import { expect } from '@playwright/test';

/**
 * Page object model utilities for Playwright tests
 */

export class PaymentTestHelpers {
  constructor(page) {
    this.page = page;
  }

  // Navigation helpers
  async navigateToProducts() {
    await this.page.goto('/products');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToCart() {
    await this.page.goto('/cart');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToCheckout() {
    await this.page.goto('/checkout');
    await this.page.waitForLoadState('networkidle');
  }

  // Product interaction helpers
  async addProductToCart(productSlug, quantity = 1) {
    await this.page.goto(`/products/${productSlug}`);
    await this.page.waitForLoadState('networkidle');
    
    // Set quantity if different from 1
    if (quantity !== 1) {
      await this.page.fill('[data-testid="quantity-input"]', quantity.toString());
    }
    
    // Click add to cart button
    await this.page.click('[data-testid="add-to-cart-button"]');
    
    // Wait for success notification
    await this.page.waitForSelector('[data-testid="cart-success-message"]', { 
      timeout: 5000 
    });
  }

  // Cart helpers
  async verifyCartContents(expectedItems) {
    for (const item of expectedItems) {
      const itemSelector = `[data-testid="cart-item-${item.productId}"]`;
      await expect(this.page.locator(itemSelector)).toBeVisible();
      
      if (item.quantity) {
        const quantitySelector = `${itemSelector} [data-testid="item-quantity"]`;
        await expect(this.page.locator(quantitySelector)).toHaveText(item.quantity.toString());
      }
      
      if (item.price) {
        const priceSelector = `${itemSelector} [data-testid="item-price"]`;
        await expect(this.page.locator(priceSelector)).toContainText(item.price.toString());
      }
    }
  }

  async proceedToCheckout() {
    await this.page.click('[data-testid="checkout-button"]');
    await this.page.waitForLoadState('networkidle');
  }

  // Checkout form helpers
  async fillShippingAddress(address) {
    await this.page.fill('[data-testid="shipping-fullname"]', address.fullName);
    await this.page.fill('[data-testid="shipping-address1"]', address.addressLine1);
    
    if (address.addressLine2) {
      await this.page.fill('[data-testid="shipping-address2"]', address.addressLine2);
    }
    
    await this.page.fill('[data-testid="shipping-city"]', address.city);
    await this.page.fill('[data-testid="shipping-state"]', address.stateProvince);
    await this.page.fill('[data-testid="shipping-postal"]', address.postalCode);
    await this.page.selectOption('[data-testid="shipping-country"]', address.country);
    
    if (address.phone) {
      await this.page.fill('[data-testid="shipping-phone"]', address.phone);
    }
  }

  async selectShippingMethod(methodId) {
    await this.page.click(`[data-testid="shipping-method-${methodId}"]`);
  }

  // Payment method selection
  async selectPaymentMethod(paymentType) {
    await this.page.click(`[data-testid="payment-method-${paymentType}"]`);
  }

  // PayPal payment flow
  async completePayPalPayment(shippingAddress) {
    await this.fillShippingAddress(shippingAddress);
    await this.selectShippingMethod('standard');
    await this.selectPaymentMethod('paypal');
    
    // Click PayPal checkout button
    await this.page.click('[data-testid="paypal-checkout-button"]');
    
    // Wait for PayPal order creation
    await this.page.waitForSelector('[data-testid="paypal-approval-link"]', { 
      timeout: 10000 
    });
    
    // In a real test, you might navigate to PayPal and complete the flow
    // For this mock, we'll simulate the approval
    const approvalUrl = await this.page.getAttribute('[data-testid="paypal-approval-link"]', 'href');
    expect(approvalUrl).toContain('paypal.com');
    
    // Simulate PayPal approval by directly calling capture
    const orderId = await this.page.getAttribute('[data-testid="order-id"]', 'data-order-id');
    const paypalOrderId = await this.page.getAttribute('[data-testid="paypal-order-id"]', 'data-paypal-order-id');
    
    // Click capture button (simulating return from PayPal)
    await this.page.click('[data-testid="paypal-capture-button"]');
    
    // Wait for payment confirmation
    await this.page.waitForSelector('[data-testid="payment-success"]', { 
      timeout: 10000 
    });
    
    return { orderId, paypalOrderId };
  }

  // Bitcoin payment flow
  async initiateBitcoinPayment(orderId) {
    await this.selectPaymentMethod('bitcoin');
    
    // Click Bitcoin payment button
    await this.page.click('[data-testid="bitcoin-payment-button"]');
    
    // Wait for Bitcoin address generation
    await this.page.waitForSelector('[data-testid="bitcoin-address"]', { 
      timeout: 10000 
    });
    
    // Verify Bitcoin payment details are displayed
    await expect(this.page.locator('[data-testid="bitcoin-address"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="bitcoin-amount"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="bitcoin-qr-code"]')).toBeVisible();
    
    const bitcoinAddress = await this.page.textContent('[data-testid="bitcoin-address"]');
    const btcAmount = await this.page.textContent('[data-testid="bitcoin-amount"]');
    
    return { bitcoinAddress, btcAmount };
  }

  async checkBitcoinPaymentStatus(orderId) {
    await this.page.click('[data-testid="check-payment-status"]');
    
    // Wait for status update
    await this.page.waitForSelector('[data-testid="payment-status"]', { 
      timeout: 5000 
    });
    
    const status = await this.page.textContent('[data-testid="payment-status"]');
    return status;
  }

  // Monero payment flow
  async initiateMoneroPayment(orderId) {
    await this.selectPaymentMethod('monero');
    
    // Click Monero payment button
    await this.page.click('[data-testid="monero-payment-button"]');
    
    // Wait for Monero address generation
    await this.page.waitForSelector('[data-testid="monero-address"]', { 
      timeout: 10000 
    });
    
    // Verify Monero payment details are displayed
    await expect(this.page.locator('[data-testid="monero-address"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="monero-amount"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="monero-payment-url"]')).toBeVisible();
    
    const moneroAddress = await this.page.textContent('[data-testid="monero-address"]');
    const xmrAmount = await this.page.textContent('[data-testid="monero-amount"]');
    const paymentUrl = await this.page.getAttribute('[data-testid="monero-payment-url"]', 'href');
    
    return { moneroAddress, xmrAmount, paymentUrl };
  }

  // Order verification helpers
  async verifyOrderDetails(expectedOrder) {
    await expect(this.page.locator('[data-testid="order-number"]')).toContainText(expectedOrder.orderNumber);
    await expect(this.page.locator('[data-testid="order-total"]')).toContainText(expectedOrder.totalAmount.toString());
    await expect(this.page.locator('[data-testid="order-status"]')).toContainText(expectedOrder.status);
  }

  // Error handling helpers
  async expectErrorMessage(expectedMessage) {
    await expect(this.page.locator('[data-testid="error-message"]')).toContainText(expectedMessage);
  }

  async expectSuccessMessage(expectedMessage) {
    await expect(this.page.locator('[data-testid="success-message"]')).toContainText(expectedMessage);
  }

  // Waiting helpers
  async waitForPaymentProcessing() {
    await this.page.waitForSelector('[data-testid="payment-processing"]', { 
      timeout: 5000 
    });
    await this.page.waitForSelector('[data-testid="payment-processing"]', { 
      state: 'hidden', 
      timeout: 30000 
    });
  }

  async waitForOrderConfirmation() {
    await this.page.waitForSelector('[data-testid="order-confirmation"]', { 
      timeout: 15000 
    });
  }
}

export class AdminTestHelpers {
  constructor(page) {
    this.page = page;
  }

  // Navigation helpers
  async navigateToAdminDashboard() {
    await this.page.goto('/admin');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToUserManagement() {
    await this.page.goto('/admin/users');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToOrderManagement() {
    await this.page.goto('/admin/orders');
    await this.page.waitForLoadState('networkidle');
  }

  // Authentication helpers
  async loginAsAdmin(credentials) {
    await this.page.goto('/admin/login');
    await this.page.fill('[data-testid="email-input"]', credentials.email);
    await this.page.fill('[data-testid="password-input"]', credentials.password);
    await this.page.click('[data-testid="login-button"]');
    
    // Wait for redirect to admin dashboard
    await this.page.waitForURL('/admin', { timeout: 10000 });
  }

  // User management helpers
  async searchUsers(searchTerm) {
    await this.page.fill('[data-testid="user-search"]', searchTerm);
    await this.page.press('[data-testid="user-search"]', 'Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async updateUserStatus(userId, status) {
    const userRow = `[data-testid="user-row-${userId}"]`;
    await this.page.click(`${userRow} [data-testid="status-dropdown"]`);
    await this.page.click(`[data-testid="status-option-${status}"]`);
    
    // Wait for confirmation
    await this.page.waitForSelector('[data-testid="status-update-success"]', { 
      timeout: 5000 
    });
  }

  async verifyUserInList(user) {
    const userRow = `[data-testid="user-row-${user.id}"]`;
    await expect(this.page.locator(userRow)).toBeVisible();
    await expect(this.page.locator(`${userRow} [data-testid="user-email"]`)).toContainText(user.email);
    await expect(this.page.locator(`${userRow} [data-testid="user-status"]`)).toContainText(user.status);
  }

  // Order management helpers
  async searchOrders(searchTerm) {
    await this.page.fill('[data-testid="order-search"]', searchTerm);
    await this.page.press('[data-testid="order-search"]', 'Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async viewOrderDetails(orderId) {
    await this.page.click(`[data-testid="view-order-${orderId}"]`);
    await this.page.waitForLoadState('networkidle');
  }

  async updateOrderStatus(orderId, status) {
    const orderRow = `[data-testid="order-row-${orderId}"]`;
    await this.page.click(`${orderRow} [data-testid="status-dropdown"]`);
    await this.page.click(`[data-testid="status-option-${status}"]`);
    
    // Wait for confirmation
    await this.page.waitForSelector('[data-testid="order-status-update-success"]', { 
      timeout: 5000 
    });
  }
}

// Utility functions
export const testUtils = {
  // Generate test data
  generateTestEmail: () => `test-${Date.now()}@example.com`,
  generateTestOrderNumber: () => `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  
  // Wait helpers
  async waitForApiResponse(page, url, timeout = 10000) {
    return page.waitForResponse(response => 
      response.url().includes(url) && response.status() === 200, 
      { timeout }
    );
  },

  // Network helpers
  async interceptApiCall(page, url, mockResponse) {
    await page.route(url, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse)
      });
    });
  },

  // Screenshot helpers
  async takeScreenshot(page, name) {
    await page.screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  },

  // Accessibility helpers
  async checkAccessibility(page) {
    // Add accessibility checks using axe-core if needed
    // This is a placeholder for accessibility testing
    const title = await page.title();
    expect(title).toBeTruthy();
  },

  // Performance helpers
  async measurePageLoadTime(page, url) {
    const startTime = Date.now();
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    
    return endTime - startTime;
  }
};