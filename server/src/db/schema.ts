import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Drizzle mapping for the `books` table (design.md D4).
 * CHECK constraints are declared in db/init.ts raw SQL.
 */
export const books = sqliteTable('books', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  status: text('status').notNull().default('unread'),
  rating: integer('rating'),
  dateAdded: text('date_added').notNull(),
  dateCompleted: text('date_completed'),
  titleKey: text('title_key').notNull(),
  authorKey: text('author_key').notNull(),
});

export type BookRow = typeof books.$inferSelect;
export type NewBookRow = typeof books.$inferInsert;
