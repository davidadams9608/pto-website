import { auth } from '@clerk/nextjs/server';

import { createEvent, getAllEventsWithSignupCount } from '@/lib/db/queries/events';
import { createEventSchema, validateForPublish } from '@/lib/validators/events';
import { SITE_TIMEZONE } from '@/lib/site-config';

/** Combine a date string (YYYY-MM-DD) and time string (HH:mm) into a Date in the site timezone. */
function buildTimestamp(date: string, time: string): Date {
  return new Date(new Date(`${date}T${time}:00`).toLocaleString('en-US', { timeZone: SITE_TIMEZONE }));
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await getAllEventsWithSignupCount();
    return Response.json({ data });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to fetch events';
    return Response.json({ error }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const result = createEventSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const input = result.data;

    // If publishing, validate required publish fields
    if (input.isPublished) {
      const missing = validateForPublish(input);
      if (missing.length > 0) {
        return Response.json(
          { error: `Cannot publish: missing required fields: ${missing.join(', ')}` },
          { status: 400 },
        );
      }
    }

    const event = await createEvent({
      title: input.title,
      description: input.description ?? '',
      date: buildTimestamp(input.date, input.startTime),
      location: input.location,
      zoomUrl: input.zoomUrl || null,
      imageUrl: input.imageUrl || null,
      imageKey: input.imageKey || null,
      volunteerSlots: input.volunteerSlots.length > 0 ? input.volunteerSlots : null,
      isPublished: input.isPublished,
    });

    return Response.json({ data: event }, { status: 201 });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to create event';
    return Response.json({ error }, { status: 500 });
  }
}
