import { auth } from '@clerk/nextjs/server';

import { createNewsletter } from '@/lib/db/queries/newsletters';
import { createNewsletterSchema } from '@/lib/validators/newsletters';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const result = createNewsletterSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const input = result.data;
    const newsletter = await createNewsletter({
      title: input.title,
      pdfUrl: input.fileUrl,
      fileKey: input.fileKey,
      publishedAt: new Date(input.publishedAt),
    });

    return Response.json({ data: newsletter }, { status: 201 });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to create newsletter';
    return Response.json({ error }, { status: 500 });
  }
}
