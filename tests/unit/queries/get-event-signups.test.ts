// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest';

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('getEventWithSignups', () => {
  let testEventId: string;

  afterAll(async () => {
    if (testEventId) {
      const { deleteEvent } = await import('@/lib/db/queries/events');
      await deleteEvent(testEventId);
    }
  });

  it('returns event with all signups across different roles', async () => {
    const { db } = await import('@/lib/db');
    const { events, volunteerSignups } = await import('@/lib/db/schema');
    const { getEventWithSignups } = await import('@/lib/db/queries/events');

    // Create test event with volunteer slots
    const [event] = await db
      .insert(events)
      .values({
        title: '__test_get_signups__',
        description: 'Integration test',
        date: new Date('2026-05-01T12:00:00Z'),
        location: 'Test Gym',
        volunteerSlots: [
          { role: 'Setup', count: 3 },
          { role: 'Cleanup', count: 2 },
        ],
        isPublished: true,
      })
      .returning();
    testEventId = event.id;

    // Insert signups across different roles
    await db.insert(volunteerSignups).values([
      { eventId: event.id, name: 'Alice', email: 'alice@test.com', phone: '(555) 111-1111', role: 'Setup' },
      { eventId: event.id, name: 'Bob', email: 'bob@test.com', phone: '(555) 222-2222', role: 'Setup' },
      { eventId: event.id, name: 'Carol', email: 'carol@test.com', phone: null, role: 'Cleanup' },
    ]);

    const result = await getEventWithSignups(event.id);

    expect(result).not.toBeNull();
    expect(result!.event.id).toBe(event.id);
    expect(result!.event.title).toBe('__test_get_signups__');
    expect(result!.event.location).toBe('Test Gym');

    // All 3 signups returned
    expect(result!.signups).toHaveLength(3);

    // Check fields are present on each signup
    const names = result!.signups.map((s) => s.name).sort();
    expect(names).toEqual(['Alice', 'Bob', 'Carol']);

    const emails = result!.signups.map((s) => s.email).sort();
    expect(emails).toEqual(['alice@test.com', 'bob@test.com', 'carol@test.com']);

    // Verify roles
    const roles = result!.signups.map((s) => s.role).sort();
    expect(roles).toEqual(['Cleanup', 'Setup', 'Setup']);

    // Phone can be null
    const carol = result!.signups.find((s) => s.name === 'Carol');
    expect(carol!.phone).toBeNull();

    // Signups sorted by createdAt descending (most recent first)
    const timestamps = result!.signups.map((s) => new Date(s.createdAt).getTime());
    for (let i = 0; i < timestamps.length - 1; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]);
    }
  });

  it('returns null for nonexistent event', async () => {
    const { getEventWithSignups } = await import('@/lib/db/queries/events');
    const result = await getEventWithSignups('00000000-0000-0000-0000-000000000000');
    expect(result).toBeNull();
  });

  it('returns empty signups array for event with no signups', async () => {
    const { db } = await import('@/lib/db');
    const { events } = await import('@/lib/db/schema');
    const { getEventWithSignups, deleteEvent } = await import('@/lib/db/queries/events');

    const [event] = await db
      .insert(events)
      .values({
        title: '__test_no_signups__',
        description: 'Empty signups test',
        date: new Date('2026-06-01T12:00:00Z'),
        location: 'Test Room',
        isPublished: true,
      })
      .returning();

    try {
      const result = await getEventWithSignups(event.id);
      expect(result).not.toBeNull();
      expect(result!.signups).toHaveLength(0);
    } finally {
      await deleteEvent(event.id);
    }
  });
});
