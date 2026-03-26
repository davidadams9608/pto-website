import { Resend } from 'resend';

import type { EmailProvider, SendEmailOptions, SendEmailResult } from './types';

const DEFAULT_FROM = 'Westmont PTO <noreply@westmontpto.org>';

export class ResendAdapter implements EmailProvider {
  private client: Resend | null;
  private from: string;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.RESEND_API_KEY ?? '';
    this.client = key ? new Resend(key) : null;
    this.from = process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM;
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.client) {
      return { success: false, error: 'Email provider is not configured' };
    }

    try {
      const { error } = await this.client.emails.send({
        from: this.from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        replyTo: options.replyTo,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send email';
      return { success: false, error: message };
    }
  }
}
