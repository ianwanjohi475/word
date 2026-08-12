/**
 * App configuration & secrets.
 *
 * The Groq key is read from `EXPO_PUBLIC_GROQ_API_KEY` (see `.env.example`).
 *
 * ⚠️ SECURITY NOTE: any `EXPO_PUBLIC_*` value is inlined into the JS bundle and
 * is therefore extractable from a shipped app. That's acceptable for personal /
 * prototype builds. For a public release, run a thin proxy that holds the key
 * server-side and set GROQ_BASE_URL to point at that proxy instead of calling
 * api.groq.com directly from the client.
 */

export const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';

/**
 * Vision model used for OCR.
 *
 * Groq deprecates models frequently — always confirm what's live at
 * https://console.groq.com/docs/models and override with EXPO_PUBLIC_GROQ_MODEL
 * if the default has been retired. The pipeline also tries the fallbacks below
 * automatically if the primary model returns a "decommissioned" error.
 */
export const GROQ_MODEL =
  process.env.EXPO_PUBLIC_GROQ_MODEL && process.env.EXPO_PUBLIC_GROQ_MODEL.length > 0
    ? process.env.EXPO_PUBLIC_GROQ_MODEL
    : 'qwen/qwen3.6-27b';

/** Ordered fallbacks tried if the primary model is decommissioned/unavailable. */
export const GROQ_MODEL_FALLBACKS = [
  'qwen/qwen3.6-27b',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
];

export function hasApiKey(): boolean {
  return GROQ_API_KEY.trim().length > 0;
}
