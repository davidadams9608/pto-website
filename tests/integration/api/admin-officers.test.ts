// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Mock Clerk auth to simulate an authenticated admin
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-admin-user' }),
}));

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('Admin officers API', () => {
  let GET: () => Promise<Response>;
  let POST: (request: Request) => Promise<Response>;
  let DELETE_HANDLER: (request: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
  let createdId: string;

  beforeAll(async () => {
    ({ GET, POST } = await import('@/app/api/admin/officers/route'));
    const idRoute = await import('@/app/api/admin/officers/[id]/route');
    DELETE_HANDLER = idRoute.DELETE;
  });

  afterAll(async () => {
    // Clean up created test officer if it still exists
    if (createdId) {
      try {
        const req = new Request('http://localhost/api/admin/officers/' + createdId, { method: 'DELETE' });
        await DELETE_HANDLER(req, { params: Promise.resolve({ id: createdId }) });
      } catch {
        // ignore cleanup errors
      }
    }
  });

  describe('GET /api/admin/officers', () => {
    it('returns 200 with data array', async () => {
      const response = await GET();
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('POST /api/admin/officers', () => {
    it('creates an officer with valid data', async () => {
      const request = new Request('http://localhost/api/admin/officers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Officer', role: 'Historian', displayOrder: 99 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.data).toHaveProperty('id');
      expect(body.data.name).toBe('Test Officer');
      expect(body.data.role).toBe('Historian');
      createdId = body.data.id;
    });

    it('rejects missing name', async () => {
      const request = new Request('http://localhost/api/admin/officers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'Historian' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('rejects missing role', async () => {
      const request = new Request('http://localhost/api/admin/officers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/admin/officers/[id]', () => {
    it('deletes an existing officer', async () => {
      // Ensure we have an officer to delete
      expect(createdId).toBeDefined();

      const request = new Request('http://localhost/api/admin/officers/' + createdId, { method: 'DELETE' });
      const response = await DELETE_HANDLER(request, { params: Promise.resolve({ id: createdId }) });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.success).toBe(true);

      // Prevent afterAll from trying to clean up again
      createdId = '';
    });

    it('returns 404 for non-existent officer', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const request = new Request('http://localhost/api/admin/officers/' + fakeId, { method: 'DELETE' });
      const response = await DELETE_HANDLER(request, { params: Promise.resolve({ id: fakeId }) });
      expect(response.status).toBe(404);
    });
  });
});
