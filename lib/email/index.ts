import type { EmailProvider } from './types';
import { ResendAdapter } from './resend';

export function getEmailProvider(): EmailProvider {
  return new ResendAdapter();
}

export type { EmailProvider, SendEmailOptions, SendEmailResult } from './types';
