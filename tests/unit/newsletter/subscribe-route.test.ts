// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the newsletter provider
vi.mock('@/lib/newsletter', () => ({
  getNewsletterProvider: vi.fn(),
}));

// Mock rate limiter as disabled
vi.mock('@/lib/rate-limit', () => ({
  newsletterRateLimit: null,
}));

import { getNewsletterProvider } from '@/lib/newsletter';

const mockGetProvider = vi.mocked(getNewsletterProvider);

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/newsletter/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/newsletter/subscribe', () => {
  let POST: (request: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const route = await import('@/app/api/newsletter/subscribe/route');
    POST = route.POST;
  });

  it('returns 200 on successful subscription', async () => {
    mockGetProvider.mockReturnValue({
      subscribe: vi.fn().mockResolvedValue({ success: true }),
    });

    const res = await POST(makeRequest({ email: 'test@example.com' }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.success).toBe(true);
  });

  it('calls provider with the submitted email', async () => {
    const subscribeMock = vi.fn().mockResolvedValue({ success: true });
    mockGetProvider.mockReturnValue({ subscribe: subscribeMock });

    await POST(makeRequest({ email: 'hello@world.com' }));

    expect(subscribeMock).toHaveBeenCalledWith('hello@world.com');
  });

  it('returns 400 for invalid email', async () => {
    const res = await POST(makeRequest({ email: 'not-an-email' }));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('returns 400 for missing email', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty email', async () => {
    const res = await POST(makeRequest({ email: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 500 when provider returns error', async () => {
    mockGetProvider.mockReturnValue({
      subscribe: vi.fn().mockResolvedValue({ success: false, error: 'Provider failed' }),
    });

    const res = await POST(makeRequest({ email: 'test@example.com' }));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe('Provider failed');
  });
});

describe('POST /api/newsletter/subscribe (rate limited)', () => {
  it('returns 429 when rate limit is exceeded', async () => {
    // Reset modules to apply new mocks
    vi.resetModules();

    vi.doMock('@/lib/newsletter', () => ({
      getNewsletterProvider: vi.fn().mockReturnValue({
        subscribe: vi.fn().mockResolvedValue({ success: true }),
      }),
    }));

    vi.doMock('@/lib/rate-limit', () => ({
      newsletterRateLimit: {
        limit: vi.fn().mockResolvedValue({ success: false }),
      },
    }));

    const route = await import('@/app/api/newsletter/subscribe/route');

    const res = await route.POST(makeRequest({ email: 'test@example.com' }));
    expect(res.status).toBe(429);

    const body = await res.json();
    expect(body.error).toContain('Too many requests');
  });
});
