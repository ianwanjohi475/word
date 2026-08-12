/**
 * Web PDF generator using pdf-lib (pure JS, no native deps).
 *
 * Native builds use expo-print for richer HTML layout; on web we lay out the
 * document model directly with pdf-lib and return raw PDF bytes so the browser
 * can download them. Handles headings, wrapped paragraphs and simple tables
 * with pagination.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { DocumentModel, TableBlock } from '@/types';

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = rgb(0.14, 0.17, 0.2);
const ACCENT = rgb(0.055, 0.55, 0.42);
const MUTED = rgb(0.42, 0.46, 0.5);
const LINE = rgb(0.87, 0.89, 0.91);
const HEADER_FILL = rgb(0.9, 0.95, 0.93);

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

export async function generatePdfBytes(doc: DocumentModel): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const ensure = (needed: number) => {
    if (y - needed < MARGIN) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };

  const drawText = (text: string, size: number, f: PDFFont, color = INK, gap = 4) => {
    for (const line of wrap(text, f, size, CONTENT_W)) {
      ensure(size + gap);
      page.drawText(line, { x: MARGIN, y: y - size, size, font: f, color });
      y -= size + gap;
    }
  };

  if (doc.title) {
    drawText(doc.title, 22, bold, INK, 8);
    y -= 6;
  }

  for (const block of doc.blocks) {
    if (block.type === 'heading') {
      y -= 8;
      const size = block.level === 1 ? 17 : block.level === 2 ? 14 : 12.5;
      drawText(block.text, size, bold, block.level === 1 ? ACCENT : INK, 5);
    } else if (block.type === 'paragraph') {
      drawText(block.text, 11, font, INK, 5);
      y -= 4;
    } else {
      drawTable(block, page, () => page);
      y -= 6;
    }
  }

  // Footer note on the last page.
  ensure(20);
  page.drawText('Generated with Converta', {
    x: MARGIN,
    y: MARGIN - 18,
    size: 8,
    font,
    color: MUTED,
  });

  function drawTable(table: TableBlock, _p: PDFPage, _cur: () => PDFPage) {
    const rows = table.headers ? [table.headers, ...table.rows] : table.rows;
    if (rows.length === 0) return;
    const cols = rows[0].length || 1;
    const colW = CONTENT_W / cols;
    const size = 9.5;
    const padding = 5;

    rows.forEach((row, rowIndex) => {
      // Compute row height from wrapped cell content.
      const cellLines = row.map((c) => wrap(String(c ?? ''), font, size, colW - padding * 2));
      const rowH = Math.max(...cellLines.map((l) => l.length)) * (size + 3) + padding * 2;
      ensure(rowH);
      const top = y;
      const isHeader = table.headers && rowIndex === 0;

      if (isHeader) {
        page.drawRectangle({ x: MARGIN, y: top - rowH, width: CONTENT_W, height: rowH, color: HEADER_FILL });
      }
      // Cell text + vertical separators
      row.forEach((_, c) => {
        const x = MARGIN + c * colW;
        const lines = cellLines[c];
        lines.forEach((ln, li) => {
          page.drawText(ln, {
            x: x + padding,
            y: top - padding - size - li * (size + 3),
            size,
            font: isHeader ? bold : font,
            color: INK,
          });
        });
        if (c > 0) {
          page.drawLine({ start: { x, y: top }, end: { x, y: top - rowH }, thickness: 0.5, color: LINE });
        }
      });
      // Row borders
      page.drawLine({ start: { x: MARGIN, y: top }, end: { x: MARGIN + CONTENT_W, y: top }, thickness: 0.5, color: LINE });
      page.drawLine({ start: { x: MARGIN, y: top - rowH }, end: { x: MARGIN + CONTENT_W, y: top - rowH }, thickness: 0.5, color: LINE });
      y = top - rowH;
    });
  }

  return pdf.save();
}
