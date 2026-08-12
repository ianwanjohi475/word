/** Shared types for the visual PDF editor. Coordinates are normalized 0..1
 * relative to the page (so they map cleanly between the on-screen preview and
 * the exported PDF regardless of scale). */

export interface EditorPage {
  id: string;
  kind: 'orig' | 'blank';
  /** Index into the original PDF (for kind === 'orig'). */
  index?: number;
  /** Rendered preview image (data URL) for original pages. */
  dataUrl?: string;
  /** Page size in PDF points. */
  width: number;
  height: number;
}

export interface TextOverlay {
  id: string;
  pageId: string;
  type: 'text';
  x: number; // top-left, fraction of page width
  y: number; // top-left, fraction of page height
  size: number; // fraction of page height
  color: string; // hex
  text: string;
}

export interface RectOverlay {
  id: string;
  pageId: string;
  type: 'white' | 'highlight';
  x: number;
  y: number;
  w: number;
  h: number;
  color: string; // hex (white = erase, yellow = highlight)
}

export type Overlay = TextOverlay | RectOverlay;

export interface LoadedPdf {
  bytes: Uint8Array;
  pages: EditorPage[];
}
