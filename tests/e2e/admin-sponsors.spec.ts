import path from 'path';

import { expect, test } from '@playwright/test';

import { clerkSetup, hasClerkSecret, setupAdminPage } from './helpers/auth';

test.describe('Admin: manage sponsors', () => {
  test.skip(!hasClerkSecret, 'CLERK_SECRET_KEY required for admin tests');

  test.beforeAll(async () => {
    await clerkSetup();
  });

  test.beforeEach(async ({ page }) => {
    await setupAdminPage(page);
  });

  test('adds a new sponsor with logo and verifies it appears', async ({ page }) => {
    await page.goto('/admin/sponsors');
    await expect(page.getByText('Sponsors')).toBeVisible();

    await page.getByRole('button', { name: /add sponsor/i }).click();

    const testName = `E2E Sponsor ${Date.now()}`;
    await page.getByLabel('Name').fill(testName);
    await page.getByLabel('Website').fill('https://example.com');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.resolve(__dirname, '../fixtures/test-logo.png'));

    await expect(page.getByText(/uploaded/i)).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /^add$/i }).click();

    await expect(page.getByText(testName)).toBeVisible({ timeout: 10_000 });
  });
});
