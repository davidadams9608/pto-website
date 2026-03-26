import { and, asc, count, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';

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

export async function getSignupCountForEvent(eventId: string): Promise<number> {
  const rows = await db
    .select({ count: count() })
    .from(volunteerSignups)
    .where(eq(volunteerSignups.eventId, eventId));

  return rows[0]?.count ?? 0;
}

export async function getVolunteerSignupByEmail(
  eventId: string,
  email: string,
): Promise<VolunteerSignup | undefined> {
  const rows = await db
    .select()
    .from(volunteerSignups)
    .where(and(eq(volunteerSignups.eventId, eventId), eq(volunteerSignups.email, email)))
    .limit(1);

  return rows[0];
}

export async function createVolunteerSignup(data: {
  eventId: string;
  name: string;
  email: string;
  phone: string;
}): Promise<VolunteerSignup> {
  const rows = await db
    .insert(volunteerSignups)
    .values({
      eventId: data.eventId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: 'Unassigned',
    })
    .returning();

  return rows[0];
}

export async function getVolunteersByIds(ids: string[]): Promise<VolunteerSignup[]> {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(volunteerSignups)
    .where(inArray(volunteerSignups.id, ids));
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

export type VolunteerSignup = typeof volunteerSignups.$inferSelect;

export interface EventWithSignups {
  event: Event;
  signups: VolunteerSignup[];
}

export async function getEventWithSignups(eventId: string): Promise<EventWithSignups | null> {
  const event = await getEventByIdAdmin(eventId);
  if (!event) return null;

  const signups = await db
    .select()
    .from(volunteerSignups)
    .where(eq(volunteerSignups.eventId, eventId))
    .orderBy(desc(volunteerSignups.createdAt));

  return { event, signups };
}

export async function deleteSignupsForEvent(eventId: string): Promise<number> {
  const deleted = await db
    .delete(volunteerSignups)
    .where(eq(volunteerSignups.eventId, eventId))
    .returning({ id: volunteerSignups.id });

  return deleted.length;
}
