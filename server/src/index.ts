import path from 'node:path';
import { openStore } from './db/client';
import { BookRepository } from './repositories/bookRepository';
import { createApp } from './http/app';

const PORT = Number(process.env.PORT ?? 3000);
const DB_PATH =
  process.env.DB_PATH ?? path.resolve(process.cwd(), 'data', 'globerbooks.db');

const store = openStore(DB_PATH);
const repo = new BookRepository(store.db);
const app = createApp(repo);

app.listen(PORT, () => {
  console.log(`GloberBooks API listening on http://localhost:${PORT} (db: ${DB_PATH})`);
});
