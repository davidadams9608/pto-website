import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MailerLiteAdapter } from '@/lib/newsletter/mailerlite';

describe('MailerLiteAdapter', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as typeof globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns success when API responds 200', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { id: '123' } }), { status: 200 }),
    );

    const adapter = new MailerLiteAdapter('test-api-key', 'test-group-id');
    const result = await adapter.subscribe('user@example.com');

    expect(result).toEqual({ success: true });
    expect(fetchSpy).toHaveBeenCalledOnce();

    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://connect.mailerlite.com/api/subscribers');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer test-api-key');

    const body = JSON.parse(options.body);
    expect(body.email).toBe('user@example.com');
    expect(body.groups).toEqual(['test-group-id']);
  });

  it('returns success when API responds 201', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { id: '456' } }), { status: 201 }),
    );

    const adapter = new MailerLiteAdapter('key', 'group');
    const result = await adapter.subscribe('new@example.com');

    expect(result).toEqual({ success: true });
  });

  it('returns error with message when API returns 422', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Invalid email address' }), { status: 422 }),
    );

    const adapter = new MailerLiteAdapter('key', 'group');
    const result = await adapter.subscribe('bad-email');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email address');
  });

  it('returns generic error when API returns non-JSON error', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response('Internal Server Error', { status: 500 }),
    );

    const adapter = new MailerLiteAdapter('key', 'group');
    const result = await adapter.subscribe('user@example.com');

    expect(result.success).toBe(false);
    expect(result.error).toContain('500');
  });

  it('returns error when fetch throws (network failure)', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network error'));

    const adapter = new MailerLiteAdapter('key', 'group');
    const result = await adapter.subscribe('user@example.com');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('returns error when API key is not configured', async () => {
    const adapter = new MailerLiteAdapter('', 'group');
    const result = await adapter.subscribe('user@example.com');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Newsletter provider is not configured');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns error when group ID is not configured', async () => {
    const adapter = new MailerLiteAdapter('key', '');
    const result = await adapter.subscribe('user@example.com');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Newsletter provider is not configured');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
