/**
 * Conversion pipeline — the orchestration layer.
 *
 *   source asset ─▶ (rasterize PDF pages) ─▶ Groq OCR ─▶ DocumentModel
 *                ─▶ generate chosen format ─▶ save to disk ─▶ SQLite record
 *
 * Progress is reported through `onProgress` so the OCR screen can animate the
 * staged steps.
 */
import type {
  DocumentModel,
  FileRecord,
  OutputFormat,
  PipelineProgress,
  SourceAsset,
} from '@/types';
import { extractDocumentFromImage } from './groq';
import { rasterizePdf } from './pdfRasterizer';
import { persistOutput } from './io';
import { insertFile } from '@/db/database';
import { uid } from '@/utils/id';
import { stripExtension } from '@/utils/format';

type ProgressFn = (p: PipelineProgress) => void;

/** Run OCR on a source asset (image or multi-page PDF) into one DocumentModel. */
export async function runOcr(
  asset: SourceAsset,
  onProgress?: ProgressFn,
  signal?: AbortSignal
): Promise<DocumentModel> {
  onProgress?.({ stage: 'uploading', progress: 0.12, message: 'Preparing your document' });

  let pageUris: string[];
  if (asset.sourceFormat === 'pdf') {
    onProgress?.({ stage: 'uploading', progress: 0.2, message: 'Rendering PDF pages' });
    pageUris = await rasterizePdf(asset.uri);
  } else {
    pageUris = [asset.uri];
  }

  onProgress?.({ stage: 'detecting', progress: 0.35, message: 'Detecting text' });

  const merged: DocumentModel = { blocks: [], hasTables: false };
  const total = pageUris.length;
  for (let i = 0; i < total; i++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    // eslint-disable-next-line no-await-in-loop
    const page = await extractDocumentFromImage(pageUris[i], { signal });
    if (i === 0 && page.title) merged.title = page.title;
    if (!merged.language && page.language) merged.language = page.language;
    merged.blocks.push(...page.blocks);
    merged.hasTables = merged.hasTables || page.hasTables;
    onProgress?.({
      stage: 'layout',
      progress: 0.35 + (0.3 * (i + 1)) / total,
      message: total > 1 ? `Understanding layout (page ${i + 1} of ${total})` : 'Understanding layout',
    });
  }

  return merged;
}

/**
 * Generate the chosen output format from a document model and persist it to
 * disk. Returns the on-disk path/name/size. Reused by the editor's re-export.
 */
export async function generateFile(
  doc: DocumentModel,
  format: OutputFormat,
  baseName: string
): Promise<{ path: string; name: string; size: number }> {
  // Saving is platform-specific (native filesystem vs. browser download).
  return persistOutput(doc, format, baseName);
}

export interface ConvertParams {
  asset: SourceAsset;
  format: OutputFormat;
  /** Optional pre-extracted document (skips OCR, e.g. editor re-export). */
  doc?: DocumentModel;
  /** Override the output base name (defaults to the source file name). */
  baseName?: string;
  onProgress?: ProgressFn;
  signal?: AbortSignal;
}

export interface ConvertResult {
  record: FileRecord;
  doc: DocumentModel;
}

/** Full convert: OCR (unless doc supplied) → generate → save → DB insert. */
export async function convert(params: ConvertParams): Promise<ConvertResult> {
  const { asset, format, onProgress, signal } = params;
  const baseName = params.baseName ?? stripExtension(asset.name) ?? 'Document';

  const doc = params.doc ?? (await runOcr(asset, onProgress, signal));

  onProgress?.({ stage: 'formatting', progress: 0.78, message: 'Formatting document' });
  const { path, name, size } = await generateFile(doc, format, baseName);

  onProgress?.({ stage: 'saving', progress: 0.93, message: 'Creating file' });
  const record: FileRecord = {
    id: uid('f_'),
    name,
    outputFormat: format,
    sourceFormat: asset.sourceFormat,
    path,
    size,
    createdAt: Date.now(),
    status: 'completed',
    documentJson: JSON.stringify(doc),
    sourceThumbUri: asset.previewUri ?? asset.uri,
  };
  await insertFile(record);

  onProgress?.({ stage: 'done', progress: 1, message: 'Done' });
  return { record, doc };
}
