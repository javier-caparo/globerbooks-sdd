const BASE_URL = '/api/v1';

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  let body = {};
  try {
    body = await response.json();
  } catch {
    body = {};
  }

  if (!response.ok) {
    const error = new Error(body.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.code = body.code;
    error.existing = body.existing;
    throw error;
  }
  return body;
}

export const api = {
  listBooks: () => request('/books'),

  addBook: (book, force = false) =>
    request('/books', {
      method: 'POST',
      body: JSON.stringify({ ...book, force }),
    }),

  updateStatus: (id, status) =>
    request(`/books/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  setRating: (id, rating) =>
    request(`/books/${id}/rating`, {
      method: 'PUT',
      body: JSON.stringify({ rating }),
    }),

  deleteBook: (id) => request(`/books/${id}`, { method: 'DELETE' }),
};
