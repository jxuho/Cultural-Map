import { test, expect } from '@playwright/test';

test.describe('Homepage Test', () => {
  // Actions to take before running each test
  test.beforeEach(async ({ page }) => {
    // Go to the baseURL (http://localhost:3000) set in playwright.config.ts
    await page.goto('/');
  });

  test('Page title and main UI elements should be displayed', async ({
    page,
  }) => {
    // 1. Check page title (regular expression can be used)
    await expect(page).toHaveTitle(/Cultural Heritage Map/);

    // 2. Check for presence of header or specific text
    const header = page.getByRole('banner'); // or getByText('Service Name')
    await expect(header).toBeVisible();
  });

  test('Map should be rendered correctly on the screen', async ({ page }) => {
    // Search by specific class, id, or aria-label of a map component
    // Example: <div id="map"> or <section aria-label="map">
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();
  });
});
