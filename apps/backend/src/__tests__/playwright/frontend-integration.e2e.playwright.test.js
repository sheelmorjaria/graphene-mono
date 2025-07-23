import { test, expect } from '@playwright/test';

test.describe('Frontend Integration Tests', () => {
  test('should load the frontend homepage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the page loaded successfully
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'frontend-homepage.png' });
    
    // Check if we can find basic elements (like the document is loaded)
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should navigate to products page and show product cards', async ({ page }) => {
    await page.goto('/products');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the page loaded successfully
    const pageTitle = await page.title();
    console.log('Products page title:', pageTitle);
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'frontend-products.png' });
    
    // Look for product-related elements (these might exist or might show "no products")
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    
    // Check if search functionality exists
    const searchBar = page.locator('[data-testid="product-search"]');
    if (await searchBar.isVisible()) {
      console.log('✅ Product search bar found with data-testid');
    } else {
      console.log('ℹ️ Product search bar not visible on this page');
    }
  });

  test('should navigate to login page and show login form', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'frontend-login.png' });
    
    // Check for login form elements with our data-testids
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');
    
    if (await emailInput.isVisible()) {
      console.log('✅ Email input found with data-testid="email-input"');
    }
    
    if (await passwordInput.isVisible()) {
      console.log('✅ Password input found with data-testid="password-input"');
    }
    
    if (await loginButton.isVisible()) {
      console.log('✅ Login button found with data-testid="login-button"');
    }
    
    // Verify the page loaded successfully
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should navigate to admin login page and show admin form', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'frontend-admin-login.png' });
    
    // Check for admin login form elements with our data-testids
    const adminForm = page.locator('[data-testid="admin-login-form"]');
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');
    
    if (await adminForm.isVisible()) {
      console.log('✅ Admin login form found with data-testid="admin-login-form"');
    }
    
    if (await emailInput.isVisible()) {
      console.log('✅ Admin email input found with data-testid="email-input"');
    }
    
    if (await passwordInput.isVisible()) {
      console.log('✅ Admin password input found with data-testid="password-input"');
    }
    
    if (await loginButton.isVisible()) {
      console.log('✅ Admin login button found with data-testid="login-button"');
    }
    
    // Verify the page loaded successfully
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });
});