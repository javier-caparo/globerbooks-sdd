import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BookRow } from '../src/db/schema';
import type { BookRepository } from '../src/repositories/bookRepository';
import { addBook, listBooks, removeBook, updateBookStatus } from '../src/services/bookService';
import { AppError } from '../src/http/errors';

type Spy = ReturnType<typeof vi.fn>;

interface FakeRepo extends BookRepository {
  rows: BookRow[];
  insert: Spy;
  listAll: Spy;
  findById: Spy;
  findFirstByTitleAuthor: Spy;
  updateStatus: Spy;
  updateRating: Spy;
  remove: Spy;
  count: Spy;
}

/** In-memory fake repository with spies — services must not touch the DB layer. */
function createFakeRepo(seed: BookRow[] = []): FakeRepo {
  const rows: BookRow[] = seed.map((b) => ({ ...b }));
  const fake = {
    rows,
    insert: vi.fn((book: BookRow) => {
      rows.push(book);
      return book;
    }),
    listAll: vi.fn(() => [...rows]),
    findById: vi.fn((id: string) => rows.find((b) => b.id === id) ?? null),
    findFirstByTitleAuthor: vi.fn((titleKey: string, authorKey: string) =>
      rows.find((b) => b.titleKey === titleKey && b.authorKey === authorKey) ?? null,
    ),
    updateStatus: vi.fn((id: string, u: { status: string; rating: number | null; dateCompleted: string | null }) => {
      const row = rows.find((b) => b.id === id);
      if (!row) return null;
      row.status = u.status;
      row.rating = u.rating;
      row.dateCompleted = u.dateCompleted;
      return row;
    }),
    updateRating: vi.fn((id: string, rating: number) => {
      const row = rows.find((b) => b.id === id);
      if (!row) return null;
      row.rating = rating;
      return row;
    }),
    remove: vi.fn((id: string) => {
      const index = rows.findIndex((b) => b.id === id);
      if (index === -1) return false;
      rows.splice(index, 1);
      return true;
    }),
    count: vi.fn(() => rows.length),
  };
  return fake as unknown as FakeRepo;
}

function seededBook(overrides: Partial<BookRow> = {}): BookRow {
  return {
    id: 'b-1',
    title: 'Clean Code',
    author: 'Robert Martin',
    status: 'unread',
    rating: null,
    dateAdded: '2026-01-01T00:00:00.000Z',
    dateCompleted: null,
    titleKey: 'clean code',
    authorKey: 'robert martin',
    ...overrides,
  };
}

