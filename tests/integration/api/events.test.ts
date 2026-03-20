// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { GET } from '@/app/api/events/route';

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('GET /api/events', () => {
  it('returns 200', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it('returns { data: [...] } shape', async () => {
    const response = await GET();
    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('only returns published events', async () => {
    const response = await GET();
    const body = await response.json();
    expect(body.data.every((e: { isPublished: boolean }) => e.isPublished === true)).toBe(true);
  });

  it('events are ordered by date ascending', async () => {
    const response = await GET();
    const body = await response.json();
    const dates = body.data.map((e: { date: string }) => new Date(e.date).getTime());
    expect(dates).toEqual([...dates].sort((a, b) => a - b));
  });
});
