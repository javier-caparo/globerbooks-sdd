import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openStore, type BookStore } from '../src/db/client';
import { BookRepository } from '../src/repositories/bookRepository';

export interface TestContext {
  store: BookStore;
  repo: BookRepository;
  dbPath: string;
  cleanup(): void;
}

/** Creates an isolated temp-dir SQLite store for a test. */
export function createTestContext(): TestContext {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'globerbooks-test-'));
  const dbPath = path.join(dir, 'test.db');
  const store = openStore(dbPath);
  const repo = new BookRepository(store.db);
  return {
    store,
    repo,
    dbPath,
    cleanup() {
      store.close();
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}
