import {
  createVolunteerSignups,
  getEventById,
  getSignupCountsByRole,
  getSignupsByEmail,
} from '@/lib/db/queries/events';
import { getSetting } from '@/lib/db/queries/settings';
import { getEmailProvider } from '@/lib/email';
import { volunteerConfirmationTemplate } from '@/lib/email/templates/volunteer-confirmation';
import { volunteerSignupRateLimit } from '@/lib/rate-limit';
import { buildGoogleCalendarUrl } from '@/lib/utils/calendar';
import { isValidUUID } from '@/lib/validators/uuid';
import { SITE_TIMEZONE } from '@/lib/site-config';
import { volunteerSignupSchema } from '@/lib/validators/volunteer-signup';

interface RouteContext {
  params: Promise<{ id: string }>;
}

type VolunteerSlot = { role: string; count: number; type?: 'shift' | 'supply' };

function hasVolunteerSlots(slots: unknown): boolean {
  return Array.isArray(slots) && (slots as VolunteerSlot[]).length > 0;
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const body = await request.json();

    // 1. Honeypot check — silently accept to not tip off bots
    if (body.honeypot) {
      return Response.json({ data: { success: true, message: 'Signup confirmed' } }, { status: 201 });
    }

    // 2. Zod validation
    const result = volunteerSignupSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    // 3. Rate limiting by IP
    if (volunteerSignupRateLimit) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? request.headers.get('x-real-ip')
        ?? 'unknown';
      const { success } = await volunteerSignupRateLimit.limit(ip);
      if (!success) {
        return Response.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 },
        );
      }
    }

    const { id: eventId } = await params;
    if (!isValidUUID(eventId)) {
      return Response.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    const { name, email, phone, roles, notes } = result.data;

    // 4. Event existence + published check
    const event = await getEventById(eventId);
    if (!event) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    // 5. Volunteer signup enabled check
    const slots = event.volunteerSlots as VolunteerSlot[];
    if (!hasVolunteerSlots(slots)) {
      return Response.json(
        { error: 'Volunteer signup is not enabled for this event' },
        { status: 400 },
      );
    }

    // 6. Duplicate check — one signup per email per event
    const existingSignups = await getSignupsByEmail(eventId, email);
    if (existingSignups.length > 0) {
      return Response.json(
        { error: "You've already signed up for this event" },
        { status: 409 },
      );
    }

    // 7. Per-role capacity check
    const roleCounts = await getSignupCountsByRole(eventId);
    const countMap = new Map(roleCounts.map((r) => [r.role, r.count]));
    for (const { role, quantity } of roles) {
      const slot = slots.find((s) => s.role === role);
      if (!slot) {
        return Response.json(
          { error: `Invalid role: ${role}` },
          { status: 400 },
        );
      }
      const filled = countMap.get(role) ?? 0;
      const remaining = slot.count - filled;
      if (quantity > remaining) {
        return Response.json(
          { error: `"${role}" is full or does not have enough spots remaining` },
          { status: 409 },
        );
      }
    }

    // 8. Insert all roles in one transaction
    await createVolunteerSignups({ eventId, name, email, phone, notes, roles });

    // 9. Send confirmation email — best-effort, don't fail signup if email fails
    try {
      const eventDate = new Date(event.date);
      const eventEnd = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // default 2h duration
      const contactEmail = await getSetting('contact_email');
      const emailProvider = getEmailProvider();
      const roleDescription = roles.map((r) => r.role).join(', ');
      const googleCalendarUrl = buildGoogleCalendarUrl({
        title: event.title,
        start: eventDate,
        end: eventEnd,
        location: event.location,
        description: `Volunteering for: ${roleDescription}`,
      });
      const slotTypes = new Map(
        slots.map((s) => [s.role, s.type ?? 'shift'] as const),
      );
      const emailResult = await emailProvider.sendEmail({
        to: email,
        subject: `Volunteer Confirmation: ${event.title}`,
        replyTo: contactEmail || undefined,
        html: volunteerConfirmationTemplate({
          volunteerName: name,
          eventTitle: event.title,
          eventDate: eventDate.toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: SITE_TIMEZONE,
          }),
          eventTime: eventDate.toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: true, timeZone: SITE_TIMEZONE,
          }),
          eventLocation: event.location,
          roles: roles.map((r) => ({
            role: r.role,
            quantity: r.quantity,
            type: slotTypes.get(r.role) ?? 'shift',
          })),
          notes: notes || undefined,
          googleCalendarUrl,
        }),
      });
      if (!emailResult.success) {
        console.error('[Volunteer Signup] Email failed:', emailResult.error); // eslint-disable-line no-console
      }
    } catch (err) {
      // Email is best-effort — signup already saved
      console.error('[Volunteer Signup] Email error:', err); // eslint-disable-line no-console
    }

    // 10. Return success
    return Response.json(
      { data: { success: true, message: 'Signup confirmed' } },
      { status: 201 },
    );
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to process signup';
    return Response.json({ error }, { status: 500 });
  }
}
