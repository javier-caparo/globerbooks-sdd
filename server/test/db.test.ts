import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import { openStore } from '../src/db/client';
import { createTestContext } from './helpers';

const contexts: Array<{ cleanup: () => void }> = [];

afterEach(() => {
  while (contexts.length > 0) {
    contexts.pop()?.cleanup();
  }
});

describe('db init (task 2.1)', () => {
  it('creates the database file at the given path', () => {
    const ctx = createTestContext();
    contexts.push(ctx);
    expect(fs.existsSync(ctx.dbPath)).toBe(true);
  });

  it('creates the books table with all expected columns', () => {
    const ctx = createTestContext();
    contexts.push(ctx);
    const columns = ctx.store.sqlite
      .prepare('PRAGMA table_info(books)')
      .all()
      .map((col) => (col as { name: string }).name);
    expect(columns).toEqual([
      'id',
      'title',
      'author',
      'status',
      'rating',
      'date_added',
      'date_completed',
      'title_key',
      'author_key',
    ]);
  });

  it('enforces the status CHECK constraint', () => {
    const ctx = createTestContext();
    contexts.push(ctx);
    const insert = ctx.store.sqlite.prepare(
      `INSERT INTO books (id, title, author, status, date_added, title_key, author_key)
       VALUES ('b1', 'T', 'A', 'bogus', '2026-01-01T00:00:00.000Z', 't', 'a')`,
    );
    expect(() => insert.run()).toThrow(/CHECK constraint failed/i);
  });

  it('enforces the rating CHECK constraint (rating only on completed)', () => {
    const ctx = createTestContext();
    contexts.push(ctx);
    const insert = ctx.store.sqlite.prepare(
      `INSERT INTO books (id, title, author, status, rating, date_added, title_key, author_key)
       VALUES ('b1', 'T', 'A', 'reading', 4, '2026-01-01T00:00:00.000Z', 't', 'a')`,
    );
    expect(() => insert.run()).toThrow(/CHECK constraint failed/i);
  });

  it('is idempotent — reopening an existing store keeps data', () => {
    const ctx = createTestContext();
    ctx.repo.insert({
      id: 'b1',
      title: 'Clean Code',
      author: 'Robert Martin',
      status: 'unread',
      rating: null,
      dateAdded: '2026-01-01T00:00:00.000Z',
      dateCompleted: null,
      titleKey: 'clean code',
      authorKey: 'robert martin',
    });
    ctx.store.close();
    const reopened = openStore(ctx.dbPath);
    contexts.push({ cleanup: () => reopened.close() });
    expect(reopened.sqlite.prepare('SELECT COUNT(*) AS n FROM books').get()).toEqual({ n: 1 });
  });
});
