import { auth } from '@clerk/nextjs/server';

import { deleteSponsor, getSponsorById, updateSponsor } from '@/lib/db/queries/sponsors';
import { deleteObject } from '@/lib/r2/presigned';
import { updateSponsorSchema } from '@/lib/validators/sponsors';
import { isValidUUID } from '@/lib/validators/uuid';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isValidUUID(id)) return Response.json({ error: 'Invalid ID format' }, { status: 400 });

  try {
    const existing = await getSponsorById(id);
    if (!existing) return Response.json({ error: 'Sponsor not found' }, { status: 404 });

    const body = await request.json();
    const result = updateSponsorSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const input = result.data;

    // If logo changed, clean up old R2 object
    if (input.logoKey && input.logoKey !== existing.logoKey) {
      try {
        await deleteObject(existing.logoKey);
      } catch {
        console.error(`Failed to delete old R2 logo: ${existing.logoKey}`);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.websiteUrl !== undefined) updateData.websiteUrl = input.websiteUrl || null;
    if (input.logoKey !== undefined) updateData.logoKey = input.logoKey;
    if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const sponsor = await updateSponsor(id, updateData);
    return Response.json({ data: sponsor });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to update sponsor';
    return Response.json({ error }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isValidUUID(id)) return Response.json({ error: 'Invalid ID format' }, { status: 400 });

  try {
    const existing = await getSponsorById(id);
    if (!existing) return Response.json({ error: 'Sponsor not found' }, { status: 404 });

    if (existing.logoKey) {
      try {
        await deleteObject(existing.logoKey);
      } catch {
        console.error(`Failed to delete R2 logo: ${existing.logoKey}`);
      }
    }

    await deleteSponsor(id);
    return new Response(null, { status: 204 });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to delete sponsor';
    return Response.json({ error }, { status: 500 });
  }
}
