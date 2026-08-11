/**
 * PDF → image rasterizer bridge.
 *
 * Expo's managed workflow has no native PDF renderer, so we render pages with
 * pdf.js inside a hidden off-screen WebView (`PdfRasterizerHost`, mounted once
 * at the app root). This module is the async bridge between the pipeline and
 * that WebView: `rasterizePdf()` hands a job to the host and resolves with the
 * file:// uris of the rendered page images.
 */
import * as FileSystem from 'expo-file-system/legacy';
import { WORK_DIR, readBase64 } from './files';
import { uid } from '@/utils/id';

export interface RasterJob {
  id: string;
  base64: string;
}

export interface RasterPage {
  page: number;
  dataUrl: string; // "data:image/jpeg;base64,...."
}

type Pending = {
  resolve: (uris: string[]) => void;
  reject: (err: Error) => void;
  pages: Map<number, string>; // page number -> file uri written so far
  timeout: ReturnType<typeof setTimeout>;
};

let bridgeSend: ((job: RasterJob) => void) | null = null;
const pending = new Map<string, Pending>();

/** The host WebView registers its sender here when mounted. */
export function registerRasterizerBridge(send: (job: RasterJob) => void): () => void {
  bridgeSend = send;
  return () => {
    if (bridgeSend === send) bridgeSend = null;
  };
}

async function writePage(jobId: string, page: number, dataUrl: string): Promise<string> {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const info = await FileSystem.getInfoAsync(WORK_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(WORK_DIR, { intermediates: true });
  const uri = `${WORK_DIR}${jobId}-p${page}.jpg`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  return uri;
}

/** Called by the host when the WebView reports progress/completion/error. */
export async function handleRasterizerMessage(msg: {
  id: string;
  type: 'page' | 'done' | 'error';
  page?: number;
  dataUrl?: string;
  count?: number;
  error?: string;
}): Promise<void> {
  const job = pending.get(msg.id);
  if (!job) return;

  if (msg.type === 'page' && msg.dataUrl && msg.page != null) {
    try {
      const uri = await writePage(msg.id, msg.page, msg.dataUrl);
      job.pages.set(msg.page, uri);
    } catch (e) {
      clearTimeout(job.timeout);
      pending.delete(msg.id);
      job.reject(e as Error);
    }
    return;
  }

  if (msg.type === 'done') {
    clearTimeout(job.timeout);
    pending.delete(msg.id);
    const ordered = [...job.pages.entries()].sort((a, b) => a[0] - b[0]).map(([, uri]) => uri);
    if (ordered.length === 0) {
      job.reject(new Error('The PDF produced no readable pages.'));
    } else {
      job.resolve(ordered);
    }
    return;
  }

  if (msg.type === 'error') {
    clearTimeout(job.timeout);
    pending.delete(msg.id);
    job.reject(new Error(msg.error || 'Failed to render the PDF.'));
  }
}

/** Cap on pages we process per PDF to keep OCR cost/time bounded. */
export const MAX_PDF_PAGES = 15;

/**
 * Rasterize a PDF file into an ordered list of JPEG page image uris.
 * Throws if the host WebView isn't mounted or rendering fails/times out.
 */
export async function rasterizePdf(pdfUri: string): Promise<string[]> {
  if (!bridgeSend) {
    throw new Error('PDF renderer is not ready yet. Please try again in a moment.');
  }
  const base64 = await readBase64(pdfUri);
  const id = uid('pdf_');

  return new Promise<string[]>((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error('Rendering the PDF took too long. Try a smaller file.'));
    }, 90_000);
    pending.set(id, { resolve, reject, pages: new Map(), timeout });
    bridgeSend!({ id, base64 });
  });
}
