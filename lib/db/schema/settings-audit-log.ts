import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const settingsAuditLog = pgTable('settings_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  settingKey: text('setting_key').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value').notNull(),
  changedBy: text('changed_by').notNull(),
  changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow().notNull(),
});
