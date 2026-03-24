import { count, desc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { meetingMinutes } from '@/lib/db/schema';
import type { PaginatedResult } from './types';

export type MeetingMinutes = typeof meetingMinutes.$inferSelect;

export async function getMinutes(
  page: number,
  limit: number,
): Promise<PaginatedResult<MeetingMinutes>> {
  const offset = (page - 1) * limit;

  const [items, [{ total }]] = await Promise.all([
    db.select().from(meetingMinutes).orderBy(desc(meetingMinutes.meetingDate)).limit(limit).offset(offset),
    db.select({ total: count() }).from(meetingMinutes),
  ]);

  return { items, total: Number(total), page, limit };
}

export async function getMinutesCount(): Promise<number> {
  const [{ total }] = await db.select({ total: count() }).from(meetingMinutes);
  return Number(total);
}

export async function getMinuteById(id: string): Promise<MeetingMinutes | undefined> {
  const rows = await db
    .select()
    .from(meetingMinutes)
    .where(eq(meetingMinutes.id, id))
    .limit(1);

  return rows[0];
}
