/** Loads pdf.js once from a CDN for the browser (rasterizing + text extraction). */
const g = globalThis as any;

export const MAX_PDF_PAGES = 15;
const PDFJS_VERSION = '3.11.174';
const CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

let pdfjsPromise: Promise<any> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (g.document.querySelector(`script[src="${src}"]`)) {
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

export async function loadPdfJs(): Promise<any> {
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
