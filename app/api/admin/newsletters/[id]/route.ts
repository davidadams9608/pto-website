import { auth } from '@clerk/nextjs/server';

import { deleteNewsletter, getNewsletterById } from '@/lib/db/queries/newsletters';
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
    const existing = await getNewsletterById(id);
    if (!existing) return Response.json({ error: 'Newsletter not found' }, { status: 404 });

    // Delete from R2
    if (existing.fileKey) {
      try {
        await deleteObject(existing.fileKey);
      } catch {
        console.error(`Failed to delete R2 object: ${existing.fileKey}`);
      }
    }

    await deleteNewsletter(id);

    return new Response(null, { status: 204 });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to delete newsletter';
    return Response.json({ error }, { status: 500 });
  }
}
