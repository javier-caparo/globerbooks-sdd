import React, { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import BookForm from './components/BookForm.jsx';
import BookList from './components/BookList.jsx';
import DuplicateDialog from './components/DuplicateDialog.jsx';

export default function App() {
  const [books, setBooks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [duplicate, setDuplicate] = useState(null);

  const refresh = useCallback(async () => {
    const data = await api.listBooks();
    setBooks(data.books);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoaded(true));
  }, [refresh]);

  async function handleAdd(book) {
    try {
      await api.addBook(book);
      await refresh();
      return 'added';
    } catch (error) {
      if (error.status === 409) {
        setDuplicate({ pending: book, existing: error.existing });
        return 'duplicate';
      }
      return 'error';
    }
  }

  async function handleOverride() {
    const { pending } = duplicate;
    setDuplicate(null);
    await api.addBook(pending, true);
    await refresh();
  }

  async function handleStatusChange(id, status) {
    await api.updateStatus(id, status);
    await refresh();
  }

  async function handleRating(id, rating) {
    await api.setRating(id, rating);
    await refresh();
  }

  async function handleDelete(id) {
    await api.deleteBook(id);
    await refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-indigo-600 py-6 text-white">
        <div className="mx-auto max-w-2xl px-4">
          <h1 className="text-2xl font-bold">📚 GloberBooks</h1>
          <p className="text-sm text-indigo-100">Your personal reading list</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 px-4 py-8">
        <BookForm onAdd={handleAdd} />
        <BookList
          books={books}
          loaded={loaded}
          onStatusChange={handleStatusChange}
          onRating={handleRating}
          onDelete={handleDelete}
        />
      </main>

      {duplicate && (
        <DuplicateDialog
          existing={duplicate.existing}
          onConfirm={handleOverride}
          onCancel={() => setDuplicate(null)}
        />
      )}
    </div>
  );
}
