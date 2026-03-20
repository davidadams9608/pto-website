// @vitest-environment node
import { count } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('database connection', () => {
  it('imports the db client without errors', async () => {
    const { db } = await import('@/lib/db');
    expect(db).toBeDefined();
  });

  it('can query the events table', async () => {
    const { db } = await import('@/lib/db');
    const { events } = await import('@/lib/db/schema');

    const result = await db.select({ count: count() }).from(events);

    expect(result).toHaveLength(1);
    expect(typeof result[0].count).toBe('number');
  });
});
