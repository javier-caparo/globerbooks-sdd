import { randomUUID } from 'node:crypto';
import { AppError } from '../http/errors';
import type { BookRepository } from '../repositories/bookRepository';
import type { BookRow } from '../db/schema';

export const BOOK_STATUSES = ['unread', 'reading', 'completed'] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

export interface AddBookInput {
  title?: unknown;
  author?: unknown;
  status?: unknown;
  force?: unknown;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function isBookStatus(value: unknown): value is BookStatus {
  return typeof value === 'string' && (BOOK_STATUSES as readonly string[]).includes(value);
}

/**
 * Adds a book after field validation and duplicate detection.
 * Spec: books "Add a book" + "Flag duplicate books"; design.md D5.
 */
export function addBook(repo: BookRepository, input: AddBookInput): BookRow {
  const fieldErrors: string[] = [];

  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (title.length < 1 || title.length > 500) {
    fieldErrors.push('title must be a string of 1-500 characters');
  }

  const author = typeof input.author === 'string' ? input.author.trim() : '';
  if (author.length < 1 || author.length > 200) {
    fieldErrors.push('author must be a string of 1-200 characters');
  }

  if (fieldErrors.length > 0) {
    throw new AppError('VALIDATION_ERROR', fieldErrors.join('; '), 400, { fields: fieldErrors });
  }

  let status: BookStatus = 'unread';
  if (input.status !== undefined && input.status !== null) {
    if (!isBookStatus(input.status)) {
      throw new AppError(
        'INVALID_STATUS',
        'status must be one of: unread, reading, completed',
        400,
        { fields: ['status must be one of: unread, reading, completed'] },
      );
    }
    status = input.status;
  }

  const titleKey = normalizeKey(title);
  const authorKey = normalizeKey(author);

  const existing = repo.findFirstByTitleAuthor(titleKey, authorKey);
  if (existing && input.force !== true) {
    throw new AppError('DUPLICATE_BOOK', 'This book may already exist. Add anyway?', 409, { existing });
  }

  const now = new Date().toISOString();
  return repo.insert({
    id: randomUUID(),
    title,
    author,
    status,
    rating: null,
    dateAdded: now,
    dateCompleted: status === 'completed' ? now : null,
    titleKey,
    authorKey,
  });
}

/** Lists all books newest first. Spec: books "List books". */
export function listBooks(repo: BookRepository): BookRow[] {
  return repo.listAll();
}

/**
 * Updates reading status. Sets `date_completed` when entering `completed`
 * (preserving an existing value); clears rating + completion when leaving.
 * Spec: books "Update reading status"; design.md D6.
 */
export function updateBookStatus(repo: BookRepository, id: string, rawStatus: unknown): BookRow {
  if (!isBookStatus(rawStatus)) {
    throw new AppError(
      'INVALID_STATUS',
      'status must be one of: unread, reading, completed',
      400,
      { fields: ['status must be one of: unread, reading, completed'] },
    );
  }
  const status = rawStatus;

  const book = repo.findById(id);
  if (!book) {
    throw new AppError('BOOK_NOT_FOUND', `Book not found: ${id}`, 404);
  }

  const rating = status === 'completed' ? book.rating : null;
  const dateCompleted =
    status === 'completed' ? (book.dateCompleted ?? new Date().toISOString()) : null;

  const updated = repo.updateStatus(id, { status, rating, dateCompleted });
  if (!updated) {
    throw new AppError('BOOK_NOT_FOUND', `Book not found: ${id}`, 404);
  }
  return updated;
}

/** Removes a book. Spec: books "Remove a book". */
export function removeBook(repo: BookRepository, id: string): void {
  const book = repo.findById(id);
  if (!book) {
    throw new AppError('BOOK_NOT_FOUND', `Book not found: ${id}`, 404);
  }
  repo.remove(id);
}
