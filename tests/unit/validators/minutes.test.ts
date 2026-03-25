import { describe, expect, it } from 'vitest';

import { createMinutesSchema } from '@/lib/validators/minutes';

const validPayload = {
  title: 'March 2026 General Meeting',
  meetingDate: '2026-03-15',
  fileKey: 'minutes/abc123.pdf',
  fileUrl: 'https://example.com/minutes/abc123.pdf',
};

describe('createMinutesSchema', () => {
  it('passes with valid payload', () => {
    expect(createMinutesSchema.safeParse(validPayload).success).toBe(true);
  });

  it('rejects empty title', () => {
    expect(createMinutesSchema.safeParse({ ...validPayload, title: '' }).success).toBe(false);
  });

  it('rejects title over 200 characters', () => {
    expect(createMinutesSchema.safeParse({ ...validPayload, title: 'x'.repeat(201) }).success).toBe(false);
  });

  it('rejects empty meetingDate', () => {
    expect(createMinutesSchema.safeParse({ ...validPayload, meetingDate: '' }).success).toBe(false);
  });

  it('rejects invalid date format', () => {
    expect(createMinutesSchema.safeParse({ ...validPayload, meetingDate: 'not-a-date' }).success).toBe(false);
  });

  it('rejects empty fileKey', () => {
    expect(createMinutesSchema.safeParse({ ...validPayload, fileKey: '' }).success).toBe(false);
  });

  it('rejects invalid fileUrl', () => {
    expect(createMinutesSchema.safeParse({ ...validPayload, fileUrl: 'not-a-url' }).success).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(createMinutesSchema.safeParse({}).success).toBe(false);
  });
});
