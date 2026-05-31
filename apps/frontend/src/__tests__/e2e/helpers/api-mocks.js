import { test as base, expect } from '@playwright/test';
import { testUser, testProducts, testProductDetail, testOrders, testCartItems, testCart } from '../fixtures/test-data.js';

/**
 * Extended Playwright test fixture with API route mocking helpers.
 */
export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/');
    await page.evaluate((token) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify({
        _id: 'user-e2e-001',
        firstName: 'E2E',
        lastName: 'Tester',
        email: 'e2e-test@example.com',
        role: 'customer',
      }));
    }, 'mock-jwt-token-e2e');
    await use(page);
  },
});

export { expect };

/**
 * Set up auth tokens in localStorage.
 * Uses addInitScript to set tokens BEFORE the first page load.
 * Must be called BEFORE the first page.goto().
 */
export async function setAuthTokens(page) {
  await page.addInitScript(() => {
    localStorage.setItem('authToken', 'mock-jwt-token-e2e');
    localStorage.setItem('user', JSON.stringify({
      _id: 'user-e2e-001',
      firstName: 'E2E',
      lastName: 'Tester',
      email: 'e2e-test@example.com',
      role: 'customer',
    }));
  });
}

/**
 * For tests that have already navigated and need to set auth tokens.
 * Sets localStorage directly and reloads the page.
 */
export async function setAuthTokensOnLoadedPage(page) {
  await page.evaluate(() => {
    localStorage.setItem('authToken', 'mock-jwt-token-e2e');
    localStorage.setItem('user', JSON.stringify({
      _id: 'user-e2e-001',
      firstName: 'E2E',
      lastName: 'Tester',
      email: 'e2e-test@example.com',
      role: 'customer',
    }));
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
}

/**
 * Mock API routes on a Playwright page.
 */
export function mockApiRoutes(page) {
  // Auth - response format: { success: true, data: { token, user } }
  page.route('**/api/auth/register', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          token: 'mock-jwt-token-e2e',
          user: { _id: 'user-e2e-001', firstName: testUser.firstName, lastName: testUser.lastName, email: testUser.email },
        },
      }),
    })
  );

  page.route('**/api/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          token: 'mock-jwt-token-e2e',
          user: { _id: 'user-e2e-001', firstName: 'E2E', lastName: 'Tester', email: testUser.email },
        },
      }),
    })
  );

  page.route('**/api/auth/profile', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { user: { _id: 'user-e2e-001', firstName: 'E2E', lastName: 'Tester', email: testUser.email, phone: testUser.phone } },
        }),
      });
    }
    // PUT request for profile update
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'Profile updated successfully' }),
    });
  });

  page.route('**/api/auth/logout', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
  );

  page.route('**/api/auth/password', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'Password updated' }) })
  );

  // Products - response format: { success: true, data: [...], pagination }
  page.route('**/api/products?**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: testProducts,
        pagination: { page: 1, limit: 12, total: testProducts.length, pages: 1 },
      }),
    })
  );

  // Product detail - response format: { success: true, data: { product } }
  page.route(`**/api/products/${testProductDetail.slug}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: testProductDetail }),
    })
  );

  // Cart - response format: { success: true, data: { cart: { items, totalItems, totalAmount, itemCount } } }
  page.route('**/api/cart', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { cart: testCart },
        }),
      });
    }
    return route.continue();
  });

  page.route('**/api/cart/add', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          cart: testCart,
          addedItem: testCartItems[0],
        },
      }),
    })
  );

  page.route('**/api/cart/item/**', (route) => {
    if (route.request().method() === 'DELETE') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { cart: { items: [], totalItems: 0, totalAmount: 0, itemCount: 0 } } }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { cart: testCart } }),
    });
  });

  page.route('**/api/cart/clear', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { cart: { items: [], totalItems: 0, totalAmount: 0, itemCount: 0 } } }),
    })
  );

  // Orders - response format: { success: true, data: { orders, pagination } }
  page.route('**/api/user/orders?**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          orders: testOrders,
          pagination: { page: 1, limit: 10, total: testOrders.length, pages: 1 },
        },
      }),
    })
  );

  // Order detail (specific order ID) - matches before the list pattern
  page.route('**/api/user/orders/order-001', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { order: testOrders[0] } }),
    })
  );

  // Return requests - OrderDetailsPage calls this
  page.route('**/api/user/returns**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { returns: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } } }),
    })
  );

  page.route('**/api/user/orders/place-order', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          order: {
            _id: 'order-new-001',
            orderNumber: 'GS-2024-NEW',
            status: 'pending',
            totalAmount: 699.99,
            items: testCartItems,
          },
        },
      }),
    })
  );

  // Payment methods
  page.route('**/api/payments/methods', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        methods: [
          { id: 'paypal', name: 'PayPal', enabled: true },
        ],
      }),
    })
  );

  // PayPal
  page.route('**/api/payments/paypal/create-order', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { orderID: 'paypal-order-e2e-001' } }),
    })
  );

  page.route('**/api/payments/paypal/capture', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { captureID: 'paypal-capture-e2e-001' } }),
    })
  );

  // Shipping
  page.route('**/api/shipping/calculate', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        options: [
          { id: 'standard', name: 'Standard Delivery', price: 0, estimatedDays: '3-5' },
          { id: 'express', name: 'Express Delivery', price: 9.99, estimatedDays: '1-2' },
        ],
      }),
    })
  );

  // Addresses
  page.route('**/api/user/addresses', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { addresses: [] } }),
      });
    }
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { address: { _id: 'addr-new-001' } } }),
    });
  });
}
