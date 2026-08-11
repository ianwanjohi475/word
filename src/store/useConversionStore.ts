/**
 * Ephemeral state for the active convert flow: the picked source assets, the
 * chosen output format, the extracted document, and the last result. Not
 * persisted — a conversion is a transient task; finished files live in SQLite.
 */
import { create } from 'zustand';
import type { DocumentModel, FileRecord, OutputFormat, SourceAsset } from '@/types';

interface ConversionState {
  assets: SourceAsset[];
  /** Index of the asset currently being converted (multi-file selection). */
  activeIndex: number;
  selectedFormat: OutputFormat | null;
  /** OCR result available to the result/editor screens. */
  currentDoc: DocumentModel | null;
  lastResult: FileRecord | null;

  setAssets: (assets: SourceAsset[]) => void;
  addAssets: (assets: SourceAsset[]) => void;
  removeAsset: (id: string) => void;
  setActiveIndex: (i: number) => void;
  setSelectedFormat: (f: OutputFormat) => void;
  setCurrentDoc: (doc: DocumentModel | null) => void;
  setLastResult: (r: FileRecord | null) => void;
  reset: () => void;

  activeAsset: () => SourceAsset | null;
}

export const useConversionStore = create<ConversionState>((set, get) => ({
  assets: [],
  activeIndex: 0,
  selectedFormat: null,
  currentDoc: null,
  lastResult: null,

  setAssets: (assets) => set({ assets, activeIndex: 0 }),
  addAssets: (assets) =>
    set((s) => ({ assets: [...s.assets, ...assets] })),
  removeAsset: (id) =>
    set((s) => {
      const next = s.assets.filter((a) => a.id !== id);
      return { assets: next, activeIndex: Math.min(s.activeIndex, Math.max(0, next.length - 1)) };
    }),
  setActiveIndex: (i) => set({ activeIndex: i }),
  setSelectedFormat: (f) => set({ selectedFormat: f }),
  setCurrentDoc: (doc) => set({ currentDoc: doc }),
  setLastResult: (r) => set({ lastResult: r }),
  reset: () =>
    set({ assets: [], activeIndex: 0, selectedFormat: null, currentDoc: null, lastResult: null }),

  activeAsset: () => {
    const { assets, activeIndex } = get();
    return assets[activeIndex] ?? assets[0] ?? null;
  },
}));
