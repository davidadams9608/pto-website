/**
 * Admin page performance audit using Playwright.
 * Measures load time, DOM content loaded, and page weight for each admin page.
 *
 * Requires: dev server running on localhost:3000
 * Run: npx playwright test scripts/admin-perf-audit.ts
 *
 * Since Lighthouse can't authenticate with Clerk, we use Playwright's
 * performance APIs to measure key metrics within an authenticated session.
 */
import { chromium } from '@playwright/test';
import { clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright';
import { config } from 'dotenv';

config({ path: '.env.local' });

const ADMIN_PAGES = [
  { path: '/admin/dashboard', name: 'Dashboard' },
  { path: '/admin/events', name: 'Events' },
  { path: '/admin/archive', name: 'Archive' },
  { path: '/admin/about', name: 'About' },
  { path: '/admin/sponsors', name: 'Sponsors' },
  { path: '/admin/homepage', name: 'Homepage' },
  { path: '/admin/settings', name: 'Settings' },
];

interface PageMetrics {
  name: string;
  path: string;
  loadTime: number;
  domContentLoaded: number;
  transferSize: number;
  resourceCount: number;
  lcp: number | null;
}

async function main() {
  await clerkSetup();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Authenticate
  await setupClerkTestingToken({ page });
  await page.goto('http://localhost:3000/admin/dashboard');
  await page.waitForTimeout(2000);

  const results: PageMetrics[] = [];

  for (const adminPage of ADMIN_PAGES) {
    // Clear performance entries
    await page.evaluate(() => performance.clearResourceTimings());

    const start = Date.now();
    await page.goto(`http://localhost:3000${adminPage.path}`, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - start;

    // Get performance timing
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
        transferSize: nav.transferSize,
      };
    });

    // Get resource count and total transfer size
    const resources = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return {
        count: entries.length,
        totalSize: entries.reduce((sum, e) => sum + (e.transferSize || 0), 0),
      };
    });

    // Get LCP
    const lcp = await page.evaluate(() => {
      return new Promise<number | null>((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          observer.disconnect();
          resolve(Math.round(last?.startTime ?? 0));
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        setTimeout(() => { observer.disconnect(); resolve(null); }, 3000);
      });
    });

    results.push({
      name: adminPage.name,
      path: adminPage.path,
      loadTime,
      domContentLoaded: timing.domContentLoaded,
      transferSize: Math.round((timing.transferSize + resources.totalSize) / 1024),
      resourceCount: resources.count,
      lcp,
    });
  }

  await browser.close();

  // Print results
  console.log('\n  Admin Page Performance Audit\n');
  console.log(
    '  ' +
    'Page'.padEnd(14) +
    'Load'.padEnd(10) +
    'DCL'.padEnd(10) +
    'LCP'.padEnd(10) +
    'Size'.padEnd(10) +
    'Requests'
  );
  console.log('  ' + '-'.repeat(64));

  for (const r of results) {
    console.log(
      '  ' +
      r.name.padEnd(14) +
      `${r.loadTime}ms`.padEnd(10) +
      `${r.domContentLoaded}ms`.padEnd(10) +
      (r.lcp !== null ? `${r.lcp}ms` : 'N/A').padEnd(10) +
      `${r.transferSize}KB`.padEnd(10) +
      `${r.resourceCount}`
    );
  }
  console.log();
}

main().catch(console.error);
