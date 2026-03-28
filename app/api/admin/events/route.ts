import { auth } from '@clerk/nextjs/server';

import { createEvent, getAllEventsWithSignupCount, getSignupQuantitiesByEventAndRole } from '@/lib/db/queries/events';
import { computeRetentionStatus } from '@/lib/utils/retention';
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
    const [rows, roleQuantities] = await Promise.all([
      getAllEventsWithSignupCount(),
      getSignupQuantitiesByEventAndRole(),
    ]);

    // Build lookup: eventId → Map<role, filledQty>
    const roleMap = new Map<string, Map<string, number>>();
    for (const rq of roleQuantities) {
      if (!roleMap.has(rq.eventId)) roleMap.set(rq.eventId, new Map());
      roleMap.get(rq.eventId)!.set(rq.role, rq.total);
    }

    type Slot = { role: string; count: number; type?: 'shift' | 'supply' };
    const now = new Date();
    const data = rows.map((row) => {
      const { retentionExpired, daysSinceEvent } = computeRetentionStatus(row.date, row.signupCount, now);
      const slots = (Array.isArray(row.volunteerSlots) ? row.volunteerSlots : []) as Slot[];
      const filledByRole = roleMap.get(row.id) ?? new Map<string, number>();

      let shiftFilled = 0, shiftTotal = 0, supplyFilled = 0, supplyTotal = 0;
      for (const s of slots) {
        const filled = filledByRole.get(s.role) ?? 0;
        if (s.type === 'supply') {
          supplyFilled += filled;
          supplyTotal += s.count;
        } else {
          shiftFilled += filled;
          shiftTotal += s.count;
        }
      }

      return { ...row, retentionExpired, daysSinceEvent, shiftFilled, shiftTotal, supplyFilled, supplyTotal };
    });
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
