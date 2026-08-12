/**
 * Web PDF rasterizer.
 *
 * The native build renders PDF pages in a hidden WebView; in a real browser we
 * just run pdf.js on the page directly. pdf.js is loaded once from a CDN (the
 * browser has network at conversion time), then each page is drawn to a canvas
 * and returned as a JPEG data URL that the OCR step reads via fetch.
 */
const g = globalThis as any;

export const MAX_PDF_PAGES = 15;
const PDFJS_VERSION = '3.11.174';
const CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

let pdfjsPromise: Promise<any> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = g.document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const s = g.document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load the PDF engine.'));
    g.document.head.appendChild(s);
  });
}

async function ensurePdfJs(): Promise<any> {
  if (g.pdfjsLib) return g.pdfjsLib;
  if (!pdfjsPromise) {
    pdfjsPromise = loadScript(`${CDN}/pdf.min.js`).then(() => {
      if (!g.pdfjsLib) throw new Error('PDF engine unavailable.');
      g.pdfjsLib.GlobalWorkerOptions.workerSrc = `${CDN}/pdf.worker.min.js`;
      return g.pdfjsLib;
    });
  }
  return pdfjsPromise;
}

/** Rasterize a PDF (blob/object URL) into an ordered list of JPEG data URLs. */
export async function rasterizePdf(pdfUri: string): Promise<string[]> {
  const pdfjs = await ensurePdfJs();
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

// No-op bridge exports so any shared import site stays valid on web.
export function registerRasterizerBridge(): () => void {
  return () => {};
}
export async function handleRasterizerMessage(): Promise<void> {}
