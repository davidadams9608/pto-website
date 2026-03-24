// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('GET /api/about', () => {
  let GET: () => Promise<Response>;

  beforeAll(async () => {
    ({ GET } = await import('@/app/api/about/route'));
  });

  it('returns 200 with aboutText and officers', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(body.data).toHaveProperty('aboutText');
    expect(body.data).toHaveProperty('officers');
    expect(typeof body.data.aboutText).toBe('string');
    expect(Array.isArray(body.data.officers)).toBe(true);
  });

  it('aboutText contains seeded content', async () => {
    const body = await (await GET()).json();
    expect(body.data.aboutText).toContain('Parent Teacher Organization');
  });

  it('returns at least 4 seeded officers', async () => {
    const body = await (await GET()).json();
    expect(body.data.officers.length).toBeGreaterThanOrEqual(4);
  });

  it('officers are ordered by display_order ascending', async () => {
    const body = await (await GET()).json();
    const orders = body.data.officers.map((o: { displayOrder: number }) => o.displayOrder);
    const sorted = [...orders].sort((a: number, b: number) => a - b);
    expect(orders).toEqual(sorted);
  });

  it('seeded officer roles are present', async () => {
    const body = await (await GET()).json();
    const roles = body.data.officers.map((o: { role: string }) => o.role);
    expect(roles).toContain('President');
    expect(roles).toContain('Vice President');
    expect(roles).toContain('Treasurer');
    expect(roles).toContain('Secretary');
  });
});
