/**
 * Groq OCR client.
 *
 * Sends a document image to Groq's OpenAI-compatible chat/completions endpoint
 * with a vision model and asks (in JSON mode) for a structured description of
 * the document as an ordered list of typed blocks. The result is normalized
 * into a `DocumentModel` the generators can turn into Word/Excel/PDF/TXT.
 */
import { GROQ_API_KEY, GROQ_BASE_URL, GROQ_MODEL, GROQ_MODEL_FALLBACKS, hasApiKey } from '@/config';
import { readAsBase64 } from './io';
import type { DocBlock, DocumentModel } from '@/types';

/** A typed error so the UI can show the right message + retry affordance. */
export type OcrErrorKind =
  | 'no_key'
  | 'network'
  | 'rate_limit'
  | 'auth'
  | 'model'
  | 'server'
  | 'parse'
  | 'empty'
  | 'unknown';

export class OcrError extends Error {
  kind: OcrErrorKind;
  retryable: boolean;
  constructor(kind: OcrErrorKind, message: string, retryable = true) {
    super(message);
    this.name = 'OcrError';
    this.kind = kind;
    this.retryable = retryable;
  }
}

const SYSTEM_PROMPT = `You are a precise OCR and document-structure engine. You are given a single page image of a document. Read ALL of the text exactly as written, then describe the page as an ordered list of structural blocks.

Return ONLY a JSON object with this exact shape:
{
  "title": string | null,            // the document's main title if present, else null
  "language": string | null,         // ISO code of the dominant language, e.g. "en"
  "blocks": [
    { "type": "heading", "level": 1|2|3, "text": string },
    { "type": "paragraph", "text": string },
    { "type": "table", "headers": string[] | null, "rows": string[][] }
  ]
}

Rules:
- Preserve reading order top-to-bottom, left-to-right.
- Use "heading" for titles/section headers (level 1 = document title, 2 = section, 3 = subsection).
- Use "paragraph" for running text. Merge wrapped lines into one paragraph; keep real line breaks as separate paragraphs.
- Use "table" ONLY for genuine tabular/grid data. "headers" is the top row if it labels columns (else null). Every row in "rows" must have the same number of cells; pad short rows with "".
- Transcribe text verbatim — do not summarize, translate, or invent content. If a cell/section is empty, use "".
- Do not include any commentary, markdown, or code fences. Output the raw JSON object only.`;

interface GroqRawBlock {
  type?: string;
  level?: number;
  text?: string;
  headers?: unknown;
  rows?: unknown;
}

