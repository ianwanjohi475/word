/**
 * OCR orchestrator.
 *
 * Strategy for reliability:
 *  - If a Groq key is set, try Groq first (best quality: structure + tables).
 *  - On ANY Groq failure that isn't a user cancellation (rate limit, JSON error,
 *    model/network/etc.), fall back to local Tesseract OCR (web) so the user
 *    still gets a result.
 *  - With no Groq key, go straight to local OCR — the app works with no account
 *    and no limits.
 */
import type { DocumentModel } from '@/types';
import { hasApiKey } from '@/config';
import { extractDocumentFromImage, OcrError } from '@/services/groq';
import { localOcr, LOCAL_OCR_AVAILABLE } from './local';

interface Opts {
  signal?: AbortSignal;
  onLocalProgress?: (p: number) => void;
}

/** Recognize a single image (file/blob/data URL) into a DocumentModel. */
export async function recognizeImage(uri: string, opts: Opts = {}): Promise<DocumentModel> {
  if (hasApiKey()) {
    try {
      return await extractDocumentFromImage(uri, { signal: opts.signal });
    } catch (e) {
      const err = e as OcrError;
      // User cancelled — don't fall back.
      if (err instanceof OcrError && err.kind === 'network' && err.retryable === false) throw err;
      if (LOCAL_OCR_AVAILABLE) {
        try {
          return await localOcr(uri, opts.onLocalProgress);
        } catch {
          throw err; // surface the original (more descriptive) Groq error
        }
      }
      throw err;
    }
  }
  // No key → local OCR only.
  return localOcr(uri, opts.onLocalProgress);
}
