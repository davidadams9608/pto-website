import { describe, expect, it } from 'vitest';

import { sendMessageSchema } from '@/lib/validators/messages';

const validPayload = {
  recipientIds: ['550e8400-e29b-41d4-a716-446655440000'],
  subject: 'Re: Spring Picnic',
  body: 'Please arrive 15 minutes early for setup.',
  ccAdmin: true,
};

describe('sendMessageSchema', () => {
  it('passes with valid payload', () => {
    const result = sendMessageSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('passes with multiple recipients', () => {
    const result = sendMessageSchema.safeParse({
      ...validPayload,
      recipientIds: [
        '550e8400-e29b-41d4-a716-446655440000',
        '660e8400-e29b-41d4-a716-446655440001',
        '770e8400-e29b-41d4-a716-446655440002',
      ],
    });
    expect(result.success).toBe(true);
  });

  it('defaults ccAdmin to true', () => {
    const { recipientIds, subject, body } = validPayload;
    const result = sendMessageSchema.safeParse({ recipientIds, subject, body });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ccAdmin).toBe(true);
    }
  });

  it('allows ccAdmin false', () => {
    const result = sendMessageSchema.safeParse({ ...validPayload, ccAdmin: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ccAdmin).toBe(false);
    }
  });

  it('rejects empty recipientIds', () => {
    const result = sendMessageSchema.safeParse({ ...validPayload, recipientIds: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('At least one recipient');
    }
  });

  it('rejects non-UUID recipient IDs', () => {
    const result = sendMessageSchema.safeParse({
      ...validPayload,
      recipientIds: ['not-a-uuid'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty subject', () => {
    const result = sendMessageSchema.safeParse({ ...validPayload, subject: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Subject is required');
    }
  });

  it('rejects subject over 200 characters', () => {
    const result = sendMessageSchema.safeParse({
      ...validPayload,
      subject: 'x'.repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty body', () => {
    const result = sendMessageSchema.safeParse({ ...validPayload, body: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Message body is required');
    }
  });

  it('rejects body over 5000 characters', () => {
    const result = sendMessageSchema.safeParse({
      ...validPayload,
      body: 'x'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing recipientIds field', () => {
    const result = sendMessageSchema.safeParse({ subject: validPayload.subject, body: validPayload.body, ccAdmin: true });
    expect(result.success).toBe(false);
  });

  it('rejects missing subject field', () => {
    const result = sendMessageSchema.safeParse({ recipientIds: validPayload.recipientIds, body: validPayload.body, ccAdmin: true });
    expect(result.success).toBe(false);
  });

  it('rejects missing body field', () => {
    const result = sendMessageSchema.safeParse({ recipientIds: validPayload.recipientIds, subject: validPayload.subject, ccAdmin: true });
    expect(result.success).toBe(false);
  });
});
