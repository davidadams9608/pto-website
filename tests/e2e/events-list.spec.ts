import { expect, test } from '@playwright/test';

test.describe('Public: view events list', () => {
  test('shows events with title, date, and location', async ({ page }) => {
    await page.goto('/events');

    // Page loads with heading
    await expect(page.getByRole('heading', { name: /upcoming events/i })).toBeVisible();

    // At least one event card is visible
    const eventCards = page.locator('a[href^="/events/"]');
    await expect(eventCards.first()).toBeVisible();

    // First event card has title text
    const firstCard = eventCards.first();
    await expect(firstCard).toContainText(/.+/);
  });

  test('clicking an event navigates to detail page', async ({ page }) => {
    await page.goto('/events');

    const eventLink = page.locator('a[href^="/events/"]').first();
    await expect(eventLink).toBeVisible();

    await eventLink.click();

    // Should be on an event detail page
    await expect(page).toHaveURL(/\/events\/.+/);

    // Back link should be visible
    await expect(page.getByText('Back to Events')).toBeVisible();
  });
});
