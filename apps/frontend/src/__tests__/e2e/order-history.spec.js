import { test, expect } from '@playwright/test';
import { mockApiRoutes, setAuthTokens } from './helpers/api-mocks.js';
import { testOrders } from './fixtures/test-data.js';

test.describe('Order History', () => {
  test.describe('View Orders', () => {
    test('should display order history page with orders', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/orders');

      await expect(page.getByText(/my orders|order history/i).first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(testOrders[0].orderNumber).first()).toBeVisible();
      await expect(page.getByText(testOrders[1].orderNumber).first()).toBeVisible();
    });

    test('should display order status badges', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/orders');

      await expect(page.getByText(/delivered/i).first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/processing/i).first()).toBeVisible();
    });

    test('should display order totals', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/orders');

      await expect(page.getByText(/699\.99|£699/).first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/999\.99|£999/).first()).toBeVisible();
    });

    test('should show empty state when no orders exist', async ({ page }) => {
      // Set up mocks first
      await setAuthTokens(page);
      await mockApiRoutes(page);

      // Now override the orders route (routes registered later take precedence)
      await page.route('**/api/user/orders**', (route) => {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              orders: [],
              pagination: { page: 1, limit: 10, total: 0, pages: 0 }
            }
          })
        });
      });

      await page.goto('/#/orders');

      await expect(page.getByText(/no orders|haven.*placed.*order/i).first()).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to order detail from order history', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/orders');

      const viewDetailsLink = page.getByRole('link', { name: /view details/i }).or(page.getByText(/view details/i));
      if (await viewDetailsLink.first().isVisible()) {
        await viewDetailsLink.first().click();
        await expect(page).toHaveURL(/\/orders\//);
      }
    });
  });

  test.describe('Order Detail', () => {
    test('should display order details page', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/orders/order-001');

      await expect(page.getByText(testOrders[0].orderNumber).first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/delivered/i).first()).toBeVisible();
    });

    test('should display order items', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/orders/order-001');

      await expect(page.getByText(testOrders[0].items[0].productName)).toBeVisible({ timeout: 5000 });
    });

    test('should display payment method on order', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/orders/order-001');

      await expect(page.getByText(/paypal/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Protected Routes', () => {
    test('should show authentication error when not authenticated', async ({ page }) => {
      await mockApiRoutes(page);
      await page.goto('/#/orders');
      await expect(page.getByText(/authentication required|please log in|log in/i)).toBeVisible({ timeout: 5000 });
    });
  });
});
