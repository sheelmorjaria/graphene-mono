import { test, expect } from './fixtures/test-fixtures.js';
import { PaymentTestHelpers, testUtils } from './utils/test-helpers.js';

test.describe('Payment Flows E2E Tests', () => {
  let paymentHelpers;

  test.beforeEach(async ({ page, mockData }) => {
    // Initialize test helpers
    paymentHelpers = new PaymentTestHelpers(page);
    
    // Clear mock data before each test
    mockData.clearAll();
    
    // Set up page with realistic viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('PayPal Payment Flow', () => {
    test('should complete full PayPal payment flow from product to confirmation', async ({ 
      page, 
      api, 
      testData, 
      mockData 
    }) => {
      test.slow(); // Mark as slow test due to multiple steps
      
      // Step 1: Add product to cart via API (simulating user interaction)
      const addToCartResult = await api.addToCart(testData.pixelPhone._id, 1);
      expect(addToCartResult.success).toBe(true);
      
      // Step 2: Navigate to checkout page
      await page.goto('/checkout');
      await page.waitForLoadState('networkidle');
      
      // Step 3: Verify cart contents are displayed
      await expect(page.locator('[data-testid="cart-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="cart-item-' + testData.pixelPhone._id + '"]')).toBeVisible();
      
      // Step 4: Fill shipping information
      await paymentHelpers.fillShippingAddress(testData.validShippingAddress);
      
      // Step 5: Select shipping method
      await paymentHelpers.selectShippingMethod('standard');
      
      // Step 6: Select PayPal payment method
      await paymentHelpers.selectPaymentMethod('paypal');
      
      // Step 7: Initiate PayPal payment
      await page.click('[data-testid="paypal-checkout-button"]');
      
      // Step 8: Wait for PayPal order creation
      const paypalOrderCreated = await testUtils.waitForApiResponse(page, '/api/payments/paypal/create-order');
      expect(paypalOrderCreated.status()).toBe(200);
      
      // Step 9: Verify PayPal approval URL is displayed
      await expect(page.locator('[data-testid="paypal-approval-link"]')).toBeVisible();
      const approvalUrl = await page.getAttribute('[data-testid="paypal-approval-link"]', 'href');
      expect(approvalUrl).toContain('paypal.com');
      
      // Step 10: Simulate PayPal approval and capture
      await page.click('[data-testid="paypal-capture-button"]');
      
      // Step 11: Wait for payment capture
      const paypalCaptured = await testUtils.waitForApiResponse(page, '/api/payments/paypal/capture');
      expect(paypalCaptured.status()).toBe(200);
      
      // Step 12: Verify payment success
      await paymentHelpers.waitForOrderConfirmation();
      await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
      
      // Step 13: Verify order details
      const orderNumber = await page.textContent('[data-testid="order-number"]');
      expect(orderNumber).toMatch(/^ORD-\d+-/);
      
      // Step 14: Take screenshot for visual verification
      await testUtils.takeScreenshot(page, 'paypal-payment-success');
    });

    test('should handle PayPal payment with validation errors', async ({ 
      page, 
      api, 
      testData 
    }) => {
      // Step 1: Navigate to checkout
      await page.goto('/checkout');
      await page.waitForLoadState('networkidle');
      
      // Step 2: Try to proceed without filling required fields
      await paymentHelpers.selectPaymentMethod('paypal');
      await page.click('[data-testid="paypal-checkout-button"]');
      
      // Step 3: Verify validation errors are displayed
      await paymentHelpers.expectErrorMessage('Shipping address and shipping method are required');
      
      // Step 4: Fill invalid shipping address
      await paymentHelpers.fillShippingAddress(testData.invalidShippingAddress);
      await page.click('[data-testid="paypal-checkout-button"]');
      
      // Step 5: Verify specific validation errors
      await expect(page.locator('[data-testid="address-error"]')).toBeVisible();
      
      // Step 6: Fill valid address and proceed
      await paymentHelpers.fillShippingAddress(testData.validShippingAddress);
      await paymentHelpers.selectShippingMethod('standard');
      await page.click('[data-testid="paypal-checkout-button"]');
      
      // Step 7: Verify PayPal order creation succeeds
      await expect(page.locator('[data-testid="paypal-approval-link"]')).toBeVisible();
    });

    test('should handle PayPal payment cancellation', async ({ 
      page, 
      api, 
      testData 
    }) => {
      // Add product to cart
      await api.addToCart(testData.pixelPhone._id, 1);
      
      // Navigate to checkout and fill details
      await page.goto('/checkout');
      await paymentHelpers.fillShippingAddress(testData.validShippingAddress);
      await paymentHelpers.selectShippingMethod('standard');
      await paymentHelpers.selectPaymentMethod('paypal');
      
      // Initiate PayPal payment
      await page.click('[data-testid="paypal-checkout-button"]');
      await expect(page.locator('[data-testid="paypal-approval-link"]')).toBeVisible();
      
      // Simulate cancellation
      await page.click('[data-testid="paypal-cancel-button"]');
      
      // Verify user is returned to checkout with cancellation message
      await expect(page.locator('[data-testid="payment-cancelled"]')).toBeVisible();
      await paymentHelpers.expectErrorMessage('PayPal payment was cancelled');
    });
  });

  test.describe('Bitcoin Payment Flow', () => {
    test('should complete Bitcoin payment initialization', async ({ 
      page, 
      api, 
      testData 
    }) => {
      // Create order first
      const orderResult = await api.createPayPalOrder(testData.sampleOrder);
      expect(orderResult.success).toBe(true);
      const orderId = orderResult.data.orderId;
      
      // Navigate to Bitcoin payment page
      await page.goto(`/payments/bitcoin/${orderId}`);
      await page.waitForLoadState('networkidle');
      
      // Initiate Bitcoin payment
      const bitcoinDetails = await paymentHelpers.initiateBitcoinPayment(orderId);
      
      // Verify Bitcoin payment details
      expect(bitcoinDetails.bitcoinAddress).toBeTruthy();
      expect(bitcoinDetails.btcAmount).toBeTruthy();
      
      // Verify QR code is displayed
      await expect(page.locator('[data-testid="bitcoin-qr-code"]')).toBeVisible();
      
      // Verify payment instructions
      await expect(page.locator('[data-testid="bitcoin-instructions"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirmation-requirements"]')).toContainText('2 confirmations');
      
      // Check payment status
      const status = await paymentHelpers.checkBitcoinPaymentStatus(orderId);
      expect(status).toBe('pending');
    });

    test('should handle Bitcoin payment expiration', async ({ 
      page, 
      api, 
      testData,
      mockData 
    }) => {
      // Create order
      const orderResult = await api.createPayPalOrder(testData.sampleOrder);
      const orderId = orderResult.data.orderId;
      
      // Mock expired payment
      const expiredOrder = {
        _id: orderId,
        paymentDetails: {
          bitcoinPaymentExpiry: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        }
      };
      mockData.updateOrder(orderId, expiredOrder);
      
      // Navigate to Bitcoin payment
      await page.goto(`/payments/bitcoin/${orderId}`);
      
      // Check payment status
      const status = await paymentHelpers.checkBitcoinPaymentStatus(orderId);
      expect(status).toBe('expired');
      
      // Verify expiration message
      await expect(page.locator('[data-testid="payment-expired"]')).toBeVisible();
      await paymentHelpers.expectErrorMessage('Payment window has expired');
    });

    test('should display Bitcoin payment monitoring interface', async ({ 
      page, 
      api, 
      testData 
    }) => {
      // Create order and initiate Bitcoin payment
      const orderResult = await api.createPayPalOrder(testData.sampleOrder);
      const orderId = orderResult.data.orderId;
      
      await page.goto(`/payments/bitcoin/${orderId}`);
      await paymentHelpers.initiateBitcoinPayment(orderId);
      
      // Verify monitoring interface elements
      await expect(page.locator('[data-testid="payment-monitor"]')).toBeVisible();
      await expect(page.locator('[data-testid="confirmation-count"]')).toBeVisible();
      await expect(page.locator('[data-testid="amount-received"]')).toBeVisible();
      await expect(page.locator('[data-testid="time-remaining"]')).toBeVisible();
      
      // Verify refresh functionality
      await page.click('[data-testid="refresh-status"]');
      await testUtils.waitForApiResponse(page, `/api/payments/bitcoin/status/${orderId}`);
      
      // Take screenshot of Bitcoin interface
      await testUtils.takeScreenshot(page, 'bitcoin-payment-interface');
    });
  });

  test.describe('Monero Payment Flow', () => {
    test('should complete Monero payment initialization', async ({ 
      page, 
      api, 
      testData 
    }) => {
      // Create order first
      const orderResult = await api.createPayPalOrder(testData.sampleOrder);
      const orderId = orderResult.data.orderId;
      
      // Navigate to Monero payment page
      await page.goto(`/payments/monero/${orderId}`);
      await page.waitForLoadState('networkidle');
      
      // Initiate Monero payment
      const moneroDetails = await paymentHelpers.initiateMoneroPayment(orderId);
      
      // Verify Monero payment details
      expect(moneroDetails.moneroAddress).toBeTruthy();
      expect(moneroDetails.xmrAmount).toBeTruthy();
      expect(moneroDetails.paymentUrl).toContain('globee.com');
      
      // Verify Monero-specific elements
      await expect(page.locator('[data-testid="monero-payment-url"]')).toBeVisible();
      await expect(page.locator('[data-testid="globee-integration"]')).toBeVisible();
      
      // Verify privacy features are highlighted
      await expect(page.locator('[data-testid="privacy-features"]')).toBeVisible();
      await expect(page.locator('[data-testid="privacy-features"]')).toContainText('untraceable');
      
      // Verify payment window information
      await expect(page.locator('[data-testid="payment-window"]')).toContainText('24 hours');
      await expect(page.locator('[data-testid="required-confirmations"]')).toContainText('10 confirmations');
    });

    test('should handle Monero payment via GloBee integration', async ({ 
      page, 
      api, 
      testData 
    }) => {
      // Create order
      const orderResult = await api.createPayPalOrder(testData.sampleOrder);
      const orderId = orderResult.data.orderId;
      
      await page.goto(`/payments/monero/${orderId}`);
      const moneroDetails = await paymentHelpers.initiateMoneroPayment(orderId);
      
      // Verify GloBee payment URL
      expect(moneroDetails.paymentUrl).toContain('globee.com/payment/');
      
      // Click on GloBee payment link (in real test, this would open new tab)
      await page.click('[data-testid="monero-payment-url"]');
      
      // Since we're mocking, verify the URL would be correct
      const href = await page.getAttribute('[data-testid="monero-payment-url"]', 'href');
      expect(href).toContain('globee.com');
      
      // Verify payment monitoring is available
      await expect(page.locator('[data-testid="monero-status-monitor"]')).toBeVisible();
    });

    test('should display Monero payment status updates', async ({ 
      page, 
      api, 
      testData 
    }) => {
      // Create and initiate Monero payment
      const orderResult = await api.createPayPalOrder(testData.sampleOrder);
      const orderId = orderResult.data.orderId;
      
      await page.goto(`/payments/monero/${orderId}`);
      await paymentHelpers.initiateMoneroPayment(orderId);
      
      // Check initial status
      await page.click('[data-testid="check-monero-status"]');
      await expect(page.locator('[data-testid="monero-status"]')).toContainText('pending');
      
      // Verify status elements
      await expect(page.locator('[data-testid="monero-confirmations"]')).toBeVisible();
      await expect(page.locator('[data-testid="monero-amount-received"]')).toBeVisible();
      
      // Take screenshot of Monero interface
      await testUtils.takeScreenshot(page, 'monero-payment-interface');
    });
  });

  test.describe('Payment Method Selection', () => {
    test('should display all available payment methods', async ({ 
      page, 
      api 
    }) => {
      // Get payment methods via API
      const methodsResult = await api.getPaymentMethods();
      expect(methodsResult.success).toBe(true);
      
      const paymentMethods = methodsResult.data.paymentMethods;
      expect(paymentMethods).toHaveLength(3);
      
      // Navigate to checkout
      await page.goto('/checkout');
      await page.waitForLoadState('networkidle');
      
      // Verify all payment methods are displayed
      for (const method of paymentMethods) {
        await expect(page.locator(`[data-testid="payment-method-${method.id}"]`)).toBeVisible();
        await expect(page.locator(`[data-testid="payment-method-${method.id}"] .method-name`)).toContainText(method.name);
        await expect(page.locator(`[data-testid="payment-method-${method.id}"] .method-description`)).toContainText(method.description);
      }
    });

    test('should allow switching between payment methods', async ({ 
      page, 
      api, 
      testData 
    }) => {
      // Add product and navigate to checkout
      await api.addToCart(testData.pixelPhone._id);
      await page.goto('/checkout');
      
      // Fill required fields
      await paymentHelpers.fillShippingAddress(testData.validShippingAddress);
      await paymentHelpers.selectShippingMethod('standard');
      
      // Test switching between payment methods
      const methods = ['paypal', 'bitcoin', 'monero'];
      
      for (const method of methods) {
        await paymentHelpers.selectPaymentMethod(method);
        
        // Verify method is selected
        await expect(page.locator(`[data-testid="payment-method-${method}"]`)).toHaveClass(/selected/);
        
        // Verify method-specific content is displayed
        await expect(page.locator(`[data-testid="${method}-payment-content"]`)).toBeVisible();
      }
    });
  });

  test.describe('Payment Error Handling', () => {
    test('should handle network errors gracefully', async ({ 
      page, 
      api, 
      testData 
    }) => {
      // Intercept API calls to simulate network errors
      await page.route('/api/payments/**', route => {
        route.abort('failed');
      });
      
      await api.addToCart(testData.pixelPhone._id);
      await page.goto('/checkout');
      await paymentHelpers.fillShippingAddress(testData.validShippingAddress);
      await paymentHelpers.selectShippingMethod('standard');
      await paymentHelpers.selectPaymentMethod('paypal');
      
      // Try to initiate payment
      await page.click('[data-testid="paypal-checkout-button"]');
      
      // Verify error handling
      await paymentHelpers.expectErrorMessage('Network error occurred');
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
      
      // Test retry functionality
      await page.unroute('/api/payments/**'); // Remove network simulation
      await page.click('[data-testid="retry-button"]');
      
      // Verify payment proceeds normally after retry
      await expect(page.locator('[data-testid="paypal-approval-link"]')).toBeVisible();
    });

    test('should handle payment timeout scenarios', async ({ 
      page, 
      api, 
      testData 
    }) => {
      // Simulate slow API response
      await page.route('/api/payments/paypal/create-order', async route => {
        await page.waitForTimeout(5000); // 5 second delay
        route.continue();
      });
      
      await api.addToCart(testData.pixelPhone._id);
      await page.goto('/checkout');
      await paymentHelpers.fillShippingAddress(testData.validShippingAddress);
      await paymentHelpers.selectShippingMethod('standard');
      await paymentHelpers.selectPaymentMethod('paypal');
      
      // Initiate payment
      await page.click('[data-testid="paypal-checkout-button"]');
      
      // Verify loading state is shown
      await expect(page.locator('[data-testid="payment-processing"]')).toBeVisible();
      
      // Wait for completion
      await paymentHelpers.waitForPaymentProcessing();
      
      // Verify payment completes after delay
      await expect(page.locator('[data-testid="paypal-approval-link"]')).toBeVisible();
    });
  });

  test.describe('Mobile Payment Experience', () => {
    test('should work correctly on mobile devices', async ({ 
      page, 
      api, 
      testData 
    }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      
      await api.addToCart(testData.pixelPhone._id);
      await page.goto('/checkout');
      
      // Verify mobile-responsive layout
      await expect(page.locator('[data-testid="mobile-checkout-form"]')).toBeVisible();
      
      // Fill form on mobile
      await paymentHelpers.fillShippingAddress(testData.validShippingAddress);
      await paymentHelpers.selectShippingMethod('standard');
      
      // Test mobile payment method selection
      await page.click('[data-testid="payment-methods-accordion"]');
      await paymentHelpers.selectPaymentMethod('paypal');
      
      // Verify mobile PayPal flow
      await page.click('[data-testid="paypal-checkout-button"]');
      await expect(page.locator('[data-testid="paypal-approval-link"]')).toBeVisible();
      
      // Take mobile screenshot
      await testUtils.takeScreenshot(page, 'mobile-paypal-checkout');
    });
  });

  test.describe('Accessibility', () => {
    test('should be accessible for screen readers', async ({ 
      page, 
      api, 
      testData 
    }) => {
      await api.addToCart(testData.pixelPhone._id);
      await page.goto('/checkout');
      
      // Check basic accessibility requirements
      await testUtils.checkAccessibility(page);
      
      // Verify ARIA labels and roles
      await expect(page.locator('[data-testid="payment-methods"] [role="radiogroup"]')).toBeVisible();
      await expect(page.locator('[data-testid="shipping-form"] [aria-required="true"]')).toHaveCount(4); // Required fields
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Space'); // Should select payment method
      
      // Verify focus management
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });
});