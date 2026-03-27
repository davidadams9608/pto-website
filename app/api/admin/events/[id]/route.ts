import { auth } from '@clerk/nextjs/server';

import { deleteEvent, getEventByIdAdmin, updateEvent } from '@/lib/db/queries/events';
import type { NewEvent } from '@/lib/db/queries/events';
import { deleteObject } from '@/lib/r2/presigned';
import { updateEventSchema, validateForPublish } from '@/lib/validators/events';
import { isValidUUID } from '@/lib/validators/uuid';
import { SITE_TIMEZONE } from '@/lib/site-config';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function buildTimestamp(date: string, time: string): Date {
  return new Date(new Date(`${date}T${time}:00`).toLocaleString('en-US', { timeZone: SITE_TIMEZONE }));
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isValidUUID(id)) return Response.json({ error: 'Invalid ID format' }, { status: 400 });

  try {
    const event = await getEventByIdAdmin(id);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    return Response.json({ data: event });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to fetch event';
    return Response.json({ error }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isValidUUID(id)) return Response.json({ error: 'Invalid ID format' }, { status: 400 });

  try {
    const existing = await getEventByIdAdmin(id);
    if (!existing) return Response.json({ error: 'Event not found' }, { status: 404 });

    const body = await request.json();
    const result = updateEventSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const input = result.data;

    // If publishing (either already published or setting to published), validate merged state
    const willBePublished = input.isPublished ?? existing.isPublished;
    if (willBePublished) {
      const mergedForValidation = {
        title: input.title ?? existing.title,
        date: input.date ?? existing.date.toISOString().slice(0, 10),
        location: input.location ?? existing.location,
        startTime: input.startTime ?? existing.date.toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', hour12: false, timeZone: SITE_TIMEZONE,
        }),
      };
      const missing = validateForPublish(mergedForValidation);
      if (missing.length > 0) {
        return Response.json(
          { error: `Cannot publish: missing required fields: ${missing.join(', ')}` },
          { status: 400 },
        );
      }
    }

    // Build the update payload
    const updateData: Partial<NewEvent> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.location !== undefined) updateData.location = input.location;
    if (input.zoomUrl !== undefined) updateData.zoomUrl = input.zoomUrl || null;
    if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl || null;
    if (input.imageKey !== undefined) updateData.imageKey = input.imageKey || null;
    if (input.isPublished !== undefined) updateData.isPublished = input.isPublished;

    if (input.volunteerSlots !== undefined) {
      updateData.volunteerSlots = input.volunteerSlots.length > 0 ? input.volunteerSlots : null;
    }

    // If date or startTime changed, rebuild the timestamp
    if (input.date !== undefined || input.startTime !== undefined) {
      const date = input.date ?? existing.date.toISOString().slice(0, 10);
      const time = input.startTime ?? existing.date.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: SITE_TIMEZONE,
      });
      updateData.date = buildTimestamp(date, time);
    }

    const event = await updateEvent(id, updateData);
    return Response.json({ data: event });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to update event';
    return Response.json({ error }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isValidUUID(id)) return Response.json({ error: 'Invalid ID format' }, { status: 400 });

  try {
    const existing = await getEventByIdAdmin(id);
    if (!existing) return Response.json({ error: 'Event not found' }, { status: 404 });

    // Delete image from R2 if present
    if (existing.imageKey) {
      try {
        await deleteObject(existing.imageKey);
      } catch {
        // Log but don't fail the delete if R2 cleanup fails
        console.error(`Failed to delete R2 object: ${existing.imageKey}`);
      }
    }

    // Cascade delete handled by FK constraint on volunteer_signups
    await deleteEvent(id);

    return new Response(null, { status: 204 });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to delete event';
    return Response.json({ error }, { status: 500 });
  }
}
