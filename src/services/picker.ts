/**
 * Input layer — turns image-picker / document-picker / camera results into the
 * app's `SourceAsset` shape. Imported files are copied into the work dir so they
 * survive the OS clearing the picker cache mid-flow.
 */
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import type { SourceAsset, SourceFormat } from '@/types';
import { uid } from '@/utils/id';
import { importSource } from './io';

function detectSourceFormat(mime?: string, name?: string, uri?: string): SourceFormat {
  const hay = `${mime ?? ''} ${name ?? ''} ${uri ?? ''}`.toLowerCase();
  return hay.includes('pdf') ? 'pdf' : 'image';
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

/** Pick one or more images from the photo library. */
export async function pickFromGallery(): Promise<SourceAsset[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new PermissionDenied('Photo library access is needed to import images.');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.9,
    exif: false,
  });
  if (result.canceled) throw new PickerCancelled();

  return Promise.all(
    result.assets.map(async (a, i) => {
      const name = a.fileName ?? `Photo ${i + 1}.jpg`;
      const uri = await importSource(a.uri, name);
      return {
        id: uid('a_'),
        uri,
        previewUri: uri,
        name,
        size: a.fileSize,
        mimeType: a.mimeType ?? 'image/jpeg',
        sourceFormat: 'image' as const,
      };
    })
  );
}

/** Pick documents (PDF or image files) from the system file browser. */
export async function pickDocuments(): Promise<SourceAsset[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
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
        previewUri: sourceFormat === 'image' ? uri : undefined,
        name: a.name,
        size: a.size ?? undefined,
        mimeType: a.mimeType ?? undefined,
        sourceFormat,
      };
    })
  );
}

/** Capture a photo with the system camera (fallback / "Take a Photo"). */
export async function capturePhoto(): Promise<SourceAsset[]> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    throw new PermissionDenied('Camera access is needed to scan documents.');
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.9,
    exif: false,
  });
  if (result.canceled) throw new PickerCancelled();

  return Promise.all(
    result.assets.map(async (a, i) => {
      const name = a.fileName ?? `Scan ${Date.now()}-${i}.jpg`;
      const uri = await importSource(a.uri, name);
      return {
        id: uid('a_'),
        uri,
        previewUri: uri,
        name,
        size: a.fileSize,
        mimeType: a.mimeType ?? 'image/jpeg',
        sourceFormat: 'image' as const,
      };
    })
  );
}

/** Build a SourceAsset from a captured camera photo uri (custom scan screen). */
export async function assetFromCapture(uri: string): Promise<SourceAsset> {
  const name = `Scan ${Date.now()}.jpg`;
  const stored = await importSource(uri, name);
  return {
    id: uid('a_'),
    uri: stored,
    previewUri: stored,
    name,
    mimeType: 'image/jpeg',
    sourceFormat: 'image',
  };
}
