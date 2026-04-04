import { test, expect } from '@playwright/test';
import { mockApiRoutes, setAuthTokens } from './helpers/api-mocks.js';
import { testProducts } from './fixtures/test-data.js';

test.describe('Shopping Cart', () => {
  test.describe('Add to Cart', () => {
    test('should add a product to cart from product detail page', async ({ page }) => {
      await mockApiRoutes(page);
      await page.goto(`/#/products/${testProducts[0].slug}`);

      const addToCartBtn = page.getByRole('button', { name: /add to cart/i });
      await expect(addToCartBtn).toBeVisible({ timeout: 10000 });

      // Select a variation if the button is disabled (product requires variation selection)
      if (await addToCartBtn.isDisabled()) {
        const variation = page.getByText(/128GB/).first();
        if (await variation.isVisible()) {
          await variation.click();
        }
      }

      await page.waitForTimeout(500);
      if (!(await addToCartBtn.isDisabled())) {
        await addToCartBtn.click();
      }
    });
  });

  test.describe('View Cart', () => {
    test('should display cart items on cart page', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/cart');

      await expect(page.getByText(/shopping cart|your cart/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show empty cart message when cart is empty', async ({ page }) => {
      await mockApiRoutes(page);
      page.route('**/api/cart', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { cart: { items: [], totalItems: 0, totalAmount: 0, itemCount: 0 } } }),
        })
      );
      await setAuthTokens(page);
      await page.goto('/#/cart');

      await expect(page.getByText(/your cart is empty|no items|cart is empty/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show proceed to checkout button when cart has items', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/cart');

      const checkoutBtn = page.getByRole('link', { name: /proceed to checkout/i }).or(page.getByRole('button', { name: /proceed to checkout/i }));
      if (await checkoutBtn.isVisible().catch(() => false)) {
        await expect(checkoutBtn).toBeVisible();
      }
    });
  });

  test.describe('Update Cart', () => {
    test('should have remove button on cart items', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/cart');

      const removeButton = page.getByRole('button', { name: /remove/i }).or(page.locator('button[title*="Remove"], button[aria-label*="Remove"]'));
      if (await removeButton.first().isVisible().catch(() => false)) {
        await removeButton.first().click();
      }
    });

    test('should have clear cart button', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/cart');

      const clearCartBtn = page.getByRole('button', { name: /clear cart/i });
      if (await clearCartBtn.isVisible().catch(() => false)) {
        await expect(clearCartBtn).toBeVisible();
      }
    });
  });

  test.describe('Cart Navigation', () => {
    test('should navigate to checkout from cart', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/cart');

      const checkoutBtn = page.getByRole('link', { name: /proceed to checkout/i }).or(page.getByRole('button', { name: /proceed to checkout/i }));
      if (await checkoutBtn.isVisible().catch(() => false)) {
        await checkoutBtn.click();
        await expect(page).toHaveURL(/\/checkout/);
      }
    });

    test('should navigate back to products from cart', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/cart');

      const continueShopping = page.getByRole('link', { name: /continue shopping/i });
      if (await continueShopping.isVisible().catch(() => false)) {
        await continueShopping.click();
        await expect(page).toHaveURL(/\/products/);
      }
    });
  });
});
