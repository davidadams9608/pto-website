import { describe, expect, it } from 'vitest';

import { volunteerSignupSchema } from '@/lib/validators/volunteer-signup';

const validPayload = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '(555) 123-4567',
};

describe('volunteerSignupSchema', () => {
  it('passes with valid payload', () => {
    const result = volunteerSignupSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('trims the name', () => {
    const result = volunteerSignupSchema.safeParse({ ...validPayload, name: '  Jane Smith  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe('Jane Smith');
  });

  it('rejects empty name', () => {
    const result = volunteerSignupSchema.safeParse({ ...validPayload, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing name', () => {
    const { name: _, ...noName } = validPayload;
    const result = volunteerSignupSchema.safeParse(noName);
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = volunteerSignupSchema.safeParse({ ...validPayload, email: 'not-email' });
    expect(result.success).toBe(false);
  });

  it('rejects empty email', () => {
    const result = volunteerSignupSchema.safeParse({ ...validPayload, email: '' });
    expect(result.success).toBe(false);
  });

  it('accepts phone format: (555) 123-4567', () => {
    const result = volunteerSignupSchema.safeParse({ ...validPayload, phone: '(555) 123-4567' });
    expect(result.success).toBe(true);
  });

  it('accepts phone format: 555-123-4567', () => {
    const result = volunteerSignupSchema.safeParse({ ...validPayload, phone: '555-123-4567' });
    expect(result.success).toBe(true);
  });

  it('accepts phone format: 5551234567', () => {
    const result = volunteerSignupSchema.safeParse({ ...validPayload, phone: '5551234567' });
    expect(result.success).toBe(true);
  });

  it('accepts phone format: +1 555-123-4567', () => {
    const result = volunteerSignupSchema.safeParse({ ...validPayload, phone: '+1 555-123-4567' });
    expect(result.success).toBe(true);
  });

  it('accepts phone format: 555.123.4567', () => {
    const result = volunteerSignupSchema.safeParse({ ...validPayload, phone: '555.123.4567' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid phone', () => {
    const result = volunteerSignupSchema.safeParse({ ...validPayload, phone: '123' });
    expect(result.success).toBe(false);
  });

  it('rejects empty phone', () => {
    const result = volunteerSignupSchema.safeParse({ ...validPayload, phone: '' });
    expect(result.success).toBe(false);
  });

  it('passes when honeypot is empty string', () => {
    const result = volunteerSignupSchema.safeParse({ ...validPayload, honeypot: '' });
    expect(result.success).toBe(true);
  });

  it('passes when honeypot is omitted', () => {
    const result = volunteerSignupSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('passes parsing when honeypot has value (rejection handled by API)', () => {
    const result = volunteerSignupSchema.safeParse({ ...validPayload, honeypot: 'bot-value' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.honeypot).toBe('bot-value');
  });
});
