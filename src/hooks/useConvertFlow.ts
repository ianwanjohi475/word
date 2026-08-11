/**
 * Centralizes the "pick a source and start converting" flow used by the Home
 * dashboard, quick-action cards and the Upload screen. Handles permissions,
 * cancellation and routing so screens stay declarative.
 */
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import type { OutputFormat, SourceAsset } from '@/types';
import {
  pickFromGallery,
  pickDocuments,
  capturePhoto,
  PickerCancelled,
  PermissionDenied,
} from '@/services/picker';
import { useConversionStore } from '@/store/useConversionStore';
import { useToast } from '@/components/Toast';

type Source = 'gallery' | 'documents' | 'camera';

export function useConvertFlow() {
  const router = useRouter();
  const toast = useToast();
  const setAssets = useConversionStore((s) => s.setAssets);
  const setSelectedFormat = useConversionStore((s) => s.setSelectedFormat);
  const setCurrentDoc = useConversionStore((s) => s.setCurrentDoc);

  const run = useCallback(
    async (source: Source, preselect?: OutputFormat, destination: 'convert' | 'upload' = 'convert') => {
      try {
        let assets: SourceAsset[] = [];
        if (source === 'gallery') assets = await pickFromGallery();
        else if (source === 'documents') assets = await pickDocuments();
        else assets = await capturePhoto();

        if (assets.length === 0) return;

        setAssets(assets);
        setCurrentDoc(null);
        if (preselect) setSelectedFormat(preselect);

        if (destination === 'upload') {
          router.push({ pathname: '/upload', params: preselect ? { target: preselect } : {} });
        } else {
          router.push({ pathname: '/convert', params: preselect ? { target: preselect } : {} });
        }
      } catch (e) {
        if (e instanceof PickerCancelled) return; // user backed out — no noise
        if (e instanceof PermissionDenied) {
          toast.show(e.message, 'error');
          return;
        }
        toast.show('Could not open that file. Please try another.', 'error');
      }
    },
    [router, setAssets, setSelectedFormat, setCurrentDoc, toast]
  );

  return { run };
}
