// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('GET /api/settings', () => {
  let GET: () => Promise<Response>;

  beforeAll(async () => {
    ({ GET } = await import('@/app/api/settings/route'));
  });

  it('returns 200 with a key-value object', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(typeof body.data).toBe('object');
    expect(Array.isArray(body.data)).toBe(false);
  });

  it('contains seeded settings keys', async () => {
    const body = await (await GET()).json();
    // Seed has 5+ keys; admin may add more via upsert
    expect(Object.keys(body.data).length).toBeGreaterThanOrEqual(5);
  });

  it('known seed settings are present', async () => {
    const body = await (await GET()).json();
    expect(body.data).toHaveProperty('school_name');
    expect(body.data).toHaveProperty('venmo_url');
  });
});
