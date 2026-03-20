import { getUpcomingEvents } from '@/lib/db/queries';

export async function GET() {
  try {
    const data = await getUpcomingEvents();
    return Response.json({ data });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to fetch events';
    return Response.json({ error }, { status: 500 });
  }
}
