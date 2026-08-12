/**
 * Local OCR — native placeholder.
 *
 * Tesseract.js relies on Web Workers / WASM in the browser and doesn't run in
 * the React Native JS runtime, so on native we don't offer a local fallback
 * (Groq is used). This throws so the orchestrator keeps the original error.
 */
import type { DocumentModel } from '@/types';

export const LOCAL_OCR_AVAILABLE = false;

export async function localOcr(_uri: string, _onProgress?: (p: number) => void): Promise<DocumentModel> {
  throw new Error('Local OCR is not available on this platform.');
}
