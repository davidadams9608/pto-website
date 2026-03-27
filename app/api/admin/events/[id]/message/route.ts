import { auth, currentUser } from '@clerk/nextjs/server';

import { getEventByIdAdmin, getVolunteersByIds } from '@/lib/db/queries/events';
import { getEmailProvider } from '@/lib/email';
import { adminToVolunteersTemplate } from '@/lib/email/templates/admin-to-volunteers';
import { sendMessageSchema } from '@/lib/validators/messages';
import { isValidUUID } from '@/lib/validators/uuid';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isValidUUID(id)) return Response.json({ error: 'Invalid ID format' }, { status: 400 });

  try {
    const event = await getEventByIdAdmin(id);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    const body = await request.json();
    const result = sendMessageSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { recipientIds, subject, body: messageBody, ccAdmin } = result.data;

    // Look up volunteer email addresses
    const volunteers = await getVolunteersByIds(recipientIds);
    const recipientEmails = volunteers.map((v) => v.email);

    if (recipientEmails.length === 0) {
      return Response.json({ error: 'No valid recipients found' }, { status: 400 });
    }

    // Get admin email for reply-to and CC
    const user = await currentUser();
    const adminEmail = user?.emailAddresses?.[0]?.emailAddress;

    const emailProvider = getEmailProvider();
    const emailResult = await emailProvider.sendEmail({
      to: recipientEmails,
      subject,
      html: adminToVolunteersTemplate({
        body: messageBody,
        eventTitle: event.title,
      }),
      replyTo: adminEmail,
    });

    if (!emailResult.success) {
      return Response.json(
        { error: 'Failed to send message. Please try again.' },
        { status: 500 },
      );
    }

    // CC admin separately if requested
    if (ccAdmin && adminEmail) {
      await emailProvider.sendEmail({
        to: adminEmail,
        subject: `[CC] ${subject}`,
        html: adminToVolunteersTemplate({
          body: messageBody,
          eventTitle: event.title,
        }),
      });
    }

    return Response.json({
      data: {
        success: true,
        message: `Message sent to ${recipientEmails.length} volunteer${recipientEmails.length !== 1 ? 's' : ''}`,
        recipientCount: recipientEmails.length,
      },
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to send message';
    return Response.json({ error }, { status: 500 });
  }
}
