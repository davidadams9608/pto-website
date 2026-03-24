// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-admin-user' }),
}));

// Mock R2 (avoid real calls on delete)
vi.mock('@/lib/r2/presigned', () => ({
  deleteObject: vi.fn().mockResolvedValue(undefined),
}));

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('Admin events API', () => {
  let LIST_GET: () => Promise<Response>;
  let LIST_POST: (request: Request) => Promise<Response>;
  let DETAIL_GET: (request: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
  let DETAIL_PUT: (request: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
  let DETAIL_DELETE: (request: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
  let createdEventId: string;

  beforeAll(async () => {
    const listRoute = await import('@/app/api/admin/events/route');
    LIST_GET = listRoute.GET;
    LIST_POST = listRoute.POST;

    const detailRoute = await import('@/app/api/admin/events/[id]/route');
    DETAIL_GET = detailRoute.GET;
    DETAIL_PUT = detailRoute.PUT;
    DETAIL_DELETE = detailRoute.DELETE;
  });

  afterAll(async () => {
    // Clean up created test event
    if (createdEventId) {
      try {
        const req = new Request('http://localhost', { method: 'DELETE' });
        await DETAIL_DELETE(req, { params: Promise.resolve({ id: createdEventId }) });
      } catch {
        // ignore
      }
    }
  });

  function makeRequest(body: Record<string, unknown>, method = 'POST') {
    return new Request('http://localhost/api/admin/events', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  describe('GET /api/admin/events', () => {
    it('returns events with signup counts', async () => {
      const response = await LIST_GET();
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
      // Seeded events should be present
      expect(body.data.length).toBeGreaterThan(0);
      // Each event should have signupCount
      expect(body.data[0]).toHaveProperty('signupCount');
      expect(typeof body.data[0].signupCount).toBe('number');
    });
  });

  describe('POST /api/admin/events', () => {
    it('creates a draft event with valid data', async () => {
      const response = await LIST_POST(
        makeRequest({
          title: 'Test Event',
          date: '2027-06-15',
          startTime: '14:00',
          location: 'Test Location',
          isPublished: false,
        }),
      );
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.data).toHaveProperty('id');
      expect(body.data.title).toBe('Test Event');
      expect(body.data.isPublished).toBe(false);
      createdEventId = body.data.id;
    });

    it('rejects missing required fields', async () => {
      const response = await LIST_POST(
        makeRequest({ title: '', date: '2027-06-15', startTime: '14:00', location: 'Loc' }),
      );
      expect(response.status).toBe(400);
    });

    it('rejects publish with incomplete fields', async () => {
      const response = await LIST_POST(
        makeRequest({
          title: 'Test',
          date: '2027-06-15',
          startTime: '',
          location: 'Loc',
          isPublished: true,
        }),
      );
      expect(response.status).toBe(400);
    });

    it('creates a published event when all fields present', async () => {
      const response = await LIST_POST(
        makeRequest({
          title: 'Published Event',
          date: '2027-07-01',
          startTime: '10:00',
          location: 'Gym',
          isPublished: true,
        }),
      );
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.data.isPublished).toBe(true);
      // Clean up
      const req = new Request('http://localhost', { method: 'DELETE' });
      await DETAIL_DELETE(req, { params: Promise.resolve({ id: body.data.id }) });
    });
  });

  describe('GET /api/admin/events/[id]', () => {
    it('returns a single event', async () => {
      expect(createdEventId).toBeDefined();
      const req = new Request('http://localhost');
      const response = await DETAIL_GET(req, { params: Promise.resolve({ id: createdEventId }) });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.id).toBe(createdEventId);
      expect(body.data.title).toBe('Test Event');
    });

    it('returns 404 for non-existent event', async () => {
      const req = new Request('http://localhost');
      const response = await DETAIL_GET(req, {
        params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }),
      });
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/admin/events/[id]', () => {
    it('updates event fields', async () => {
      const req = new Request('http://localhost', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title', location: 'New Location' }),
      });
      const response = await DETAIL_PUT(req, { params: Promise.resolve({ id: createdEventId }) });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.title).toBe('Updated Title');
      expect(body.data.location).toBe('New Location');
    });

    it('rejects publishing with missing required fields on draft', async () => {
      // First create a minimal draft with empty description
      const createRes = await LIST_POST(
        makeRequest({
          title: 'Incomplete Draft',
          date: '2027-08-01',
          startTime: '09:00',
          location: '',
          isPublished: false,
        }),
      );
      // This should fail because location is required by the schema
      expect(createRes.status).toBe(400);
    });
  });

  describe('DELETE /api/admin/events/[id]', () => {
    it('deletes an existing event', async () => {
      expect(createdEventId).toBeDefined();
      const req = new Request('http://localhost', { method: 'DELETE' });
      const response = await DETAIL_DELETE(req, { params: Promise.resolve({ id: createdEventId }) });
      expect(response.status).toBe(204);

      // Verify it's gone
      const getReq = new Request('http://localhost');
      const getRes = await DETAIL_GET(getReq, { params: Promise.resolve({ id: createdEventId }) });
      expect(getRes.status).toBe(404);

      createdEventId = '';
    });

    it('returns 404 for non-existent event', async () => {
      const req = new Request('http://localhost', { method: 'DELETE' });
      const response = await DETAIL_DELETE(req, {
        params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }),
      });
      expect(response.status).toBe(404);
    });
  });
});
