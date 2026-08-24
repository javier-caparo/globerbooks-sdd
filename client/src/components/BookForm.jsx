import React, { useState } from 'react';

const STATUSES = ['unread', 'reading', 'completed'];

export default function BookForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('unread');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await onAdd({ title, author, status });
    setSubmitting(false);

    if (result === 'added') {
      setTitle('');
      setAuthor('');
      setStatus('unread');
    } else if (result === 'error') {
      setError('Could not add the book. Check the fields and try again.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Add book form"
      className="space-y-3 rounded-lg bg-white p-4 shadow"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-slate-700">
          Title
          <input
            data-testid="title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={500}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm text-slate-700">
          Author
          <input
            data-testid="author-input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
            maxLength={200}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-700">
          Status
          <select
            data-testid="status-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="ml-2 rounded border border-slate-300 px-2 py-1"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add book'}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
