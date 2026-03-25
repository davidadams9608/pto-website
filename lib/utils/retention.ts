/** Volunteer data retention computation (90-day policy). */

const RETENTION_DAYS = 90;

interface RetentionStatus {
  /** True if event is >90 days past AND has at least one volunteer signup. */
  retentionExpired: boolean;
  /** Days since the event date, or null if the event is in the future. */
  daysSinceEvent: number | null;
}

/**
 * Compute volunteer data retention status for an event.
 *
 * @param eventDate - The event date
 * @param signupCount - Number of volunteer signups for the event
 * @param now - Current date (injectable for testing)
 */
export function computeRetentionStatus(
  eventDate: Date,
  signupCount: number,
  now: Date = new Date(),
): RetentionStatus {
  const diffMs = now.getTime() - eventDate.getTime();
  const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (daysSince <= 0) {
    return { retentionExpired: false, daysSinceEvent: null };
  }

  return {
    retentionExpired: daysSince > RETENTION_DAYS && signupCount > 0,
    daysSinceEvent: daysSince,
  };
}
