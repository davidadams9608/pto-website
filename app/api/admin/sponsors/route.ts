import { auth } from '@clerk/nextjs/server';

import { createSponsor, getAllSponsors } from '@/lib/db/queries/sponsors';
import { createSponsorSchema } from '@/lib/validators/sponsors';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await getAllSponsors();
    return Response.json({ data });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to fetch sponsors';
    return Response.json({ error }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const result = createSponsorSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const input = result.data;
    const sponsor = await createSponsor({
      name: input.name,
      logoUrl: input.logoUrl,
      logoKey: input.logoKey,
      websiteUrl: input.websiteUrl || null,
      isActive: input.isActive,
    });

    return Response.json({ data: sponsor }, { status: 201 });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to create sponsor';
    return Response.json({ error }, { status: 500 });
  }
}
