import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { events } from '@/lib/db/schema/events';

export const volunteerSignups = pgTable('volunteer_signups', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  role: text('role').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
