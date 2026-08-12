/**
 * PDF editor service (web).
 *
 * loadPdfForEdit: render every page to a preview image (pdf.js) and record its
 * PDF-point size. savePdf: rebuild the document with pdf-lib in the current page
 * order (dropping deleted pages, inserting blanks), draw all overlays at their
 * normalized positions, and trigger a browser download.
 */
import { loadPdfJs } from './pdfjsLoader.web';
import type { EditorPage, LoadedPdf, Overlay } from './pdfEditTypes';
import { uid } from '@/utils/id';

const g = globalThis as any;

export const PDF_EDITOR_AVAILABLE = true;

export async function loadPdfForEdit(uri: string): Promise<LoadedPdf> {
  const pdfjs = await loadPdfJs();
  const buf: ArrayBuffer = await g.fetch(uri).then((r: any) => r.arrayBuffer());
  const bytes = new Uint8Array(buf.slice(0));
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
  const pages: EditorPage[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const base = page.getViewport({ scale: 1 });
    const renderScale = Math.min(2, 1400 / base.width);
    const vp = page.getViewport({ scale: renderScale });
    const canvas = g.document.createElement('canvas');
    canvas.width = Math.floor(vp.width);
    canvas.height = Math.floor(vp.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    pages.push({
      id: uid('pg_'),
      kind: 'orig',
      index: p - 1,
      dataUrl: canvas.toDataURL('image/jpeg', 0.85),
      width: base.width,
      height: base.height,
    });
    canvas.width = 0;
    canvas.height = 0;
  }

  return { bytes, pages };
}

function hexToRgb01(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export async function savePdf(
  bytes: Uint8Array,
  pages: EditorPage[],
  overlays: Overlay[],
  name: string
): Promise<void> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const src = await PDFDocument.load(bytes);
  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);

  for (const pd of pages) {
    let page;
    if (pd.kind === 'orig' && pd.index != null) {
      const [copied] = await out.copyPages(src, [pd.index]);
      page = out.addPage(copied);
    } else {
      page = out.addPage([pd.width, pd.height]);
    }
    const W = page.getWidth();
    const H = page.getHeight();

    for (const ov of overlays.filter((o) => o.pageId === pd.id)) {
      if (ov.type === 'text') {
        const size = Math.max(6, ov.size * H);
        const [r, gg, b] = hexToRgb01(ov.color);
        const lines = ov.text.split('\n');
        lines.forEach((line, i) => {
          page.drawText(line, {
            x: ov.x * W,
            y: H - ov.y * H - size - i * size * 1.2,
            size,
            font,
            color: rgb(r, gg, b),
          });
        });
      } else {
        const [r, gg, b] = hexToRgb01(ov.color);
        page.drawRectangle({
          x: ov.x * W,
          y: H - ov.y * H - ov.h * H,
          width: ov.w * W,
          height: ov.h * H,
          color: rgb(r, gg, b),
          opacity: ov.type === 'highlight' ? 0.4 : 1,
        });
      }
    }
  }

  const outBytes = await out.save();
  const blob = new g.Blob([outBytes], { type: 'application/pdf' });
  const url = g.URL.createObjectURL(blob);
  const a = g.document.createElement('a');
  a.href = url;
  a.download = name.toLowerCase().endsWith('.pdf') ? name : `${name}.pdf`;
  g.document.body.appendChild(a);
  a.click();
  g.document.body.removeChild(a);
  setTimeout(() => g.URL.revokeObjectURL(url), 4000);
}
