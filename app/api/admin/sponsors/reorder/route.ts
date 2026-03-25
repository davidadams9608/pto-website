import { auth } from '@clerk/nextjs/server';

import { reorderSponsors } from '@/lib/db/queries/sponsors';
import { reorderSponsorsSchema } from '@/lib/validators/sponsors';

export async function PUT(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const result = reorderSponsorsSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    await reorderSponsors(result.data.ids);
    return Response.json({ data: { success: true } });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to reorder sponsors';
    return Response.json({ error }, { status: 500 });
  }
}
