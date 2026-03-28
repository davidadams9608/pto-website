import { expect, test } from '@playwright/test';

test.describe('Public: newsletter signup', () => {
  test.beforeEach(async ({ page }) => {
    // Clear newsletter localStorage to ensure form is visible
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('pto-newsletter-subscribed'));
    await page.reload();
  });

  test('shows newsletter signup form on homepage', async ({ page }) => {
    await expect(page.getByText('Get the newsletter')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible();
  });

  test('subscribes successfully with valid email', async ({ page }) => {
    const email = `e2e-nl-${Date.now()}@example.com`;

    // Scroll to newsletter section and use the form's submit button
    const emailInput = page.getByPlaceholder('Enter your email');
    await emailInput.scrollIntoViewIfNeeded();
    await emailInput.fill(email);
    await emailInput.press('Enter');

    // Should show success
    await expect(page.getByText(/subscribed/i)).toBeVisible({ timeout: 10_000 });
  });

  test('shows error for invalid email', async ({ page }) => {
    const emailInput = page.getByPlaceholder('Enter your email');
    await emailInput.scrollIntoViewIfNeeded();
    await emailInput.fill('not-valid');
    await emailInput.press('Enter');

    await expect(page.getByText(/valid email/i)).toBeVisible();
  });
});
