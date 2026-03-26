import { eq, inArray } from 'drizzle-orm';

import { db } from '@/lib/db';
import { settingsAuditLog, siteSettings } from '@/lib/db/schema';

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

export async function updateSettings(
  settings: { key: string; value: string }[],
  changedBy?: string,
): Promise<void> {
  const now = new Date();
  const keys = settings.map((s) => s.key);

  // Read current values for audit logging
  const currentRows = changedBy
    ? await db
        .select({ key: siteSettings.key, value: siteSettings.value })
        .from(siteSettings)
        .where(inArray(siteSettings.key, keys))
    : [];

  const currentValues = new Map(currentRows.map((r) => [r.key, r.value]));

  // Upsert settings
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

  // Insert audit log entries for changed values only
  if (changedBy) {
    const auditEntries = settings
      .filter(({ key, value }) => {
        const oldValue = currentValues.get(key);
        return oldValue !== value;
      })
      .map(({ key, value }) => ({
        settingKey: key,
        oldValue: currentValues.get(key) ?? null,
        newValue: value,
        changedBy,
        changedAt: now,
      }));

    if (auditEntries.length > 0) {
      await db.insert(settingsAuditLog).values(auditEntries);
    }
  }
}
