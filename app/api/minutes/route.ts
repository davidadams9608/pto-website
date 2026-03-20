import { getMinutes } from '@/lib/db/queries';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));

    const result = await getMinutes(page, limit);
    const totalPages = Math.ceil(result.total / limit);

    return Response.json({
      data: result.items,
      meta: { page, limit, total: result.total, totalPages },
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to fetch minutes';
    return Response.json({ error }, { status: 500 });
  }
}
