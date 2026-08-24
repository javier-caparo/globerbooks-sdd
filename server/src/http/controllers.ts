import type { Request, Response } from 'express';
import { addBook, listBooks, removeBook, updateBookStatus } from '../services/bookService';
import { setRating } from '../services/ratingService';
import type { BookRepository } from '../repositories/bookRepository';
import type { BookRow } from '../db/schema';

function serializeBook(book: BookRow) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    status: book.status,
    rating: book.rating,
    date_added: book.dateAdded,
    date_completed: book.dateCompleted,
  };
}

/**
 * HTTP shape only: parse, delegate to services, map results to responses.
 * All business rules live in services (design.md D3).
 */
export function makeControllers(repo: BookRepository) {
  return {
    listBooks(_req: Request, res: Response): void {
      const books = listBooks(repo);
      res.status(200).json({ books: books.map(serializeBook), total: books.length });
    },

    addBook(req: Request, res: Response): void {
      const book = addBook(repo, req.body ?? {});
      res.status(201).json(serializeBook(book));
    },

    updateStatus(req: Request, res: Response): void {
      const body = (req.body ?? {}) as { status?: unknown };
      const book = updateBookStatus(repo, String(req.params.id), body.status);
      res.status(200).json(serializeBook(book));
    },

    setRating(req: Request, res: Response): void {
      const body = (req.body ?? {}) as { rating?: unknown };
      const book = setRating(repo, String(req.params.id), body.rating);
      res.status(200).json(serializeBook(book));
    },

    removeBook(req: Request, res: Response): void {
      removeBook(repo, String(req.params.id));
      res.status(200).json({ message: 'Book removed' });
    },
  };
}
