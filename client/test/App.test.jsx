import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('../src/api.js', () => ({
  api: {
    listBooks: vi.fn(),
    addBook: vi.fn(),
    updateStatus: vi.fn(),
    setRating: vi.fn(),
    deleteBook: vi.fn(),
  },
}));

import { api } from '../src/api.js';
import App from '../src/App.jsx';

const readingBook = {
  id: 'b1',
  title: 'Clean Code',
  author: 'Robert Martin',
  status: 'reading',
  rating: null,
  date_added: '2026-01-01T00:00:00.000Z',
  date_completed: null,
};

const completedBook = { ...readingBook, status: 'completed', rating: 4 };

beforeEach(() => {
  vi.clearAllMocks();
  api.listBooks.mockResolvedValue({ books: [readingBook], total: 1 });
  api.addBook.mockResolvedValue({ id: 'b2' });
  api.updateStatus.mockResolvedValue({});
  api.setRating.mockResolvedValue({});
  api.deleteBook.mockResolvedValue({});
});

describe('App mutation error feedback (tasks 2.1 + 2.2)', () => {
  it('does not show an error banner on initial render', async () => {
    render(<App />);
    await waitFor(() => screen.getByText('Clean Code'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the error banner when a status change fails and keeps the book list stable', async () => {
    api.updateStatus.mockRejectedValue(new Error('Could not update status'));
    render(<App />);
    await waitFor(() => screen.getByLabelText('Status of Clean Code'));

    fireEvent.change(screen.getByLabelText('Status of Clean Code'), { target: { value: 'completed' } });

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('Could not update status');
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
  });

  it('shows the error banner when a rating fails and keeps the book list stable', async () => {
    api.listBooks.mockResolvedValue({ books: [completedBook], total: 1 });
    api.setRating.mockRejectedValue(new Error('Could not set rating'));
    render(<App />);
    await waitFor(() => screen.getByLabelText('Rating of Clean Code'));

    fireEvent.click(screen.getByLabelText('Rate 5 stars'));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('Could not set rating');
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
  });

  it('shows the error banner when a delete fails and keeps the book list stable', async () => {
    api.deleteBook.mockRejectedValue(new Error('Could not delete book'));
    render(<App />);
    await waitFor(() => screen.getByText('Clean Code'));

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent('Could not delete book');
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
  });

  it('clears the error banner on the next successful mutation', async () => {
    api.updateStatus.mockRejectedValueOnce(new Error(' transient failure'));
    render(<App />);
    await waitFor(() => screen.getByLabelText('Status of Clean Code'));

    fireEvent.change(screen.getByLabelText('Status of Clean Code'), { target: { value: 'completed' } });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    api.updateStatus.mockResolvedValue({});
    api.listBooks.mockResolvedValue({ books: [completedBook], total: 1 });
    fireEvent.change(screen.getByLabelText('Status of Clean Code'), { target: { value: 'reading' } });

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
