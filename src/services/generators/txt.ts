/** Plain-text generator: flattens the document model to readable UTF-8 text. */
import type { DocumentModel, TableBlock } from '@/types';

function renderTable(t: TableBlock): string {
  const rows = t.headers ? [t.headers, ...t.rows] : t.rows;
  if (rows.length === 0) return '';
  const cols = rows[0].length;
  // Column widths for a monospace-ish aligned layout.
  const widths = new Array(cols).fill(0);
  for (const r of rows) {
    for (let c = 0; c < cols; c++) {
      widths[c] = Math.max(widths[c], (r[c] ?? '').length);
    }
  }
  const line = (r: string[]) =>
    r.map((cell, c) => (cell ?? '').padEnd(widths[c])).join('  |  ').replace(/\s+$/, '');
  const sep = widths.map((w) => '-'.repeat(w)).join('--+--');
  const out: string[] = [];
  if (t.headers) {
    out.push(line(t.headers));
    out.push(sep);
    out.push(...t.rows.map(line));
  } else {
    out.push(...t.rows.map(line));
  }
  return out.join('\n');
}

export function generateTxt(doc: DocumentModel): string {
  const parts: string[] = [];
  if (doc.title) {
    parts.push(doc.title.toUpperCase());
    parts.push('='.repeat(Math.min(doc.title.length, 60)));
    parts.push('');
  }
  for (const block of doc.blocks) {
    if (block.type === 'heading') {
      if (block.level === 1) {
        parts.push(block.text.toUpperCase());
        parts.push('='.repeat(Math.min(block.text.length, 60)));
      } else if (block.level === 2) {
        parts.push(block.text);
        parts.push('-'.repeat(Math.min(block.text.length, 60)));
      } else {
        parts.push(`## ${block.text}`);
      }
      parts.push('');
    } else if (block.type === 'paragraph') {
      parts.push(block.text);
      parts.push('');
    } else {
      parts.push(renderTable(block));
      parts.push('');
    }
  }
  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
