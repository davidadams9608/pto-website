import { getNewsletterProvider } from '@/lib/newsletter';
import { newsletterRateLimit } from '@/lib/rate-limit';
import { subscribeSchema } from '@/lib/validators/newsletter';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = subscribeSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email } = result.data;

    // Rate limit by email
    if (newsletterRateLimit) {
      const { success } = await newsletterRateLimit.limit(email.toLowerCase());
      if (!success) {
        return Response.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 },
        );
      }
    }

    const provider = getNewsletterProvider();
    const subscribeResult = await provider.subscribe(email);

    if (!subscribeResult.success) {
      return Response.json(
        { error: subscribeResult.error ?? 'Failed to subscribe' },
        { status: 500 },
      );
    }

    return Response.json({ data: { success: true } });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to subscribe';
    return Response.json({ error }, { status: 500 });
  }
}
