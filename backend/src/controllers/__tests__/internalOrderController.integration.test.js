import { describe, it, test, expect, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../server.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import { createValidOrderData, createValidUserData } from '../../test/helpers/testDataFactory.js';

// Set up environment variables for testing
process.env.INTERNAL_API_KEY = 'test-internal-api-key-12345';

describe('Internal Order Controller (Admin Endpoints)', () => {
  // Using global test setup for MongoDB connection
  
  let testUser;
  let testOrder;
  const validApiKey = 'test-internal-api-key-12345';
  const invalidApiKey = 'invalid-api-key';

  beforeEach(async () => {
    // Clear test data
    await User.deleteMany({});
    await Order.deleteMany({});

    // Create test user using factory
    const userData = createValidUserData({
      email: 'admin.test@example.com',
      firstName: 'Admin',
      lastName: 'Tester'
    });
    testUser = await User.create(userData);

    // Create test order using factory
    const orderData = createValidOrderData({
      orderNumber: 'ADMIN-TEST-001',
      userId: testUser._id,
      customerEmail: testUser.email,
      status: 'pending',
      subtotal: 100.00,
      tax: 8.00,
      shipping: 10.00,
      totalAmount: 118.00,
      shippingAddress: {
        fullName: 'Admin Test User',
        addressLine1: '456 Admin St',
        city: 'London',
        stateProvince: 'London',
        postalCode: 'SW1A 1AA',
        country: 'GB',
        phoneNumber: '+44 20 7946 0958'
      },
      billingAddress: {
        fullName: 'Admin Test User',
        addressLine1: '456 Admin St',
        city: 'London',
        stateProvince: 'London',
        postalCode: 'SW1A 1AA',
        country: 'GB',
        phoneNumber: '+44 20 7946 0958'
      },
      paymentStatus: 'completed'
    });
    testOrder = await Order.create(orderData);
  });

  describe('Authentication Middleware', () => {
    it('should reject requests without API key', async () => {
      const response = await request(app)
        .put(`/api/internal/orders/${testOrder._id}/status`)
        .send({ status: 'processing' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid or missing API key');
    });

    it('should reject requests with invalid API key', async () => {
      const response = await request(app)
        .put(`/api/internal/orders/${testOrder._id}/status`)
        .set('x-api-key', invalidApiKey)
        .send({ status: 'processing' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid or missing API key');
    });

    it('should accept requests with valid API key', async () => {
      const response = await request(app)
        .put(`/api/internal/orders/${testOrder._id}/status`)
        .set('x-api-key', validApiKey)
        .send({ status: 'processing' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/internal/orders/:orderId/status', () => {
    it('should update order status successfully', async () => {
      const response = await request(app)
        .put(`/api/internal/orders/${testOrder._id}/status`)
        .set('x-api-key', validApiKey)
        .send({
          status: 'processing',
          note: 'Order is being processed by fulfillment team'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe('processing');
      expect(response.body.data.order.statusDisplay).toBe('Processing');
      expect(response.body.data.order.statusHistory).toHaveLength(2); // pending + processing
      expect(response.body.data.order.statusHistory[1].note).toBe('Order is being processed by fulfillment team');
    });

    it('should update tracking information when provided', async () => {
      const trackingNumber = 'TRACK123456789';
      const trackingUrl = 'https://tracking.example.com/TRACK123456789';

      const response = await request(app)
        .put(`/api/internal/orders/${testOrder._id}/status`)
        .set('x-api-key', validApiKey)
        .send({
          status: 'shipped',
          trackingNumber,
          trackingUrl,
          note: 'Package shipped via courier'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe('shipped');
      expect(response.body.data.order.trackingNumber).toBe(trackingNumber);
      expect(response.body.data.order.trackingUrl).toBe(trackingUrl);
    });

    it('should validate status field is required', async () => {
      const response = await request(app)
        .put(`/api/internal/orders/${testOrder._id}/status`)
        .set('x-api-key', validApiKey)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Status is required');
    });

    it('should validate status enum values', async () => {
      const response = await request(app)
        .put(`/api/internal/orders/${testOrder._id}/status`)
        .set('x-api-key', validApiKey)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid status');
    });

    it('should validate order ID format', async () => {
      const response = await request(app)
        .put('/api/internal/orders/invalid-id/status')
        .set('x-api-key', validApiKey)
        .send({ status: 'processing' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid order ID format');
    });

    it('should return 404 for non-existent order', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/internal/orders/${nonExistentId}/status`)
        .set('x-api-key', validApiKey)
        .send({ status: 'processing' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order not found');
    });

    it('should accept all valid status values', async () => {
      const validStatuses = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];

      for (const status of validStatuses) {
        const response = await request(app)
          .put(`/api/internal/orders/${testOrder._id}/status`)
          .set('x-api-key', validApiKey)
          .send({ status })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.order.status).toBe(status);
      }
    });

    it('should handle tracking info removal', async () => {
      // First add tracking info
      await request(app)
        .put(`/api/internal/orders/${testOrder._id}/status`)
        .set('x-api-key', validApiKey)
        .send({
          status: 'shipped',
          trackingNumber: 'TRACK123',
          trackingUrl: 'https://example.com/track'
        })
        .expect(200);

      // Remove tracking info
      const response = await request(app)
        .put(`/api/internal/orders/${testOrder._id}/status`)
        .set('x-api-key', validApiKey)
        .send({
          status: 'cancelled',
          trackingNumber: '',
          trackingUrl: ''
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe('cancelled');
      expect(response.body.data.order.trackingNumber).toBe('');
      expect(response.body.data.order.trackingUrl).toBe('');
    });
  });

  describe('GET /api/internal/orders/:orderId', () => {
    it('should return complete order details for internal use', async () => {
      const response = await request(app)
        .get(`/api/internal/orders/${testOrder._id}`)
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      const order = response.body.data.order;

      // Verify all fields are present for internal use
      expect(order).toHaveProperty('_id');
      expect(order).toHaveProperty('orderNumber');
      expect(order).toHaveProperty('userId');
      expect(order).toHaveProperty('customerEmail');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('statusHistory');
      expect(order).toHaveProperty('items');
      expect(order).toHaveProperty('shippingAddress');
      expect(order).toHaveProperty('billingAddress');
      expect(order).toHaveProperty('paymentDetails');
      expect(order).toHaveProperty('trackingNumber');
      expect(order).toHaveProperty('trackingUrl');
      expect(order.trackingNumber).toBeNull(); // Should be null initially
      expect(order.trackingUrl).toBeNull(); // Should be null initially
    });

    it('should return 404 for non-existent order', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/internal/orders/${nonExistentId}`)
        .set('x-api-key', validApiKey)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order not found');
    });

    it('should validate order ID format', async () => {
      const response = await request(app)
        .get('/api/internal/orders/invalid-id')
        .set('x-api-key', validApiKey)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid order ID format');
    });
  });

  describe('GET /api/internal/orders', () => {
    beforeEach(async () => {
      // Create additional test orders using factory
      const order1Data = createValidOrderData({
        orderNumber: 'ADMIN-TEST-002',
        userId: testUser._id,
        customerEmail: 'test2@example.com',
        status: 'shipped',
        trackingNumber: 'TRACK001',
        subtotal: 50,
        tax: 4,
        shipping: 5,
        totalAmount: 59,
        shippingAddress: {
          fullName: 'Test User',
          addressLine1: '123 Test St',
          city: 'London',
          stateProvince: 'London',
          postalCode: 'SW1A 1AA',
          country: 'GB'
        },
        billingAddress: {
          fullName: 'Test User',
          addressLine1: '123 Test St',
          city: 'London',
          stateProvince: 'London',
          postalCode: 'SW1A 1AA',
          country: 'GB'
        },
        paymentStatus: 'completed'
      });

      const order2Data = createValidOrderData({
        orderNumber: 'ADMIN-TEST-003',
        userId: new mongoose.Types.ObjectId(),
        customerEmail: 'test3@example.com',
        status: 'delivered',
        subtotal: 50,
        tax: 4,
        shipping: 5,
        totalAmount: 59,
        shippingAddress: {
          fullName: 'Test User',
          addressLine1: '123 Test St',
          city: 'London',
          stateProvince: 'London',
          postalCode: 'SW1A 1AA',
          country: 'GB'
        },
        billingAddress: {
          fullName: 'Test User',
          addressLine1: '123 Test St',
          city: 'London',
          stateProvince: 'London',
          postalCode: 'SW1A 1AA',
          country: 'GB'
        },
        paymentStatus: 'completed'
      });

      await Order.create([order1Data, order2Data]);
    });

    it('should return paginated list of all orders', async () => {
      const response = await request(app)
        .get('/api/internal/orders')
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(3); // testOrder + 2 additional
      expect(response.body.data.pagination).toHaveProperty('totalOrders', 3);
    });

    it('should support filtering by status', async () => {
      const response = await request(app)
        .get('/api/internal/orders?status=shipped')
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].status).toBe('shipped');
    });

    it('should support filtering by user ID', async () => {
      const response = await request(app)
        .get(`/api/internal/orders?userId=${testUser._id}`)
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(2); // testOrder + ADMIN-TEST-002
    });

    it('should support searching by order number', async () => {
      const response = await request(app)
        .get('/api/internal/orders?orderNumber=ADMIN-TEST-002')
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].orderNumber).toBe('ADMIN-TEST-002');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/internal/orders?page=1&limit=2')
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(2);
      expect(response.body.data.pagination.totalPages).toBe(2);
      expect(response.body.data.pagination.hasNextPage).toBe(true);
    });

    it('should support custom sorting', async () => {
      const response = await request(app)
        .get('/api/internal/orders?sortBy=totalAmount&sortOrder=asc')
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      const orders = response.body.data.orders;
      
      // Verify ascending order by totalAmount
      for (let i = 1; i < orders.length; i++) {
        expect(orders[i].totalAmount).toBeGreaterThanOrEqual(orders[i - 1].totalAmount);
      }
    });

    it('should include tracking status indicators', async () => {
      const response = await request(app)
        .get('/api/internal/orders')
        .set('x-api-key', validApiKey)
        .expect(200);

      expect(response.body.success).toBe(true);
      const orders = response.body.data.orders;
      
      orders.forEach(order => {
        expect(order).toHaveProperty('hasTracking');
        expect(typeof order.hasTracking).toBe('boolean');
      });

      // Find the order with tracking number
      const trackedOrder = orders.find(order => order.trackingNumber);
      if (trackedOrder) {
        expect(trackedOrder.hasTracking).toBe(true);
      }
    });
  });

  describe('Security Tests', () => {
    it('should not be accessible without proper authentication', async () => {
      const endpoints = [
        { method: 'put', path: `/api/internal/orders/${testOrder._id}/status` },
        { method: 'get', path: `/api/internal/orders/${testOrder._id}` },
        { method: 'get', path: '/api/internal/orders' }
      ];

      for (const endpoint of endpoints) {
        const req = request(app)[endpoint.method](endpoint.path);
        
        if (endpoint.method === 'put') {
          req.send({ status: 'processing' });
        }
        
        const response = await req.expect(401);
        expect(response.body.success).toBe(false);
      }
    });

    it('should validate API key properly', async () => {
      const invalidKeys = ['', 'wrong-key', 'test', undefined];

      for (const key of invalidKeys) {
        const req = request(app)
          .put(`/api/internal/orders/${testOrder._id}/status`)
          .send({ status: 'processing' });
        
        if (key !== undefined) {
          req.set('x-api-key', key);
        }

        const response = await req.expect(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid or missing API key');
      }
    });
  });
});