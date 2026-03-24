import { auth } from '@clerk/nextjs/server';

import { createOfficer, getOfficers } from '@/lib/db/queries';
import { createOfficerSchema } from '@/lib/validators/officers';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await getOfficers();
    return Response.json({ data });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to fetch officers';
    return Response.json({ error }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const result = createOfficerSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const officer = await createOfficer(result.data);
    return Response.json({ data: officer }, { status: 201 });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to create officer';
    return Response.json({ error }, { status: 500 });
  }
}
