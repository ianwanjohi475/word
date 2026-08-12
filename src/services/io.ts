/**
 * Platform I/O layer (native implementation).
 *
 * Everything platform-specific about reading source bytes, saving a generated
 * document, and delivering it (share/download) lives behind this module. The web
 * build swaps in `io.web.ts` automatically (Metro resolves the `.web` variant),
 * so screens and the pipeline stay platform-agnostic.
 */
import type { DocumentModel, FileRecord, OutputFormat } from '@/types';
import { generateDocx } from './generators/docx';
import { generateXlsx } from './generators/xlsx';
import { generateTxt } from './generators/txt';
import { generatePdf } from './generators/pdf';
import * as FileSystem from 'expo-file-system/legacy';
import {
  resolveOutputPath,
  writeBase64,
  writeUtf8,
  getFileSize,
  readBase64,
  importToWork,
  shareFile,
  downloadFile,
  computeStorageUsage,
  clearWorkCache,
} from './files';

/** Read any source asset (file:// uri) as base64 for the OCR request. */
export async function readAsBase64(uri: string): Promise<string> {
  return readBase64(uri);
}

/** Bring a picked/captured asset into app-managed storage. */
export async function importSource(uri: string, name: string): Promise<string> {
  return importToWork(uri, name);
}

/** Generate the chosen format from a document model and save it to disk. */
export async function persistOutput(
  doc: DocumentModel,
  format: OutputFormat,
  baseName: string
): Promise<{ path: string; name: string; size: number }> {
  const { path, name } = await resolveOutputPath(baseName, format);
  switch (format) {
    case 'word': {
      const base64 = await generateDocx(doc);
      return { path, name, size: await writeBase64(path, base64) };
    }
    case 'excel': {
      const base64 = generateXlsx(doc);
      return { path, name, size: await writeBase64(path, base64) };
    }
    case 'txt': {
      const text = generateTxt(doc);
      return { path, name, size: await writeUtf8(path, text) };
    }
    case 'pdf': {
      const tempUri = await generatePdf(doc);
      await FileSystem.moveAsync({ from: tempUri, to: path });
      return { path, name, size: await getFileSize(path) };
    }
  }
}

/** "Download" a finished record to a user-accessible location. */
export async function deliver(record: FileRecord): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await downloadFile(record.path, record.name, record.outputFormat);
    if (res.kind === 'saved') return { ok: true, message: `Saved to ${res.location}` };
    if (res.kind === 'shared') return { ok: true, message: 'Choose “Save to Files” to download' };
    return { ok: false };
  } catch {
    return { ok: false, message: 'Could not save the file.' };
  }
}

/** Share a finished record via the OS share sheet. */
export async function shareRecord(record: FileRecord): Promise<{ ok: boolean; message?: string }> {
  try {
    await shareFile(record.path, record.outputFormat);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e as Error).message || 'Could not share the file.' };
  }
}

export async function storageUsage(): Promise<number> {
  return computeStorageUsage();
}

export async function clearCache(): Promise<void> {
  return clearWorkCache();
}

/** Whether the platform can persist generated files locally (native = yes). */
export const PERSISTS_FILES = true;
