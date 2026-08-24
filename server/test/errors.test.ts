import { describe, it, expect, afterEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import { AppError, errorHandler } from '../src/http/errors';
import { createTestContext, type TestContext } from './helpers';

const contexts: TestContext[] = [];

afterEach(() => {
  while (contexts.length > 0) {
    contexts.pop()?.cleanup();
  }
});

function errorApp(): Express {
  const app = express();
  app.use(express.json());
  app.get('/api/v1/invalid', () => {
    throw new AppError('INVALID_STATUS', 'status must be one of: unread, reading, completed', 400, {
      fields: ['status must be one of: unread, reading, completed'],
    });
  });
  app.get('/api/v1/missing', () => {
    throw new AppError('BOOK_NOT_FOUND', 'Book not found: ghost', 404);
  });
  app.get('/api/v1/duplicate', () => {
    throw new AppError('DUPLICATE_BOOK', 'This book may already exist. Add anyway?', 409, {
      existing: { id: 'b-1', title: 'Clean Code' },
    });
  });
  app.get('/api/v1/crash', () => {
    throw new Error('surprise');
  });
  app.post('/api/v1/echo', (req, res) => {
    res.status(200).json(req.body);
  });
  app.use(errorHandler);
  return app;
}

const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

describe('error middleware (task 4.1)', () => {
  it('maps AppError 400 to the standard body shape', async () => {
    const res = await request(errorApp()).get('/api/v1/invalid');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('status must be one of: unread, reading, completed');
    expect(res.body.code).toBe('INVALID_STATUS');
    expect(res.body.timestamp).toMatch(ISO_TIMESTAMP);
    expect(res.body.fields).toBeDefined();
  });

  it('maps AppError 404 to the standard body shape', async () => {
    const res = await request(errorApp()).get('/api/v1/missing');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('BOOK_NOT_FOUND');
    expect(res.body.timestamp).toMatch(ISO_TIMESTAMP);
  });

  it('maps AppError 409 and includes duplicate details', async () => {
    const res = await request(errorApp()).get('/api/v1/duplicate');
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DUPLICATE_BOOK');
    expect(res.body.existing).toEqual({ id: 'b-1', title: 'Clean Code' });
    expect(res.body.timestamp).toMatch(ISO_TIMESTAMP);
  });

  it('maps unknown errors to a generic 500 without leaking the message', async () => {
    const res = await request(errorApp()).get('/api/v1/crash');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
    expect(res.body.code).toBe('INTERNAL_ERROR');
    expect(res.body.timestamp).toMatch(ISO_TIMESTAMP);
  });

  it('maps malformed JSON bodies to 400 VALIDATION_ERROR', async () => {
    const res = await request(errorApp())
      .post('/api/v1/echo')
      .set('Content-Type', 'application/json')
      .send('{not json');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.timestamp).toMatch(ISO_TIMESTAMP);
  });

  it('serves the API via createApp wiring (smoke)', async () => {
    const ctx = createTestContext();
    contexts.push(ctx);
    const { createApp } = await import('../src/http/app');
    const res = await request(createApp(ctx.repo)).get('/api/v1/books');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ books: [], total: 0 });
  });
});
