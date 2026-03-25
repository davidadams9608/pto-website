import { auth } from '@clerk/nextjs/server';

import { getEventByIdAdmin } from '@/lib/db/queries/events';
import { sendMessageSchema } from '@/lib/validators/messages';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const event = await getEventByIdAdmin(id);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    const body = await request.json();
    const result = sendMessageSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { recipientIds, subject, body: messageBody, ccAdmin } = result.data;

    // Stub: log message details. Actual Resend integration is M7 scope.
    console.log('[Contact Volunteers] Stub — email not sent');
    console.log(`  Event: ${event.title} (${id})`);
    console.log(`  Recipients: ${recipientIds.length} volunteer(s)`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${messageBody.slice(0, 100)}${messageBody.length > 100 ? '...' : ''}`);
    console.log(`  CC Admin: ${ccAdmin}`);

    return Response.json({
      data: {
        success: true,
        message: 'Message queued (email integration pending)',
        recipientCount: recipientIds.length,
      },
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to send message';
    return Response.json({ error }, { status: 500 });
  }
}
