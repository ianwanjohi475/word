/**
 * Platform I/O layer (web implementation).
 *
 * The browser has no app filesystem, so instead of saving files we generate the
 * document bytes in-memory and trigger a normal browser download. Source images
 * are read via fetch + FileReader. Metro picks this file over `io.ts` on web.
 */
import type { DocumentModel, FileRecord, OutputFormat } from '@/types';
import { generateDocx } from './generators/docx';
import { generateXlsx } from './generators/xlsx';
import { generateTxt } from './generators/txt';
import { generatePdfBytes } from './generators/pdfWeb';
import { FORMAT_META } from '@/utils/formats';
import { sanitizeFileName } from '@/utils/format';

// DOM globals aren't in the RN TS lib; access them loosely on web.
const g = globalThis as any;

function base64ToBytes(b64: string): Uint8Array {
  const bin = g.atob(b64) as string;
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function generateBytes(doc: DocumentModel, format: OutputFormat): Promise<Uint8Array> {
  switch (format) {
    case 'word':
      return base64ToBytes(await generateDocx(doc));
    case 'excel':
      return base64ToBytes(generateXlsx(doc));
    case 'txt':
      return new g.TextEncoder().encode(generateTxt(doc)) as Uint8Array;
    case 'pdf':
      return generatePdfBytes(doc);
  }
}

function triggerDownload(bytes: Uint8Array, name: string, mime: string) {
  const blob = new g.Blob([bytes], { type: mime });
  const url = g.URL.createObjectURL(blob);
  const a = g.document.createElement('a');
  a.href = url;
  a.download = name;
  g.document.body.appendChild(a);
  a.click();
  g.document.body.removeChild(a);
  setTimeout(() => g.URL.revokeObjectURL(url), 4000);
}

export async function readAsBase64(uri: string): Promise<string> {
  const res = await g.fetch(uri);
  const blob = await res.blob();
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new g.FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(blob);
  });
  return dataUrl.replace(/^data:[^;]+;base64,/, '');
}

/**
 * Downscale + compress the source image on a canvas before OCR so large photos
 * stay under Groq's per-minute token budget (see the native counterpart).
 */
export async function readImageForOcr(uri: string): Promise<{ base64: string; mime: string }> {
  try {
    const img: any = await new Promise((resolve, reject) => {
      const image = new g.Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('image load failed'));
      image.src = uri;
    });
    const maxW = 1000;
    const scale = Math.min(1, maxW / (img.width || maxW));
    const w = Math.max(1, Math.round((img.width || maxW) * scale));
    const h = Math.max(1, Math.round((img.height || maxW) * scale));
    const canvas = g.document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const dataUrl: string = canvas.toDataURL('image/jpeg', 0.55);
    return { base64: dataUrl.replace(/^data:[^;]+;base64,/, ''), mime: 'image/jpeg' };
  } catch {
    return { base64: await readAsBase64(uri), mime: 'image/jpeg' };
  }
}

export async function importSource(uri: string): Promise<string> {
  // On web the picker already returns a usable blob/object URL — keep it as-is.
  return uri;
}

export async function persistOutput(
  doc: DocumentModel,
  format: OutputFormat,
  baseName: string
): Promise<{ path: string; name: string; size: number }> {
  const meta = FORMAT_META[format];
  const name = `${sanitizeFileName(baseName)}.${meta.extension}`;
  const bytes = await generateBytes(doc, format);
  triggerDownload(bytes, name, meta.mimeType);
  return { path: `web:${name}`, name, size: bytes.byteLength };
}

export async function deliver(record: FileRecord): Promise<{ ok: boolean; message?: string }> {
  if (!record.documentJson) {
    return { ok: false, message: 'This file is only available on the device app.' };
  }
  try {
    const doc = JSON.parse(record.documentJson) as DocumentModel;
    const bytes = await generateBytes(doc, record.outputFormat);
    triggerDownload(bytes, record.name, FORMAT_META[record.outputFormat].mimeType);
    return { ok: true, message: 'Downloaded' };
  } catch {
    return { ok: false, message: 'Could not prepare the download.' };
  }
}

export async function shareRecord(record: FileRecord): Promise<{ ok: boolean; message?: string }> {
  // Try the Web Share API with a file; fall back to a plain download.
  try {
    if (record.documentJson && g.navigator?.canShare) {
      const doc = JSON.parse(record.documentJson) as DocumentModel;
      const bytes = await generateBytes(doc, record.outputFormat);
      const meta = FORMAT_META[record.outputFormat];
      const file = new g.File([bytes], record.name, { type: meta.mimeType });
      if (g.navigator.canShare({ files: [file] })) {
        await g.navigator.share({ files: [file], title: record.name });
        return { ok: true };
      }
    }
  } catch {
    /* fall through to download */
  }
  return deliver(record);
}

export async function storageUsage(): Promise<number> {
  return 0;
}

export async function clearCache(): Promise<void> {
  /* nothing to clear in the browser */
}

/** The browser can't persist generated files across sessions. */
export const PERSISTS_FILES = false;
