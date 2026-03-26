import { config } from 'dotenv';
config({ path: '.env.local' });

import { desc, eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  const limit = parseInt(process.argv[2] || '50', 10);
  const filterKey = process.argv[3];

  const query = db
    .select()
    .from(schema.settingsAuditLog)
    .orderBy(desc(schema.settingsAuditLog.changedAt))
    .limit(limit);

  const rows = filterKey
    ? await query.where(eq(schema.settingsAuditLog.settingKey, filterKey))
    : await query;

  if (rows.length === 0) {
    console.log('No audit log entries found.');
    return;
  }

  console.log(`\n  Settings Audit Log (${rows.length} entries)\n`);
  console.log(
    '  ' +
    'Timestamp'.padEnd(22) +
    'Key'.padEnd(24) +
    'Old Value'.padEnd(32) +
    'New Value'.padEnd(32) +
    'User ID'
  );
  console.log('  ' + '-'.repeat(130));

  for (const row of rows) {
    const ts = row.changedAt.toISOString().replace('T', ' ').slice(0, 19);
    const old = (row.oldValue ?? '(none)').slice(0, 30);
    const val = row.newValue.slice(0, 30);
    console.log(
      '  ' +
      ts.padEnd(22) +
      row.settingKey.padEnd(24) +
      old.padEnd(32) +
      val.padEnd(32) +
      row.changedBy
    );
  }
  console.log();
}

main().catch(console.error);
