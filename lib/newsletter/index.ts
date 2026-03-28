import type { NewsletterProvider } from './types';
import { MailerLiteAdapter } from './mailerlite';

export function getNewsletterProvider(): NewsletterProvider {
  return new MailerLiteAdapter();
}

export type { NewsletterProvider, SubscribeResult } from './types';

/**
 * Returns a subscriber message based on count thresholds.
 * Below 50: no number shown. At milestones: "50+", "100+", "150+", "250+", "500+".
 */
export function formatSubscriberMessage(count: number): string {
  const thresholds = [500, 250, 150, 100, 50];
  for (const t of thresholds) {
    if (count >= t) return `Join ${t}+ Westmont families`;
  }
  return 'Join our growing community of Westmont families';
}

/** Returns a short label for the stat card, e.g. "150+" or null if below threshold. */
export function formatSubscriberBadge(count: number): string | null {
  const thresholds = [500, 250, 150, 100, 50];
  for (const t of thresholds) {
    if (count >= t) return `${t}+`;
  }
  return null;
}
