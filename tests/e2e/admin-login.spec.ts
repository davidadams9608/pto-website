import { expect, test } from '@playwright/test';

test.describe('Admin: login protection', () => {
  test('redirects unauthenticated users to Clerk login', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Should not be on the admin dashboard
    await expect(page).not.toHaveURL('**/admin/dashboard');

    // Should see Clerk login UI or be redirected to sign-in
    // Clerk may render a sign-in page or redirect to accounts.dev
    const url = page.url();
    const isRedirected = url.includes('clerk') || url.includes('sign-in') || !url.includes('/admin/dashboard');
    expect(isRedirected).toBe(true);
  });

  test('all admin routes are protected', async ({ page }) => {
    const adminRoutes = [
      '/admin/dashboard',
      '/admin/events',
      '/admin/archive',
      '/admin/about',
      '/admin/sponsors',
      '/admin/homepage',
      '/admin/settings',
    ];

    for (const route of adminRoutes) {
      const response = await page.goto(route);
      // Should redirect (307) or show login — not 200 with admin content
      const isProtected = response?.status() === 307
        || !page.url().includes(route)
        || page.url().includes('sign-in')
        || page.url().includes('clerk');
      expect(isProtected).toBe(true);
    }
  });
});
