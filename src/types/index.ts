/**
 * Core domain types shared across the OCR pipeline, generators, storage and UI.
 */

/** Output formats the app can generate. */
export type OutputFormat = 'word' | 'excel' | 'pdf' | 'txt';

/** Formats a user can feed in. */
export type SourceFormat = 'image' | 'pdf';

/** Status of a conversion record. */
export type ConversionStatus = 'completed' | 'failed' | 'processing';

/* -------------------------------------------------------------------------- */
/* Structured document model                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The AI returns an ordered list of typed blocks describing the document so the
 * original structure (headings, paragraphs, tables) survives the conversion.
 */
export type DocBlock = HeadingBlock | ParagraphBlock | TableBlock;

export interface HeadingBlock {
  type: 'heading';
  /** 1 = title, 2 = section, 3 = subsection. */
  level: 1 | 2 | 3;
  text: string;
}

export interface ParagraphBlock {
  type: 'paragraph';
  text: string;
}

export interface TableBlock {
  type: 'table';
  /** Optional header row (column titles). */
  headers?: string[];
  /** Body rows; each row is an array of cell strings. */
  rows: string[][];
}

/** The full parsed document. */
export interface DocumentModel {
  title?: string;
  blocks: DocBlock[];
  /** True when the OCR detected one or more tables (drives the Excel hint). */
  hasTables: boolean;
  /** Detected language code when available, e.g. "en". */
  language?: string;
}

/* -------------------------------------------------------------------------- */
/* Pipeline input                                                             */
/* -------------------------------------------------------------------------- */

/** A single source asset picked/captured by the user. */
export interface SourceAsset {
  id: string;
  uri: string;
  name: string;
  /** Bytes, when known. */
  size?: number;
  mimeType?: string;
  sourceFormat: SourceFormat;
  /** Thumbnail uri for preview (usually === uri for images). */
  previewUri?: string;
}

/* -------------------------------------------------------------------------- */
/* Storage records                                                            */
/* -------------------------------------------------------------------------- */

/** A generated file on disk + its history metadata (one SQLite row). */
export interface FileRecord {
  id: string;
  /** Display name including extension, e.g. "Invoice.xlsx". */
  name: string;
  outputFormat: OutputFormat;
  sourceFormat: SourceFormat;
  /** Absolute file:// path of the generated file. */
  path: string;
  /** Bytes on disk. */
  size: number;
  /** Epoch ms. */
  createdAt: number;
  status: ConversionStatus;
  /** Serialized DocumentModel so the file can be re-edited / re-exported. */
  documentJson?: string;
  /** Original source thumbnail uri for the history/preview rows. */
  sourceThumbUri?: string;
  /** Optional human error message when status === 'failed'. */
  error?: string;
}

/* -------------------------------------------------------------------------- */
/* Pipeline progress                                                          */
/* -------------------------------------------------------------------------- */

export type PipelineStage =
  | 'idle'
  | 'uploading'
  | 'detecting'
  | 'layout'
  | 'formatting'
  | 'saving'
  | 'done'
  | 'error';

export interface PipelineProgress {
  stage: PipelineStage;
  /** 0..1 */
  progress: number;
  message?: string;
}
