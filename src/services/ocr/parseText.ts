/**
 * Turn a flat block of extracted text (from Tesseract, a Word doc, or a text
 * PDF) into a structured DocumentModel: paragraphs, with a light heuristic that
 * groups aligned multi-column lines into tables.
 */
import type { DocBlock, DocumentModel } from '@/types';

function normalizeTable(rows: string[][]): string[][] {
  const cols = Math.max(...rows.map((r) => r.length), 1);
  return rows.map((r) => {
    const copy = [...r];
    while (copy.length < cols) copy.push('');
    return copy.slice(0, cols);
  });
}

export function textToDocument(text: string, title?: string): DocumentModel {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: DocBlock[] = [];
  let para: string[] = [];
  let table: string[][] = [];
  let hasTables = false;

  const flushPara = () => {
    if (para.length) {
      const joined = para.join(' ').replace(/\s+/g, ' ').trim();
      if (joined) blocks.push({ type: 'paragraph', text: joined });
      para = [];
    }
  };
  const flushTable = () => {
    if (table.length >= 2) {
      const rows = normalizeTable(table);
      blocks.push({ type: 'table', rows });
      hasTables = true;
    } else if (table.length === 1) {
      para.push(table[0].join(' '));
    }
    table = [];
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (line.trim() === '') {
      flushTable();
      flushPara();
      continue;
    }
    // Two or more columns separated by 2+ spaces or a tab → likely a table row.
    const cells = line.split(/\t+|\s{2,}/).map((s) => s.trim()).filter((s) => s.length > 0);
    if (cells.length >= 2 && line.trim().length > 3) {
      flushPara();
      table.push(cells);
    } else {
      flushTable();
      para.push(line.trim());
    }
  }
  flushTable();
  flushPara();

  // Promote a short first paragraph to a heading/title for nicer output.
  let outTitle = title;
  if (!outTitle && blocks.length && blocks[0].type === 'paragraph' && blocks[0].text.length <= 60) {
    outTitle = blocks[0].text;
    blocks.shift();
  }

  return { title: outTitle, blocks, hasTables };
}
