import { test, expect } from '@playwright/test';

test.describe('Basic Setup Tests', () => {
  test('should verify MSW mocking works', async ({ request }) => {
    // Test MSW API mocking without needing a real server
    const response = await request.get('http://localhost:3000/api/health');
    
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.status).toBe('healthy');
  });

  test('should handle payment methods endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/payments/methods');
    
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.paymentMethods).toHaveLength(3);
    
    const paymentMethods = result.data.paymentMethods;
    const methodNames = paymentMethods.map(m => m.name);
    expect(methodNames).toContain('PayPal');
    expect(methodNames).toContain('Bitcoin');
    expect(methodNames).toContain('Monero');
  });

  test('should handle products endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/products');
    
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.products).toHaveLength(3);
    
    const products = result.data.products;
    expect(products[0]).toHaveProperty('name');
    expect(products[0]).toHaveProperty('price');
    expect(products[0]).toHaveProperty('slug');
  });

  test('should handle authentication', async ({ request }) => {
    // Test admin login
    const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        email: 'admin@graphene-store.com',
        password: 'admin123'
      }
    });
    
    const loginResult = await loginResponse.json();
    expect(loginResult.success).toBe(true);
    expect(loginResult.data.user.role).toBe('admin');
    expect(loginResult.data.token).toBeTruthy();
  });

  test('should handle cart operations', async ({ request }) => {
    // Add item to cart
    const addResponse = await request.post('http://localhost:3000/api/cart/add', {
      data: {
        productId: 'product-pixel-7-pro',
        quantity: 1
      },
      headers: {
        'x-session-id': 'test-session-123'
      }
    });
    
    const addResult = await addResponse.json();
    expect(addResult.success).toBe(true);
    expect(addResult.data.cart.items).toHaveLength(1);
    expect(addResult.data.cart.totalAmount).toBe(699.99);
    
    // Get cart
    const getResponse = await request.get('http://localhost:3000/api/cart', {
      headers: {
        'x-session-id': 'test-session-123'
      }
    });
    
    const getResult = await getResponse.json();
    expect(getResult.success).toBe(true);
    expect(getResult.data.cart.items).toHaveLength(1);
  });
});