import { describe, it, expect, afterEach } from 'vitest';
import { createTestContext, type TestContext } from './helpers';

const contexts: TestContext[] = [];

afterEach(() => {
  while (contexts.length > 0) {
    contexts.pop()?.cleanup();
  }
});

function makeBook(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    title: `Book ${id}`,
    author: `Author ${id}`,
    status: 'unread',
    rating: null,
    dateAdded: '2026-01-01T00:00:00.000Z',
    dateCompleted: null,
    titleKey: `book ${id}`,
    authorKey: `author ${id}`,
    ...overrides,
  };
}

describe('BookRepository (task 2.2)', () => {
  it('insert returns the stored row', () => {
    const ctx = createTestContext();
    contexts.push(ctx);
    const row = ctx.repo.insert(makeBook('b1'));
    expect(row.id).toBe('b1');
    expect(row.title).toBe('Book b1');
    expect(ctx.repo.count()).toBe(1);
  });

  it('findById returns the row or null', () => {
    const ctx = createTestContext();
    contexts.push(ctx);
    ctx.repo.insert(makeBook('b1'));
    expect(ctx.repo.findById('b1')?.title).toBe('Book b1');
    expect(ctx.repo.findById('missing')).toBeNull();
  });

  it('listAll returns books newest first (date_added DESC, rowid tiebreak)', () => {
    const ctx = createTestContext();
    contexts.push(ctx);
    ctx.repo.insert(makeBook('old', { dateAdded: '2026-01-01T00:00:00.000Z' }));
    ctx.repo.insert(makeBook('newest', { dateAdded: '2026-03-01T00:00:00.000Z' }));
    ctx.repo.insert(makeBook('middle', { dateAdded: '2026-02-01T00:00:00.000Z' }));
    ctx.repo.insert(makeBook('tie-newer', { dateAdded: '2026-03-01T00:00:00.000Z' }));
    const order = ctx.repo.listAll().map((b) => b.id);
    expect(order).toEqual(['tie-newer', 'newest', 'middle', 'old']);
  });

  it('findFirstByTitleAuthor matches on normalized keys', () => {
    const ctx = createTestContext();
    contexts.push(ctx);
    ctx.repo.insert(
      makeBook('b1', { titleKey: 'clean code', authorKey: 'robert martin' }),
    );
    expect(ctx.repo.findFirstByTitleAuthor('clean code', 'robert martin')?.id).toBe('b1');
    expect(ctx.repo.findFirstByTitleAuthor('clean code', 'someone else')).toBeNull();
  });

  it('updateStatus persists status, rating and date_completed', () => {
    const ctx = createTestContext();
    contexts.push(ctx);
    ctx.repo.insert(makeBook('b1'));
    const updated = ctx.repo.updateStatus('b1', {
      status: 'completed',
      rating: 5,
      dateCompleted: '2026-02-02T00:00:00.000Z',
    });
    expect(updated?.status).toBe('completed');
    expect(updated?.rating).toBe(5);
    expect(updated?.dateCompleted).toBe('2026-02-02T00:00:00.000Z');
    expect(ctx.repo.findById('b1')?.rating).toBe(5);
  });

  it('updateStatus returns null for a missing id', () => {
    const ctx = createTestContext();
    contexts.push(ctx);
    expect(ctx.repo.updateStatus('missing', { status: 'reading', rating: null, dateCompleted: null })).toBeNull();
  });

  it('updateRating persists the rating', () => {
    const ctx = createTestContext();
    contexts.push(ctx);
    ctx.repo.insert(makeBook('b1', { status: 'completed' }));
    expect(ctx.repo.updateRating('b1', 3)?.rating).toBe(3);
    expect(ctx.repo.findById('b1')?.rating).toBe(3);
  });

  it('remove deletes an existing row and reports misses', () => {
    const ctx = createTestContext();
    contexts.push(ctx);
    ctx.repo.insert(makeBook('b1'));
    expect(ctx.repo.remove('b1')).toBe(true);
    expect(ctx.repo.count()).toBe(0);
    expect(ctx.repo.remove('b1')).toBe(false);
  });
});
