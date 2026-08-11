/** Metadata describing each output/source format for the UI and file layer. */
import type { OutputFormat, SourceFormat } from '@/types';
import type { FormatColorKey } from '@/theme/tokens';

export interface FormatMeta {
  key: OutputFormat;
  label: string; // "Word"
  productName: string; // "Microsoft Word"
  extension: string; // "docx"
  mimeType: string;
  color: FormatColorKey;
  /** Short caption shown under the format on the selection screen. */
  blurb: string;
  /** Uppercase badge, e.g. "DOCX". */
  badge: string;
}

export const FORMAT_META: Record<OutputFormat, FormatMeta> = {
  word: {
    key: 'word',
    label: 'Word',
    productName: 'Microsoft Word',
    extension: 'docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    color: 'word',
    blurb: 'Editable document with headings & paragraphs',
    badge: 'DOCX',
  },
  excel: {
    key: 'excel',
    label: 'Excel',
    productName: 'Microsoft Excel',
    extension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    color: 'excel',
    blurb: 'Spreadsheet — best for tables & numbers',
    badge: 'XLSX',
  },
  pdf: {
    key: 'pdf',
    label: 'PDF',
    productName: 'PDF Document',
    extension: 'pdf',
    mimeType: 'application/pdf',
    color: 'pdf',
    blurb: 'Portable document, fixed layout',
    badge: 'PDF',
  },
  txt: {
    key: 'txt',
    label: 'Text',
    productName: 'Plain Text',
    extension: 'txt',
    mimeType: 'text/plain',
    color: 'txt',
    blurb: 'Plain text, no formatting',
    badge: 'TXT',
  },
};

export const OUTPUT_FORMATS: OutputFormat[] = ['word', 'excel', 'pdf', 'txt'];

/** Map an output extension back to its format (used by the Files screen). */
export function formatFromExtension(ext: string): OutputFormat {
  const e = ext.toLowerCase().replace('.', '');
  if (e === 'docx' || e === 'doc') return 'word';
  if (e === 'xlsx' || e === 'xls' || e === 'csv') return 'excel';
  if (e === 'pdf') return 'pdf';
  return 'txt';
}

export function sourceFormatLabel(f: SourceFormat): string {
  return f === 'pdf' ? 'PDF' : 'Image';
}
