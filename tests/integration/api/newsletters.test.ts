// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('GET /api/newsletters', () => {
  let GET: (req: Request) => Promise<Response>;

  beforeAll(async () => {
    ({ GET } = await import('@/app/api/newsletters/route'));
  });

  it('returns 200 with data and meta', async () => {
    const req = new Request('http://localhost/api/newsletters');
    const response = await GET(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('meta');
  });

  it('default pagination returns page 1 with limit 20', async () => {
    const req = new Request('http://localhost/api/newsletters');
    const body = await (await GET(req)).json();
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(20);
  });

  it('meta includes correct total count', async () => {
    const req = new Request('http://localhost/api/newsletters');
    const body = await (await GET(req)).json();
    expect(body.meta.total).toBe(3);
    expect(body.meta.totalPages).toBe(1);
  });

  it('custom pagination params are respected', async () => {
    const req = new Request('http://localhost/api/newsletters?page=1&limit=2');
    const body = await (await GET(req)).json();
    expect(body.data).toHaveLength(2);
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(2);
    expect(body.meta.total).toBe(3);
    expect(body.meta.totalPages).toBe(2);
  });
});
