// @vitest-environment node
import { eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('deleteSignupsForEvent', () => {
  let testEventId: string;

  afterAll(async () => {
    // Clean up test event (cascade deletes remaining signups)
    if (testEventId) {
      const { deleteEvent } = await import('@/lib/db/queries/events');
      await deleteEvent(testEventId);
    }
  });

  it('deletes all signups for an event but keeps the event', async () => {
    const { db } = await import('@/lib/db');
    const { events, volunteerSignups } = await import('@/lib/db/schema');
    const { deleteSignupsForEvent, getEventByIdAdmin } = await import('@/lib/db/queries/events');

    // Create a test event
    const [event] = await db
      .insert(events)
      .values({
        title: '__test_delete_signups__',
        description: 'Integration test event',
        date: new Date('2025-01-01T12:00:00Z'),
        location: 'Test Location',
        isPublished: false,
      })
      .returning();
    testEventId = event.id;

    // Add signups
    await db.insert(volunteerSignups).values([
      { eventId: event.id, name: 'Test User 1', email: 'test1@example.com', role: 'Helper' },
      { eventId: event.id, name: 'Test User 2', email: 'test2@example.com', role: 'Helper' },
      { eventId: event.id, name: 'Test User 3', email: 'test3@example.com', role: 'Setup' },
    ]);

    // Verify signups exist
    const before = await db
      .select()
      .from(volunteerSignups)
      .where(eq(volunteerSignups.eventId, event.id));
    expect(before).toHaveLength(3);

    // Delete signups
    const deletedCount = await deleteSignupsForEvent(event.id);
    expect(deletedCount).toBe(3);

    // Verify signups are gone
    const after = await db
      .select()
      .from(volunteerSignups)
      .where(eq(volunteerSignups.eventId, event.id));
    expect(after).toHaveLength(0);

    // Verify event still exists
    const eventAfter = await getEventByIdAdmin(event.id);
    expect(eventAfter).toBeDefined();
    expect(eventAfter!.title).toBe('__test_delete_signups__');
  });
});
