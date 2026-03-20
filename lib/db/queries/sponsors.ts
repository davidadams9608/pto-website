import { asc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { sponsors } from '@/lib/db/schema';

export type Sponsor = typeof sponsors.$inferSelect;

export async function getActiveSponsors(): Promise<Sponsor[]> {
  return db
    .select()
    .from(sponsors)
    .where(eq(sponsors.isActive, true))
    .orderBy(asc(sponsors.displayOrder));
}
