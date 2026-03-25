// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('GET /api/minutes', () => {
  let GET: (req: Request) => Promise<Response>;

  beforeAll(async () => {
    ({ GET } = await import('@/app/api/minutes/route'));
  });

  it('returns 200 with data and meta', async () => {
    const req = new Request('http://localhost/api/minutes');
    const response = await GET(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('meta');
  });

  it('returns all seeded meeting minutes', async () => {
    const req = new Request('http://localhost/api/minutes');
    const body = await (await GET(req)).json();
    // Seed has 2 minutes; other test suites may transiently add more
    expect(body.meta.total).toBeGreaterThanOrEqual(2);
    expect(body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('minutes are ordered by meeting_date descending', async () => {
    const req = new Request('http://localhost/api/minutes');
    const body = await (await GET(req)).json();
    const dates = body.data.map((m: { meetingDate: string }) => m.meetingDate);
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
  });

  it('custom pagination limits results', async () => {
    const req = new Request('http://localhost/api/minutes?page=1&limit=1');
    const body = await (await GET(req)).json();
    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBeGreaterThanOrEqual(2);
    expect(body.meta.totalPages).toBeGreaterThanOrEqual(2);
  });
});
