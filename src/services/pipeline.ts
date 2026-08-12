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
import { extractWord, extractExcel, extractPdfText } from './docExtract';
import { persistOutput } from './io';
import { insertFile } from '@/db/database';
import { uid } from '@/utils/id';
import { stripExtension } from '@/utils/format';

type ProgressFn = (p: PipelineProgress) => void;

/**
 * Extract a DocumentModel from a source document (no OCR — fully local):
 *  - Word (.docx): mammoth text layer.
 *  - Excel (.xlsx/.csv): SheetJS → tables per sheet.
 *  - PDF: pdf.js embedded text layer (web). Scanned PDFs (no text) error clearly.
 *
 * Kept named `runOcr` so existing callers (the job controller) stay unchanged.
 */
export async function runOcr(
  asset: SourceAsset,
  onProgress?: ProgressFn,
  _signal?: AbortSignal
): Promise<DocumentModel> {
  onProgress?.({ stage: 'uploading', progress: 0.18, message: 'Preparing your document' });

  if (asset.sourceFormat === 'word') {
    onProgress?.({ stage: 'detecting', progress: 0.45, message: 'Reading Word document' });
    const doc = await extractWord(asset.uri);
    onProgress?.({ stage: 'layout', progress: 0.66, message: 'Understanding layout' });
    return doc;
  }

  if (asset.sourceFormat === 'excel') {
    onProgress?.({ stage: 'detecting', progress: 0.45, message: 'Reading spreadsheet' });
    const doc = await extractExcel(asset.uri);
    onProgress?.({ stage: 'layout', progress: 0.66, message: 'Understanding tables' });
    return doc;
  }

  // PDF
  onProgress?.({ stage: 'detecting', progress: 0.4, message: 'Reading PDF text' });
  const textDoc = await extractPdfText(asset.uri).catch(() => null);
  if (!textDoc || textDoc.blocks.length === 0) {
    throw new Error(
      'This PDF has no selectable text (it looks like a scan). Try a text-based PDF or a Word/Excel file.'
    );
  }
  onProgress?.({ stage: 'layout', progress: 0.66, message: 'Understanding layout' });
  return textDoc;
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
