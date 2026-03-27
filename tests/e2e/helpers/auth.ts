import { type Page } from '@playwright/test';
import { clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright';

export { clerkSetup, setupClerkTestingToken };

/**
 * Set up authenticated admin session for e2e tests.
 *
 * Uses Clerk's testing token approach — requires:
 * - CLERK_SECRET_KEY in .env.local
 * - Testing mode enabled in Clerk Dashboard (Configure → Testing)
 *
 * No email/password needed. The testing token bypasses the sign-in UI
 * and creates a valid session for the first user in the Clerk instance.
 */
export async function setupAdminPage(page: Page) {
  await setupClerkTestingToken({ page });
}

export const hasClerkSecret = !!process.env.CLERK_SECRET_KEY;
