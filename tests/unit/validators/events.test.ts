import { describe, expect, it } from 'vitest';

import { createEventSchema, updateEventSchema, validateForPublish } from '@/lib/validators/events';

const validPayload = {
  title: 'Spring Family Picnic',
  date: '2026-05-16',
  startTime: '11:00',
  location: 'School Field',
};

describe('createEventSchema', () => {
  it('passes with valid required fields', () => {
    const result = createEventSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('passes with all optional fields', () => {
    const result = createEventSchema.safeParse({
      ...validPayload,
      description: 'A fun event',
      endTime: '14:00',
      zoomUrl: 'https://zoom.us/j/123',
      imageUrl: 'https://example.com/img.jpg',
      imageKey: 'events/abc.jpg',
      volunteerSlots: [{ role: 'Setup', count: 4 }],
      isPublished: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing title', () => {
    const result = createEventSchema.safeParse({ ...validPayload, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing date', () => {
    const result = createEventSchema.safeParse({ ...validPayload, date: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing startTime', () => {
    const result = createEventSchema.safeParse({ ...validPayload, startTime: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing location', () => {
    const result = createEventSchema.safeParse({ ...validPayload, location: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid startTime format', () => {
    const result = createEventSchema.safeParse({ ...validPayload, startTime: '3pm' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid zoomUrl', () => {
    const result = createEventSchema.safeParse({ ...validPayload, zoomUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('allows empty string zoomUrl', () => {
    const result = createEventSchema.safeParse({ ...validPayload, zoomUrl: '' });
    expect(result.success).toBe(true);
  });

  it('validates volunteer slot shape', () => {
    const result = createEventSchema.safeParse({
      ...validPayload,
      volunteerSlots: [{ role: '', count: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('validates volunteer slot with valid data', () => {
    const result = createEventSchema.safeParse({
      ...validPayload,
      volunteerSlots: [
        { role: 'Setup', count: 4 },
        { role: 'Cleanup', count: 3 },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.volunteerSlots).toHaveLength(2);
    }
  });

  it('defaults slot type to shift', () => {
    const result = createEventSchema.safeParse({
      ...validPayload,
      volunteerSlots: [{ role: 'Setup', count: 4 }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.volunteerSlots![0].type).toBe('shift');
    }
  });

  it('accepts slot type supply', () => {
    const result = createEventSchema.safeParse({
      ...validPayload,
      volunteerSlots: [{ role: 'Paper Towels', count: 8, type: 'supply' }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.volunteerSlots![0].type).toBe('supply');
    }
  });

  it('rejects invalid slot type', () => {
    const result = createEventSchema.safeParse({
      ...validPayload,
      volunteerSlots: [{ role: 'Setup', count: 4, type: 'invalid' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts mixed shift and supply slots', () => {
    const result = createEventSchema.safeParse({
      ...validPayload,
      volunteerSlots: [
        { role: 'Setup', count: 4, type: 'shift' },
        { role: 'Cookies', count: 6, type: 'supply' },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.volunteerSlots![0].type).toBe('shift');
      expect(result.data.volunteerSlots![1].type).toBe('supply');
    }
  });

  it('defaults isPublished to false', () => {
    const result = createEventSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublished).toBe(false);
    }
  });

  it('defaults volunteerSlots to empty array', () => {
    const result = createEventSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.volunteerSlots).toEqual([]);
    }
  });
});

describe('updateEventSchema', () => {
  it('passes with partial data', () => {
    const result = updateEventSchema.safeParse({ title: 'New Title' });
    expect(result.success).toBe(true);
  });

  it('passes with empty object', () => {
    const result = updateEventSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('validateForPublish', () => {
  it('returns empty array for complete event', () => {
    const missing = validateForPublish(validPayload);
    expect(missing).toEqual([]);
  });

  it('returns missing fields for incomplete event', () => {
    const missing = validateForPublish({ title: 'Test' });
    expect(missing).toContain('date');
    expect(missing).toContain('location');
    expect(missing).toContain('startTime');
    expect(missing).not.toContain('title');
  });

  it('catches empty strings as missing', () => {
    const missing = validateForPublish({
      title: '',
      date: '2026-05-16',
      startTime: '11:00',
      location: '',
    });
    expect(missing).toContain('title');
    expect(missing).toContain('location');
    expect(missing).toHaveLength(2);
  });

  it('returns all four fields when object is empty', () => {
    const missing = validateForPublish({});
    expect(missing).toEqual(['title', 'date', 'location', 'startTime']);
  });
});
