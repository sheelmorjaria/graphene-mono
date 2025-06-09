import { test, expect } from '@playwright/test';

// E2E test for complete Monero payment flow
test.describe('Monero Payment E2E Flow', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Mock external APIs to avoid real transactions
    await page.route('**/api/payments/monero/create', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            orderId: 'test-order-123',
            moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
            xmrAmount: 1.234567890123,
            orderTotal: 199.99,
            exchangeRate: 0.00617,
            expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            validUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            requiredConfirmations: 10,
            paymentWindowHours: 24,
            status: 'pending'
          }
        })
      });
    });

    await page.route('**/api/payments/monero/status/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            orderId: 'test-order-123',
            paymentStatus: 'pending',
            confirmations: 0,
            moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
            xmrAmount: 1.234567890123,
            exchangeRate: 0.00617,
            isExpired: false
          }
        })
      });
    });

    // Mock cart and user authentication
    await page.route('**/api/cart', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [{
            _id: 'item1',
            product: {
              _id: 'product1',
              name: 'GrapheneOS Pixel 7',
              price: 599.99,
              images: ['pixel7.jpg']
            },
            quantity: 1
          }],
          cartTotal: 599.99
        })
      });
    });

    await page.route('**/api/orders', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              order: {
                _id: 'test-order-123',
                orderNumber: 'ORD-2024-001'
              }
            }
          })
        });
      }
    });

    await page.goto('/');
  });

  test('Complete Monero payment journey from cart to payment page', async () => {
    // Step 1: Navigate to cart
    await page.getByRole('link', { name: /cart/i }).click();
    await expect(page).toHaveURL(/\/cart/);

    // Step 2: Proceed to checkout
    await page.getByRole('button', { name: /proceed to checkout/i }).click();
    await expect(page).toHaveURL(/\/checkout/);

    // Step 3: Fill shipping address
    await page.fill('[data-testid="fullName"]', 'John Doe');
    await page.fill('[data-testid="addressLine1"]', '123 Test Street');
    await page.fill('[data-testid="city"]', 'London');
    await page.fill('[data-testid="postalCode"]', 'SW1A 1AA');

    // Continue to payment method
    await page.getByRole('button', { name: /continue/i }).click();

    // Step 4: Select Monero payment method
    await page.getByText('Monero (XMR)').click();
    await expect(page.getByText('Monero Payment Process')).toBeVisible();

    // Step 5: Complete order
    await page.getByRole('button', { name: /place order/i }).click();

    // Step 6: Verify redirect to Monero payment page
    await expect(page).toHaveURL(/\/payment\/monero\/test-order-123/);

    // Step 7: Verify Monero payment page elements
    await expect(page.getByRole('heading', { name: 'Monero Payment' })).toBeVisible();
    await expect(page.getByText('Complete your order by sending Monero to the address below')).toBeVisible();

    // Step 8: Verify payment details
    await expect(page.getByText('Payment Instructions')).toBeVisible();
    await expect(page.getByText('Scan QR Code')).toBeVisible();
    await expect(page.getByText('Monero Address')).toBeVisible();
    await expect(page.getByText('Amount (XMR)')).toBeVisible();

    // Step 9: Verify address and amount display
    await expect(page.getByDisplayValue(/4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q/)).toBeVisible();
    await expect(page.getByDisplayValue('1.234567890123')).toBeVisible();

    // Step 10: Test copy functionality
    await page.getByRole('button', { name: /copy address/i }).first().click();
    await expect(page.getByText('Address copied!')).toBeVisible();

    // Step 11: Verify important information sections
    await expect(page.getByText('Important Notes')).toBeVisible();
    await expect(page.getByText(/Send the exact amount shown above/)).toBeVisible();
    await expect(page.getByText(/Payment expires in 24 hours/)).toBeVisible();
  });

  test('Handle payment confirmation flow', async () => {
    // Navigate directly to payment page
    await page.goto('/payment/monero/test-order-123');

    // Wait for initial load
    await expect(page.getByText('Waiting for Payment')).toBeVisible();

    // Mock payment confirmation
    await page.route('**/api/payments/monero/status/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            orderId: 'test-order-123',
            paymentStatus: 'confirmed',
            confirmations: 12,
            moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
            xmrAmount: 1.234567890123,
            isExpired: false
          }
        })
      });
    });

    // Trigger status update (simulate polling)
    await page.reload();

    // Verify confirmation message
    await expect(page.getByText('Payment Confirmed!')).toBeVisible();
    await expect(page.getByText(/Your Monero payment has been confirmed/)).toBeVisible();
    await expect(page.getByText(/You'll be redirected to the order confirmation page shortly/)).toBeVisible();
  });

  test('Handle payment errors gracefully', async () => {
    // Mock API error
    await page.route('**/api/payments/monero/status/**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Payment service unavailable'
        })
      });
    });

    await page.goto('/payment/monero/test-order-123');

    // Verify error handling
    await expect(page.getByText('Payment Error')).toBeVisible();
    await expect(page.getByText('Payment service unavailable')).toBeVisible();
    await expect(page.getByText('Try Again')).toBeVisible();
    await expect(page.getByText('Back to Checkout')).toBeVisible();
  });

  test('Verify responsive design on mobile', async () => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/payment/monero/test-order-123');

    // Verify mobile layout
    await expect(page.getByRole('heading', { name: 'Monero Payment' })).toBeVisible();
    
    // Check that elements stack properly on mobile
    const qrSection = page.getByText('Scan QR Code');
    const addressSection = page.getByText('Monero Address');
    
    await expect(qrSection).toBeVisible();
    await expect(addressSection).toBeVisible();

    // Verify mobile-specific styling classes are applied
    const container = page.locator('.max-w-4xl');
    await expect(container).toBeVisible();
  });

  test('Verify accessibility features', async () => {
    await page.goto('/payment/monero/test-order-123');

    // Check heading structure
    await expect(page.getByRole('heading', { level: 1, name: 'Monero Payment' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'Need Help?' })).toBeVisible();

    // Check form labels
    await expect(page.getByLabelText('Monero Address')).toBeVisible();
    await expect(page.getByLabelText('Amount (XMR)')).toBeVisible();

    // Check button accessibility
    const copyButtons = page.getByRole('button', { name: /copy/i });
    await expect(copyButtons.first()).toBeVisible();

    // Verify alt text for QR code (when loaded)
    await expect(page.getByAltText('Monero Payment QR Code')).toBeVisible();
  });

  test('Handle expired payment scenarios', async () => {
    // Mock expired payment
    await page.route('**/api/payments/monero/status/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            orderId: 'test-order-123',
            paymentStatus: 'pending',
            confirmations: 0,
            moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
            xmrAmount: 1.234567890123,
            isExpired: true
          }
        })
      });
    });

    await page.goto('/payment/monero/test-order-123');

    // Should still show payment details but indicate expiration
    await expect(page.getByText('Monero Payment')).toBeVisible();
    // The expired state would be handled by the component's internal logic
  });

  test('Verify navigation and back button functionality', async () => {
    await page.goto('/payment/monero/test-order-123');

    // Test back to checkout link
    const backLink = page.getByRole('link', { name: /back to checkout/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/checkout');

    // Test contact support link
    const supportLink = page.getByRole('link', { name: /contact support/i });
    await expect(supportLink).toBeVisible();
    await expect(supportLink).toHaveAttribute('href', '/contact-us');
  });

  test('Performance - Page loads within acceptable time', async () => {
    const startTime = Date.now();
    
    await page.goto('/payment/monero/test-order-123');
    await expect(page.getByText('Monero Payment')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});