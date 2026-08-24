import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express } from 'express';
import { createBooksRouter } from './routes';
import { errorHandler } from './errors';
import type { BookRepository } from '../repositories/bookRepository';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.resolve(currentDir, '../../../client/dist');

/**
 * Builds the Express app. When `client/dist` exists (production build),
 * the SPA is served from the same origin (design.md D1).
 */
export function createApp(repo: BookRepository): Express {
  const app = express();
  app.use(express.json());
  app.use('/api/v1', createBooksRouter(repo));

  if (fs.existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST));
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        res.sendFile(path.join(CLIENT_DIST, 'index.html'));
        return;
      }
      next();
    });
  }

  app.use(errorHandler);
  return app;
}
