/** PDF editor service — native placeholder (the visual editor is web-only, as it
 * relies on pdf.js page rendering in the browser). */
import type { EditorPage, LoadedPdf, Overlay } from './pdfEditTypes';

export const PDF_EDITOR_AVAILABLE = false;

export async function loadPdfForEdit(_uri: string): Promise<LoadedPdf> {
  throw new Error('The PDF editor is available in the web app.');
}

export async function savePdf(
  _bytes: Uint8Array,
  _pages: EditorPage[],
  _overlays: Overlay[],
  _name: string
): Promise<void> {
  throw new Error('The PDF editor is available in the web app.');
}
