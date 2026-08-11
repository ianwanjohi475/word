/**
 * Excel (.xlsx) generator built on SheetJS. Returns base64.
 *
 * Strategy: a "Document" sheet stacks all content (headings, paragraphs and
 * tables) in reading order, and every detected table additionally gets its own
 * clean sheet ("Table 1", "Table 2", …) so the tabular data is ready to use.
 */
import * as XLSX from 'xlsx';
import type { DocumentModel, TableBlock } from '@/types';

type AOA = (string | number)[][];

function tableToAoa(t: TableBlock): AOA {
  const rows: AOA = [];
  if (t.headers) rows.push([...t.headers]);
  for (const r of t.rows) rows.push([...r]);
  return rows;
}

function columnWidths(aoa: AOA): { wch: number }[] {
  const widths: number[] = [];
  for (const row of aoa) {
    row.forEach((cell, i) => {
      const len = String(cell ?? '').length;
      widths[i] = Math.max(widths[i] ?? 10, Math.min(len + 2, 60));
    });
  }
  return widths.map((w) => ({ wch: w }));
}

export function generateXlsx(doc: DocumentModel): string {
  const wb = XLSX.utils.book_new();

  // --- Combined "Document" sheet ---
  const combined: AOA = [];
  if (doc.title) {
    combined.push([doc.title]);
    combined.push([]);
  }
  for (const block of doc.blocks) {
    if (block.type === 'heading') {
      combined.push([block.text]);
    } else if (block.type === 'paragraph') {
      combined.push([block.text]);
    } else {
      for (const row of tableToAoa(block)) combined.push(row);
      combined.push([]); // spacer after each table
    }
  }
  if (combined.length === 0) combined.push(['']);

  const docSheet = XLSX.utils.aoa_to_sheet(combined);
  docSheet['!cols'] = columnWidths(combined);
  XLSX.utils.book_append_sheet(wb, docSheet, 'Document');

  // --- One dedicated sheet per table ---
  let tableIndex = 0;
  for (const block of doc.blocks) {
    if (block.type !== 'table') continue;
    tableIndex += 1;
    const aoa = tableToAoa(block);
    const sheet = XLSX.utils.aoa_to_sheet(aoa);
    sheet['!cols'] = columnWidths(aoa);
    XLSX.utils.book_append_sheet(wb, sheet, `Table ${tableIndex}`.slice(0, 31));
  }

  return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' }) as string;
}
