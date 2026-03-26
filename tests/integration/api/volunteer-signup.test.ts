// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Mock Clerk auth for admin event creation/cleanup
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-admin-user' }),
}));

// Mock R2
vi.mock('@/lib/r2/presigned', () => ({
  deleteObject: vi.fn().mockResolvedValue(undefined),
}));

// Mock rate limiter as disabled for most tests
vi.mock('@/lib/rate-limit', () => ({
  volunteerSignupRateLimit: null,
  newsletterRateLimit: null,
}));

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('POST /api/events/[id]/volunteer', () => {
  let POST: (request: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
  let ADMIN_POST: (request: Request) => Promise<Response>;
  let ADMIN_PUT: (request: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
  let ADMIN_DELETE: (request: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

  let publishedEventId: string;
  let unpublishedEventId: string;
  let noSlotsEventId: string;

  beforeAll(async () => {
    const volunteerRoute = await import('@/app/api/events/[id]/volunteer/route');
    POST = volunteerRoute.POST;

    const adminListRoute = await import('@/app/api/admin/events/route');
    ADMIN_POST = adminListRoute.POST;

    const adminDetailRoute = await import('@/app/api/admin/events/[id]/route');
    ADMIN_PUT = adminDetailRoute.PUT;
    ADMIN_DELETE = adminDetailRoute.DELETE;

    // Create a published event with volunteer slots
    const publishedRes = await ADMIN_POST(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Volunteer Test Event',
        date: '2026-12-01',
        startTime: '18:00',
        location: 'Test Location',
        volunteerSlots: [{ role: 'Setup', count: 5 }],
        isPublished: true,
      }),
    }));
    const publishedBody = await publishedRes.json();
    publishedEventId = publishedBody.data.id;

    // Create an unpublished event with volunteer slots
    const unpubRes = await ADMIN_POST(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Unpublished Vol Event',
        date: '2026-12-02',
        startTime: '18:00',
        location: 'Test Location',
        volunteerSlots: [{ role: 'Cleanup', count: 3 }],
        isPublished: false,
      }),
    }));
    const unpubBody = await unpubRes.json();
    unpublishedEventId = unpubBody.data.id;

    // Create a published event without volunteer slots
    const noSlotsRes = await ADMIN_POST(new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'No Slots Event',
        date: '2026-12-03',
        startTime: '18:00',
        location: 'Test Location',
        volunteerSlots: [],
        isPublished: true,
      }),
    }));
    const noSlotsBody = await noSlotsRes.json();
    noSlotsEventId = noSlotsBody.data.id;
  });

  afterAll(async () => {
    // Clean up test events
    const cleanup = async (id: string) => {
      if (!id) return;
      // Unpublish first so delete works
      await ADMIN_PUT(
        new Request('http://localhost', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublished: false }),
        }),
        { params: Promise.resolve({ id }) },
      );
      await ADMIN_DELETE(
        new Request('http://localhost', { method: 'DELETE' }),
        { params: Promise.resolve({ id }) },
      );
    };
    await cleanup(publishedEventId);
    await cleanup(unpublishedEventId);
    await cleanup(noSlotsEventId);
  });

  function makeRequest(eventId: string, body: Record<string, unknown>): [Request, { params: Promise<{ id: string }> }] {
    return [
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id: eventId }) },
    ];
  }

  const validPayload = {
    name: 'Jane Smith',
    email: 'jane-vol-test@example.com',
    phone: '(555) 123-4567',
  };

  it('returns 201 for valid signup', async () => {
    const [req, ctx] = makeRequest(publishedEventId, validPayload);
    const res = await POST(req, ctx);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.data.success).toBe(true);
    expect(body.data.message).toBe('Signup confirmed');
  });

  it('returns 409 for duplicate email on same event', async () => {
    const [req, ctx] = makeRequest(publishedEventId, validPayload);
    const res = await POST(req, ctx);
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.error).toContain('already signed up');
  });

  it('returns 404 for unpublished event', async () => {
    const [req, ctx] = makeRequest(unpublishedEventId, {
      ...validPayload,
      email: 'other@example.com',
    });
    const res = await POST(req, ctx);
    expect(res.status).toBe(404);
  });

  it('returns 404 for non-existent event', async () => {
    const [req, ctx] = makeRequest('00000000-0000-0000-0000-000000000000', validPayload);
    const res = await POST(req, ctx);
    expect(res.status).toBe(404);
  });

  it('returns 400 for event without volunteer slots', async () => {
    const [req, ctx] = makeRequest(noSlotsEventId, {
      ...validPayload,
      email: 'noslots@example.com',
    });
    const res = await POST(req, ctx);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toContain('not enabled');
  });

  it('returns 400 for invalid fields', async () => {
    const [req, ctx] = makeRequest(publishedEventId, {
      name: '',
      email: 'not-email',
      phone: '123',
    });
    const res = await POST(req, ctx);
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing fields', async () => {
    const [req, ctx] = makeRequest(publishedEventId, {});
    const res = await POST(req, ctx);
    expect(res.status).toBe(400);
  });

  it('returns 201 (silent success) when honeypot is filled', async () => {
    const [req, ctx] = makeRequest(publishedEventId, {
      ...validPayload,
      email: 'bot@example.com',
      honeypot: 'I am a bot',
    });
    const res = await POST(req, ctx);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.data.success).toBe(true);
  });
});

describe.skipIf(!hasDb)('POST /api/events/[id]/volunteer (rate limited)', () => {
  it('returns 429 when rate limit is exceeded', async () => {
    vi.resetModules();

    vi.doMock('@clerk/nextjs/server', () => ({
      auth: vi.fn().mockResolvedValue({ userId: 'test-admin-user' }),
    }));
    vi.doMock('@/lib/r2/presigned', () => ({
      deleteObject: vi.fn().mockResolvedValue(undefined),
    }));
    vi.doMock('@/lib/rate-limit', () => ({
      volunteerSignupRateLimit: {
        limit: vi.fn().mockResolvedValue({ success: false }),
      },
      newsletterRateLimit: null,
    }));

    const route = await import('@/app/api/events/[id]/volunteer/route');

    const res = await route.POST(
      new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test',
          email: 'test@example.com',
          phone: '(555) 123-4567',
        }),
      }),
      { params: Promise.resolve({ id: 'any-id' }) },
    );

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain('Too many requests');
  });
});
