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

export async function getSignupsByEmail(
  eventId: string,
  email: string,
): Promise<VolunteerSignup[]> {
  return db
    .select()
    .from(volunteerSignups)
    .where(and(eq(volunteerSignups.eventId, eventId), eq(volunteerSignups.email, email)));
}

export async function getVolunteerSignupByEmailAndRole(
  eventId: string,
  email: string,
  role: string,
): Promise<VolunteerSignup | undefined> {
  const rows = await db
    .select()
    .from(volunteerSignups)
    .where(
      and(
        eq(volunteerSignups.eventId, eventId),
        eq(volunteerSignups.email, email),
        eq(volunteerSignups.role, role),
      ),
    )
    .limit(1);

  return rows[0];
}

export async function getSignupCountsByRole(
  eventId: string,
): Promise<Array<{ role: string; count: number }>> {
  return db
    .select({
      role: volunteerSignups.role,
      count: sql<number>`cast(coalesce(sum(${volunteerSignups.quantity}), 0) as int)`,
    })
    .from(volunteerSignups)
    .where(eq(volunteerSignups.eventId, eventId))
    .groupBy(volunteerSignups.role);
}

export async function createVolunteerSignup(data: {
  eventId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}): Promise<VolunteerSignup> {
  const rows = await db
    .insert(volunteerSignups)
    .values({
      eventId: data.eventId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
    })
    .returning();

  return rows[0];
}

export async function createVolunteerSignups(data: {
  eventId: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  roles: Array<{ role: string; quantity: number }>;
}): Promise<VolunteerSignup[]> {
  const signupGroupId = crypto.randomUUID();

  return db
    .insert(volunteerSignups)
    .values(
      data.roles.map((r) => ({
        eventId: data.eventId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: r.role,
        quantity: r.quantity,
        signupGroupId,
        notes: data.notes || null,
      })),
    )
    .returning();
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

/** Per-role signup quantities grouped by event. Used to compute per-type totals on the list page. */
export async function getSignupQuantitiesByEventAndRole(): Promise<
  Array<{ eventId: string; role: string; total: number }>
> {
  return db
    .select({
      eventId: volunteerSignups.eventId,
      role: volunteerSignups.role,
      total: sql<number>`cast(coalesce(sum(${volunteerSignups.quantity}), 0) as int)`,
    })
    .from(volunteerSignups)
    .groupBy(volunteerSignups.eventId, volunteerSignups.role);
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

export async function getSignupsByGroupId(signupGroupId: string): Promise<VolunteerSignup[]> {
  return db
    .select()
    .from(volunteerSignups)
    .where(eq(volunteerSignups.signupGroupId, signupGroupId));
}

export async function deleteSignupsByGroupId(signupGroupId: string): Promise<number> {
  const deleted = await db
    .delete(volunteerSignups)
    .where(eq(volunteerSignups.signupGroupId, signupGroupId))
    .returning({ id: volunteerSignups.id });

  return deleted.length;
}

export async function updateSignupGroup(
  signupGroupId: string,
  eventId: string,
  data: { name: string; email: string; phone: string; notes: string; roles: Array<{ role: string; quantity: number }> },
): Promise<VolunteerSignup[]> {
  await db.delete(volunteerSignups).where(eq(volunteerSignups.signupGroupId, signupGroupId));

  return db
    .insert(volunteerSignups)
    .values(
      data.roles.map((r) => ({
        eventId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: r.role,
        quantity: r.quantity,
        signupGroupId,
        notes: data.notes || null,
      })),
    )
    .returning();
}
