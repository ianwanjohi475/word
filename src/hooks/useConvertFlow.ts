/**
 * Centralizes the "pick a document and start converting" flow. Documents only
 * (PDF / Word / Excel) — no images or camera.
 */
import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import type { OutputFormat } from '@/types';
import { pickDocuments, PickerCancelled, PermissionDenied } from '@/services/picker';
import { useConversionStore } from '@/store/useConversionStore';
import { useToast } from '@/components/Toast';

export function useConvertFlow() {
  const router = useRouter();
  const toast = useToast();
  const setAssets = useConversionStore((s) => s.setAssets);
  const setSelectedFormat = useConversionStore((s) => s.setSelectedFormat);
  const setCurrentDoc = useConversionStore((s) => s.setCurrentDoc);

  const run = useCallback(
    async (preselect?: OutputFormat, destination: 'convert' | 'upload' = 'convert') => {
      try {
        const assets = await pickDocuments();
        if (assets.length === 0) return;

        setAssets(assets);
        setCurrentDoc(null);
        if (preselect) setSelectedFormat(preselect);

        router.push({
          pathname: destination === 'upload' ? '/upload' : '/convert',
          params: preselect ? { target: preselect } : {},
        });
      } catch (e) {
        if (e instanceof PickerCancelled) return;
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
