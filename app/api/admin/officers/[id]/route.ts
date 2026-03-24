import { auth } from '@clerk/nextjs/server';

import { deleteOfficer, getOfficerById, updateOfficer } from '@/lib/db/queries';
import { updateOfficerSchema } from '@/lib/validators/officers';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await getOfficerById(id);
    if (!existing) return Response.json({ error: 'Officer not found' }, { status: 404 });

    const body = await request.json();
    const result = updateOfficerSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const officer = await updateOfficer(id, result.data);
    return Response.json({ data: officer });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to update officer';
    return Response.json({ error }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const existing = await getOfficerById(id);
    if (!existing) return Response.json({ error: 'Officer not found' }, { status: 404 });

    await deleteOfficer(id);
    return Response.json({ data: { success: true } });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to delete officer';
    return Response.json({ error }, { status: 500 });
  }
}
