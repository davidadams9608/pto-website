import { describe, expect, it } from 'vitest';

import { updateSettingsSchema } from '@/lib/validators/settings';

describe('updateSettingsSchema', () => {
  it('passes with valid settings array', () => {
    const result = updateSettingsSchema.safeParse({
      settings: [{ key: 'school_name', value: 'Test School' }],
    });
    expect(result.success).toBe(true);
  });

  it('passes with multiple settings', () => {
    const result = updateSettingsSchema.safeParse({
      settings: [
        { key: 'school_name', value: 'Test' },
        { key: 'contact_email', value: 'test@example.com' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('allows empty string values', () => {
    const result = updateSettingsSchema.safeParse({
      settings: [{ key: 'hero_image_url', value: '' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty settings array', () => {
    expect(updateSettingsSchema.safeParse({ settings: [] }).success).toBe(false);
  });

  it('rejects missing settings field', () => {
    expect(updateSettingsSchema.safeParse({}).success).toBe(false);
  });

  it('rejects empty key', () => {
    expect(updateSettingsSchema.safeParse({ settings: [{ key: '', value: 'x' }] }).success).toBe(false);
  });
});
