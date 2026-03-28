import { expect, test } from '@playwright/test';

test.describe('Public: volunteer signup', () => {
  // Find an event with volunteer slots dynamically from the API
  let eventWithSlots = '';
  const uniqueEmail = `e2e-vol-${Date.now()}@example.com`;

  test.beforeAll(async ({ request }) => {
    const res = await request.get('/api/events');
    const { data } = await res.json();
    const event = data.find((e: { volunteerSlots: unknown[] | null }) =>
      Array.isArray(e.volunteerSlots) && e.volunteerSlots.length > 0,
    );
    if (event) eventWithSlots = `/events/${event.id}`;
  });

  test('shows signup form with name, email, phone, role fields', async ({ page }) => {
    test.skip(!eventWithSlots, 'No event with volunteer slots found in seed data');
    await page.goto(eventWithSlots);

    const signupHeading = page.getByText('Volunteer Signup', { exact: true });
    await signupHeading.scrollIntoViewIfNeeded();
    await expect(signupHeading).toBeVisible();
    await expect(page.locator('#vol-name')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#vol-email')).toBeVisible();
    await expect(page.locator('#vol-phone')).toBeVisible();
    await expect(page.locator('#vol-role')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign up to volunteer/i })).toBeVisible();
  });

  test('shows spots left badge', async ({ page }) => {
    test.skip(!eventWithSlots, 'No event with volunteer slots found in seed data');
    await page.goto(eventWithSlots);
    await expect(page.getByText(/\d+ spots? left/)).toBeVisible();
  });

  test('submits successfully with valid data', async ({ page }) => {
    test.skip(!eventWithSlots, 'No event with volunteer slots found in seed data');
    await page.goto(eventWithSlots);

    await page.locator('#vol-name').fill('E2E Test Volunteer');
    await page.locator('#vol-email').fill(uniqueEmail);
    await page.locator('#vol-phone').fill('5551234567');
    await page.locator('#vol-role').selectOption({ index: 1 });
    await page.getByRole('button', { name: /sign up to volunteer/i }).click();

    await expect(page.getByText('Thanks for signing up!')).toBeVisible({ timeout: 10_000 });
  });

  test('shows error for duplicate email', async ({ page }) => {
    test.skip(!eventWithSlots, 'No event with volunteer slots found in seed data');
    await page.goto(eventWithSlots);

    await page.locator('#vol-name').fill('E2E Duplicate');
    await page.locator('#vol-email').fill(uniqueEmail);
    await page.locator('#vol-phone').fill('5559998888');
    await page.locator('#vol-role').selectOption({ index: 1 });
    await page.getByRole('button', { name: /sign up to volunteer/i }).click();

    await expect(page.getByText(/already signed up/i)).toBeVisible({ timeout: 10_000 });
  });

  test('shows validation errors for empty fields', async ({ page }) => {
    test.skip(!eventWithSlots, 'No event with volunteer slots found in seed data');
    await page.goto(eventWithSlots);

    await page.getByRole('button', { name: /sign up to volunteer/i }).click();

    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Phone number is required')).toBeVisible();
    await expect(page.getByText('Please select a role')).toBeVisible();
  });
});
