import { getActiveSponsors } from '@/lib/db/queries';

export async function GET() {
  try {
    const data = await getActiveSponsors();
    return Response.json({ data });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to fetch sponsors';
    return Response.json({ error }, { status: 500 });
  }
}
