import path from 'path';

import { expect, test } from '@playwright/test';

import { clerkSetup, hasClerkSecret, setupAdminPage } from './helpers/auth';

test.describe('Admin: upload newsletter', () => {
  test.skip(!hasClerkSecret, 'CLERK_SECRET_KEY required for admin tests');

  test.beforeAll(async () => {
    await clerkSetup();
  });

  test.beforeEach(async ({ page }) => {
    await setupAdminPage(page);
  });

  test('uploads a newsletter PDF and verifies it appears', async ({ page }) => {
    await page.goto('/admin/archive');
    await expect(page.getByText('Archive')).toBeVisible();

    await page.getByRole('button', { name: /upload newsletter/i }).click();

    const testTitle = `E2E Newsletter ${Date.now()}`;
    await page.getByLabel('Title').fill(testTitle);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.resolve(__dirname, '../fixtures/test.pdf'));

    await expect(page.getByText(/uploaded/i)).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /^upload$/i }).click();

    await expect(page.getByText(testTitle)).toBeVisible({ timeout: 10_000 });
  });
});
