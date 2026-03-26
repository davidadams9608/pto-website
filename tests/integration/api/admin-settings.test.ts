// @vitest-environment node
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-admin-user' }),
}));

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('Admin settings API', () => {
  let GET: () => Promise<Response>;
  let PUT: (request: Request) => Promise<Response>;

  beforeAll(async () => {
    const route = await import('@/app/api/admin/settings/route');
    GET = route.GET;
    PUT = route.PUT;
  });

  describe('GET /api/admin/settings', () => {
    it('returns all settings as key-value pairs', async () => {
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveProperty('school_name');
      expect(body.data).toHaveProperty('contact_email');
    });
  });

  describe('PUT /api/admin/settings', () => {
    it('updates settings with valid payload', async () => {
      const req = new Request('http://localhost', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            { key: 'school_name', value: 'Test School Name' },
          ],
        }),
      });
      const res = await PUT(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.success).toBe(true);

      // Verify the update persisted
      const getRes = await GET();
      const getBody = await getRes.json();
      expect(getBody.data.school_name).toBe('Test School Name');

      // Restore original value
      await PUT(new Request('http://localhost', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: [{ key: 'school_name', value: 'Westmont Elementary School' }] }),
      }));
    });

    it('rejects empty settings array', async () => {
      const req = new Request('http://localhost', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: [] }),
      });
      const res = await PUT(req);
      expect(res.status).toBe(400);
    });

    it('rejects missing settings field', async () => {
      const req = new Request('http://localhost', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const res = await PUT(req);
      expect(res.status).toBe(400);
    });
  });
});