function guessImageMime(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

/** Extract the first balanced JSON object from a possibly-noisy string. */
function extractJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function asString(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return String(v);
}

/** Normalize the raw model JSON into a strict DocumentModel. */
function normalize(raw: unknown): DocumentModel {
  const obj = (raw ?? {}) as { title?: unknown; language?: unknown; blocks?: unknown };
  const rawBlocks = Array.isArray(obj.blocks) ? (obj.blocks as GroqRawBlock[]) : [];
  const blocks: DocBlock[] = [];
  let hasTables = false;

  for (const b of rawBlocks) {
    const type = asString(b?.type).toLowerCase();
    if (type === 'heading') {
      const text = asString(b.text).trim();
      if (!text) continue;
      const levelNum = Number(b.level);
      const level = (levelNum === 1 || levelNum === 2 || levelNum === 3 ? levelNum : 2) as 1 | 2 | 3;
      blocks.push({ type: 'heading', level, text });
    } else if (type === 'table') {
      const rawRows = Array.isArray(b.rows) ? (b.rows as unknown[]) : [];
      const rows: string[][] = rawRows
        .map((r) => (Array.isArray(r) ? r.map(asString) : [asString(r)]))
        .filter((r) => r.length > 0);
      const headers = Array.isArray(b.headers) ? (b.headers as unknown[]).map(asString) : undefined;
      // Normalize column count across the whole table.
      const cols = Math.max(headers?.length ?? 0, ...rows.map((r) => r.length), 0);
      if (cols === 0) continue;
      const paddedRows = rows.map((r) => {
        const copy = [...r];
        while (copy.length < cols) copy.push('');
        return copy.slice(0, cols);
      });
      const paddedHeaders = headers
        ? (() => {
            const copy = [...headers];
            while (copy.length < cols) copy.push('');
            return copy.slice(0, cols);
          })()
        : undefined;
      if (paddedRows.length === 0 && !paddedHeaders) continue;
      hasTables = true;
      blocks.push({ type: 'table', headers: paddedHeaders, rows: paddedRows });
    } else {
      // Default everything else to a paragraph.
      const text = asString(b.text).trim();
      if (!text) continue;
      blocks.push({ type: 'paragraph', text });
    }
  }

  return {
    title: asString(obj.title).trim() || undefined,
    language: asString(obj.language).trim() || undefined,
    blocks,
    hasTables,
  };
}

interface CallOptions {
  signal?: AbortSignal;
}

async function callGroq(model: string, dataUrl: string, opts: CallOptions): Promise<string> {
  const body = {
    model,
    temperature: 0,
    max_tokens: 8000,
    response_format: { type: 'json_object' as const },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract this document into the structured JSON described. Return JSON only.',
          },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
  };

  let res: Response;
  try {
    res = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') {
      throw new OcrError('network', 'The request was cancelled.', false);
    }
    throw new OcrError('network', 'Network error — check your connection and try again.');
  }

  if (!res.ok) {
    let detail = '';
    let code = '';
    try {
      const err = await res.json();
      detail = err?.error?.message ?? '';
      code = err?.error?.code ?? '';
    } catch {
      /* ignore parse failure of error body */
    }
    if (res.status === 401 || res.status === 403) {
      throw new OcrError('auth', 'Invalid or missing Groq API key. Check your key in Settings.', false);
    }
    if (res.status === 429) {
      throw new OcrError('rate_limit', 'Groq rate limit reached. Please wait a moment and retry.');
    }
    if (
      res.status === 404 ||
      /decommission|not found|does not exist|deprecat/i.test(detail) ||
      code === 'model_not_found'
    ) {
      throw new OcrError('model', detail || `Model "${model}" is unavailable.`);
    }
    if (res.status >= 500) {
      throw new OcrError('server', 'Groq is having trouble right now. Please retry shortly.');
    }
    // 400 etc.
    throw new OcrError('unknown', detail || `Request failed (${res.status}).`);
  }

  const json = await res.json();
  const content: string | undefined = json?.choices?.[0]?.message?.content;
  if (!content) {
    throw new OcrError('empty', 'The model returned an empty response. Try a clearer photo.');
  }
  return content;
}

/**
 * Run OCR on a single image file (file:// uri) and return a DocumentModel.
 * Tries the configured model, then fallbacks if the model is decommissioned.
 */
export async function extractDocumentFromImage(
  imageUri: string,
  opts: CallOptions = {}
): Promise<DocumentModel> {
  if (!hasApiKey()) {
    throw new OcrError(
      'no_key',
      'No Groq API key configured. Add EXPO_PUBLIC_GROQ_API_KEY to your .env file.',
      false
    );
  }

  const base64 = await readAsBase64(imageUri);
  const dataUrl = `data:${guessImageMime(imageUri)};base64,${base64}`;

  // De-duplicated model attempt order: configured model first, then fallbacks.
  const models = Array.from(new Set([GROQ_MODEL, ...GROQ_MODEL_FALLBACKS]));

  let lastError: OcrError | null = null;
  for (const model of models) {
    try {
      const content = await callGroq(model, dataUrl, opts);
      const jsonText = extractJsonObject(content) ?? content;
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        throw new OcrError('parse', 'Could not read the document structure. Please try again.');
      }
      const doc = normalize(parsed);
      if (doc.blocks.length === 0) {
        throw new OcrError(
          'empty',
          'No text was detected. Try a sharper, well-lit photo of the document.'
        );
      }
      return doc;
    } catch (e) {
      const err = e instanceof OcrError ? e : new OcrError('unknown', (e as Error).message);
      lastError = err;
      // Only advance to the next model when the current one is unavailable.
      if (err.kind === 'model') continue;
      throw err;
    }
  }
  throw lastError ?? new OcrError('unknown', 'OCR failed.');
}
