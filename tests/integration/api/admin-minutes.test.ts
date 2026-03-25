// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-admin-user' }),
}));

vi.mock('@/lib/r2/presigned', () => ({
  deleteObject: vi.fn().mockResolvedValue(undefined),
}));

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('Admin minutes API', () => {
  let POST: (request: Request) => Promise<Response>;
  let DELETE_HANDLER: (request: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
  let createdId: string;

  beforeAll(async () => {
    const listRoute = await import('@/app/api/admin/minutes/route');
    POST = listRoute.POST;

    const detailRoute = await import('@/app/api/admin/minutes/[id]/route');
    DELETE_HANDLER = detailRoute.DELETE;
  });

  afterAll(async () => {
    if (createdId) {
      try {
        const req = new Request('http://localhost', { method: 'DELETE' });
        await DELETE_HANDLER(req, { params: Promise.resolve({ id: createdId }) });
      } catch {
        // ignore
      }
    }
  });

  describe('POST /api/admin/minutes', () => {
    it('creates meeting minutes with valid data', async () => {
      const req = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '__test_minutes__',
          meetingDate: '2026-03-15',
          fileKey: 'minutes/test-123.pdf',
          fileUrl: 'https://example.com/minutes/test-123.pdf',
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data).toHaveProperty('id');
      expect(body.data.title).toBe('__test_minutes__');
      expect(body.data.meetingDate).toBe('2026-03-15');
      createdId = body.data.id;
    });

    it('rejects missing title', async () => {
      const req = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '',
          meetingDate: '2026-03-15',
          fileKey: 'minutes/x.pdf',
          fileUrl: 'https://example.com/x.pdf',
        }),
      });
      expect((await POST(req)).status).toBe(400);
    });

    it('rejects invalid date', async () => {
      const req = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test',
          meetingDate: 'not-a-date',
          fileKey: 'minutes/x.pdf',
          fileUrl: 'https://example.com/x.pdf',
        }),
      });
      expect((await POST(req)).status).toBe(400);
    });
  });

  describe('DELETE /api/admin/minutes/[id]', () => {
    it('deletes existing minutes', async () => {
      expect(createdId).toBeDefined();
      const req = new Request('http://localhost', { method: 'DELETE' });
      const res = await DELETE_HANDLER(req, { params: Promise.resolve({ id: createdId }) });
      expect(res.status).toBe(204);
      createdId = '';
    });

    it('returns 404 for non-existent minutes', async () => {
      const req = new Request('http://localhost', { method: 'DELETE' });
      const res = await DELETE_HANDLER(req, { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) });
      expect(res.status).toBe(404);
    });
  });
});
