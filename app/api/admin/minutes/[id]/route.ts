import { auth } from '@clerk/nextjs/server';

import { deleteMinute, getMinuteById } from '@/lib/db/queries/minutes';
import { deleteObject } from '@/lib/r2/presigned';
import { isValidUUID } from '@/lib/validators/uuid';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isValidUUID(id)) return Response.json({ error: 'Invalid ID format' }, { status: 400 });

  try {
    const existing = await getMinuteById(id);
    if (!existing) return Response.json({ error: 'Meeting minutes not found' }, { status: 404 });

    if (existing.fileKey) {
      try {
        await deleteObject(existing.fileKey);
      } catch {
        console.error(`Failed to delete R2 object: ${existing.fileKey}`);
      }
    }

    await deleteMinute(id);

    return new Response(null, { status: 204 });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to delete meeting minutes';
    return Response.json({ error }, { status: 500 });
  }
}
