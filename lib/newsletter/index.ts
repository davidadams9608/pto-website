import type { NewsletterProvider } from './types';
import { MailerLiteAdapter } from './mailerlite';

export function getNewsletterProvider(): NewsletterProvider {
  return new MailerLiteAdapter();
}

export type { NewsletterProvider, SubscribeResult } from './types';
