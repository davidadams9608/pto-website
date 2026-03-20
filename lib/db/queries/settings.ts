import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { siteSettings } from '@/lib/db/schema';

export type SiteSetting = typeof siteSettings.$inferSelect;

export async function getPublicSettings(): Promise<SiteSetting[]> {
  return db.select().from(siteSettings);
}

export async function getSetting(key: string): Promise<string | undefined> {
  const rows = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);

  return rows[0]?.value;
}
