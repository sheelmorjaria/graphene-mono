import { chromium } from 'playwright';

(async () => {
  console.log('🚀 Starting simple frontend test...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('📍 Navigating to frontend...');
    await page.goto('http://localhost:3002');
    
    console.log('⏳ Waiting for page load...');
    await page.waitForLoadState('networkidle');
    
    console.log('📄 Getting page title...');
    const title = await page.title();
    console.log('✅ Page title:', title);
    
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'frontend-test.png' });
    
    console.log('🔍 Looking for data-testid elements...');
    
    // Try to navigate to login page
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:3002/login');
    await page.waitForLoadState('networkidle');
    
    // Check for our data-testid elements
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    const loginButton = page.locator('[data-testid="login-button"]');
    
    if (await emailInput.isVisible()) {
      console.log('✅ Found email input with data-testid="email-input"');
    } else {
      console.log('❌ Email input with data-testid="email-input" not found');
    }
    
    if (await passwordInput.isVisible()) {
      console.log('✅ Found password input with data-testid="password-input"');
    } else {
      console.log('❌ Password input with data-testid="password-input" not found');
    }
    
    if (await loginButton.isVisible()) {
      console.log('✅ Found login button with data-testid="login-button"');
    } else {
      console.log('❌ Login button with data-testid="login-button" not found');
    }
    
    await page.screenshot({ path: 'frontend-login-test.png' });
    
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();