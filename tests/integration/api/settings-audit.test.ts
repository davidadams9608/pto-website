// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-admin-user' }),
}));

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('Settings audit log', () => {
  let PUT: (request: Request) => Promise<Response>;
  let db: typeof import('@/lib/db')['db'];
  let settingsAuditLog: typeof import('@/lib/db/schema')['settingsAuditLog'];

  beforeAll(async () => {
    const route = await import('@/app/api/admin/settings/route');
    PUT = route.PUT;
    const dbModule = await import('@/lib/db');
    db = dbModule.db;
    const schema = await import('@/lib/db/schema');
    settingsAuditLog = schema.settingsAuditLog;
  });

  it('creates audit log entry when a setting value changes', async () => {
    const { eq, desc, and } = await import('drizzle-orm');

    // Set a known baseline value
    await PUT(new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: [{ key: 'venmo_url', value: 'https://venmo.com/original' }] }),
    }));

    // Now change it
    const res = await PUT(new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: [{ key: 'venmo_url', value: 'https://venmo.com/updated' }] }),
    }));
    expect(res.status).toBe(200);

    // Verify audit log entry
    const logs = await db
      .select()
      .from(settingsAuditLog)
      .where(and(
        eq(settingsAuditLog.settingKey, 'venmo_url'),
        eq(settingsAuditLog.newValue, 'https://venmo.com/updated'),
      ))
      .orderBy(desc(settingsAuditLog.changedAt))
      .limit(1);

    expect(logs).toHaveLength(1);
    expect(logs[0].settingKey).toBe('venmo_url');
    expect(logs[0].oldValue).toBe('https://venmo.com/original');
    expect(logs[0].newValue).toBe('https://venmo.com/updated');
    expect(logs[0].changedBy).toBe('test-admin-user');
    expect(logs[0].changedAt).toBeInstanceOf(Date);
  });

  it('does not create audit log entry when value is unchanged', async () => {
    const { eq, desc } = await import('drizzle-orm');

    // Set a known value
    await PUT(new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: [{ key: 'venmo_url', value: 'https://venmo.com/stable' }] }),
    }));

    // Count current audit entries for this key
    const beforeLogs = await db
      .select()
      .from(settingsAuditLog)
      .where(eq(settingsAuditLog.settingKey, 'venmo_url'))
      .orderBy(desc(settingsAuditLog.changedAt));
    const countBefore = beforeLogs.length;

    // Save the same value again
    await PUT(new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: [{ key: 'venmo_url', value: 'https://venmo.com/stable' }] }),
    }));

    // Count should not have increased
    const afterLogs = await db
      .select()
      .from(settingsAuditLog)
      .where(eq(settingsAuditLog.settingKey, 'venmo_url'))
      .orderBy(desc(settingsAuditLog.changedAt));

    expect(afterLogs.length).toBe(countBefore);
  });

  it('logs multiple setting changes in one request', async () => {
    const { eq, desc, and } = await import('drizzle-orm');

    // Set baseline
    await PUT(new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: [
          { key: 'contact_email', value: 'old@test.com' },
          { key: 'contact_phone', value: '(555) 000-0000' },
        ],
      }),
    }));

    // Change both
    await PUT(new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: [
          { key: 'contact_email', value: 'new@test.com' },
          { key: 'contact_phone', value: '(555) 111-1111' },
        ],
      }),
    }));

    const emailLog = await db
      .select()
      .from(settingsAuditLog)
      .where(and(
        eq(settingsAuditLog.settingKey, 'contact_email'),
        eq(settingsAuditLog.newValue, 'new@test.com'),
      ))
      .orderBy(desc(settingsAuditLog.changedAt))
      .limit(1);

    const phoneLog = await db
      .select()
      .from(settingsAuditLog)
      .where(and(
        eq(settingsAuditLog.settingKey, 'contact_phone'),
        eq(settingsAuditLog.newValue, '(555) 111-1111'),
      ))
      .orderBy(desc(settingsAuditLog.changedAt))
      .limit(1);

    expect(emailLog).toHaveLength(1);
    expect(emailLog[0].oldValue).toBe('old@test.com');
    expect(phoneLog).toHaveLength(1);
    expect(phoneLog[0].oldValue).toBe('(555) 000-0000');
  });
});
