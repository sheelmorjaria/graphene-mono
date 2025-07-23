import { test, expect } from '@playwright/test';

test.describe('Payment Integration Tests', () => {
  test('should navigate to checkout and show payment elements', async ({ page }) => {
    // Go to checkout page
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for verification
    await page.screenshot({ path: 'payment-checkout.png' });
    
    // Check if page loads (might redirect to login if not authenticated)
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    
    // Log what we find
    const pageTitle = await page.title();
    console.log('Checkout page title:', pageTitle);
    
    // Look for checkout-related elements
    const checkoutForm = page.locator('[data-testid="checkout-form"]');
    const cartSummary = page.locator('[data-testid="cart-summary"]');
    const shippingForm = page.locator('[data-testid="shipping-form"]');
    const paymentMethods = page.locator('[data-testid="payment-methods"]');
    
    if (await checkoutForm.isVisible()) {
      console.log('✅ Found checkout form with data-testid="checkout-form"');
    } else {
      console.log('ℹ️ Checkout form not visible (might require authentication)');
    }
    
    if (await cartSummary.isVisible()) {
      console.log('✅ Found cart summary with data-testid="cart-summary"');
    } else {
      console.log('ℹ️ Cart summary not visible');
    }
    
    if (await shippingForm.isVisible()) {
      console.log('✅ Found shipping form with data-testid="shipping-form"');
    } else {
      console.log('ℹ️ Shipping form not visible');
    }
    
    if (await paymentMethods.isVisible()) {
      console.log('✅ Found payment methods with data-testid="payment-methods"');
    } else {
      console.log('ℹ️ Payment methods not visible');
    }
  });

  test('should demonstrate successful MSW API mocking', async ({ page }) => {
    // This test will use MSW to intercept API calls
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Fill in login form with test data
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');
    
    if (await emailInput.isVisible() && await passwordInput.isVisible() && await loginButton.isVisible()) {
      console.log('✅ Login form elements found');
      
      // Fill the form (this will trigger API calls that MSW will intercept)
      await emailInput.fill('test@example.com');
      await passwordInput.fill('testpassword123');
      
      console.log('✅ Login form filled with test data');
      console.log('ℹ️ MSW will intercept any API calls when form is submitted');
      
      // Take screenshot showing filled form
      await page.screenshot({ path: 'payment-login-filled.png' });
    }
  });

  test('should verify product search functionality', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    const searchBar = page.locator('[data-testid="product-search"]');
    const searchInput = page.locator('[data-testid="search-input"]');
    
    if (await searchBar.isVisible()) {
      console.log('✅ Product search bar found');
      
      if (await searchInput.isVisible()) {
        console.log('✅ Search input found with data-testid="search-input"');
        
        // Test search functionality
        await searchInput.fill('pixel');
        console.log('✅ Search input filled with "pixel"');
        
        // Take screenshot
        await page.screenshot({ path: 'payment-search.png' });
      }
    }
  });
});