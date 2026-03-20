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

  it('contains all 5 seeded settings keys', async () => {
    const body = await (await GET()).json();
    expect(Object.keys(body.data)).toHaveLength(5);
  });

  it('known seed settings are present with correct values', async () => {
    const body = await (await GET()).json();
    expect(body.data.school_name).toBe('Westmont Elementary School');
    expect(body.data.contact_email).toBe('pto@westmontpto.org');
    expect(body.data.venmo_url).toBe('https://venmo.com/westmontpto');
  });
});
