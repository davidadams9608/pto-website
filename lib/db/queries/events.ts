import { and, asc, count, desc, eq, gte, lte, sql } from 'drizzle-orm';

import { db } from '@/lib/db';
import { events, volunteerSignups } from '@/lib/db/schema';

export type Event = typeof events.$inferSelect;

export async function getUpcomingEvents(): Promise<Event[]> {
  return db
    .select()
    .from(events)
    .where(and(eq(events.isPublished, true), gte(events.date, new Date())))
    .orderBy(asc(events.date));
}

export async function getUpcomingEventsWithinDays(days: number): Promise<Event[]> {
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);

  return db
    .select()
    .from(events)
    .where(
      and(
        eq(events.isPublished, true),
        gte(events.date, now),
        lte(events.date, cutoff),
      ),
    )
    .orderBy(asc(events.date));
}

export async function getNextEvent(): Promise<Event | undefined> {
  const rows = await db
    .select()
    .from(events)
    .where(and(eq(events.isPublished, true), gte(events.date, new Date())))
    .orderBy(asc(events.date))
    .limit(1);

  return rows[0];
}

export async function getUpcomingEventCount(): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(events)
    .where(and(eq(events.isPublished, true), gte(events.date, new Date())));

  return Number(total);
}

export async function getVolunteerCountForUpcomingEvents(): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(volunteerSignups)
    .innerJoin(events, eq(volunteerSignups.eventId, events.id))
    .where(and(eq(events.isPublished, true), gte(events.date, new Date())));

  return Number(total);
}

export async function getRecentEvents(limit: number): Promise<Event[]> {
  return db
    .select()
    .from(events)
    .orderBy(asc(events.date))
    .where(and(eq(events.isPublished, true), gte(events.date, new Date())))
    .limit(limit);
}

export async function getEventById(id: string): Promise<Event | undefined> {
  const rows = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.isPublished, true)))
    .limit(1);

  return rows[0];
}

// ── Admin queries ──────────────────────────────────────────────────────────

export type EventWithSignupCount = Event & { signupCount: number };

export async function getAllEventsWithSignupCount(): Promise<EventWithSignupCount[]> {
  const rows = await db
    .select({
      event: events,
      signupCount: sql<number>`cast(count(${volunteerSignups.id}) as int)`,
    })
    .from(events)
    .leftJoin(volunteerSignups, eq(events.id, volunteerSignups.eventId))
    .groupBy(events.id)
    .orderBy(desc(events.date));

  return rows.map((r) => ({ ...r.event, signupCount: r.signupCount }));
}

export async function getEventByIdAdmin(id: string): Promise<Event | undefined> {
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1);

  return rows[0];
}

export type NewEvent = typeof events.$inferInsert;

export async function createEvent(data: NewEvent): Promise<Event> {
  const [row] = await db.insert(events).values(data).returning();
  return row;
}

export async function updateEvent(id: string, data: Partial<NewEvent>): Promise<Event | undefined> {
  const [row] = await db
    .update(events)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(events.id, id))
    .returning();

  return row;
}

export async function deleteEvent(id: string): Promise<void> {
  await db.delete(events).where(eq(events.id, id));
}
