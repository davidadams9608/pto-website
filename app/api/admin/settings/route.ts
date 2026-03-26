import { auth } from '@clerk/nextjs/server';

import { getPublicSettings, updateSettings } from '@/lib/db/queries/settings';
import { updateSettingsSchema } from '@/lib/validators/settings';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const settings = await getPublicSettings();
    const data: Record<string, string> = {};
    for (const s of settings) {
      data[s.key] = s.value;
    }
    return Response.json({ data });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to fetch settings';
    return Response.json({ error }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const result = updateSettingsSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    await updateSettings(result.data.settings, userId);
    return Response.json({ data: { success: true } });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to update settings';
    return Response.json({ error }, { status: 500 });
  }
}
