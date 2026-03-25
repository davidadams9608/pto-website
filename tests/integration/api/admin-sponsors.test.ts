// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-admin-user' }),
}));

vi.mock('@/lib/r2/presigned', () => ({
  deleteObject: vi.fn().mockResolvedValue(undefined),
}));

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('Admin sponsors API', () => {
  let LIST_GET: () => Promise<Response>;
  let LIST_POST: (request: Request) => Promise<Response>;
  let DETAIL_PUT: (request: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
  let DETAIL_DELETE: (request: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
  let REORDER_PUT: (request: Request) => Promise<Response>;
  let createdId: string;

  beforeAll(async () => {
    const listRoute = await import('@/app/api/admin/sponsors/route');
    LIST_GET = listRoute.GET;
    LIST_POST = listRoute.POST;

    const detailRoute = await import('@/app/api/admin/sponsors/[id]/route');
    DETAIL_PUT = detailRoute.PUT;
    DETAIL_DELETE = detailRoute.DELETE;

    const reorderRoute = await import('@/app/api/admin/sponsors/reorder/route');
    REORDER_PUT = reorderRoute.PUT;
  });

  afterAll(async () => {
    if (createdId) {
      try {
        const req = new Request('http://localhost', { method: 'DELETE' });
        await DETAIL_DELETE(req, { params: Promise.resolve({ id: createdId }) });
      } catch { /* ignore */ }
    }
  });

  function makeRequest(body: Record<string, unknown>, method = 'POST') {
    return new Request('http://localhost', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  describe('GET /api/admin/sponsors', () => {
    it('returns all sponsors including inactive', async () => {
      const res = await LIST_GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('POST /api/admin/sponsors', () => {
    it('creates a sponsor with valid data', async () => {
      const res = await LIST_POST(makeRequest({
        name: '__test_sponsor__',
        logoKey: 'sponsors/test-logo.png',
        logoUrl: 'https://example.com/sponsors/test-logo.png',
        websiteUrl: 'https://example.com',
        isActive: true,
      }));
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.name).toBe('__test_sponsor__');
      expect(body.data.isActive).toBe(true);
      createdId = body.data.id;
    });

    it('rejects missing name', async () => {
      const res = await LIST_POST(makeRequest({
        name: '',
        logoKey: 'sponsors/x.png',
        logoUrl: 'https://example.com/x.png',
      }));
      expect(res.status).toBe(400);
    });

    it('rejects missing logoKey', async () => {
      const res = await LIST_POST(makeRequest({
        name: 'Test',
        logoKey: '',
        logoUrl: 'https://example.com/x.png',
      }));
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/admin/sponsors/[id]', () => {
    it('updates sponsor fields', async () => {
      expect(createdId).toBeDefined();
      const req = makeRequest({ name: 'Updated Sponsor', isActive: false }, 'PUT');
      const res = await DETAIL_PUT(req, { params: Promise.resolve({ id: createdId }) });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.name).toBe('Updated Sponsor');
      expect(body.data.isActive).toBe(false);
    });

    it('returns 404 for non-existent sponsor', async () => {
      const req = makeRequest({ name: 'Test' }, 'PUT');
      const res = await DETAIL_PUT(req, { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) });
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/admin/sponsors/reorder', () => {
    it('reorders sponsors successfully', async () => {
      const listRes = await LIST_GET();
      const { data } = await listRes.json();
      const ids = data.map((s: { id: string }) => s.id);

      const req = makeRequest({ ids }, 'PUT');
      const res = await REORDER_PUT(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.success).toBe(true);
    });

    it('rejects empty ids array', async () => {
      const req = makeRequest({ ids: [] }, 'PUT');
      const res = await REORDER_PUT(req);
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/admin/sponsors/[id]', () => {
    it('deletes an existing sponsor', async () => {
      expect(createdId).toBeDefined();
      const req = new Request('http://localhost', { method: 'DELETE' });
      const res = await DETAIL_DELETE(req, { params: Promise.resolve({ id: createdId }) });
      expect(res.status).toBe(204);
      createdId = '';
    });

    it('returns 404 for non-existent sponsor', async () => {
      const req = new Request('http://localhost', { method: 'DELETE' });
      const res = await DETAIL_DELETE(req, { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) });
      expect(res.status).toBe(404);
    });
  });
});
