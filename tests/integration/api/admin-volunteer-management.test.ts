// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-admin-user' }),
  currentUser: vi.fn().mockResolvedValue({
    emailAddresses: [{ emailAddress: 'admin@westmontpto.org' }],
  }),
}));

// Mock email provider
const sendEmailMock = vi.fn().mockResolvedValue({ success: true });
vi.mock('@/lib/email', () => ({
  getEmailProvider: vi.fn(() => ({ sendEmail: sendEmailMock })),
}));

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('Admin volunteer management API', () => {
  let LIST_GET: () => Promise<Response>;
  let SIGNUPS_GET: (request: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
  let SIGNUPS_DELETE: (request: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
  let MESSAGE_POST: (request: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
  let testEventId: string;
  let signupIds: string[];

  beforeAll(async () => {
    const listRoute = await import('@/app/api/admin/events/route');
    LIST_GET = listRoute.GET;

    const signupsRoute = await import('@/app/api/admin/events/[id]/signups/route');
    SIGNUPS_GET = signupsRoute.GET;
    SIGNUPS_DELETE = signupsRoute.DELETE;

    const messageRoute = await import('@/app/api/admin/events/[id]/message/route');
    MESSAGE_POST = messageRoute.POST;

    // Create a test event with volunteer slots, dated >90 days ago
    const { db } = await import('@/lib/db');
    const { events, volunteerSignups } = await import('@/lib/db/schema');

    const [event] = await db.insert(events).values({
      title: '__integration_volunteer_test__',
      description: 'Integration test event',
      date: new Date('2025-11-01T10:00:00Z'), // >90 days in the past
      location: 'Test Hall',
      volunteerSlots: [{ role: 'Helper', count: 5 }],
      isPublished: true,
    }).returning();
    testEventId = event.id;

    const rows = await db.insert(volunteerSignups).values([
      { eventId: event.id, name: 'Test User A', email: 'a@test.com', phone: '(555) 111-0001', role: 'Helper' },
      { eventId: event.id, name: 'Test User B', email: 'b@test.com', phone: null, role: 'Helper' },
    ]).returning();
    signupIds = rows.map((r) => r.id);
  });

  afterAll(async () => {
    if (testEventId) {
      const { deleteEvent } = await import('@/lib/db/queries/events');
      await deleteEvent(testEventId);
    }
  });

  function ctx(id: string) {
    return { params: Promise.resolve({ id }) };
  }

  describe('GET /api/admin/events — retention fields', () => {
    it('includes retentionExpired and daysSinceEvent on each event', async () => {
      const res = await LIST_GET();
      const body = await res.json();
      const testEvent = body.data.find((e: { id: string }) => e.id === testEventId);
      expect(testEvent).toBeDefined();
      expect(testEvent.retentionExpired).toBe(true);
      expect(typeof testEvent.daysSinceEvent).toBe('number');
      expect(testEvent.daysSinceEvent).toBeGreaterThan(90);
    });
  });

  describe('GET /api/admin/events/[id]/signups', () => {
    it('returns event with signups', async () => {
      const req = new Request('http://localhost');
      const res = await SIGNUPS_GET(req, ctx(testEventId));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.event.id).toBe(testEventId);
      expect(body.data.signups).toHaveLength(2);
      expect(body.data.signups[0]).toHaveProperty('name');
      expect(body.data.signups[0]).toHaveProperty('email');
      expect(body.data.signups[0]).toHaveProperty('phone');
      expect(body.data.signups[0]).toHaveProperty('role');
      expect(body.data.signups[0]).toHaveProperty('createdAt');
      expect(body.data.retentionExpired).toBe(true);
    });

    it('returns 404 for non-existent event', async () => {
      const req = new Request('http://localhost');
      const res = await SIGNUPS_GET(req, ctx('00000000-0000-0000-0000-000000000000'));
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/admin/events/[id]/message', () => {
    it('sends email to selected volunteers', async () => {
      sendEmailMock.mockClear();
      const req = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientIds: signupIds,
          subject: 'Test message',
          body: 'Hello volunteers!',
          ccAdmin: true,
        }),
      });
      const res = await MESSAGE_POST(req, ctx(testEventId));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.success).toBe(true);
      expect(body.data.recipientCount).toBe(2);

      // Verify email was sent to volunteers
      expect(sendEmailMock).toHaveBeenCalled();
      const firstCall = sendEmailMock.mock.calls[0][0];
      expect(firstCall.to).toEqual(expect.arrayContaining(['a@test.com', 'b@test.com']));
      expect(firstCall.subject).toBe('Test message');
      expect(firstCall.html).toContain('Hello volunteers!');
      expect(firstCall.replyTo).toBe('admin@westmontpto.org');
    });

    it('rejects missing recipients', async () => {
      const req = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientIds: [],
          subject: 'Test',
          body: 'Hello',
        }),
      });
      const res = await MESSAGE_POST(req, ctx(testEventId));
      expect(res.status).toBe(400);
    });

    it('rejects missing subject', async () => {
      const req = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientIds: signupIds,
          subject: '',
          body: 'Hello',
        }),
      });
      const res = await MESSAGE_POST(req, ctx(testEventId));
      expect(res.status).toBe(400);
    });

    it('rejects missing body', async () => {
      const req = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientIds: signupIds,
          subject: 'Test',
          body: '',
        }),
      });
      const res = await MESSAGE_POST(req, ctx(testEventId));
      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existent event', async () => {
      const req = new Request('http://localhost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientIds: signupIds,
          subject: 'Test',
          body: 'Hello',
        }),
      });
      const res = await MESSAGE_POST(req, ctx('00000000-0000-0000-0000-000000000000'));
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/admin/events/[id]/signups', () => {
    it('deletes signups and preserves event', async () => {
      const req = new Request('http://localhost', { method: 'DELETE' });
      const res = await SIGNUPS_DELETE(req, ctx(testEventId));
      expect(res.status).toBe(204);

      // Verify signups are gone
      const getReq = new Request('http://localhost');
      const getRes = await SIGNUPS_GET(getReq, ctx(testEventId));
      const body = await getRes.json();
      expect(body.data.signups).toHaveLength(0);
      expect(body.data.event.id).toBe(testEventId);
      expect(body.data.retentionExpired).toBe(false);
    });
  });
});
