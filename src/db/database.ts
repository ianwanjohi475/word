/**
 * SQLite persistence for file metadata + conversion history.
 *
 * A single `files` table backs both the Files manager and the History list —
 * a history entry *is* a generated file record. Uses the async expo-sqlite API.
 */
import * as SQLite from 'expo-sqlite';
import type { ConversionStatus, FileRecord, OutputFormat, SourceFormat } from '@/types';

const DB_NAME = 'converta.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS files (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          outputFormat TEXT NOT NULL,
          sourceFormat TEXT NOT NULL,
          path TEXT NOT NULL,
          size INTEGER NOT NULL DEFAULT 0,
          createdAt INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'completed',
          documentJson TEXT,
          sourceThumbUri TEXT,
          error TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_files_createdAt ON files (createdAt DESC);
      `);
      return db;
    })();
  }
  return dbPromise;
}

/** Call once at app startup. */
export async function initDatabase(): Promise<void> {
  await getDb();
}

interface Row {
  id: string;
  name: string;
  outputFormat: string;
  sourceFormat: string;
  path: string;
  size: number;
  createdAt: number;
  status: string;
  documentJson: string | null;
  sourceThumbUri: string | null;
  error: string | null;
}

function rowToRecord(r: Row): FileRecord {
  return {
    id: r.id,
    name: r.name,
    outputFormat: r.outputFormat as OutputFormat,
    sourceFormat: r.sourceFormat as SourceFormat,
    path: r.path,
    size: r.size,
    createdAt: r.createdAt,
    status: r.status as ConversionStatus,
    documentJson: r.documentJson ?? undefined,
    sourceThumbUri: r.sourceThumbUri ?? undefined,
    error: r.error ?? undefined,
  };
}

export async function insertFile(rec: FileRecord): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO files
      (id, name, outputFormat, sourceFormat, path, size, createdAt, status, documentJson, sourceThumbUri, error)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    rec.id,
    rec.name,
    rec.outputFormat,
    rec.sourceFormat,
    rec.path,
    rec.size,
    rec.createdAt,
    rec.status,
    rec.documentJson ?? null,
    rec.sourceThumbUri ?? null,
    rec.error ?? null
  );
}

export async function updateFileFields(
  id: string,
  fields: Partial<Pick<FileRecord, 'name' | 'path' | 'size' | 'status' | 'documentJson' | 'error'>>
): Promise<void> {
  const db = await getDb();
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => {
    const v = (fields as Record<string, unknown>)[k];
    return (v ?? null) as SQLite.SQLiteBindValue;
  });
  await db.runAsync(`UPDATE files SET ${setClause} WHERE id = ?`, ...values, id);
}

export async function getAllFiles(): Promise<FileRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    `SELECT * FROM files ORDER BY createdAt DESC`
  );
  return rows.map(rowToRecord);
}

export async function getRecentFiles(limit = 6): Promise<FileRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    `SELECT * FROM files WHERE status = 'completed' ORDER BY createdAt DESC LIMIT ?`,
    limit
  );
  return rows.map(rowToRecord);
}

export async function getFileById(id: string): Promise<FileRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Row>(`SELECT * FROM files WHERE id = ?`, id);
  return row ? rowToRecord(row) : null;
}

export async function deleteFileRecord(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM files WHERE id = ?`, id);
}

export async function clearAllFiles(): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM files`);
}

export async function countFiles(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) as n FROM files`);
  return row?.n ?? 0;
}
