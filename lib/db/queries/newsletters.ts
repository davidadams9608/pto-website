import { count, desc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { newsletters } from '@/lib/db/schema';
import type { PaginatedResult } from './types';

export type Newsletter = typeof newsletters.$inferSelect;
export type { PaginatedResult };

export async function getNewsletters(
  page: number,
  limit: number,
): Promise<PaginatedResult<Newsletter>> {
  const offset = (page - 1) * limit;

  const [items, [{ total }]] = await Promise.all([
    db.select().from(newsletters).orderBy(desc(newsletters.publishedAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(newsletters),
  ]);

  return { items, total: Number(total), page, limit };
}

export async function getAllNewsletters(): Promise<Newsletter[]> {
  return db.select().from(newsletters).orderBy(desc(newsletters.publishedAt));
}

export async function getNewsletterCount(): Promise<number> {
  const [{ total }] = await db.select({ total: count() }).from(newsletters);
  return Number(total);
}

export async function getRecentNewsletters(limit: number): Promise<Newsletter[]> {
  return db
    .select()
    .from(newsletters)
    .orderBy(desc(newsletters.publishedAt))
    .limit(limit);
}

export async function getNewsletterById(id: string): Promise<Newsletter | undefined> {
  const rows = await db
    .select()
    .from(newsletters)
    .where(eq(newsletters.id, id))
    .limit(1);

  return rows[0];
}

export type NewNewsletter = typeof newsletters.$inferInsert;

export async function createNewsletter(data: NewNewsletter): Promise<Newsletter> {
  const [row] = await db.insert(newsletters).values(data).returning();
  return row;
}

export async function deleteNewsletter(id: string): Promise<Newsletter | undefined> {
  const [row] = await db.delete(newsletters).where(eq(newsletters.id, id)).returning();
  return row;
}
