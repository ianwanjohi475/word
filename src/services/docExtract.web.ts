/**
 * Direct document text extraction (web).
 *
 * - Word (.docx): mammoth via the file's ArrayBuffer.
 * - PDF text: pdf.js text layer (getTextContent) — so a text-based PDF converts
 *   to Word/Excel/etc. instantly and accurately with no OCR. If the PDF has no
 *   text layer (a scan), returns null and the pipeline falls back to OCR.
 */
import mammoth from 'mammoth';
import * as XLSX from 'xlsx-js-style';
import type { DocumentModel } from '@/types';
import { textToDocument } from './ocr/parseText';
import { workbookToDocument } from './workbookToDocument';
import { loadPdfJs, MAX_PDF_PAGES } from './pdfjsLoader.web';

const g = globalThis as any;

export async function extractWord(uri: string): Promise<DocumentModel> {
  const arrayBuffer = await g.fetch(uri).then((r: any) => r.arrayBuffer());
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = (result?.value ?? '').trim();
  if (!text) throw new Error('This Word file has no extractable text.');
  return textToDocument(text);
}

export async function extractExcel(uri: string): Promise<DocumentModel> {
  const arrayBuffer = await g.fetch(uri).then((r: any) => r.arrayBuffer());
  const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  return workbookToDocument(wb);
}

export async function extractPdfText(uri: string): Promise<DocumentModel | null> {
  try {
    const pdfjs = await loadPdfJs();
    const data = await g.fetch(uri).then((r: any) => r.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data }).promise;
    const count = Math.min(pdf.numPages, MAX_PDF_PAGES);
    const parts: string[] = [];
    for (let p = 1; p <= count; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      // Reconstruct lines from text items using their Y positions.
      const items = content.items as { str: string; transform: number[] }[];
      let lastY: number | null = null;
      let line = '';
      const lines: string[] = [];
      for (const it of items) {
        const y = it.transform[5];
        if (lastY !== null && Math.abs(y - lastY) > 3) {
          lines.push(line.trim());
          line = '';
        }
        line += it.str + ' ';
        lastY = y;
      }
      if (line.trim()) lines.push(line.trim());
      parts.push(lines.join('\n'));
    }
    const text = parts.join('\n\n').trim();
    // Require a reasonable amount of real text; otherwise treat as a scan.
    if (text.replace(/\s/g, '').length < 20) return null;
    return textToDocument(text);
  } catch {
    return null;
  }
}
