// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('GET /api/sponsors', () => {
  let GET: () => Promise<Response>;

  beforeAll(async () => {
    ({ GET } = await import('@/app/api/sponsors/route'));
  });

  it('returns 200 with data array', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('only returns active sponsors', async () => {
    const body = await (await GET()).json();
    expect(body.data.every((s: { isActive: boolean }) => s.isActive === true)).toBe(true);
  });

  it('returns all 3 seeded active sponsors', async () => {
    const body = await (await GET()).json();
    expect(body.data).toHaveLength(3);
  });

  it('sponsors are ordered by display_order ascending', async () => {
    const body = await (await GET()).json();
    const orders = body.data.map((s: { displayOrder: number }) => s.displayOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});
