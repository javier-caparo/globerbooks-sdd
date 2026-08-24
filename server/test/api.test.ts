import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import type { BookRow } from '../src/db/schema';
import { createApp } from '../src/http/app';
import { createTestContext, type TestContext } from './helpers';

const contexts: TestContext[] = [];

afterEach(() => {
  while (contexts.length > 0) {
    contexts.pop()?.cleanup();
  }
});

function app(): { api: ReturnType<typeof request>; ctx: TestContext } {
  const ctx = createTestContext();
  contexts.push(ctx);
  return { api: request(createApp(ctx.repo)), ctx };
}

const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

describe('API integration — spec scenarios (task 4.2)', () => {
  it('lists an empty collection with 200 (Scenario: List an empty collection)', async () => {
    const { api } = app();
    const res = await api.get('/api/v1/books');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ books: [], total: 0 });
  });

  it('adds a book with only title and author → 201, status unread, generated id + timestamp (Scenario: Add with only title and author)', async () => {
    const { api } = app();
    const res = await api.post('/api/v1/books').send({ title: 'Clean Code', author: 'Robert Martin' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('unread');
    expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.body.date_added).toMatch(ISO_TIMESTAMP);
    expect(res.body.date_completed).toBeNull();
  });

  it('rejects an invalid status on add with 400 INVALID_STATUS (Scenario: Add with invalid status rejected)', async () => {
    const { api } = app();
    const res = await api.post('/api/v1/books').send({ title: 'T', author: 'A', status: 'bogus' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_STATUS');
    expect(res.body.error).toContain('status');
    expect(res.body.timestamp).toMatch(ISO_TIMESTAMP);
  });

  it('rejects missing/empty fields with 400 field-specific errors (Scenario: Add with missing fields rejected)', async () => {
    const { api } = app();
    const missingTitle = await api.post('/api/v1/books').send({ author: 'A' });
    expect(missingTitle.status).toBe(400);
    expect(missingTitle.body.code).toBe('VALIDATION_ERROR');
    expect(missingTitle.body.error).toContain('title');

    const emptyAuthor = await api.post('/api/v1/books').send({ title: 'T', author: '   ' });
    expect(emptyAuthor.status).toBe(400);
    expect(emptyAuthor.body.error).toContain('author');
  });

  it('lists books newest first (Scenario: List books newest first)', async () => {
    const { api } = app();
    await api.post('/api/v1/books').send({ title: 'Old Book', author: 'A' });
    await api.post('/api/v1/books').send({ title: 'Newest Book', author: 'A' });
    const res = await api.get('/api/v1/books');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.books[0].title).toBe('Newest Book');
    expect(res.body.books[1].title).toBe('Old Book');
    for (const key of ['id', 'title', 'author', 'status', 'rating', 'date_added']) {
      expect(res.body.books[0]).toHaveProperty(key);
    }
  });

  it('updates status to completed and records date_completed (Scenario: Change status to completed)', async () => {
    const { api } = app();
    const created = await api.post('/api/v1/books').send({ title: 'T', author: 'A' });
    const res = await api.patch(`/api/v1/books/${created.body.id}/status`).send({ status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('completed');
    expect(res.body.date_completed).toMatch(ISO_TIMESTAMP);
  });

  it('rejects an invalid status update with 400 (Scenario: Invalid status rejected)', async () => {
    const { api } = app();
    const created = await api.post('/api/v1/books').send({ title: 'T', author: 'A' });
    const res = await api.patch(`/api/v1/books/${created.body.id}/status`).send({ status: 'paused' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_STATUS');
  });

  it('returns 404 when updating a missing book (Scenario: Update a missing book)', async () => {
    const { api } = app();
    const res = await api.patch('/api/v1/books/ghost/status').send({ status: 'reading' });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('BOOK_NOT_FOUND');
  });

  it('rates a completed book and allows editing (Scenario: Rate a completed book)', async () => {
    const { api } = app();
    const created = await api.post('/api/v1/books').send({ title: 'T', author: 'A' });
    const id = created.body.id;
    await api.patch(`/api/v1/books/${id}/status`).send({ status: 'completed' });

    const rated = await api.put(`/api/v1/books/${id}/rating`).send({ rating: 5 });
    expect(rated.status).toBe(200);
    expect(rated.body.rating).toBe(5);

    const reRated = await api.put(`/api/v1/books/${id}/rating`).send({ rating: 3 });
    expect(reRated.status).toBe(200);
    expect(reRated.body.rating).toBe(3);
  });

  it('rejects ratings for non-completed books with 400 RATING_NOT_ALLOWED (Scenario: Rating rejected for non-completed book)', async () => {
    const { api } = app();
    const created = await api.post('/api/v1/books').send({ title: 'T', author: 'A' });
    const res = await api.put(`/api/v1/books/${created.body.id}/rating`).send({ rating: 4 });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('RATING_NOT_ALLOWED');
  });

  it('rejects out-of-range and non-integer ratings with 400 INVALID_RATING (Scenario: Out-of-range rating rejected)', async () => {
    const { api } = app();
    const created = await api.post('/api/v1/books').send({ title: 'T', author: 'A' });
    const id = created.body.id;
    await api.patch(`/api/v1/books/${id}/status`).send({ status: 'completed' });

    for (const bad of [0, 6, 2.5, '5']) {
      const res = await api.put(`/api/v1/books/${id}/rating`).send({ rating: bad });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_RATING');
      expect(res.body.error).toContain('rating');
    }
  });

  it('returns 404 when rating a missing book', async () => {
    const { api } = app();
    const res = await api.put('/api/v1/books/ghost/rating').send({ rating: 3 });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('BOOK_NOT_FOUND');
  });

  it('flags a case-insensitive duplicate with 409 + existing details (Scenario: Duplicate flagged on add)', async () => {
    const { api } = app();
    await api.post('/api/v1/books').send({ title: 'Clean Code', author: 'Robert Martin' });
    const res = await api.post('/api/v1/books').send({ title: '  CLEAN CODE ', author: 'robert martin ' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DUPLICATE_BOOK');
    expect(res.body.existing.title).toBe('Clean Code');
    expect(res.body.existing.author).toBe('Robert Martin');
  });

  it('adds the duplicate anyway when force is true (Scenario: Override adds the duplicate)', async () => {
    const { api } = app();
    await api.post('/api/v1/books').send({ title: 'Clean Code', author: 'Robert Martin' });
    const res = await api
      .post('/api/v1/books')
      .send({ title: 'Clean Code', author: 'Robert Martin', force: true });
    expect(res.status).toBe(201);
    const list = await api.get('/api/v1/books');
    expect(list.body.total).toBe(2);
    const titles = list.body.books.map((b: BookRow) => b.title);
    expect(titles.filter((t: string) => t === 'Clean Code')).toHaveLength(2);
  });

  it('removes an existing book and it disappears from listings (Scenario: Remove an existing book)', async () => {
    const { api } = app();
    const created = await api.post('/api/v1/books').send({ title: 'T', author: 'A' });
    const res = await api.delete(`/api/v1/books/${created.body.id}`);
    expect(res.status).toBe(200);
    const list = await api.get('/api/v1/books');
    expect(list.body.total).toBe(0);
  });

  it('returns 404 when removing a missing book (Scenario: Remove a missing book)', async () => {
    const { api } = app();
    const res = await api.delete('/api/v1/books/ghost');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('BOOK_NOT_FOUND');
  });

  it('clears the rating when a completed book leaves completed (design D6, integration)', async () => {
    const { api } = app();
    const created = await api.post('/api/v1/books').send({ title: 'T', author: 'A' });
    const id = created.body.id;
    await api.patch(`/api/v1/books/${id}/status`).send({ status: 'completed' });
    await api.put(`/api/v1/books/${id}/rating`).send({ rating: 5 });

    const res = await api.patch(`/api/v1/books/${id}/status`).send({ status: 'reading' });
    expect(res.status).toBe(200);
    expect(res.body.rating).toBeNull();
    expect(res.body.date_completed).toBeNull();
  });

  it('returns the standard error body shape on validation failures (Scenario: Validation error body)', async () => {
    const { api } = app();
    const res = await api.post('/api/v1/books').send({});
    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
    expect(typeof res.body.code).toBe('string');
    expect(res.body.timestamp).toMatch(ISO_TIMESTAMP);
  });
});
