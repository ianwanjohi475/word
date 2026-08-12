/**
 * Direct document text extraction (native) — for non-image inputs so we can
 * convert Word ⇆ PDF (and PDF → anything) WITHOUT OCR when the file already
 * contains real text.
 *
 * - Word (.docx): parsed with mammoth (pure JS).
 * - PDF text: not extracted natively (no pure-JS text layer reader wired up on
 *   device) — returns null so the pipeline falls back to rasterize + OCR.
 */
import mammoth from 'mammoth';
import { Buffer } from 'buffer';
import type { DocumentModel } from '@/types';
import { textToDocument } from './ocr/parseText';
import { readBase64 } from './files';

export async function extractWord(uri: string): Promise<DocumentModel> {
  const base64 = await readBase64(uri);
  const buffer = Buffer.from(base64, 'base64');
  const result = await mammoth.extractRawText({ buffer });
  const text = (result?.value ?? '').trim();
  if (!text) throw new Error('This Word file has no extractable text.');
  return textToDocument(text);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function extractPdfText(_uri: string): Promise<DocumentModel | null> {
  return null;
}
