import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import BookList from '../src/components/BookList.jsx';

function book(overrides = {}) {
  return {
    id: 'b1',
    title: 'Clean Code',
    author: 'Robert Martin',
    status: 'reading',
    rating: null,
    date_added: '2026-01-01T00:00:00.000Z',
    date_completed: null,
    ...overrides,
  };
}

describe('BookList / BookRow (task 6.3)', () => {
  it('shows the empty state when there are no books', () => {
    render(<BookList books={[]} loaded onStatusChange={vi.fn()} onRating={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('shows the loading state before the first load completes', () => {
    render(<BookList books={[]} loaded={false} onStatusChange={vi.fn()} onRating={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('hides the rating control for non-completed books and shows it for completed ones', () => {
    render(
      <BookList
        books={[book({ id: 'b1', title: 'Reading One', status: 'reading' }), book({ id: 'b2', title: 'Done One', status: 'completed', rating: 4 })]}
        loaded
        onStatusChange={vi.fn()}
        onRating={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('Rating of Reading One')).not.toBeInTheDocument();
    const rating = screen.getByLabelText('Rating of Done One');
    expect(rating).toBeInTheDocument();
    expect(screen.getByLabelText('Rate 4 stars')).toBeInTheDocument();
  });

  it('calls onStatusChange when the status select changes', () => {
    const onStatusChange = vi.fn();
    render(<BookList books={[book()]} loaded onStatusChange={onStatusChange} onRating={vi.fn()} onDelete={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Status of Clean Code'), { target: { value: 'completed' } });
    expect(onStatusChange).toHaveBeenCalledWith('b1', 'completed');
  });

  it('calls onRating when a star is clicked on a completed book', () => {
    const onRating = vi.fn();
    render(
      <BookList
        books={[book({ status: 'completed' })]}
        loaded
        onStatusChange={vi.fn()}
        onRating={onRating}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText('Rate 5 stars'));
    expect(onRating).toHaveBeenCalledWith('b1', 5);
  });

  it('calls onDelete when Remove is clicked', () => {
    const onDelete = vi.fn();
    render(<BookList books={[book()]} loaded onStatusChange={vi.fn()} onRating={vi.fn()} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(onDelete).toHaveBeenCalledWith('b1');
  });
});
