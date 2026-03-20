import { date, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const meetingMinutes = pgTable('meeting_minutes', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  meetingDate: date('meeting_date').notNull(),
  fileUrl: text('file_url').notNull(),
  fileKey: text('file_key').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
