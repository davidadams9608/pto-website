import { expect, test } from '@playwright/test';

import { clerkSetup, hasClerkSecret, setupAdminPage } from './helpers/auth';

test.describe('Admin: create event', () => {
  test.skip(!hasClerkSecret, 'CLERK_SECRET_KEY required for admin tests');

  test.beforeAll(async () => {
    await clerkSetup();
  });

  test.beforeEach(async ({ page }) => {
    await setupAdminPage(page);
  });

  test('creates a new event and saves as draft', async ({ page }) => {
    await page.goto('/admin/events');
    await expect(page.getByText('Events')).toBeVisible();
    await page.getByRole('link', { name: /create event/i }).click();
    await expect(page).toHaveURL('**/admin/events/new');

    const testTitle = `E2E Test Event ${Date.now()}`;
    await page.getByLabel('Event Title').fill(testTitle);
    await page.getByLabel('Date').fill('2026-12-25');
    await page.getByLabel('Start Time').fill('18:00');
    await page.getByLabel('Location').fill('E2E Test Location');

    await page.getByRole('button', { name: /^create$/i }).click();

    // Redirects back to events list with success banner
    await page.waitForURL('**/admin/events', { timeout: 10_000 });
    await expect(page.getByText(testTitle)).toBeVisible({ timeout: 10_000 });
  });
});
