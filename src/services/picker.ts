/**
 * Input layer — documents only (PDF / Word / Excel). No images or camera; this
 * is a pure document converter, so everything works locally with no OCR.
 */
import * as DocumentPicker from 'expo-document-picker';
import type { SourceAsset, SourceFormat } from '@/types';
import { uid } from '@/utils/id';
import { importSource } from './io';

function detectSourceFormat(mime?: string, name?: string, uri?: string): SourceFormat {
  const hay = `${mime ?? ''} ${name ?? ''} ${uri ?? ''}`.toLowerCase();
  if (hay.includes('spreadsheet') || hay.includes('.xlsx') || hay.includes('.xls') || hay.includes('excel') || hay.includes('.csv')) {
    return 'excel';
  }
  if (hay.includes('wordprocessingml') || hay.includes('.docx') || hay.includes('msword') || hay.includes('.doc')) {
    return 'word';
  }
  return 'pdf';
}

export class PickerCancelled extends Error {
  constructor() {
    super('cancelled');
    this.name = 'PickerCancelled';
  }
}

export class PermissionDenied extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionDenied';
  }
}

/** Accepted input types for the document picker. */
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
];

/** Pick documents (PDF / Word / Excel) from the system file browser. */
export async function pickDocuments(): Promise<SourceAsset[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ACCEPTED_TYPES,
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (result.canceled) throw new PickerCancelled();

  return Promise.all(
    result.assets.map(async (a) => {
      const sourceFormat = detectSourceFormat(a.mimeType, a.name, a.uri);
      const uri = await importSource(a.uri, a.name);
      return {
        id: uid('a_'),
        uri,
        previewUri: undefined,
        name: a.name,
        size: a.size ?? undefined,
        mimeType: a.mimeType ?? undefined,
        sourceFormat,
      };
    })
  );
}
