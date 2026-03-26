import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMock = vi.fn();

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import { ResendAdapter } from '@/lib/email/resend';

describe('ResendAdapter', () => {
  beforeEach(() => {
    sendMock.mockReset();
  });

  it('returns success when Resend API succeeds', async () => {
    sendMock.mockResolvedValueOnce({ data: { id: 'email-123' }, error: null });

    const adapter = new ResendAdapter('test-api-key');
    const result = await adapter.sendEmail({
      to: 'user@example.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
    });

    expect(result).toEqual({ success: true });
    expect(sendMock).toHaveBeenCalledOnce();
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
      to: ['user@example.com'],
      subject: 'Test Subject',
      html: '<p>Hello</p>',
    }));
  });

  it('accepts array of recipients', async () => {
    sendMock.mockResolvedValueOnce({ data: { id: 'email-456' }, error: null });

    const adapter = new ResendAdapter('test-key');
    await adapter.sendEmail({
      to: ['a@example.com', 'b@example.com'],
      subject: 'Test',
      html: '<p>Hi</p>',
    });

    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
      to: ['a@example.com', 'b@example.com'],
    }));
  });

  it('passes replyTo when provided', async () => {
    sendMock.mockResolvedValueOnce({ data: { id: 'email-789' }, error: null });

    const adapter = new ResendAdapter('test-key');
    await adapter.sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
      replyTo: 'admin@westmontpto.org',
    });

    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
      replyTo: 'admin@westmontpto.org',
    }));
  });

  it('returns error when Resend API returns error', async () => {
    sendMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid API key', name: 'validation_error' },
    });

    const adapter = new ResendAdapter('bad-key');
    const result = await adapter.sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid API key');
  });

  it('returns error when Resend SDK throws', async () => {
    sendMock.mockRejectedValueOnce(new Error('Network failure'));

    const adapter = new ResendAdapter('test-key');
    const result = await adapter.sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network failure');
  });

  it('returns error when API key is not configured', async () => {
    const adapter = new ResendAdapter('');
    const result = await adapter.sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Hi</p>',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Email provider is not configured');
    expect(sendMock).not.toHaveBeenCalled();
  });
});
