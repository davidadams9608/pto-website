import { getAboutText, getOfficers } from '@/lib/db/queries';

export async function GET() {
  try {
    const [aboutText, officers] = await Promise.all([
      getAboutText(),
      getOfficers(),
    ]);

    return Response.json({ data: { aboutText: aboutText ?? '', officers } });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to fetch about data';
    return Response.json({ error }, { status: 500 });
  }
}
