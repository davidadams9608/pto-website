import { auth } from '@clerk/nextjs/server';

import { updateSetting } from '@/lib/db/queries';
import { updateAboutTextSchema } from '@/lib/validators/officers';

export async function PUT(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const result = updateAboutTextSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    await updateSetting('about_text', result.data.value);
    return Response.json({ data: { success: true } });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to update about text';
    return Response.json({ error }, { status: 500 });
  }
}
