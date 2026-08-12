/**
 * Web PDF rasterizer.
 *
 * The native build renders PDF pages in a hidden WebView; in a real browser we
 * run pdf.js on the page directly. Each page is drawn to a canvas and returned
 * as a JPEG data URL that the OCR step reads via fetch.
 */
import { loadPdfJs, MAX_PDF_PAGES as MAX } from './pdfjsLoader.web';

const g = globalThis as any;

export const MAX_PDF_PAGES = MAX;

/** Rasterize a PDF (blob/object URL) into an ordered list of JPEG data URLs. */
export async function rasterizePdf(pdfUri: string): Promise<string[]> {
  const pdfjs = await loadPdfJs();
  const data = await g.fetch(pdfUri).then((r: any) => r.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const count = Math.min(pdf.numPages, MAX_PDF_PAGES);
  const urls: string[] = [];

  for (let p = 1; p <= count; p++) {
    const page = await pdf.getPage(p);
    const baseViewport = page.getViewport({ scale: 2 });
    const maxSide = 2000;
    const scale = Math.min(1, maxSide / Math.max(baseViewport.width, baseViewport.height));
    const viewport = page.getViewport({ scale: 2 * scale });

    const canvas = g.document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    urls.push(canvas.toDataURL('image/jpeg', 0.75));
    canvas.width = 0;
    canvas.height = 0;
  }

  if (urls.length === 0) throw new Error('The PDF produced no readable pages.');
  return urls;
}

// No-op bridge exports so shared import sites stay valid on web.
export function registerRasterizerBridge(): () => void {
  return () => {};
}
export async function handleRasterizerMessage(): Promise<void> {}
