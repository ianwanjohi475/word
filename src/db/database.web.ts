/**
 * Web persistence (mirrors database.ts).
 *
 * expo-sqlite's web (wasm) backend needs cross-origin-isolation headers the dev
 * server doesn't set, so on web we persist file metadata in AsyncStorage
 * (localStorage). File bytes aren't stored — downloads are regenerated on demand
 * from each record's saved DocumentModel. Metro resolves this over database.ts.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FileRecord } from '@/types';

const KEY = 'converta-files-web';
let cache: FileRecord[] | null = null;

async function load(): Promise<FileRecord[]> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as FileRecord[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

async function save(list: FileRecord[]): Promise<void> {
  cache = list;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full / unavailable — keep the in-memory copy */
  }
}

export async function initDatabase(): Promise<void> {
  await load();
}

export async function insertFile(rec: FileRecord): Promise<void> {
  const list = await load();
  const next = [rec, ...list.filter((f) => f.id !== rec.id)];
  await save(next);
}

export async function updateFileFields(
  id: string,
  fields: Partial<Pick<FileRecord, 'name' | 'path' | 'size' | 'status' | 'documentJson' | 'error'>>
): Promise<void> {
  const list = await load();
  await save(list.map((f) => (f.id === id ? { ...f, ...fields } : f)));
}

export async function getAllFiles(): Promise<FileRecord[]> {
  const list = await load();
  return [...list].sort((a, b) => b.createdAt - a.createdAt);
}

export async function getRecentFiles(limit = 6): Promise<FileRecord[]> {
  const list = await getAllFiles();
  return list.filter((f) => f.status === 'completed').slice(0, limit);
}

export async function getFileById(id: string): Promise<FileRecord | null> {
  const list = await load();
  return list.find((f) => f.id === id) ?? null;
}

export async function deleteFileRecord(id: string): Promise<void> {
  const list = await load();
  await save(list.filter((f) => f.id !== id));
}

export async function clearAllFiles(): Promise<void> {
  await save([]);
}

export async function countFiles(): Promise<number> {
  return (await load()).length;
}
