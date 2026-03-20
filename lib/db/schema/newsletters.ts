import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const newsletters = pgTable('newsletters', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  pdfUrl: text('pdf_url').notNull(),
  fileKey: text('file_key').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
