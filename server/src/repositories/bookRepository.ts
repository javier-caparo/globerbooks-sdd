import { and, eq, sql } from 'drizzle-orm';
import { desc } from 'drizzle-orm';
import { books, type BookRow, type NewBookRow } from '../db/schema';
import type { BooksDatabase } from '../db/client';

export interface StatusUpdate {
  status: string;
  rating: number | null;
  dateCompleted: string | null;
}

/**
 * Data access for the `books` table. Drizzle queries only —
 * business logic lives in services (design.md D3).
 */
export class BookRepository {
  constructor(private readonly db: BooksDatabase) {}

  insert(book: NewBookRow): BookRow {
    const rows = this.db.insert(books).values(book).returning().all();
    return rows[0];
  }

  /** All books, newest first. rowid breaks timestamp ties deterministically. */
  listAll(): BookRow[] {
    return this.db
      .select()
      .from(books)
      .orderBy(desc(books.dateAdded), sql`rowid DESC`)
      .all();
  }

  findById(id: string): BookRow | null {
    const rows = this.db.select().from(books).where(eq(books.id, id)).all();
    return rows[0] ?? null;
  }

  findFirstByTitleAuthor(titleKey: string, authorKey: string): BookRow | null {
    const rows = this.db
      .select()
      .from(books)
      .where(and(eq(books.titleKey, titleKey), eq(books.authorKey, authorKey)))
      .orderBy(sql`rowid ASC`)
      .limit(1)
      .all();
    return rows[0] ?? null;
  }

  updateStatus(id: string, update: StatusUpdate): BookRow | null {
    const rows = this.db
      .update(books)
      .set({ status: update.status, rating: update.rating, dateCompleted: update.dateCompleted })
      .where(eq(books.id, id))
      .returning()
      .all();
    return rows[0] ?? null;
  }

  updateRating(id: string, rating: number): BookRow | null {
    const rows = this.db.update(books).set({ rating }).where(eq(books.id, id)).returning().all();
    return rows[0] ?? null;
  }

  remove(id: string): boolean {
    const rows = this.db.delete(books).where(eq(books.id, id)).returning().all();
    return rows.length > 0;
  }

  count(): number {
    const rows = this.db.select({ value: sql<number>`count(*)` }).from(books).all();
    return rows[0]?.value ?? 0;
  }
}
