import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import BookForm from '../src/components/BookForm.jsx';

describe('BookForm (task 6.1)', () => {
  it('renders title, author, status and submit controls', () => {
    render(<BookForm onAdd={vi.fn()} />);
    expect(screen.getByTestId('title-input')).toBeInTheDocument();
    expect(screen.getByTestId('author-input')).toBeInTheDocument();
    expect(screen.getByTestId('status-select')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add book/i })).toBeInTheDocument();
  });

  it('submits title, author and status to onAdd', async () => {
    const onAdd = vi.fn(async () => 'added');
    render(<BookForm onAdd={onAdd} />);

    fireEvent.change(screen.getByTestId('title-input'), { target: { value: 'Clean Code' } });
    fireEvent.change(screen.getByTestId('author-input'), { target: { value: 'Robert Martin' } });
    fireEvent.change(screen.getByTestId('status-select'), { target: { value: 'reading' } });
    fireEvent.click(screen.getByRole('button', { name: /add book/i }));

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd).toHaveBeenCalledWith({ title: 'Clean Code', author: 'Robert Martin', status: 'reading' });
  });

  it('clears the fields after a successful add', async () => {
    const onAdd = vi.fn(async () => 'added');
    render(<BookForm onAdd={onAdd} />);

    fireEvent.change(screen.getByTestId('title-input'), { target: { value: 'T' } });
    fireEvent.change(screen.getByTestId('author-input'), { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: /add book/i }));

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('title-input')).toHaveValue('');
    expect(screen.getByTestId('author-input')).toHaveValue('');
  });

  it('shows an error message when the add fails', async () => {
    const onAdd = vi.fn(async () => 'error');
    render(<BookForm onAdd={onAdd} />);

    fireEvent.change(screen.getByTestId('title-input'), { target: { value: 'T' } });
    fireEvent.change(screen.getByTestId('author-input'), { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: /add book/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByTestId('title-input')).toHaveValue('T');
  });
});
