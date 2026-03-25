import { describe, expect, it } from 'vitest';

import { computeRetentionStatus } from '@/lib/utils/retention';

describe('computeRetentionStatus', () => {
  const now = new Date('2026-03-24T12:00:00Z');

  it('returns expired=true when event is >90 days ago with signups', () => {
    const eventDate = new Date('2025-12-01T12:00:00Z'); // 113 days ago
    const result = computeRetentionStatus(eventDate, 3, now);
    expect(result.retentionExpired).toBe(true);
    expect(result.daysSinceEvent).toBe(113);
  });

  it('returns expired=false when event is >90 days ago with zero signups', () => {
    const eventDate = new Date('2025-12-01T12:00:00Z'); // 113 days ago
    const result = computeRetentionStatus(eventDate, 0, now);
    expect(result.retentionExpired).toBe(false);
    expect(result.daysSinceEvent).toBe(113);
  });

  it('returns expired=false when event is <90 days ago with signups', () => {
    const eventDate = new Date('2026-02-01T12:00:00Z'); // 51 days ago
    const result = computeRetentionStatus(eventDate, 5, now);
    expect(result.retentionExpired).toBe(false);
    expect(result.daysSinceEvent).toBe(51);
  });

  it('returns expired=false when event is exactly 90 days ago', () => {
    const eventDate = new Date('2025-12-24T12:00:00Z'); // exactly 90 days
    const result = computeRetentionStatus(eventDate, 2, now);
    expect(result.retentionExpired).toBe(false);
    expect(result.daysSinceEvent).toBe(90);
  });

  it('returns expired=true when event is 91 days ago with signups', () => {
    const eventDate = new Date('2025-12-23T12:00:00Z'); // 91 days
    const result = computeRetentionStatus(eventDate, 1, now);
    expect(result.retentionExpired).toBe(true);
    expect(result.daysSinceEvent).toBe(91);
  });

  it('returns daysSinceEvent=null for future events', () => {
    const eventDate = new Date('2026-04-15T12:00:00Z');
    const result = computeRetentionStatus(eventDate, 0, now);
    expect(result.retentionExpired).toBe(false);
    expect(result.daysSinceEvent).toBeNull();
  });

  it('returns daysSinceEvent=null for event happening today (same timestamp)', () => {
    const result = computeRetentionStatus(now, 0, now);
    expect(result.retentionExpired).toBe(false);
    expect(result.daysSinceEvent).toBeNull();
  });
});
