import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import Cart from '../../models/Cart.js';
import Category from '../../models/Category.js';

describe('Comprehensive Error Handling E2E Tests', () => {
  let adminUser, customerUser, adminToken, customerToken;
  let testProduct;
  let testCategory;

  beforeAll(async () => {
    // Clear test data
    await User.deleteMany({ email: { $in: ['admin@error.test', 'customer@error.test'] } });
    await Product.deleteMany({ name: 'Error Test Product' });
    await Order.deleteMany({ orderId: { $regex: /^ERROR-TEST/ } });
    await Category.deleteMany({ slug: 'test-category' });

    // Create test category
    testCategory = await Category.create({
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test category for error handling'
    });

    // Create test users
    adminUser = await User.create({
      email: 'admin@error.test',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'Error',
      role: 'admin',
      isActive: true
    });

    customerUser = await User.create({
      email: 'customer@error.test',
      password: 'Customer123!',
      firstName: 'Customer',
      lastName: 'Error',
      role: 'customer',
      isActive: true
    });

    // Login and get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@error.test', password: 'Admin123!' });
    adminToken = adminLogin.body.data.token;

    const customerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer@error.test', password: 'Customer123!' });
    customerToken = customerLogin.body.data.token;

    // Create test product
    testProduct = await Product.create({
      name: 'Error Test Product',
      slug: 'error-test-product',
      sku: 'ERR001',
      price: 99.99,
      stock: 10,
      category: testCategory._id,
      isActive: true
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['admin@error.test', 'customer@error.test'] } });
    await Product.deleteMany({ name: 'Error Test Product' });
    await Order.deleteMany({ orderId: { $regex: /^ERROR-TEST/ } });
    if (customerUser && customerUser._id) {
      await Cart.deleteMany({ user: customerUser._id });
    }
    await Category.deleteMany({ slug: 'test-category' });
  });

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  describe('Database Connection Errors', () => {
    it('should handle database connection loss gracefully', async () => {
      // Temporarily close database connection
      const originalConnection = mongoose.connection;
      vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);

      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(503);
      expect(res.body.message).toContain('Service temporarily unavailable');

      // Restore connection
      vi.restoreAllMocks();
    });

    it('should handle database query timeouts', async () => {
      // Mock a slow query
      const originalFind = Product.find;
      Product.find = vi.fn().mockImplementation(() => ({
        exec: async () => {
          await new Promise(resolve => setTimeout(resolve, 30000));
          return [];
        }
      }));

      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .timeout(5000);

      expect(res.status).toBe(504);

      // Restore original method
      Product.find = originalFind;
    });

    it('should handle duplicate key errors', async () => {
      // Try to create user with existing email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'customer@error.test',
          password: 'Duplicate123!',
          confirmPassword: 'Duplicate123!'
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('Authentication and Authorization Errors', () => {
    it('should handle expired token errors', async () => {
      // Create an expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ZjRkZmY4MjkxMjM0NTY3ODkwMTIzNDUiLCJpYXQiOjE1OTg5MTg0MDIsImV4cCI6MTU5ODkxODQwM30.invalid';

      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid or expired token');
    });

    it('should handle malformed token errors', async () => {
      const malformedToken = 'not-a-valid-jwt-token';

      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${malformedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid token format');
    });

    it('should handle insufficient permissions', async () => {
      // Customer trying to access admin endpoint
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Insufficient permissions');
    });

    it('should handle account lockout after failed attempts', async () => {
      // Simulate multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'customer@error.test',
            password: 'WrongPassword!'
          });
      }

      // Next attempt should be locked
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'customer@error.test',
          password: 'Customer123!'
        });

      expect(res.status).toBe(429);
      expect(res.body.message).toContain('Too many failed attempts');
    });
  });

  describe('Validation and Input Errors', () => {
    it('should handle invalid input data types', async () => {
      const res = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: 'not-an-object-id',
          quantity: 'not-a-number'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors).toHaveProperty('productId');
      expect(res.body.errors).toHaveProperty('quantity');
    });

    it('should handle missing required fields', async () => {
      const res = await request(app)
        .post('/api/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          // Missing required fields
          paymentMethod: 'paypal'
        });

      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty('shippingAddress');
    });

    it('should handle oversized payload', async () => {
      // Create a very large payload
      const largeData = {
        description: 'x'.repeat(10 * 1024 * 1024) // 10MB string
      };

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(largeData);

      expect(res.status).toBe(413);
      expect(res.body.message).toContain('Payload too large');
    });

    it('should handle SQL injection attempts', async () => {
      const res = await request(app)
        .get('/api/products')
        .query({ search: '\'; DROP TABLE products; --' })
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200); // Should sanitize and handle safely
      expect(res.body.data).toBeDefined();
    });
  });

  describe('Business Logic Errors', () => {
    it('should handle insufficient stock errors', async () => {
      // Try to order more than available
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: testProduct._id,
          quantity: 20 // More than stock (10)
        });

      const res = await request(app)
        .post('/api/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'GB'
          },
          paymentMethod: 'paypal'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Insufficient stock');
    });

    it('should handle concurrent order conflicts', async () => {
      // Add product to cart for two users
      const customer2 = await User.create({
        email: 'customer2@error.test',
        password: 'Customer123!',
        firstName: 'Customer2',
        lastName: 'Error',
        role: 'customer',
        isActive: true
      });

      const customer2Login = await request(app)
        .post('/api/auth/login')
        .send({ email: 'customer2@error.test', password: 'Customer123!' });
      const customer2Token = customer2Login.body.data.token;

      // Both users add same product
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct._id, quantity: 8 });

      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ productId: testProduct._id, quantity: 8 });

      // Both try to order simultaneously
      const orderPromises = [
        request(app)
          .post('/api/user/orders')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            shippingAddress: {
              fullName: 'User 1',
              addressLine1: '123 Test St',
              city: 'Test City',
              postalCode: '12345',
              country: 'GB'
            },
            paymentMethod: 'paypal'
          }),
        request(app)
          .post('/api/user/orders')
          .set('Authorization', `Bearer ${customer2Token}`)
          .send({
            shippingAddress: {
              fullName: 'User 2',
              addressLine1: '456 Test Ave',
              city: 'Test City',
              postalCode: '54321',
              country: 'GB'
            },
            paymentMethod: 'bitcoin'
          })
      ];

      const results = await Promise.allSettled(orderPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 201);
      const failed = results.filter(r => r.status === 'fulfilled' && r.value.status === 400);

      expect(successful.length).toBe(1); // Only one should succeed
      expect(failed.length).toBe(1); // One should fail due to stock

      // Cleanup
      await User.deleteOne({ email: 'customer2@error.test' });
    });

    it('should handle order cancellation after payment', async () => {
      // Create a paid order
      const order = await Order.create({
        orderId: 'ERROR-TEST-PAID',
        user: customerUser._id,
        items: [{
          product: testProduct._id,
          name: testProduct.name,
          price: testProduct.price,
          quantity: 1
        }],
        totalAmount: testProduct.price,
        status: 'paid',
        paymentStatus: 'completed',
        shippingAddress: {
          fullName: 'Test User',
          addressLine1: '123 Test St',
          city: 'Test City',
          postalCode: '12345',
          country: 'GB'
        },
        paymentMethod: 'paypal'
      });

      // Try to cancel paid order
      const res = await request(app)
        .post(`/api/user/orders/${order._id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot cancel paid order');
    });
  });

  describe('External Service Errors', () => {
    it('should handle payment gateway timeout', async () => {
      // Mock payment service timeout
      vi.mock('../../services/paypalService.js', () => ({
        createOrder: vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 30000));
        })
      }));

      // Add to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct._id, quantity: 1 });

      // Create order
      const orderRes = await request(app)
        .post('/api/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'GB'
          },
          paymentMethod: 'paypal'
        });

      const res = await request(app)
        .post('/api/payments/paypal/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: orderRes.body.data.orderId })
        .timeout(5000);

      expect(res.status).toBe(504);
      expect(res.body.message).toContain('Gateway timeout');
    });

    it('should handle third-party API rate limits', async () => {
      // Simulate rate limiting
      let requestCount = 0;
      vi.mock('../../services/emailService.js', () => ({
        sendEmail: vi.fn().mockImplementation(async () => {
          requestCount++;
          if (requestCount > 3) {
            const error = new Error('Rate limit exceeded');
            error.statusCode = 429;
            throw error;
          }
          return { messageId: `msg-${requestCount}` };
        })
      }));

      // Make multiple requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'customer@error.test' })
        );
      }

      const results = await Promise.allSettled(promises);
      const rateLimited = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      );

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Filesystem and Resource Errors', () => {
    it('should handle file upload errors', async () => {
      const res = await request(app)
        .post('/api/admin/products/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', Buffer.from('corrupted data'), {
          filename: 'products.csv',
          contentType: 'text/csv'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid file format');
    });

    it('should handle disk space errors', async () => {
      // Mock disk space error
      vi.mock('fs/promises', async (importOriginal) => {
        const actual = await importOriginal();
        return {
          ...actual,
          writeFile: vi.fn().mockRejectedValue(new Error('ENOSPC: no space left on device'))
        };
      });

      const res = await request(app)
        .post('/api/admin/reports/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reportType: 'sales', format: 'pdf' });

      expect(res.status).toBe(507);
      expect(res.body.message).toContain('Insufficient storage');
    });
  });

  describe('Cascading Error Scenarios', () => {
    it('should handle cascading payment failures', async () => {
      // Mock multiple service failures
      vi.mock('../../services/paypalService.js', () => ({
        createOrder: vi.fn().mockRejectedValue(new Error('PayPal unavailable'))
      }));
      vi.mock('../../services/bitcoinService.js', () => ({
        createPaymentAddress: vi.fn().mockRejectedValue(new Error('Bitcoin network error'))
      }));

      // Add to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct._id, quantity: 1 });

      // Create order
      const orderRes = await request(app)
        .post('/api/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'GB'
          },
          paymentMethod: 'paypal'
        });

      const orderId = orderRes.body.data.orderId;

      // Try PayPal - should fail
      const paypalRes = await request(app)
        .post('/api/payments/paypal/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId });

      expect(paypalRes.status).toBe(500);

      // Update to Bitcoin
      await request(app)
        .put(`/api/user/orders/${orderId}/payment-method`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ paymentMethod: 'bitcoin' });

      // Try Bitcoin - should also fail
      const btcRes = await request(app)
        .post('/api/payments/bitcoin/initialize')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId });

      expect(btcRes.status).toBe(500);

      // Order should be in failed state
      const order = await Order.findOne({ orderId });
      expect(order.status).toBe('payment_failed');
    });

    it('should maintain data consistency during multi-step failures', async () => {
      // Start a complex operation that fails midway
      const res = await request(app)
        .post('/api/admin/products/bulk-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          updates: [
            { id: testProduct._id, price: 149.99 },
            { id: 'invalid-id', price: 199.99 }, // This will fail
            { id: mongoose.Types.ObjectId(), price: 99.99 }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Bulk update failed');

      // Verify original product unchanged
      const product = await Product.findById(testProduct._id);
      expect(product.price).toBe(99.99); // Original price
    });
  });
});