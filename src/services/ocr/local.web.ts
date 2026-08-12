/**
 * Local OCR (web) using Tesseract.js — unlimited, on-device, no API key.
 *
 * Used as the automatic fallback when Groq is unavailable (no key, rate limit,
 * error), and as the primary engine when no Groq key is configured. The first
 * run downloads the English model (~a few MB) from the CDN, then it's cached.
 */
import Tesseract from 'tesseract.js';
import type { DocumentModel } from '@/types';
import { textToDocument } from './parseText';

export const LOCAL_OCR_AVAILABLE = true;

export async function localOcr(uri: string, onProgress?: (p: number) => void): Promise<DocumentModel> {
  const { data } = await Tesseract.recognize(uri, 'eng', {
    logger: (m: { status?: string; progress?: number }) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(m.progress);
      }
    },
  });
  const text = (data?.text ?? '').trim();
  if (!text) {
    throw new Error('No readable text was found in the image.');
  }
  return textToDocument(text);
}
