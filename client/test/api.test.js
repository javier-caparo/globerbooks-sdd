import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../src/api';

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('api wrapper (task 5.2)', () => {
  it('listBooks GETs /api/v1/books and resolves the payload', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { books: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    const data = await api.listBooks();
    expect(data).toEqual({ books: [], total: 0 });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/books',
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    );
  });

  it('addBook POSTs the book with force flag', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(201, { id: 'b1' }));
    vi.stubGlobal('fetch', fetchMock);

    await api.addBook({ title: 'T', author: 'A', status: 'unread' });
    let [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ title: 'T', author: 'A', status: 'unread', force: false });

    await api.addBook({ title: 'T', author: 'A' }, true);
    [, options] = fetchMock.mock.calls[1];
    expect(JSON.parse(options.body).force).toBe(true);
  });

  it('surfaces 409 duplicates: status, code and existing book on the thrown error', async () => {
    const existing = { id: 'b1', title: 'Clean Code', author: 'Robert Martin', status: 'unread' };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(409, {
          error: 'This book may already exist. Add anyway?',
          code: 'DUPLICATE_BOOK',
          timestamp: '2026-01-01T00:00:00.000Z',
          existing,
        }),
      ),
    );

    try {
      await api.addBook({ title: 'Clean Code', author: 'Robert Martin' });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error.status).toBe(409);
      expect(error.code).toBe('DUPLICATE_BOOK');
      expect(error.existing).toEqual(existing);
      expect(error.message).toContain('already exist');
    }
  });

  it('updateStatus PATCHes { status }', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { id: 'b1', status: 'reading' }));
    vi.stubGlobal('fetch', fetchMock);

    await api.updateStatus('b1', 'reading');
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/books/b1/status');
    expect(options.method).toBe('PATCH');
    expect(JSON.parse(options.body)).toEqual({ status: 'reading' });
  });

  it('setRating PUTs { rating }', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { id: 'b1', rating: 5 }));
    vi.stubGlobal('fetch', fetchMock);

    await api.setRating('b1', 5);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/books/b1/rating');
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body)).toEqual({ rating: 5 });
  });

  it('deleteBook sends DELETE', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { message: 'Book removed' }));
    vi.stubGlobal('fetch', fetchMock);

    await api.deleteBook('b1');
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/books/b1');
    expect(options.method).toBe('DELETE');
  });

  it('throws a fallback message when the error body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 500 })));

    try {
      await api.listBooks();
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error.status).toBe(500);
      expect(error.message).toContain('500');
    }
  });
});
