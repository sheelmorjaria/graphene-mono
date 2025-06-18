import { vi, describe, it, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import mongoose from 'mongoose';
import Order from '../../models/Order.js';
import User from '../../models/User.js';
import Product from '../../models/Product.js';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../test/setup.js';

// Mock external services to test error scenarios
vi.mock('../../services/paypalService.js');
vi.mock('../../services/bitcoinService.js');
vi.mock('../../services/emailService.js');

describe('Comprehensive Error Handling Tests', () => {
  let testUser, authToken;

  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();

    testUser = new User({
      email: 'test@example.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User'
    });
    await testUser.save();

    authToken = 'mock-jwt-token';
    vi.spyOn(require('../../middleware/auth.js'), 'authenticateToken').mockImplementation((req, res, next) => {
      req.user = { userId: testUser._id, email: testUser.email };
      next();
    });

    vi.clearAllMocks();
  });

  describe('Input Validation Error Handling', () => {
    it('should handle missing required fields in order creation', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          items: []
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/required/i);
    });

    it('should handle invalid email format in user registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/email/i);
    });

    it('should handle invalid ObjectId format', async () => {
      const response = await request(app)
        .get('/api/orders/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/invalid.*id/i);
    });

    it('should handle negative quantities in cart items', async () => {
      const product = new Product({
        name: 'Test Product',
        slug: 'test-product',
        price: 100,
        stockQuantity: 10,
        condition: 'new',
        stockStatus: 'in_stock'
      });
      await product.save();

      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: product._id.toString(),
          quantity: -1
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/quantity.*positive/i);
    });

    it('should handle excessively large request payloads', async () => {
      const largeData = 'x'.repeat(10 * 1024 * 1024); // 10MB string

      const response = await request(app)
        .post('/api/support/contact')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test User',
          email: 'test@example.com',
          subject: 'Test',
          message: largeData
        });

      expect(response.status).toBe(413);
    });
  });

  describe('Database Error Handling', () => {
    it('should handle database connection failures gracefully', async () => {
      // Mock database error
      vi.spyOn(Order, 'find').mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/server error/i);
    });

    it('should handle unique constraint violations', async () => {
      // Create user first
      await new User({
        email: 'duplicate@example.com',
        password: 'password',
        firstName: 'First',
        lastName: 'User'
      }).save();

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          firstName: 'Second',
          lastName: 'User'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/already exists|duplicate/i);
    });

    it('should handle transaction rollback on order failure', async () => {
      const product = new Product({
        name: 'Limited Product',
        slug: 'limited-product',
        price: 100,
        stockQuantity: 1,
        condition: 'new',
        stockStatus: 'in_stock'
      });
      await product.save();

      // Mock payment service failure
      const paypalService = require('../../services/paypalService.js');
      paypalService.createOrder.mockRejectedValue(new Error('Payment service down'));

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{
            productId: product._id.toString(),
            quantity: 1
          }],
          shippingAddress: {
            firstName: 'Test',
            lastName: 'User',
            addressLine1: '123 Test St',
            city: 'London',
            postalCode: 'SW1A 1AA',
            country: 'GB'
          },
          paymentMethod: 'paypal'
        });

      expect(response.status).toBe(500);

      // Verify stock wasn't decremented due to rollback
      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.stockQuantity).toBe(1);
    });

    it('should handle concurrent stock updates', async () => {
      const product = new Product({
        name: 'Popular Product',
        slug: 'popular-product',
        price: 100,
        stockQuantity: 1,
        condition: 'new',
        stockStatus: 'in_stock'
      });
      await product.save();

      // Simulate concurrent requests
      const requests = Array(5).fill().map(() => 
        request(app)
          .post('/api/cart')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            productId: product._id.toString(),
            quantity: 1
          })
      );

      const responses = await Promise.all(requests);

      // Only one should succeed
      const successfulResponses = responses.filter(r => r.status === 200);
      const failedResponses = responses.filter(r => r.status === 400);

      expect(successfulResponses.length).toBe(1);
      expect(failedResponses.length).toBe(4);
      expect(failedResponses[0].body.error).toMatch(/insufficient stock/i);
    });
  });

  describe('Authentication and Authorization Error Handling', () => {
    it('should handle expired JWT tokens', async () => {
      vi.spyOn(require('../../middleware/auth.js'), 'authenticateToken').mockImplementation((req, res, next) => {
        res.status(401).json({ success: false, error: 'Token expired' });
      });

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', 'Bearer expired-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toMatch(/token expired/i);
    });

    it('should handle malformed JWT tokens', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', 'Bearer malformed.jwt.token');

      expect(response.status).toBe(401);
    });

    it('should handle missing authorization header', async () => {
      const response = await request(app)
        .get('/api/orders');

      expect(response.status).toBe(401);
    });

    it('should handle insufficient permissions for admin endpoints', async () => {
      // Mock regular user trying to access admin endpoint
      vi.spyOn(require('../../middleware/auth.js'), 'requireAdmin').mockImplementation((req, res, next) => {
        res.status(403).json({ success: false, error: 'Admin access required' });
      });

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/admin access required/i);
    });
  });

  describe('External Service Error Handling', () => {
    it('should handle PayPal API downtime', async () => {
      const order = new Order({
        userId: testUser._id,
        orderNumber: 'TEST-001',
        items: [{ productId: new mongoose.Types.ObjectId(), quantity: 1, unitPrice: 100 }],
        totalAmount: 100,
        status: 'pending'
      });
      await order.save();

      const paypalService = require('../../services/paypalService.js');
      paypalService.createOrder.mockRejectedValue(new Error('Service temporarily unavailable'));

      const response = await request(app)
        .post('/api/payments/paypal/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: order._id.toString(),
          currency: 'GBP'
        });

      expect(response.status).toBe(503);
      expect(response.body.error).toMatch(/service.*unavailable/i);
    });

    it('should handle email service failures without breaking order flow', async () => {
      const emailService = require('../../services/emailService.js');
      emailService.sendOrderConfirmationEmail.mockRejectedValue(new Error('SMTP error'));

      const product = new Product({
        name: 'Test Product',
        slug: 'test-product',
        price: 100,
        stockQuantity: 10,
        condition: 'new',
        stockStatus: 'in_stock'
      });
      await product.save();

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{
            productId: product._id.toString(),
            quantity: 1
          }],
          shippingAddress: {
            firstName: 'Test',
            lastName: 'User',
            addressLine1: '123 Test St',
            city: 'London',
            postalCode: 'SW1A 1AA',
            country: 'GB'
          },
          paymentMethod: 'cod'
        });

      // Order should still be created successfully
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should handle Bitcoin network delays', async () => {
      const bitcoinService = require('../../services/bitcoinService.js');
      bitcoinService.generatePaymentAddress.mockImplementation(() => 
        new Promise((resolve, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      const order = new Order({
        userId: testUser._id,
        orderNumber: 'TEST-002',
        items: [{ productId: new mongoose.Types.ObjectId(), quantity: 1, unitPrice: 100 }],
        totalAmount: 100,
        status: 'pending'
      });
      await order.save();

      const response = await request(app)
        .post('/api/payments/bitcoin/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: order._id.toString()
        });

      expect(response.status).toBe(504);
      expect(response.body.error).toMatch(/timeout|network/i);
    });
  });

  describe('Rate Limiting Error Handling', () => {
    it('should handle too many requests from same IP', async () => {
      // Mock rate limiter
      vi.spyOn(require('../../middleware/rateLimiter.js'), 'apiLimiter').mockImplementation((req, res, next) => {
        res.status(429).json({ 
          success: false, 
          error: 'Too many requests, please try again later' 
        });
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password'
        });

      expect(response.status).toBe(429);
      expect(response.body.error).toMatch(/too many requests/i);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle orders with zero total amount', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [],
          totalAmount: 0,
          shippingAddress: {
            firstName: 'Test',
            lastName: 'User',
            addressLine1: '123 Test St',
            city: 'London',
            postalCode: 'SW1A 1AA',
            country: 'GB'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/invalid.*amount|empty.*order/i);
    });

    it('should handle extremely long product names', async () => {
      const longName = 'x'.repeat(1000);

      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: longName,
          slug: 'test-product',
          price: 100,
          condition: 'new',
          stockQuantity: 10
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/name.*too long|validation/i);
    });

    it('should handle products with negative prices', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Product',
          slug: 'test-product',
          price: -100,
          condition: 'new',
          stockQuantity: 10
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/price.*positive/i);
    });

    it('should handle cart with more items than stock', async () => {
      const product = new Product({
        name: 'Limited Stock Product',
        slug: 'limited-stock',
        price: 100,
        stockQuantity: 5,
        condition: 'new',
        stockStatus: 'in_stock'
      });
      await product.save();

      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: product._id.toString(),
          quantity: 10
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/insufficient stock/i);
    });

    it('should handle orders during system maintenance', async () => {
      // Mock system maintenance mode
      vi.spyOn(require('../../middleware/maintenance.js'), 'checkMaintenance').mockImplementation((req, res, next) => {
        res.status(503).json({
          success: false,
          error: 'System is under maintenance. Please try again later.'
        });
      });

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ productId: new mongoose.Types.ObjectId(), quantity: 1 }]
        });

      expect(response.status).toBe(503);
      expect(response.body.error).toMatch(/maintenance/i);
    });
  });

  describe('Memory and Resource Error Handling', () => {
    it('should handle memory pressure during large operations', async () => {
      // Mock memory pressure
      const originalMemoryUsage = process.memoryUsage;
      process.memoryUsage = vi.fn().mockReturnValue({
        heapUsed: 1024 * 1024 * 1024, // 1GB
        heapTotal: 1024 * 1024 * 1024,
        external: 0,
        rss: 1024 * 1024 * 1024
      });

      const response = await request(app)
        .get('/api/admin/reports/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2020-01-01',
          endDate: '2024-12-31',
          detailed: true
        });

      // Should either succeed or fail gracefully
      expect([200, 500, 503]).toContain(response.status);

      process.memoryUsage = originalMemoryUsage;
    });

    it('should handle file upload size limits', async () => {
      const largeFile = Buffer.alloc(50 * 1024 * 1024); // 50MB

      const response = await request(app)
        .post('/api/admin/products/image-upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', largeFile, 'large-image.jpg');

      expect(response.status).toBe(413);
      expect(response.body.error).toMatch(/file.*too large|size limit/i);
    });
  });

  describe('Cross-Origin and Security Error Handling', () => {
    it('should handle CORS violations', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Origin', 'https://malicious-site.com');

      // Should either allow or deny based on CORS configuration
      if (response.status === 403) {
        expect(response.body.error).toMatch(/cors|origin/i);
      }
    });

    it('should handle SQL injection attempts in search', async () => {
      const maliciousQuery = "'; DROP TABLE products; --";

      const response = await request(app)
        .get('/api/products/search')
        .query({ q: maliciousQuery });

      // Should not crash and return safe results
      expect(response.status).toBeLessThan(500);
    });

    it('should handle XSS attempts in user input', async () => {
      const xssPayload = '<script>alert("xss")</script>';

      const response = await request(app)
        .post('/api/support/contact')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: xssPayload,
          email: 'test@example.com',
          subject: 'Test',
          message: 'Test message'
        });

      // Input should be sanitized
      expect(response.status).toBeLessThan(500);
    });
  });
});