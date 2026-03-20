import { getPublicSettings } from '@/lib/db/queries';

export async function GET() {
  try {
    const rows = await getPublicSettings();
    const data = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return Response.json({ data });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to fetch settings';
    return Response.json({ error }, { status: 500 });
  }
}
