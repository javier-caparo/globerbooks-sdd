import { Router } from 'express';
import { makeControllers } from './controllers';
import type { BookRepository } from '../repositories/bookRepository';

/** Mounts the /books routes (design.md D8) on the given Router. */
export function createBooksRouter(repo: BookRepository): Router {
  const router = Router();
  const controllers = makeControllers(repo);

  router.get('/books', controllers.listBooks);
  router.post('/books', controllers.addBook);
  router.patch('/books/:id/status', controllers.updateStatus);
  router.put('/books/:id/rating', controllers.setRating);
  router.delete('/books/:id', controllers.removeBook);

  return router;
}
