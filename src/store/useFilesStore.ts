/**
 * Files/history store — a thin cache over SQLite so Home, Files and History
 * share one reactive list and refresh consistently after conversions/edits.
 */
import { create } from 'zustand';
import type { FileRecord } from '@/types';
import {
  clearAllFiles,
  deleteFileRecord,
  getAllFiles,
  updateFileFields,
} from '@/db/database';
import { deleteFile } from '@/services/files';

interface FilesState {
  files: FileRecord[];
  loading: boolean;
  loaded: boolean;
  refresh: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  rename: (id: string, newName: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useFilesStore = create<FilesState>((set, get) => ({
  files: [],
  loading: false,
  loaded: false,

  refresh: async () => {
    set({ loading: true });
    try {
      const files = await getAllFiles();
      set({ files, loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  remove: async (id) => {
    const rec = get().files.find((f) => f.id === id);
    if (rec) {
      await deleteFile(rec.path).catch(() => {});
    }
    await deleteFileRecord(id);
    set((s) => ({ files: s.files.filter((f) => f.id !== id) }));
  },

  rename: async (id, newName) => {
    await updateFileFields(id, { name: newName });
    set((s) => ({
      files: s.files.map((f) => (f.id === id ? { ...f, name: newName } : f)),
    }));
  },

  clearHistory: async () => {
    const { files } = get();
    await Promise.all(files.map((f) => deleteFile(f.path).catch(() => {})));
    await clearAllFiles();
    set({ files: [] });
  },
}));
