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

export async function updateSetting(key: string, value: string): Promise<void> {
  await db
    .update(siteSettings)
    .set({ value, updatedAt: new Date() })
    .where(eq(siteSettings.key, key));
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await db.select().from(siteSettings);
  const result: Record<string, string> = {};
  for (const row of rows) {
    if (keys.includes(row.key)) {
      result[row.key] = row.value;
    }
  }
  return result;
}

export async function updateSettings(settings: { key: string; value: string }[]): Promise<void> {
  const now = new Date();
  await Promise.all(
    settings.map(({ key, value }) =>
      db
        .insert(siteSettings)
        .values({ key, value, updatedAt: now })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value, updatedAt: now },
        }),
    ),
  );
}
