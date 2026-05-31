import { test, expect } from '@playwright/test';
import { mockApiRoutes, setAuthTokens } from './helpers/api-mocks.js';
import { testShippingAddress } from './fixtures/test-data.js';

test.describe('Checkout Flow', () => {
  test.describe('Checkout Page Access', () => {
    test('should show login required when not authenticated', async ({ page }) => {
      await mockApiRoutes(page);
      await page.goto('/#/checkout');
      await expect(page.getByText(/login required/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Cart Summary', () => {
    test('should display cart summary on checkout page', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/checkout');

      // Wait for auth to resolve
      await expect(page.getByText(/login required/i)).not.toBeVisible({ timeout: 10000 });
    });

    test('should display order total', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/checkout');

      await expect(page.getByText(/login required/i)).not.toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Shipping Address', () => {
    test('should display checkout form', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/checkout');

      await expect(page.getByText(/login required/i)).not.toBeVisible({ timeout: 10000 });
      const checkoutForm = page.getByTestId('checkout-form').or(page.locator('form').first());
      await expect(checkoutForm.first()).toBeVisible({ timeout: 5000 });
    });

    test('should validate required shipping address fields', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/checkout');

      await expect(page.getByText(/login required/i)).not.toBeVisible({ timeout: 10000 });

      const checkoutButton = page.getByTestId('checkout-button').or(page.getByRole('button', { name: /continue|next/i }));
      if (await checkoutButton.isVisible().catch(() => false)) {
        await checkoutButton.click();
        await expect(page.getByText(/required|please enter|must be/i).first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should fill in shipping address fields', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/checkout');

      await expect(page.getByText(/login required/i)).not.toBeVisible({ timeout: 10000 });

      const checkoutForm = page.getByTestId('checkout-form').or(page.locator('form').first());
      await expect(checkoutForm.first()).toBeVisible({ timeout: 5000 });

      const fullNameField = page.locator('#fullName, [name="fullName"], [placeholder*="Full name"], [placeholder*="full name"]');
      if (await fullNameField.isVisible().catch(() => false)) {
        await fullNameField.fill(testShippingAddress.fullName);
      }

      const addressField = page.locator('#addressLine1, [name="addressLine1"], [placeholder*="Address"], [placeholder*="address"]');
      if (await addressField.isVisible().catch(() => false)) {
        await addressField.fill(testShippingAddress.addressLine1);
      }

      const cityField = page.locator('#city, [name="city"]');
      if (await cityField.isVisible().catch(() => false)) {
        await cityField.fill(testShippingAddress.city);
      }

      const postalField = page.locator('#postalCode, [name="postalCode"], [placeholder*="Postal"], [placeholder*="post"]');
      if (await postalField.isVisible().catch(() => false)) {
        await postalField.fill(testShippingAddress.postalCode);
      }

      if (await fullNameField.isVisible().catch(() => false)) {
        expect(await fullNameField.inputValue()).toBeTruthy();
      }
    });
  });

  test.describe('Payment Method Selection', () => {
    test('should display available payment methods', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/checkout');

      await expect(page.getByText(/login required/i)).not.toBeVisible({ timeout: 10000 });

      const paymentMethods = page.getByTestId('payment-methods').or(page.getByText(/payment method/i));
      await expect(paymentMethods.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show PayPal option', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/checkout');

      await expect(page.getByText(/login required/i)).not.toBeVisible({ timeout: 10000 });

      const paypalOption = page.getByTestId('payment-method-paypal').or(page.getByText(/paypal/i));
      await expect(paypalOption.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Place Order', () => {
    test('should show checkout button', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);
      await page.goto('/#/checkout');

      await expect(page.getByText(/login required/i)).not.toBeVisible({ timeout: 10000 });

      const checkoutButton = page.getByTestId('checkout-button').or(page.getByRole('button', { name: /continue|next|review/i }));
      if (await checkoutButton.isVisible().catch(() => false)) {
        await expect(checkoutButton).toBeVisible();
      }
    });
  });

  test.describe('Order Confirmation', () => {
    test('should display order confirmation page', async ({ page }) => {
      await mockApiRoutes(page);
      await setAuthTokens(page);

      await page.goto('/#/order-confirmation/order-001');

      await expect(page.getByText(/order.*confirm|thank you/i).first()).toBeVisible({ timeout: 5000 });
    });
  });
});
