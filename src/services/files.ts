/**
 * File-system layer: writes generated files into app storage, and handles
 * sharing + "download to device".
 *
 * We use the `expo-file-system/legacy` API (writeAsStringAsync / getInfoAsync /
 * StorageAccessFramework) which has the stable base64 read/write primitives the
 * generators rely on.
 */
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import type { OutputFormat } from '@/types';
import { FORMAT_META } from '@/utils/formats';
import { sanitizeFileName } from '@/utils/format';

/** Directory where all generated documents live. */
export const OUTPUT_DIR = `${FileSystem.documentDirectory}converta/`;

/** Directory for transient/source scratch files (rasterized pages, imports). */
export const WORK_DIR = `${FileSystem.cacheDirectory}converta-work/`;

async function ensureDir(dir: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

export async function ensureDirs(): Promise<void> {
  await Promise.all([ensureDir(OUTPUT_DIR), ensureDir(WORK_DIR)]);
}

/** Build a collision-free output path for a display name + format. */
export async function resolveOutputPath(
  baseName: string,
  format: OutputFormat
): Promise<{ path: string; name: string }> {
  await ensureDir(OUTPUT_DIR);
  const ext = FORMAT_META[format].extension;
  const clean = sanitizeFileName(baseName);
  let candidate = `${clean}.${ext}`;
  let i = 1;
  // Avoid overwriting an existing file with the same name.
  // eslint-disable-next-line no-await-in-loop
  while ((await FileSystem.getInfoAsync(OUTPUT_DIR + candidate)).exists) {
    candidate = `${clean} (${i}).${ext}`;
    i += 1;
  }
  return { path: OUTPUT_DIR + candidate, name: candidate };
}

/** Write a base64 payload to a path and return its byte size. */
export async function writeBase64(path: string, base64: string): Promise<number> {
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const info = await FileSystem.getInfoAsync(path);
  return info.exists && 'size' in info ? (info.size ?? 0) : 0;
}

/** Write a UTF-8 string (used for the .txt generator). */
export async function writeUtf8(path: string, text: string): Promise<number> {
  await FileSystem.writeAsStringAsync(path, text, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const info = await FileSystem.getInfoAsync(path);
  return info.exists && 'size' in info ? (info.size ?? 0) : 0;
}

export async function readBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export async function fileExists(path: string): Promise<boolean> {
  return (await FileSystem.getInfoAsync(path)).exists;
}

export async function getFileSize(path: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(path);
  return info.exists && 'size' in info ? (info.size ?? 0) : 0;
}

export async function deleteFile(path: string): Promise<void> {
  await FileSystem.deleteAsync(path, { idempotent: true });
}

/** Copy an imported/captured asset into our work dir so it survives cache eviction of the picker. */
export async function importToWork(uri: string, name: string): Promise<string> {
  await ensureDir(WORK_DIR);
  const dest = `${WORK_DIR}${Date.now()}-${sanitizeFileName(name)}`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

export async function isSharingAvailable(): Promise<boolean> {
  return Sharing.isAvailableAsync();
}

/** Open the OS share sheet for a generated file. */
export async function shareFile(path: string, format: OutputFormat): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(path, {
    mimeType: FORMAT_META[format].mimeType,
    dialogTitle: 'Share converted file',
    UTI: uti(format),
  });
}

function uti(format: OutputFormat): string {
  switch (format) {
    case 'pdf':
      return 'com.adobe.pdf';
    case 'txt':
      return 'public.plain-text';
    case 'word':
      return 'org.openxmlformats.wordprocessingml.document';
    case 'excel':
      return 'org.openxmlformats.spreadsheetml.sheet';
  }
}

export type DownloadResult =
  | { kind: 'saved'; location: string }
  | { kind: 'shared' }
  | { kind: 'cancelled' };

/**
 * Save a generated file to a location the user can find outside the app.
 *
 * - Android: use the Storage Access Framework so the user picks a folder
 *   (e.g. Downloads) and we copy the bytes there.
 * - iOS: there is no writable public folder; we present the share sheet, whose
 *   "Save to Files" option is the platform-standard way to download.
 */
export async function downloadFile(
  path: string,
  name: string,
  format: OutputFormat
): Promise<DownloadResult> {
  if (Platform.OS === 'android') {
    const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!perm.granted) return { kind: 'cancelled' };
    const base64 = await readBase64(path);
    const target = await FileSystem.StorageAccessFramework.createFileAsync(
      perm.directoryUri,
      name,
      FORMAT_META[format].mimeType
    );
    await FileSystem.writeAsStringAsync(target, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return { kind: 'saved', location: 'your selected folder' };
  }
  // iOS / others: share sheet with "Save to Files".
  await shareFile(path, format);
  return { kind: 'shared' };
}

/**
 * For image/pdf outputs we can additionally offer "Save to Photos/Files" via the
 * media library. Returns false when the type isn't a supported media type.
 */
export async function saveToMediaLibrary(path: string): Promise<boolean> {
  try {
    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted) return false;
    await MediaLibrary.saveToLibraryAsync(path);
    return true;
  } catch {
    return false;
  }
}

/** Total bytes used by generated files (for the Settings > Storage screen). */
export async function computeStorageUsage(): Promise<number> {
  await ensureDir(OUTPUT_DIR);
  const names = await FileSystem.readDirectoryAsync(OUTPUT_DIR);
  let total = 0;
  for (const n of names) {
    // eslint-disable-next-line no-await-in-loop
    const info = await FileSystem.getInfoAsync(OUTPUT_DIR + n);
    if (info.exists && 'size' in info) total += info.size ?? 0;
  }
  return total;
}

/** Clear cache / work directory. Returns bytes reclaimed (best effort). */
export async function clearWorkCache(): Promise<void> {
  const info = await FileSystem.getInfoAsync(WORK_DIR);
  if (info.exists) {
    await FileSystem.deleteAsync(WORK_DIR, { idempotent: true });
  }
  await ensureDir(WORK_DIR);
}
