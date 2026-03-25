import { asc, count, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { sponsors } from '@/lib/db/schema';

export type Sponsor = typeof sponsors.$inferSelect;

export async function getActiveSponsorCount(): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(sponsors)
    .where(eq(sponsors.isActive, true));

  return Number(total);
}

export async function getActiveSponsors(): Promise<Sponsor[]> {
  return db
    .select()
    .from(sponsors)
    .where(eq(sponsors.isActive, true))
    .orderBy(asc(sponsors.displayOrder));
}

export async function getAllSponsors(): Promise<Sponsor[]> {
  return db.select().from(sponsors).orderBy(asc(sponsors.displayOrder));
}

export async function getSponsorById(id: string): Promise<Sponsor | undefined> {
  const rows = await db.select().from(sponsors).where(eq(sponsors.id, id)).limit(1);
  return rows[0];
}

export type NewSponsor = typeof sponsors.$inferInsert;

export async function createSponsor(data: NewSponsor): Promise<Sponsor> {
  const [row] = await db.insert(sponsors).values(data).returning();
  return row;
}

export async function updateSponsor(id: string, data: Partial<NewSponsor>): Promise<Sponsor | undefined> {
  const [row] = await db.update(sponsors).set(data).where(eq(sponsors.id, id)).returning();
  return row;
}

export async function deleteSponsor(id: string): Promise<Sponsor | undefined> {
  const [row] = await db.delete(sponsors).where(eq(sponsors.id, id)).returning();
  return row;
}

export async function reorderSponsors(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id, i) =>
      db.update(sponsors).set({ displayOrder: i + 1 }).where(eq(sponsors.id, id)),
    ),
  );
}
