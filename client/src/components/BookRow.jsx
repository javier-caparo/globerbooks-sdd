import React from 'react';

const STATUSES = ['unread', 'reading', 'completed'];

export default function BookRow({ book, onStatusChange, onRating, onDelete }) {
  const completed = book.status === 'completed';

  return (
    <li className="flex items-center gap-4 rounded-lg bg-white p-4 shadow">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-800">{book.title}</p>
        <p className="truncate text-sm text-slate-500">{book.author}</p>
      </div>

      <select
        aria-label={`Status of ${book.title}`}
        value={book.status}
        onChange={(e) => onStatusChange(book.id, e.target.value)}
        className="rounded border px-2 py-1 text-sm"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {completed && (
        <div aria-label={`Rating of ${book.title}`} className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onRating(book.id, n)}
              aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
              className={n <= (book.rating ?? 0) ? 'text-yellow-500' : 'text-slate-300'}
            >
              ★
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => onDelete(book.id)}
        className="text-sm text-red-500 hover:text-red-700"
      >
        Remove
      </button>
    </li>
  );
}
