import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import DuplicateDialog from '../src/components/DuplicateDialog.jsx';

const existing = { id: 'b1', title: 'Clean Code', author: 'Robert Martin', status: 'unread' };

describe('DuplicateDialog (task 6.2)', () => {
  it('shows the warning prompt with the existing book details', () => {
    render(<DuplicateDialog existing={existing} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(
      screen.getByText('This book may already exist. Add anyway?'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Clean Code/)).toBeInTheDocument();
    expect(screen.getByText(/Robert Martin/)).toBeInTheDocument();
  });

  it('offers Add anyway and Cancel actions', () => {
    render(<DuplicateDialog existing={existing} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add anyway/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onConfirm when Add anyway is clicked (App then re-adds with force)', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<DuplicateDialog existing={existing} onConfirm={onConfirm} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /add anyway/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when Cancel is clicked (no add happens)', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<DuplicateDialog existing={existing} onConfirm={onConfirm} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
