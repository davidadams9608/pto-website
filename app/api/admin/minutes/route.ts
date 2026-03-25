import { auth } from '@clerk/nextjs/server';

import { createMinute } from '@/lib/db/queries/minutes';
import { createMinutesSchema } from '@/lib/validators/minutes';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const result = createMinutesSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const input = result.data;
    const minute = await createMinute({
      title: input.title,
      meetingDate: input.meetingDate,
      fileUrl: input.fileUrl,
      fileKey: input.fileKey,
    });

    return Response.json({ data: minute }, { status: 201 });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to create meeting minutes';
    return Response.json({ error }, { status: 500 });
  }
}
