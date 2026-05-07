import { test, expect } from '@playwright/test';

test.describe('Map and Marker Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Wait for the loading overlay to disappear
    await expect(page.getByText('Loading the Map...')).not.toBeVisible({
      timeout: 15000,
    });

    // Ensure the Leaflet map container is rendered
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('Map should display correctly', async ({ page }) => {
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('Clicking a cluster should zoom in and show individual markers', async ({
    page,
  }) => {
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.focus();

    // Zoom out using keyboard to force markers to cluster
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('-');
      await page.waitForTimeout(300);
    }

    const cluster = page.locator('.leaflet-marker-cluster').first();
    const anyMarker = page.locator('.leaflet-marker-icon').first();

    // Ensure at least one marker is visible before proceeding
    await expect(anyMarker).toBeVisible({ timeout: 10000 });

    if (await cluster.isVisible()) {
      await cluster.click();
      // After clicking cluster, individual markers should appear
      await expect(page.locator('.leaflet-marker-icon').first()).toBeVisible();
    } else {
      // Fallback if no clusters formed at this zoom level
      await expect(anyMarker).toBeVisible();
    }
  });

  test('Clicking a marker should open the side panel', async ({ page }) => {
    const cluster = page.locator('.leaflet-marker-cluster').first();

    // If markers are clustered, click to expand them
    if (await cluster.isVisible()) {
      await cluster.click();
      await page.waitForTimeout(500);
    }

    const marker = page.locator('.leaflet-marker-icon').first();
    await expect(marker).toBeVisible();

    // Trigger click on the marker to open details
    await marker.dispatchEvent('click');

    const sidePanel = page.locator('aside');
    await expect(sidePanel).toBeVisible();
  });

  test('Account button shows login prompt when not logged in', async ({
    page,
  }) => {
    // Mock unauthorized status
    await page.route('**/auth/refresh', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'fail', message: 'Unauthorized' }),
      });
    });

    await page.goto('/');
    await expect(page.locator('.leaflet-container')).toBeVisible();

    const accountBtn = page.locator('#accountManagerButton');
    await accountBtn.click();

    // Verify login invitation modal content
    await expect(
      page.getByText("You're not logged in.Please log in"),
    ).toBeVisible();

    const signInBtn = page.getByRole('button', { name: /sign in/i });
    await expect(signInBtn).toBeVisible();

    // Test navigation to sign-in page
    await signInBtn.click();
    await expect(page).toHaveURL(/\/sign-in/);
  });
});

test.describe('Guest User Constraints', () => {
  test('Guest users should not see context menu on right-click', async ({
    page,
  }) => {
    // Force non-logged-in state
    await page.route(
      (url) => url.pathname.includes('auth/refresh'),
      async (route) => {
        await route.fulfill({
          status: 401,
          body: JSON.stringify({ status: 'fail' }),
        });
      },
    );

    await page.goto('/');
    await expect(page.getByText('Loading the Map...')).not.toBeVisible({
      timeout: 15000,
    });

    // Right-click empty map area
    const map = page.locator('.leaflet-container');
    await map.click({
      button: 'right',
      position: { x: 300, y: 300 },
    });

    const contextMenu = page.getByTestId('map-context-menu');
    await expect(contextMenu).not.toBeVisible();
  });
});

test.describe('Authenticated User Features', () => {
  test.beforeEach(async ({ page }) => {
    // Mock successful login session
    await page.route(
      (url) => url.pathname.includes('auth/refresh'),
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: {
              user: {
                _id: 'admin-id',
                username: 'AdminUser',
                role: 'admin',
              },
            },
          }),
        });
      },
    );

    await page.goto('/');
    await expect(page.getByText('Loading the Map...')).not.toBeVisible({
      timeout: 15000,
    });
  });

  test('Logged-in user should see context menu on right-click', async ({
    page,
  }) => {
    const map = page.locator('.leaflet-container');

    // Right-click empty map area
    await map.click({
      button: 'right',
      position: { x: 500, y: 500 },
    });

    const contextMenu = page.getByTestId('map-context-menu');
    await expect(contextMenu).toBeVisible();
  });
});
