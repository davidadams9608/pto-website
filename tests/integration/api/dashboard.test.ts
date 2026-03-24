// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';

const hasDb = !!process.env.DATABASE_URL;

describe.skipIf(!hasDb)('Dashboard aggregate queries', () => {
  let getUpcomingEventCount: () => Promise<number>;
  let getVolunteerCountForUpcomingEvents: () => Promise<number>;
  let getNewsletterCount: () => Promise<number>;
  let getMinutesCount: () => Promise<number>;
  let getActiveSponsorCount: () => Promise<number>;
  let getRecentEvents: (limit: number) => Promise<unknown[]>;
  let getRecentNewsletters: (limit: number) => Promise<unknown[]>;

  beforeAll(async () => {
    ({ getUpcomingEventCount, getVolunteerCountForUpcomingEvents, getRecentEvents } =
      await import('@/lib/db/queries/events'));
    ({ getNewsletterCount, getRecentNewsletters } =
      await import('@/lib/db/queries/newsletters'));
    ({ getMinutesCount } = await import('@/lib/db/queries/minutes'));
    ({ getActiveSponsorCount } = await import('@/lib/db/queries/sponsors'));
  });

  it('getUpcomingEventCount returns a number', async () => {
    const count = await getUpcomingEventCount();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('getVolunteerCountForUpcomingEvents returns a number', async () => {
    const count = await getVolunteerCountForUpcomingEvents();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('getNewsletterCount returns a number', async () => {
    const count = await getNewsletterCount();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('getMinutesCount returns a number', async () => {
    const count = await getMinutesCount();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('getActiveSponsorCount returns a number', async () => {
    const count = await getActiveSponsorCount();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('getRecentEvents returns an array limited by parameter', async () => {
    const events = await getRecentEvents(3);
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeLessThanOrEqual(3);
  });

  it('getRecentNewsletters returns an array limited by parameter', async () => {
    const newsletters = await getRecentNewsletters(2);
    expect(Array.isArray(newsletters)).toBe(true);
    expect(newsletters.length).toBeLessThanOrEqual(2);
  });
});
