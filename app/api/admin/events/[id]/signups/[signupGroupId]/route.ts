import { auth } from '@clerk/nextjs/server';

import {
  deleteSignupsByGroupId,
  getSignupsByGroupId,
  updateSignupGroup,
} from '@/lib/db/queries/events';
import { isValidUUID } from '@/lib/validators/uuid';
import { adminUpdateSignupSchema } from '@/lib/validators/volunteer-signup';

interface RouteContext {
  params: Promise<{ id: string; signupGroupId: string }>;
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: eventId, signupGroupId } = await params;
  if (!isValidUUID(eventId) || !isValidUUID(signupGroupId)) {
    return Response.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const result = adminUpdateSignupSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    // Verify the signup group exists and belongs to this event
    const existing = await getSignupsByGroupId(signupGroupId);
    if (existing.length === 0) {
      return Response.json({ error: 'Signup not found' }, { status: 404 });
    }
    if (existing.some((s) => s.eventId !== eventId)) {
      return Response.json({ error: 'Signup does not belong to this event' }, { status: 403 });
    }

    const updated = await updateSignupGroup(signupGroupId, eventId, result.data);
    return Response.json({ data: updated });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to update signup';
    return Response.json({ error }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: eventId, signupGroupId } = await params;
  if (!isValidUUID(eventId) || !isValidUUID(signupGroupId)) {
    return Response.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  try {
    const existing = await getSignupsByGroupId(signupGroupId);
    if (existing.length === 0) {
      return Response.json({ error: 'Signup not found' }, { status: 404 });
    }
    if (existing.some((s) => s.eventId !== eventId)) {
      return Response.json({ error: 'Signup does not belong to this event' }, { status: 403 });
    }

    await deleteSignupsByGroupId(signupGroupId);
    return new Response(null, { status: 204 });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to delete signup';
    return Response.json({ error }, { status: 500 });
  }
}
