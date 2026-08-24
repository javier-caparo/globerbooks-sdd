import React from 'react';

export default function DuplicateDialog({ existing, onConfirm, onCancel }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Duplicate book warning"
      className="fixed inset-0 flex items-center justify-center bg-black/40 p-4"
    >
      <div className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-800">This book may already exist. Add anyway?</h2>
        <p className="text-sm text-slate-600">
          <span className="font-medium">{existing.title}</span> by{' '}
          <span className="font-medium">{existing.author}</span> is already in your library
          (status: {existing.status}).
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded bg-indigo-600 px-4 py-2 text-sm text-white"
          >
            Add anyway
          </button>
        </div>
      </div>
    </div>
  );
}
