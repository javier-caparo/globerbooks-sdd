import React from 'react';
import BookRow from './BookRow.jsx';

export default function BookList({ books, loaded, onStatusChange, onRating, onDelete }) {
  if (!loaded) {
    return <p className="text-slate-500">Loading your library…</p>;
  }
  if (books.length === 0) {
    return (
      <p data-testid="empty-state" className="text-slate-500">
        No books yet — add your first one above!
      </p>
    );
  }
  return (
    <ul aria-label="Book list" className="space-y-3">
      {books.map((book) => (
        <BookRow
          key={book.id}
          book={book}
          onStatusChange={onStatusChange}
          onRating={onRating}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
