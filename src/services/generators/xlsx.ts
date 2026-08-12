/**
 * Excel (.xlsx) generator built on xlsx-js-style (SheetJS + cell styling).
 *
 * A "Document" sheet stacks all content (headings, paragraphs and tables) in
 * reading order, and every detected table additionally gets its own clean,
 * styled sheet ("Table 1", …) with a bold header row, borders, zebra banding,
 * an autofilter and a frozen header — ready to use.
 */
import * as XLSX from 'xlsx-js-style';
import type { DocumentModel, TableBlock } from '@/types';

type Cell = { v: string | number; s?: Record<string, unknown> };
type Row = Cell[];

const BORDER = { style: 'thin', color: { rgb: 'DCE0E8' } };
const ALL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

const headerStyle = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  fill: { patternType: 'solid', fgColor: { rgb: '0E8C6B' } },
  alignment: { vertical: 'center', horizontal: 'left', wrapText: true },
  border: ALL_BORDERS,
};
const titleStyle = { font: { bold: true, sz: 16, color: { rgb: '141A20' } } };
const headingStyle = { font: { bold: true, sz: 12, color: { rgb: '0E8C6B' } } };
const bodyCellStyle = { alignment: { vertical: 'top', wrapText: true }, border: ALL_BORDERS };
const bandStyle = {
  alignment: { vertical: 'top', wrapText: true },
  border: ALL_BORDERS,
  fill: { patternType: 'solid', fgColor: { rgb: 'F6F8F9' } },
};

function txt(v: string | number, s?: Record<string, unknown>): Cell {
  return { v, s };
}

function tableRows(t: TableBlock): { rows: Row[]; cols: number } {
  const cols = Math.max(t.headers?.length ?? 0, ...t.rows.map((r) => r.length), 1);
  const rows: Row[] = [];
  if (t.headers) {
    rows.push(Array.from({ length: cols }, (_, c) => txt(t.headers?.[c] ?? '', headerStyle)));
  }
  t.rows.forEach((r, ri) => {
    const style = ri % 2 ? bandStyle : bodyCellStyle;
    rows.push(Array.from({ length: cols }, (_, c) => txt(r[c] ?? '', style)));
  });
  return { rows, cols };
}

function colWidths(rows: Row[]): { wch: number }[] {
  const widths: number[] = [];
  rows.forEach((row) => {
    row.forEach((cell, i) => {
      const len = String(cell.v ?? '').length;
      widths[i] = Math.max(widths[i] ?? 10, Math.min(len + 3, 60));
    });
  });
  return widths.map((w) => ({ wch: w }));
}

export function generateXlsx(doc: DocumentModel): string {
  const wb = XLSX.utils.book_new();

  // --- Combined "Document" sheet ---
  const combined: Row[] = [];
  if (doc.title) {
    combined.push([txt(doc.title, titleStyle)]);
    combined.push([txt('')]);
  }
  for (const block of doc.blocks) {
    if (block.type === 'heading') {
      combined.push([txt(block.text, headingStyle)]);
    } else if (block.type === 'paragraph') {
      combined.push([txt(block.text, { alignment: { wrapText: true, vertical: 'top' } })]);
    } else {
      const { rows } = tableRows(block);
      combined.push(...rows);
      combined.push([txt('')]);
    }
  }
  if (combined.length === 0) combined.push([txt('')]);

  const docSheet = XLSX.utils.aoa_to_sheet(combined.map((r) => r.map((c) => c)));
  docSheet['!cols'] = colWidths(combined);
  XLSX.utils.book_append_sheet(wb, docSheet, 'Document');

  // --- One dedicated, styled sheet per table ---
  let tableIndex = 0;
  for (const block of doc.blocks) {
    if (block.type !== 'table') continue;
    tableIndex += 1;
    const { rows, cols } = tableRows(block);
    const sheet = XLSX.utils.aoa_to_sheet(rows.map((r) => r.map((c) => c)));
    sheet['!cols'] = colWidths(rows);
    if (block.headers) {
      sheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length - 1, c: cols - 1 } }) };
    }
    XLSX.utils.book_append_sheet(wb, sheet, `Table ${tableIndex}`.slice(0, 31));
  }

  return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' }) as string;
}
