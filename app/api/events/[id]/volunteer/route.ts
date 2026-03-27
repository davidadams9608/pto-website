import {
  createVolunteerSignup,
  getEventById,
  getVolunteerSignupByEmail,
} from '@/lib/db/queries/events';
import { getSetting } from '@/lib/db/queries/settings';
import { getEmailProvider } from '@/lib/email';
import { volunteerConfirmationTemplate } from '@/lib/email/templates/volunteer-confirmation';
import { volunteerSignupRateLimit } from '@/lib/rate-limit';
import { isValidUUID } from '@/lib/validators/uuid';
import { SITE_TIMEZONE } from '@/lib/site-config';
import { volunteerSignupSchema } from '@/lib/validators/volunteer-signup';

interface RouteContext {
  params: Promise<{ id: string }>;
}

type VolunteerSlot = { role: string; count: number };

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
    const { name, email, phone, role } = result.data;

    // 4. Event existence + published check
    const event = await getEventById(eventId);
    if (!event) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    // 5. Volunteer signup enabled check
    if (!hasVolunteerSlots(event.volunteerSlots)) {
      return Response.json(
        { error: 'Volunteer signup is not enabled for this event' },
        { status: 400 },
      );
    }

    // 6. Duplicate check
    const existing = await getVolunteerSignupByEmail(eventId, email);
    if (existing) {
      return Response.json(
        { error: "You've already signed up for this event" },
        { status: 409 },
      );
    }

    // 7. Insert record
    await createVolunteerSignup({ eventId, name, email, phone, role });

    // 8. Send confirmation email — best-effort, don't fail signup if email fails
    try {
      const eventDate = new Date(event.date);
      const contactEmail = await getSetting('contact_email');
      const emailProvider = getEmailProvider();
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
          role,
        }),
      });
      if (!emailResult.success) {
        console.error('[Volunteer Signup] Email failed:', emailResult.error); // eslint-disable-line no-console
      }
    } catch (err) {
      // Email is best-effort — signup already saved
      console.error('[Volunteer Signup] Email error:', err); // eslint-disable-line no-console
    }

    // 9. Return success
    return Response.json(
      { data: { success: true, message: 'Signup confirmed' } },
      { status: 201 },
    );
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to process signup';
    return Response.json({ error }, { status: 500 });
  }
}
