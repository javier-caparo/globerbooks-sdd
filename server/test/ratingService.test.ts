import { describe, it, expect, vi } from 'vitest';
import type { BookRow } from '../src/db/schema';
import type { BookRepository } from '../src/repositories/bookRepository';
import { setRating } from '../src/services/ratingService';
import { AppError } from '../src/http/errors';

function seededBook(overrides: Partial<BookRow> = {}): BookRow {
  return {
    id: 'b-1',
    title: 'Clean Code',
    author: 'Robert Martin',
    status: 'completed',
    rating: null,
    dateAdded: '2026-01-01T00:00:00.000Z',
    dateCompleted: '2026-01-02T00:00:00.000Z',
    titleKey: 'clean code',
    authorKey: 'robert martin',
    ...overrides,
  };
}

function createFakeRepo(seed: BookRow[]) {
  const rows: BookRow[] = seed.map((b) => ({ ...b }));
  return {
    rows,
    findById: vi.fn((id: string) => rows.find((b) => b.id === id) ?? null),
    updateRating: vi.fn((id: string, rating: number) => {
      const row = rows.find((b) => b.id === id);
      if (!row) return null;
      row.rating = rating;
      return row;
    }),
  } as unknown as BookRepository & { rows: BookRow[] };
}

describe('ratingService.setRating (task 3.3)', () => {
  it('stores a rating on a completed book', () => {
    // Arrange
    const repo = createFakeRepo([seededBook()]);

    // Act
    const updated = setRating(repo, 'b-1', 5);

    // Assert
    expect(updated.rating).toBe(5);
    expect(repo.updateRating).toHaveBeenCalledWith('b-1', 5);
  });

  it('overwrites an existing rating', () => {
    const repo = createFakeRepo([seededBook({ rating: 5 })]);
    const updated = setRating(repo, 'b-1', 2);
    expect(updated.rating).toBe(2);
  });

  it('rejects ratings on unread and reading books with RATING_NOT_ALLOWED', () => {
    for (const status of ['unread', 'reading'] as const) {
      const repo = createFakeRepo([seededBook({ status, dateCompleted: null })]);
      try {
        setRating(repo, 'b-1', 4);
        expect.unreachable('should have thrown');
      } catch (error) {
        const appError = error as AppError;
        expect(appError.code).toBe('RATING_NOT_ALLOWED');
        expect(appError.httpStatus).toBe(400);
      }
      expect(repo.updateRating).not.toHaveBeenCalled();
    }
  });

  it('rejects out-of-range, non-integer and non-number ratings with INVALID_RATING', () => {
    const repo = createFakeRepo([seededBook()]);
    for (const bad of [0, 6, 2.5, '5', null, undefined, Number.NaN]) {
      try {
        setRating(repo, 'b-1', bad);
        expect.unreachable(`should have thrown for ${String(bad)}`);
      } catch (error) {
        const appError = error as AppError;
        expect(appError.code).toBe('INVALID_RATING');
        expect(appError.httpStatus).toBe(400);
        expect(appError.message).toContain('rating');
      }
    }
  });

  it('throws BOOK_NOT_FOUND 404 for a missing book', () => {
    const repo = createFakeRepo([]);
    try {
      setRating(repo, 'ghost', 3);
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as AppError).code).toBe('BOOK_NOT_FOUND');
      expect((error as AppError).httpStatus).toBe(404);
    }
  });
});
