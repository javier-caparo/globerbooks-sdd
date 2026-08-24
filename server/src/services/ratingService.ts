import { AppError } from '../http/errors';
import type { BookRepository } from '../repositories/bookRepository';
import type { BookRow } from '../db/schema';

/**
 * Sets or replaces a book rating. Completed-only guard, integer 1-5.
 * Spec: books "Rate a completed book"; design.md D6.
 */
export function setRating(repo: BookRepository, id: string, rawRating: unknown): BookRow {
  if (
    typeof rawRating !== 'number' ||
    !Number.isInteger(rawRating) ||
    rawRating < 1 ||
    rawRating > 5
  ) {
    throw new AppError('INVALID_RATING', 'rating must be an integer between 1 and 5', 400, {
      fields: ['rating must be an integer between 1 and 5'],
    });
  }

  const book = repo.findById(id);
  if (!book) {
    throw new AppError('BOOK_NOT_FOUND', `Book not found: ${id}`, 404);
  }
  if (book.status !== 'completed') {
    throw new AppError(
      'RATING_NOT_ALLOWED',
      'Rating is only allowed for books marked as completed',
      400,
    );
  }

  const updated = repo.updateRating(id, rawRating);
  if (!updated) {
    throw new AppError('BOOK_NOT_FOUND', `Book not found: ${id}`, 404);
  }
  return updated;
}
