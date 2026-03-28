import { describe, expect, it } from 'vitest';

import { adminUpdateSignupSchema, volunteerSignupSchema } from '@/lib/validators/volunteer-signup';

const validPayload = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '(555) 123-4567',
  roles: [{ role: 'Setup', quantity: 1 }],
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

  it('rejects empty roles array', () => {
    const result = volunteerSignupSchema.safeParse({ ...validPayload, roles: [] });
    expect(result.success).toBe(false);
  });

  it('rejects role with empty name', () => {
    const result = volunteerSignupSchema.safeParse({ ...validPayload, roles: [{ role: '', quantity: 1 }] });
    expect(result.success).toBe(false);
  });

  it('accepts multiple roles', () => {
    const result = volunteerSignupSchema.safeParse({
      ...validPayload,
      roles: [
        { role: 'Setup', quantity: 1 },
        { role: 'Cookies', quantity: 3 },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.roles).toHaveLength(2);
      expect(result.data.roles[1].quantity).toBe(3);
    }
  });

  it('defaults quantity to 1 when omitted', () => {
    const result = volunteerSignupSchema.safeParse({
      ...validPayload,
      roles: [{ role: 'Setup' }],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.roles[0].quantity).toBe(1);
  });

  it('rejects quantity of 0', () => {
    const result = volunteerSignupSchema.safeParse({
      ...validPayload,
      roles: [{ role: 'Setup', quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts notes up to 500 characters', () => {
    const result = volunteerSignupSchema.safeParse({ ...validPayload, notes: 'Some notes here' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.notes).toBe('Some notes here');
  });

  it('rejects notes over 500 characters', () => {
    const result = volunteerSignupSchema.safeParse({ ...validPayload, notes: 'x'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('defaults notes to empty string when omitted', () => {
    const result = volunteerSignupSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.notes).toBe('');
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

describe('adminUpdateSignupSchema', () => {
  it('passes with valid payload', () => {
    const result = adminUpdateSignupSchema.safeParse({
      name: 'Jane Smith',
      email: 'jane@example.com',
      roles: [{ role: 'Setup', quantity: 1 }],
    });
    expect(result.success).toBe(true);
  });

  it('allows empty phone (optional for admin edits)', () => {
    const result = adminUpdateSignupSchema.safeParse({
      name: 'Jane',
      email: 'jane@example.com',
      phone: '',
      roles: [{ role: 'Setup', quantity: 1 }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty roles', () => {
    const result = adminUpdateSignupSchema.safeParse({
      name: 'Jane',
      email: 'jane@example.com',
      roles: [],
    });
    expect(result.success).toBe(false);
  });
});
