import { and, asc, eq, gte, lte } from 'drizzle-orm';

import { db } from '@/lib/db';
import { events } from '@/lib/db/schema';

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

export async function getEventById(id: string): Promise<Event | undefined> {
  const rows = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.isPublished, true)))
    .limit(1);

  return rows[0];
}
