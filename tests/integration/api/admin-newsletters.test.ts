// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-admin-user' }),
}));

// Mock R2
vi.mock('@/lib/r2/presigned', () => ({
  deleteObject: vi.fn().mockResolvedValue(undefined),
}));

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('Admin newsletters API', () => {
  let POST: (request: Request) => Promise<Response>;
  let DELETE_HANDLER: (request: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
  let createdId: string;

  beforeAll(async () => {
    const listRoute = await import('@/app/api/admin/newsletters/route');
    POST = listRoute.POST;

    const detailRoute = await import('@/app/api/admin/newsletters/[id]/route');
    DELETE_HANDLER = detailRoute.DELETE;
  });

  afterAll(async () => {
    // Clean up if test failed before delete
    if (createdId) {
      try {
        const req = new Request('http://localhost', { method: 'DELETE' });
        await DELETE_HANDLER(req, { params: Promise.resolve({ id: createdId }) });
      } catch {
        // ignore
      }
    }
  });

  describe('POST /api/admin/newsletters', () => {
    it('creates a newsletter with valid data', async () => {
      const req = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '__test_newsletter__',
          publishedAt: '2026-03-01',
          fileKey: 'newsletters/test-123.pdf',
          fileUrl: 'https://example.com/newsletters/test-123.pdf',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data).toHaveProperty('id');
      expect(body.data.title).toBe('__test_newsletter__');
      expect(body.data.fileKey).toBe('newsletters/test-123.pdf');
      createdId = body.data.id;
    });

    it('rejects missing title', async () => {
      const req = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '',
          publishedAt: '2026-03-01',
          fileKey: 'newsletters/x.pdf',
          fileUrl: 'https://example.com/x.pdf',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('rejects missing fileUrl', async () => {
      const req = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test',
          publishedAt: '2026-03-01',
          fileKey: 'newsletters/x.pdf',
          fileUrl: '',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/admin/newsletters/[id]', () => {
    it('deletes an existing newsletter', async () => {
      expect(createdId).toBeDefined();
      const req = new Request('http://localhost', { method: 'DELETE' });
      const res = await DELETE_HANDLER(req, { params: Promise.resolve({ id: createdId }) });
      expect(res.status).toBe(204);
      createdId = '';
    });

    it('returns 404 for non-existent newsletter', async () => {
      const req = new Request('http://localhost', { method: 'DELETE' });
      const res = await DELETE_HANDLER(req, { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) });
      expect(res.status).toBe(404);
    });
  });
});
