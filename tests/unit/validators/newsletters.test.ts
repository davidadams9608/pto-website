import { describe, expect, it } from 'vitest';

import { createNewsletterSchema } from '@/lib/validators/newsletters';

const validPayload = {
  title: 'March 2026 Newsletter',
  publishedAt: '2026-03-01',
  fileKey: 'newsletters/abc123.pdf',
  fileUrl: 'https://example.com/newsletters/abc123.pdf',
};

describe('createNewsletterSchema', () => {
  it('passes with valid payload', () => {
    const result = createNewsletterSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = createNewsletterSchema.safeParse({ ...validPayload, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects title over 200 characters', () => {
    const result = createNewsletterSchema.safeParse({ ...validPayload, title: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('rejects empty publishedAt', () => {
    const result = createNewsletterSchema.safeParse({ ...validPayload, publishedAt: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = createNewsletterSchema.safeParse({ ...validPayload, publishedAt: 'not-a-date' });
    expect(result.success).toBe(false);
  });

  it('rejects empty fileKey', () => {
    const result = createNewsletterSchema.safeParse({ ...validPayload, fileKey: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid fileUrl', () => {
    const result = createNewsletterSchema.safeParse({ ...validPayload, fileUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    const result = createNewsletterSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
