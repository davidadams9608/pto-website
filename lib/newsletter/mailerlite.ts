/**
 * MailerLite Newsletter Adapter
 *
 * Security review (2026-03-26, per Security vendor condition + Legal §3.4):
 * - API calls are server-side only — no MailerLite JS loaded on public site
 * - No cookies set by this integration (localStorage used for UX flag only)
 * - No CSP changes required (no external scripts or resources loaded client-side)
 * - No cookie notice required
 * - API key and group ID stored in env vars, never exposed to client
 * - Client component (newsletter-signup.tsx) calls internal API route only
 */
import type { NewsletterProvider, SubscribeResult } from './types';

export class MailerLiteAdapter implements NewsletterProvider {
  private apiKey: string;
  private groupId: string;

  constructor(apiKey?: string, groupId?: string) {
    this.apiKey = apiKey ?? process.env.MAILERLITE_API_KEY ?? '';
    this.groupId = groupId ?? process.env.MAILERLITE_GROUP_ID ?? '';
  }

  async subscribe(email: string): Promise<SubscribeResult> {
    if (!this.apiKey || !this.groupId) {
      return { success: false, error: 'Newsletter provider is not configured' };
    }

    try {
      const res = await fetch(
        `https://connect.mailerlite.com/api/subscribers`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            email,
            groups: [this.groupId],
          }),
        },
      );

      if (res.ok || res.status === 200 || res.status === 201) {
        return { success: true };
      }

      const body = await res.json().catch(() => null);
      const message = body?.message ?? `MailerLite API error (${res.status})`;
      return { success: false, error: message };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe';
      return { success: false, error: message };
    }
  }
}
