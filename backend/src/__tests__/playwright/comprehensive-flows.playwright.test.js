import { test, expect } from './fixtures/test-fixtures.js';
import { PaymentTestHelpers, AdminTestHelpers, testUtils } from './utils/test-helpers.js';

test.describe('Comprehensive E2E User Flows', () => {
  let paymentHelpers;
  let adminHelpers;

  test.beforeEach(async ({ page, mockData }) => {
    // Initialize helpers
    paymentHelpers = new PaymentTestHelpers(page);
    adminHelpers = new AdminTestHelpers(page);
    
    // Clear mock data
    mockData.clearAll();
    
    // Set up realistic viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Full Customer Journey E2E', () => {
    test('should complete full customer journey from product discovery to order completion', async ({ 
      page, 
      api, 
      testData, 
      mockData 
    }) => {
      test.slow(); // Mark as slow due to comprehensive flow
      
      // === Phase 1: Product Discovery ===
      await test.step('Product Discovery', async () => {
        // Navigate to products page
        await page.goto('/products');
        await page.waitForLoadState('networkidle');
        
        // Verify products are displayed
        await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
        await expect(page.locator('[data-testid="product-card"]')).toHaveCount(3);
        
        // Test product search
        await page.fill('[data-testid="product-search"]', 'Pixel 7 Pro');
        await page.press('[data-testid="product-search"]', 'Enter');
        await page.waitForLoadState('networkidle');
        
        // Verify search results
        await expect(page.locator('[data-testid="search-results"]')).toContainText('1 result');
        await expect(page.locator('[data-testid="product-card"]')).toHaveCount(1);
        
        // Click on product to view details
        await page.click('[data-testid="product-card-product-pixel-7-pro"]');
        await page.waitForLoadState('networkidle');
        
        // Verify product details page
        await expect(page.locator('[data-testid="product-title"]')).toContainText('Google Pixel 7 Pro');
        await expect(page.locator('[data-testid="product-price"]')).toContainText('£699.99');
        await expect(page.locator('[data-testid="product-description"]')).toBeVisible();
        
        // Take screenshot of product page
        await testUtils.takeScreenshot(page, 'product-details-page');
      });
      
      // === Phase 2: Cart Management ===
      await test.step('Cart Management', async () => {
        // Add product to cart
        await page.click('[data-testid="add-to-cart-button"]');
        
        // Verify cart notification
        await expect(page.locator('[data-testid="cart-notification"]')).toBeVisible();
        await expect(page.locator('[data-testid="cart-notification"]')).toContainText('Added to cart');
        
        // Navigate to cart
        await page.click('[data-testid="cart-icon"]');
        await page.waitForLoadState('networkidle');
        
        // Verify cart contents
        await expect(page.locator('[data-testid="cart-item-product-pixel-7-pro"]')).toBeVisible();
        await expect(page.locator('[data-testid="cart-total"]')).toContainText('£699.99');
        
        // Add privacy service
        await page.goto('/products/privacy-app-installation-service');
        await page.click('[data-testid="add-to-cart-button"]');
        
        // Return to cart and verify both items
        await page.click('[data-testid="cart-icon"]');
        await expect(page.locator('[data-testid="cart-item-product-pixel-7-pro"]')).toBeVisible();
        await expect(page.locator('[data-testid="cart-item-service-privacy-setup"]')).toBeVisible();
        await expect(page.locator('[data-testid="cart-total"]')).toContainText('£749.98');
        
        // Update quantity
        await page.fill('[data-testid="quantity-input-service-privacy-setup"]', '2');
        await page.click('[data-testid="update-quantity"]');
        
        // Verify updated total
        await expect(page.locator('[data-testid="cart-total"]')).toContainText('£799.97');
      });
      
      // === Phase 3: Checkout Process ===
      await test.step('Checkout Process', async () => {
        // Proceed to checkout
        await page.click('[data-testid="checkout-button"]');
        await page.waitForLoadState('networkidle');
        
        // Verify checkout page
        await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible();
        await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
        
        // Fill shipping address
        await paymentHelpers.fillShippingAddress(testData.validShippingAddress);
        
        // Select shipping method
        await paymentHelpers.selectShippingMethod('express');
        
        // Verify shipping cost is added
        await expect(page.locator('[data-testid="shipping-cost"]')).toContainText('£15.99');
        await expect(page.locator('[data-testid="order-total"]')).toContainText('£815.96');
      });
      
      // === Phase 4: Payment Processing ===
      await test.step('PayPal Payment', async () => {
        // Select PayPal payment
        await paymentHelpers.selectPaymentMethod('paypal');
        
        // Initiate PayPal payment
        await page.click('[data-testid="paypal-checkout-button"]');
        
        // Wait for PayPal order creation
        await testUtils.waitForApiResponse(page, '/api/payments/paypal/create-order');
        
        // Verify PayPal approval interface
        await expect(page.locator('[data-testid="paypal-approval-link"]')).toBeVisible();
        await expect(page.locator('[data-testid="paypal-order-total"]')).toContainText('£815.96');
        
        // Simulate PayPal approval and capture
        await page.click('[data-testid="paypal-capture-button"]');
        
        // Wait for payment completion
        await testUtils.waitForApiResponse(page, '/api/payments/paypal/capture');
      });
      
      // === Phase 5: Order Confirmation ===
      await test.step('Order Confirmation', async () => {
        // Wait for order confirmation page
        await paymentHelpers.waitForOrderConfirmation();
        
        // Verify order success
        await expect(page.locator('[data-testid="order-success"]')).toBeVisible();
        await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
        
        // Verify order details
        const orderNumber = await page.textContent('[data-testid="order-number"]');
        expect(orderNumber).toMatch(/^ORD-\d+/);
        
        await expect(page.locator('[data-testid="order-total"]')).toContainText('£815.96');
        await expect(page.locator('[data-testid="payment-method"]')).toContainText('PayPal');
        await expect(page.locator('[data-testid="shipping-address"]')).toContainText(testData.validShippingAddress.fullName);
        
        // Verify order items
        await expect(page.locator('[data-testid="order-item-product-pixel-7-pro"]')).toBeVisible();
        await expect(page.locator('[data-testid="order-item-service-privacy-setup"]')).toBeVisible();
        
        // Take screenshot of confirmation
        await testUtils.takeScreenshot(page, 'order-confirmation-complete');
        
        // Verify email confirmation would be sent
        await expect(page.locator('[data-testid="email-confirmation-note"]')).toContainText('confirmation email');
      });
    });

    test('should handle customer registration and login flow', async ({ 
      page, 
      api, 
      testData 
    }) => {
      // === Customer Registration ===
      await test.step('Customer Registration', async () => {
        await page.goto('/register');
        
        // Fill registration form
        await page.fill('[data-testid="first-name"]', 'New');
        await page.fill('[data-testid="last-name"]', 'Customer');
        await page.fill('[data-testid="email"]', testUtils.generateTestEmail());
        await page.fill('[data-testid="password"]', 'SecurePassword123!');
        await page.fill('[data-testid="confirm-password"]', 'SecurePassword123!');
        
        // Accept terms
        await page.check('[data-testid="accept-terms"]');
        
        // Submit registration
        await page.click('[data-testid="register-button"]');
        
        // Verify registration success
        await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
        await expect(page.locator('[data-testid="verification-email-sent"]')).toContainText('verification email');
      });
      
      // === Customer Login ===
      await test.step('Customer Login', async () => {
        await page.goto('/login');
        
        // Fill login form
        await page.fill('[data-testid="email"]', testData.customerUser.email);
        await page.fill('[data-testid="password"]', testData.customerUser.password);
        
        // Submit login
        await page.click('[data-testid="login-button"]');
        
        // Verify successful login
        await page.waitForURL('/dashboard', { timeout: 10000 });
        await expect(page.locator('[data-testid="customer-dashboard"]')).toBeVisible();
        await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome back');
      });
      
      // === Customer Profile Management ===
      await test.step('Profile Management', async () => {
        // Navigate to profile
        await page.click('[data-testid="profile-menu"]');
        await page.click('[data-testid="my-profile"]');
        
        // Verify profile page
        await expect(page.locator('[data-testid="profile-form"]')).toBeVisible();
        
        // Update profile information
        await page.fill('[data-testid="phone-number"]', '+44 20 1234 5678');
        await page.click('[data-testid="save-profile"]');
        
        // Verify save success
        await expect(page.locator('[data-testid="profile-saved"]')).toBeVisible();
        
        // Add new address
        await page.click('[data-testid="add-address-button"]');
        await paymentHelpers.fillShippingAddress({
          ...testData.validShippingAddress,
          addressLine1: '456 Secondary Street'
        });
        await page.click('[data-testid="save-address"]');
        
        // Verify address added
        await expect(page.locator('[data-testid="saved-addresses"]')).toContainText('456 Secondary Street');
      });
    });
  });

  test.describe('Admin Workflow Management', () => {
    test('should complete full admin workflow from login to order processing', async ({ 
      page, 
      api, 
      testData, 
      mockData 
    }) => {
      test.slow();
      
      // Create test order first
      const testOrder = {
        _id: 'admin-test-order',
        orderNumber: 'ORD-ADMIN-TEST-123',
        userId: 'customer-user-id',
        customerEmail: 'customer@example.com',
        status: 'pending',
        paymentStatus: 'completed',
        items: [
          {
            productId: 'product-pixel-7-pro',
            productName: 'Google Pixel 7 Pro - GrapheneOS',
            quantity: 1,
            unitPrice: 699.99,
            totalPrice: 699.99
          }
        ],
        totalAmount: 709.98,
        createdAt: new Date().toISOString()
      };
      
      mockData.addOrder(testOrder);
      
      // === Admin Login ===
      await test.step('Admin Login', async () => {
        await adminHelpers.loginAsAdmin(testData.adminUser);
        
        // Verify admin dashboard
        await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
        await expect(page.locator('[data-testid="dashboard-stats"]')).toBeVisible();
        
        // Verify admin navigation
        await expect(page.locator('[data-testid="admin-nav-orders"]')).toBeVisible();
        await expect(page.locator('[data-testid="admin-nav-users"]')).toBeVisible();
        await expect(page.locator('[data-testid="admin-nav-products"]')).toBeVisible();
        await expect(page.locator('[data-testid="admin-nav-reports"]')).toBeVisible();
      });
      
      // === Order Management ===
      await test.step('Order Management', async () => {
        // Navigate to orders
        await adminHelpers.navigateToOrderManagement();
        
        // Verify order list
        await expect(page.locator('[data-testid="order-list"]')).toBeVisible();
        await expect(page.locator('[data-testid="order-row-admin-test-order"]')).toBeVisible();
        
        // View order details
        await adminHelpers.viewOrderDetails('admin-test-order');
        
        // Verify order details
        await expect(page.locator('[data-testid="order-details"]')).toBeVisible();
        await expect(page.locator('[data-testid="order-number"]')).toContainText('ORD-ADMIN-TEST-123');
        await expect(page.locator('[data-testid="customer-email"]')).toContainText('customer@example.com');
        await expect(page.locator('[data-testid="order-total"]')).toContainText('£709.98');
        
        // Update order status
        await adminHelpers.updateOrderStatus('admin-test-order', 'processing');
        
        // Verify status update
        await expect(page.locator('[data-testid="order-status-update-success"]')).toBeVisible();
        await expect(page.locator('[data-testid="current-order-status"]')).toContainText('processing');
        
        // Add order note
        await page.fill('[data-testid="order-note"]', 'Device prepared and ready for shipping');
        await page.click('[data-testid="add-note"]');
        
        // Verify note added
        await expect(page.locator('[data-testid="order-notes"]')).toContainText('Device prepared and ready');
      });
      
      // === User Management ===
      await test.step('User Management', async () => {
        // Create test user
        const adminTestUser = {
          _id: 'admin-workflow-user',
          email: 'workflow@example.com',
          firstName: 'Workflow',
          lastName: 'Test',
          role: 'customer',
          isActive: true,
          createdAt: new Date().toISOString()
        };
        
        mockData.addUser(adminTestUser);
        
        // Navigate to user management
        await adminHelpers.navigateToUserManagement();
        
        // Search for user
        await adminHelpers.searchUsers('workflow@example.com');
        
        // Verify user found
        await adminHelpers.verifyUserInList({
          id: 'admin-workflow-user',
          email: 'workflow@example.com',
          status: 'active'
        });
        
        // View user details
        await page.click('[data-testid="view-user-admin-workflow-user"]');
        
        // Verify user details modal
        await expect(page.locator('[data-testid="user-details-modal"]')).toBeVisible();
        await expect(page.locator('[data-testid="user-email"]')).toContainText('workflow@example.com');
        
        // Update user status
        await page.click('[data-testid="user-status-dropdown"]');
        await page.click('[data-testid="status-option-inactive"]');
        
        // Add status change reason
        await page.fill('[data-testid="status-change-reason"]', 'Test workflow - temporary deactivation');
        await page.click('[data-testid="confirm-status-change"]');
        
        // Verify status change
        await expect(page.locator('[data-testid="user-status-updated"]')).toBeVisible();
      });
      
      // === Reports and Analytics ===
      await test.step('Reports and Analytics', async () => {
        // Navigate to reports
        await page.click('[data-testid="admin-nav-reports"]');
        await page.waitForLoadState('networkidle');
        
        // Verify reports dashboard
        await expect(page.locator('[data-testid="reports-dashboard"]')).toBeVisible();
        
        // View sales report
        await page.click('[data-testid="sales-report-tab"]');
        await expect(page.locator('[data-testid="sales-chart"]')).toBeVisible();
        await expect(page.locator('[data-testid="revenue-metrics"]')).toBeVisible();
        
        // View user activity report
        await page.click('[data-testid="user-activity-tab"]');
        await expect(page.locator('[data-testid="user-activity-chart"]')).toBeVisible();
        
        // Export report
        await page.click('[data-testid="export-report"]');
        await page.selectOption('[data-testid="export-format"]', 'csv');
        await page.click('[data-testid="download-report"]');
        
        // Verify export initiated
        await expect(page.locator('[data-testid="export-started"]')).toBeVisible();
        
        // Take screenshot of reports
        await testUtils.takeScreenshot(page, 'admin-reports-dashboard');
      });
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`should work correctly in ${browserName}`, async ({ 
        page, 
        api, 
        testData 
      }) => {
        // Basic functionality test across browsers
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Verify homepage loads
        await expect(page.locator('[data-testid="homepage"]')).toBeVisible();
        
        // Test navigation
        await page.click('[data-testid="nav-products"]');
        await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
        
        // Test product interaction
        await page.click('[data-testid="product-card"]:first-child');
        await expect(page.locator('[data-testid="product-details"]')).toBeVisible();
        
        // Test cart functionality
        await page.click('[data-testid="add-to-cart-button"]');
        await expect(page.locator('[data-testid="cart-notification"]')).toBeVisible();
        
        // Verify checkout accessibility
        await page.click('[data-testid="cart-icon"]');
        await page.click('[data-testid="checkout-button"]');
        await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible();
        
        // Take browser-specific screenshot
        await testUtils.takeScreenshot(page, `checkout-${browserName}`);
      });
    });
  });

  test.describe('Performance and Load Testing', () => {
    test('should handle concurrent user sessions', async ({ 
      context, 
      api, 
      testData 
    }) => {
      // Create multiple browser contexts to simulate concurrent users
      const contexts = await Promise.all([
        context.browser().newContext(),
        context.browser().newContext(),
        context.browser().newContext()
      ]);
      
      const pages = await Promise.all(
        contexts.map(ctx => ctx.newPage())
      );
      
      try {
        // Simulate concurrent user actions
        const concurrentActions = pages.map(async (page, index) => {
          await page.goto('/products');
          await page.waitForLoadState('networkidle');
          
          // Each user adds different products
          const productSelectors = [
            '[data-testid="product-card-product-pixel-7-pro"]',
            '[data-testid="product-card-product-pixel-8"]',
            '[data-testid="product-card-service-privacy-setup"]'
          ];
          
          await page.click(productSelectors[index]);
          await page.click('[data-testid="add-to-cart-button"]');
          
          // Verify cart functionality under load
          await expect(page.locator('[data-testid="cart-notification"]')).toBeVisible();
          
          return page;
        });
        
        // Wait for all concurrent actions to complete
        const completedPages = await Promise.all(concurrentActions);
        
        // Verify all pages are still functional
        for (const page of completedPages) {
          await page.click('[data-testid="cart-icon"]');
          await expect(page.locator('[data-testid="cart-contents"]')).toBeVisible();
        }
        
      } finally {
        // Clean up contexts
        await Promise.all(contexts.map(ctx => ctx.close()));
      }
    });

    test('should maintain performance under API load', async ({ 
      page, 
      api 
    }) => {
      // Measure API response times under load
      const apiCalls = [];
      
      // Simulate multiple API calls
      for (let i = 0; i < 10; i++) {
        apiCalls.push(
          testUtils.measurePageLoadTime(page, '/api/products')
        );
      }
      
      const responseTimes = await Promise.all(apiCalls);
      
      // Verify all responses are within acceptable limits
      responseTimes.forEach(time => {
        expect(time).toBeLessThan(5000); // 5 second max
      });
      
      // Calculate average response time
      const avgResponseTime = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
      expect(avgResponseTime).toBeLessThan(2000); // 2 second average
    });
  });

  test.describe('Error Recovery and Resilience', () => {
    test('should handle API failures gracefully', async ({ 
      page, 
      api, 
      testData 
    }) => {
      // Add product to cart
      await api.addToCart(testData.pixelPhone._id);
      
      // Navigate to checkout
      await page.goto('/checkout');
      await paymentHelpers.fillShippingAddress(testData.validShippingAddress);
      await paymentHelpers.selectShippingMethod('standard');
      await paymentHelpers.selectPaymentMethod('paypal');
      
      // Simulate API failure
      await page.route('/api/payments/paypal/create-order', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error'
          })
        });
      });
      
      // Attempt payment
      await page.click('[data-testid="paypal-checkout-button"]');
      
      // Verify error handling
      await expect(page.locator('[data-testid="payment-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('server error');
      
      // Verify retry option is available
      await expect(page.locator('[data-testid="retry-payment"]')).toBeVisible();
      
      // Remove API failure simulation
      await page.unroute('/api/payments/paypal/create-order');
      
      // Retry payment
      await page.click('[data-testid="retry-payment"]');
      
      // Verify payment proceeds normally
      await expect(page.locator('[data-testid="paypal-approval-link"]')).toBeVisible();
    });

    test('should recover from network disconnection', async ({ 
      page, 
      api, 
      testData 
    }) => {
      // Start normal flow
      await page.goto('/products');
      
      // Simulate network disconnection
      await page.context().setOffline(true);
      
      // Attempt navigation
      await page.click('[data-testid="nav-checkout"]');
      
      // Verify offline message
      await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();
      
      // Restore network
      await page.context().setOffline(false);
      
      // Verify automatic recovery
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-testid="offline-message"]')).not.toBeVisible();
      
      // Verify functionality restored
      await page.goto('/checkout');
      await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible();
    });
  });
});