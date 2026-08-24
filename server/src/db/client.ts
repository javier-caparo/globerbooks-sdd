import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { initSchema } from './init';
import * as schema from './schema';

export type BooksDatabase = ReturnType<typeof drizzle<typeof schema>>;

export interface BookStore {
  sqlite: Database.Database;
  db: BooksDatabase;
  close(): void;
}

/**
 * Opens (and initializes) the SQLite store at `dbPath`.
 * Parent directories are created as needed.
 */
export function openStore(dbPath: string): BookStore {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  initSchema(sqlite);
  const db = drizzle(sqlite, { schema });
  return {
    sqlite,
    db,
    close() {
      sqlite.close();
    },
  };
}
