import type Database from 'better-sqlite3';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS books (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 500),
  author         TEXT NOT NULL CHECK (length(author) BETWEEN 1 AND 200),
  status         TEXT NOT NULL DEFAULT 'unread'
                 CHECK (status IN ('unread', 'reading', 'completed')),
  rating         INTEGER CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5 AND status = 'completed')),
  date_added     TEXT NOT NULL,
  date_completed TEXT,
  title_key      TEXT NOT NULL,
  author_key     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_books_title_author ON books (title_key, author_key);
CREATE INDEX IF NOT EXISTS idx_books_date_added ON books (date_added);
`;

/**
 * Idempotently creates the books table with its CHECK constraints.
 * No migration tooling by design (design.md D4).
 */
export function initSchema(sqlite: Database.Database): void {
  sqlite.exec(SCHEMA_SQL);
}
