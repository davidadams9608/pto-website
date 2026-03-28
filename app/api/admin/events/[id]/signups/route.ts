import { auth } from '@clerk/nextjs/server';

import { deleteSignupsForEvent, getEventWithSignups } from '@/lib/db/queries/events';
import { isValidUUID } from '@/lib/validators/uuid';
import { computeRetentionStatus } from '@/lib/utils/retention';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isValidUUID(id)) return Response.json({ error: 'Invalid ID format' }, { status: 400 });

  try {
    const result = await getEventWithSignups(id);
    if (!result) return Response.json({ error: 'Event not found' }, { status: 404 });

    const { retentionExpired, daysSinceEvent } = computeRetentionStatus(
      result.event.date,
      result.signups.length,
    );

    return Response.json({
      data: {
        event: result.event,
        signups: result.signups,
        retentionExpired,
        daysSinceEvent,
      },
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to fetch signups';
    return Response.json({ error }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isValidUUID(id)) return Response.json({ error: 'Invalid ID format' }, { status: 400 });

  try {
    const result = await getEventWithSignups(id);
    if (!result) return Response.json({ error: 'Event not found' }, { status: 404 });

    await deleteSignupsForEvent(id);

    return new Response(null, { status: 204 });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to delete volunteer data';
    return Response.json({ error }, { status: 500 });
  }
}
