/** Convert a parsed SheetJS workbook into a DocumentModel (tables per sheet). */
import * as XLSX from 'xlsx-js-style';
import type { DocBlock, DocumentModel } from '@/types';

export function workbookToDocument(wb: XLSX.WorkBook): DocumentModel {
  const blocks: DocBlock[] = [];
  let hasTables = false;
  const multi = wb.SheetNames.length > 1;

  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    if (!sheet) continue;
    const aoa = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: '',
    });
    const rows = aoa
      .map((r) => (Array.isArray(r) ? r.map((c) => (c == null ? '' : String(c))) : []))
      .filter((r) => r.some((c) => c.trim() !== ''));
    if (rows.length === 0) continue;

    if (multi) blocks.push({ type: 'heading', level: 2, text: name });

    const cols = Math.max(...rows.map((r) => r.length), 1);
    const norm = rows.map((r) => {
      const copy = [...r];
      while (copy.length < cols) copy.push('');
      return copy.slice(0, cols);
    });
    const headers = norm[0];
    blocks.push({ type: 'table', headers, rows: norm.slice(1) });
    hasTables = true;
  }

  if (blocks.length === 0) {
    blocks.push({ type: 'paragraph', text: '' });
  }

  return { title: undefined, blocks, hasTables };
}