describe('bookService.addBook (task 3.1)', () => {
  it('creates a book with defaults: status unread, generated id and timestamp', () => {
    // Arrange
    const repo = createFakeRepo();

    // Act
    const book = addBook(repo, { title: 'Clean Code', author: 'Robert Martin' });

    // Assert
    expect(book.status).toBe('unread');
    expect(book.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(book.dateAdded).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(book.titleKey).toBe('clean code');
    expect(book.rating).toBeNull();
    expect(repo.insert).toHaveBeenCalledTimes(1);
  });

  it('rejects an invalid status with INVALID_STATUS 400', () => {
    const repo = createFakeRepo();
    const attempt = () => addBook(repo, { title: 'T', author: 'A', status: 'bogus' });
    expect(attempt).toThrow(AppError);
    try {
      attempt();
    } catch (error) {
      const appError = error as AppError;
      expect(appError.code).toBe('INVALID_STATUS');
      expect(appError.httpStatus).toBe(400);
      expect(appError.message).toContain('status');
    }
  });

  it('rejects a missing or empty title with a field-specific error', () => {
    const repo = createFakeRepo();
    for (const badTitle of [undefined, '', '   ']) {
      const attempt = () => addBook(repo, { title: badTitle, author: 'A' });
      expect(attempt).toThrow(AppError);
      try {
        attempt();
      } catch (error) {
        expect((error as AppError).message).toContain('title');
      }
    }
  });

  it('rejects a missing author and an overlong title', () => {
    const repo = createFakeRepo();
    expect(() => addBook(repo, { title: 'T' })).toThrow(/author/);
    expect(() => addBook(repo, { title: 'x'.repeat(501), author: 'A' })).toThrow(/title/);
  });

  it('flags a case/whitespace-insensitive duplicate with 409 DUPLICATE_BOOK', () => {
    const repo = createFakeRepo([seededBook()]);
    // "  CLEAN CODE " / "robert martin " normalize to the stored keys
    const attempt = () => addBook(repo, { title: '  CLEAN CODE  ', author: ' robert martin ' });
    expect(attempt).toThrow(AppError);
    try {
      attempt();
    } catch (error) {
      const appError = error as AppError;
      expect(appError.code).toBe('DUPLICATE_BOOK');
      expect(appError.httpStatus).toBe(409);
      expect((appError.details as { existing: BookRow }).existing.id).toBe('b-1');
    }
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it('adds anyway when force is true', () => {
    const repo = createFakeRepo([seededBook()]);
    const book = addBook(repo, { title: 'Clean Code', author: 'Robert Martin', force: true });
    expect(book.id).not.toBe('b-1');
    expect(repo.insert).toHaveBeenCalledTimes(1);
  });
});

describe('bookService.updateBookStatus (task 3.2)', () => {
  it('transitions to completed and records date_completed', () => {
    const repo = createFakeRepo([seededBook({ status: 'reading' })]);
    const updated = updateBookStatus(repo, 'b-1', 'completed');
    expect(updated.status).toBe('completed');
    expect(updated.dateCompleted).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('rejects an invalid status with INVALID_STATUS 400', () => {
    const repo = createFakeRepo([seededBook()]);
    expect(() => updateBookStatus(repo, 'b-1', 'paused')).toThrow(AppError);
    try {
      updateBookStatus(repo, 'b-1', 'paused');
    } catch (error) {
      expect((error as AppError).code).toBe('INVALID_STATUS');
      expect((error as AppError).httpStatus).toBe(400);
    }
  });

  it('throws BOOK_NOT_FOUND 404 for a missing book', () => {
    const repo = createFakeRepo();
    try {
      updateBookStatus(repo, 'ghost', 'reading');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as AppError).code).toBe('BOOK_NOT_FOUND');
      expect((error as AppError).httpStatus).toBe(404);
    }
  });

  it('clears rating and date_completed when leaving completed (design D6)', () => {
    const repo = createFakeRepo([
      seededBook({ status: 'completed', rating: 5, dateCompleted: '2026-01-02T00:00:00.000Z' }),
    ]);
    const updated = updateBookStatus(repo, 'b-1', 'reading');
    expect(updated.rating).toBeNull();
    expect(updated.dateCompleted).toBeNull();
  });

  it('keeps an existing date_completed when re-entering completed', () => {
    const completed = '2026-01-02T00:00:00.000Z';
    const repo = createFakeRepo([seededBook({ status: 'completed', dateCompleted: completed })]);
    const updated = updateBookStatus(repo, 'b-1', 'completed');
    expect(updated.dateCompleted).toBe(completed);
  });
});

describe('bookService remove/list (task 3.4)', () => {
  it('removes an existing book via the repository', () => {
    const repo = createFakeRepo([seededBook()]);
    removeBook(repo, 'b-1');
    expect(repo.remove).toHaveBeenCalledWith('b-1');
  });

  it('throws BOOK_NOT_FOUND 404 when removing a missing book', () => {
    const repo = createFakeRepo();
    try {
      removeBook(repo, 'ghost');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as AppError).code).toBe('BOOK_NOT_FOUND');
    }
  });

  it('lists books delegated to repository (ordering covered by repo tests)', () => {
    const repo = createFakeRepo([seededBook({ id: 'b-2' }), seededBook({ id: 'b-1' })]);
    const books = listBooks(repo);
    expect(repo.listAll).toHaveBeenCalledTimes(1);
    expect(books).toHaveLength(2);
  });
});
