import { test as base, expect } from '@playwright/test';
import { mockDataUtils } from '../mocks/handlers.js';

// Extend base test with custom fixtures
export const test = base.extend({
  // API utilities fixture
  api: async ({ request }, use) => {
    const api = {
      // Authentication helpers
      async loginAsAdmin() {
        const response = await request.post('http://localhost:3000/api/auth/login', {
          data: {
            email: 'admin@graphene-store.com',
            password: 'admin123'
          }
        });
        
        const result = await response.json();
        if (result.success) {
          return {
            token: result.data.token,
            user: result.data.user,
            headers: {
              'Authorization': `Bearer ${result.data.token}`
            }
          };
        }
        throw new Error('Admin login failed');
      },

      async loginAsCustomer() {
        const response = await request.post('http://localhost:3000/api/auth/login', {
          data: {
            email: 'customer@example.com',
            password: 'password123'
          }
        });
        
        const result = await response.json();
        if (result.success) {
          return {
            token: result.data.token,
            user: result.data.user,
            headers: {
              'Authorization': `Bearer ${result.data.token}`
            }
          };
        }
        throw new Error('Customer login failed');
      },

      // Cart helpers
      async addToCart(productId, quantity = 1, headers = {}) {
        const response = await request.post('http://localhost:3000/api/cart/add', {
          data: { productId, quantity },
          headers
        });
        return response.json();
      },

      async getCart(headers = {}) {
        const response = await request.get('http://localhost:3000/api/cart', { headers });
        return response.json();
      },

      // Product helpers
      async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `http://localhost:3000/api/products${queryString ? `?${queryString}` : ''}`;
        const response = await request.get(url);
        return response.json();
      },

      async getProduct(slug) {
        const response = await request.get(`http://localhost:3000/api/products/${slug}`);
        return response.json();
      },

      // Payment helpers
      async getPaymentMethods() {
        const response = await request.get('http://localhost:3000/api/payments/methods');
        return response.json();
      },

      async createPayPalOrder(orderData, headers = {}) {
        const response = await request.post('http://localhost:3000/api/payments/paypal/create-order', {
          data: orderData,
          headers
        });
        return response.json();
      },

      async capturePayPalOrder(captureData, headers = {}) {
        const response = await request.post('http://localhost:3000/api/payments/paypal/capture', {
          data: captureData,
          headers
        });
        return response.json();
      },

      async createBitcoinPayment(paymentData, headers = {}) {
        const response = await request.post('http://localhost:3000/api/payments/bitcoin/create', {
          data: paymentData,
          headers
        });
        return response.json();
      },

      async getBitcoinPaymentStatus(orderId, headers = {}) {
        const response = await request.get(`http://localhost:3000/api/payments/bitcoin/status/${orderId}`, {
          headers
        });
        return response.json();
      },

      async createMoneroPayment(paymentData, headers = {}) {
        const response = await request.post('http://localhost:3000/api/payments/monero/create', {
          data: paymentData,
          headers
        });
        return response.json();
      },

      async getMoneroPaymentStatus(orderId, headers = {}) {
        const response = await request.get(`http://localhost:3000/api/payments/monero/status/${orderId}`, {
          headers
        });
        return response.json();
      },

      // Order helpers
      async getOrder(orderId, headers = {}) {
        const response = await request.get(`http://localhost:3000/api/orders/${orderId}`, { headers });
        return response.json();
      },

      // Admin helpers
      async getUsers(params = {}, headers = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `http://localhost:3000/api/admin/users${queryString ? `?${queryString}` : ''}`;
        const response = await request.get(url, { headers });
        return response.json();
      },

      async updateUserStatus(userId, status, headers = {}) {
        const response = await request.patch(`http://localhost:3000/api/admin/users/${userId}/status`, {
          data: { status },
          headers
        });
        return response.json();
      },

      // Health check
      async healthCheck() {
        const response = await request.get('http://localhost:3000/api/health');
        return response.json();
      }
    };

    await use(api);
  },

  // Mock data utilities fixture
  mockData: async ({}, use) => {
    await use(mockDataUtils);
  },

  // Common test data fixture
  testData: async ({}, use) => {
    const testData = {
      // Test users
      adminUser: {
        email: 'admin@graphene-store.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      },

      customerUser: {
        email: 'customer@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer'
      },

      // Test addresses
      validShippingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Test Street',
        addressLine2: 'Apt 4B',
        city: 'London',
        stateProvince: 'England',
        postalCode: 'SW1A 1AA',
        country: 'GB',
        phone: '+44 20 1234 5678'
      },

      invalidShippingAddress: {
        fullName: 'Test User',
        // Missing required fields
        city: 'London'
      },

      // Test products
      pixelPhone: {
        _id: 'product-pixel-7-pro',
        name: 'Google Pixel 7 Pro - GrapheneOS',
        slug: 'google-pixel-7-pro-grapheneos',
        price: 699.99
      },

      privacyService: {
        _id: 'service-privacy-setup',
        name: 'Privacy App Installation Service',
        slug: 'privacy-app-installation-service',
        price: 49.99
      },

      // Test orders
      sampleOrder: {
        shippingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Test Street',
          city: 'London',
          stateProvince: 'England',
          postalCode: 'SW1A 1AA',
          country: 'GB'
        },
        shippingMethodId: 'standard-shipping'
      }
    };

    await use(testData);
  }
});

// Re-export expect for convenience
export { expect };