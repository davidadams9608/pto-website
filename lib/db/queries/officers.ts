import { asc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { officers } from '@/lib/db/schema';
import { getSetting } from './settings';

export type Officer = typeof officers.$inferSelect;
export type NewOfficer = Omit<typeof officers.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateOfficer = Partial<NewOfficer>;

// ── Public queries ─────────────────────────────────────────────────────────

export async function getOfficers(): Promise<Officer[]> {
  return db.select().from(officers).orderBy(asc(officers.displayOrder));
}

export async function getOfficerById(id: string): Promise<Officer | undefined> {
  const rows = await db
    .select()
    .from(officers)
    .where(eq(officers.id, id))
    .limit(1);

  return rows[0];
}

export async function getAboutText(): Promise<string | undefined> {
  return getSetting('about_text');
}

// ── Admin mutations ────────────────────────────────────────────────────────

export async function createOfficer(data: NewOfficer): Promise<Officer> {
  const [row] = await db.insert(officers).values(data).returning();
  return row;
}

export async function updateOfficer(id: string, data: UpdateOfficer): Promise<Officer | undefined> {
  const [row] = await db
    .update(officers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(officers.id, id))
    .returning();

  return row;
}

export async function deleteOfficer(id: string): Promise<void> {
  await db.delete(officers).where(eq(officers.id, id));
}

export async function reorderOfficers(ids: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx
        .update(officers)
        .set({ displayOrder: i + 1, updatedAt: new Date() })
        .where(eq(officers.id, ids[i]));
    }
  });
}
