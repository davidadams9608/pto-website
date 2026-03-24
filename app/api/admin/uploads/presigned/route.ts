import { randomUUID } from 'crypto';

import { auth } from '@clerk/nextjs/server';

import { generatePresignedUploadUrl } from '@/lib/r2/presigned';
import { presignedUploadSchema } from '@/lib/validators/uploads';

function extFromFilename(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : 'bin';
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const result = presignedUploadSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { filename, contentType, type } = result.data;
    const ext = extFromFilename(filename);
    const fileKey = `${type}/${randomUUID()}.${ext}`;
    const presignedUrl = await generatePresignedUploadUrl(fileKey, contentType);
    const publicUrl = process.env.R2_PUBLIC_URL;
    const fileUrl = `${publicUrl}/${fileKey}`;

    return Response.json({ data: { presignedUrl, fileKey, fileUrl } });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to generate presigned URL';
    return Response.json({ error }, { status: 500 });
  }
}
