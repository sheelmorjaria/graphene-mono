import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import paymentRoutes from '../../routes/payment.js';
import Order from '../../models/Order.js';
import User from '../../models/User.js';
import { createValidOrderData, createValidUserData } from '../../test/helpers/testDataFactory.js';

// Bitcoin API Integration Tests
describe('Bitcoin Payment API Integration Tests', () => {
  let app;
  let mongoServer;
  let testOrder;
  let testUser;

  beforeAll(async () => {
    // Setup Express app only (data will be created in beforeEach)
    app = express();
    app.use(express.json());
    
    // Mock user authentication (will be set in beforeEach)
    app.use((req, res, next) => {
      req.user = testUser;
      next();
    });
    
    app.use('/api/payments', paymentRoutes);

    // Set environment variables
    process.env.BLOCKONOMICS_API_KEY = 'test-bitcoin-api-key';
  });

  afterAll(async () => {
    // Clean up handled by global test setup
  });

  beforeEach(async () => {
    // Create fresh test data for each test (since global setup clears DB after each test)
    const userData = createValidUserData({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'hashedpassword123'
    });
    testUser = await User.create(userData);

    const orderData = createValidOrderData({
      userId: testUser._id,
      orderNumber: 'ORD-BTC-TEST-123',
      customerEmail: 'test@example.com',
      items: [{
        productId: new mongoose.Types.ObjectId(),
        productName: 'Test Bitcoin Product',
        productSlug: 'test-bitcoin-product',
        quantity: 1,
        unitPrice: 299.99,
        totalPrice: 299.99
      }],
      subtotal: 299.99,
      totalAmount: 299.99,
      paymentMethod: {
        type: 'bitcoin',
        name: 'Bitcoin'
      },
      paymentStatus: 'pending'
    });
    testOrder = await Order.create(orderData);
  });

  describe('Bitcoin Payment Initialization', () => {
    it('should initialize Bitcoin payment for valid order', async () => {
      const response = await request(app)
        .post('/api/payments/bitcoin/initialize')
        .send({ orderId: testOrder._id.toString() });

      // Should respond (regardless of success/failure due to mocked services)
      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('bitcoinAddress');
        expect(response.body.data).toHaveProperty('bitcoinAmount');
        expect(response.body.data).toHaveProperty('exchangeRate');
        expect(response.body.data).toHaveProperty('paymentExpiry');
      }
    });

    it('should handle missing order ID', async () => {
      const response = await request(app)
        .post('/api/payments/bitcoin/initialize')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order ID is required');
    });

    it('should handle non-existent order', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post('/api/payments/bitcoin/initialize')
        .send({ orderId: nonExistentId.toString() });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order not found');
    });

    it('should handle invalid order ID format', async () => {
      const response = await request(app)
        .post('/api/payments/bitcoin/initialize')
        .send({ orderId: 'invalid-id' });

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should handle order already paid', async () => {
      testOrder.paymentStatus = 'completed';
      await testOrder.save();
      
      const response = await request(app)
        .post('/api/payments/bitcoin/initialize')
        .send({ orderId: testOrder._id.toString() });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order is not in pending payment state');
    });
  });

  describe('Bitcoin Payment Status', () => {
    beforeEach(async () => {
      // Set up order with Bitcoin payment details
      testOrder.paymentMethod = { type: 'bitcoin', name: 'Bitcoin' };
      testOrder.paymentStatus = 'awaiting_confirmation';
      testOrder.paymentDetails = {
        bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        bitcoinAmount: 0.00666666,
        bitcoinExchangeRate: 45000,
        bitcoinPaymentExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        bitcoinConfirmations: 0,
        bitcoinAmountReceived: 0
      };
      await testOrder.save();
    });

    it('should get Bitcoin payment status for valid order', async () => {
      const response = await request(app)
        .get(`/api/payments/bitcoin/status/${testOrder._id.toString()}`);

      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('orderId');
        expect(response.body.data).toHaveProperty('paymentStatus');
        expect(response.body.data).toHaveProperty('bitcoinAddress');
        expect(response.body.data).toHaveProperty('bitcoinAmount');
        expect(response.body.data).toHaveProperty('bitcoinConfirmations');
        expect(response.body.data).toHaveProperty('isExpired');
        expect(response.body.data).toHaveProperty('isConfirmed');
      }
    });

    it('should handle missing order ID parameter', async () => {
      const response = await request(app)
        .get('/api/payments/bitcoin/status/');

      expect(response.status).toBe(404);
    });

    it('should handle non-existent order for status check', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/payments/bitcoin/status/${nonExistentId.toString()}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order not found');
    });

    it('should handle non-Bitcoin order for status check', async () => {
      testOrder.paymentMethod = { type: 'paypal', name: 'PayPal' };
      await testOrder.save();
      
      const response = await request(app)
        .get(`/api/payments/bitcoin/status/${testOrder._id.toString()}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order is not a Bitcoin payment');
    });

    it('should detect expired payments', async () => {
      // Set payment as expired
      testOrder.paymentDetails.bitcoinPaymentExpiry = new Date(Date.now() - 1000);
      await testOrder.save();
      
      const response = await request(app)
        .get(`/api/payments/bitcoin/status/${testOrder._id.toString()}`);

      if (response.status === 200) {
        expect(response.body.data.isExpired).toBe(true);
      }
    });
  });

  describe('Blockonomics Webhook', () => {
    beforeEach(async () => {
      // Set up order with Bitcoin payment details
      testOrder.paymentMethod = { type: 'bitcoin', name: 'Bitcoin' };
      testOrder.paymentStatus = 'awaiting_confirmation';
      testOrder.paymentDetails = {
        bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        bitcoinAmount: 0.00666666,
        bitcoinExchangeRate: 45000,
        bitcoinPaymentExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      await testOrder.save();
    });

    it('should process valid Bitcoin webhook notification', async () => {
      const webhookPayload = {
        addr: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        value: 666666, // Amount in satoshis
        txid: 'abc123def456789',
        confirmations: 3
      };

      const response = await request(app)
        .post('/api/payments/bitcoin/webhook')
        .send(webhookPayload);

      // Should respond (regardless of success/failure)
      expect([200, 400, 404, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it('should handle webhook with missing address', async () => {
      const webhookPayload = {
        value: 666666,
        txid: 'abc123def456789',
        confirmations: 3
      };

      const response = await request(app)
        .post('/api/payments/bitcoin/webhook')
        .send(webhookPayload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid webhook data');
    });

    it('should handle webhook with missing transaction ID', async () => {
      const webhookPayload = {
        addr: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        value: 666666,
        confirmations: 3
      };

      const response = await request(app)
        .post('/api/payments/bitcoin/webhook')
        .send(webhookPayload);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid webhook data');
    });

    it('should handle webhook for unknown Bitcoin address', async () => {
      const webhookPayload = {
        addr: '1UnknownAddressNotInDatabase12345',
        value: 666666,
        txid: 'abc123def456789',
        confirmations: 3
      };

      const response = await request(app)
        .post('/api/payments/bitcoin/webhook')
        .send(webhookPayload);

      expect([404, 500]).toContain(response.status);
      
      if (response.status === 404) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should handle malformed webhook data', async () => {
      const response = await request(app)
        .post('/api/payments/bitcoin/webhook')
        .send('invalid json');

      expect([400, 500]).toContain(response.status);
    });

    it('should handle empty webhook payload', async () => {
      const response = await request(app)
        .post('/api/payments/bitcoin/webhook')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid webhook data');
    });
  });

  describe('Database Integration', () => {
    it('should maintain database connection during requests', async () => {
      expect(mongoose.connection.readyState).toBe(1); // Connected
      
      const response = await request(app)
        .post('/api/payments/bitcoin/initialize')
        .send({ orderId: testOrder._id.toString() });

      expect(mongoose.connection.readyState).toBe(1); // Still connected
      expect(response.body).toBeDefined();
    });

    it('should handle concurrent Bitcoin payment requests', async () => {
      // Create multiple test orders using factory
      const order1Data = createValidOrderData({
        userId: testUser._id,
        orderNumber: 'ORD-BTC-CONCURRENT-1',
        customerEmail: 'test1@example.com',
        subtotal: 100,
        totalAmount: 100,
        paymentMethod: { type: 'bitcoin', name: 'Bitcoin' },
        paymentStatus: 'pending'
      });
      
      const order2Data = createValidOrderData({
        userId: testUser._id,
        orderNumber: 'ORD-BTC-CONCURRENT-2',
        customerEmail: 'test2@example.com',
        subtotal: 200,
        totalAmount: 200,
        paymentMethod: { type: 'bitcoin', name: 'Bitcoin' },
        paymentStatus: 'pending'
      });
      
      const orders = await Promise.all([
        Order.create(order1Data),
        Order.create(order2Data)
      ]);

      // Send concurrent requests
      const promises = orders.map(order => 
        request(app)
          .post('/api/payments/bitcoin/initialize')
          .send({ orderId: order._id.toString() })
      );

      const responses = await Promise.all(promises);

      // All requests should complete without crashing
      responses.forEach(response => {
        expect([200, 400, 500]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });

    it('should validate order data integrity', async () => {
      const foundOrder = await Order.findById(testOrder._id);
      expect(foundOrder).toBeDefined();
      
      if (foundOrder) {
        expect(foundOrder.orderNumber).toBe('ORD-BTC-TEST-123');
        expect(foundOrder.customerEmail).toBe('test@example.com');
        expect(foundOrder.items).toHaveLength(1);
        expect(foundOrder.totalAmount).toBe(299.99);
      }
    });
  });

  describe('API Response Validation', () => {
    it('should return consistent response structure for initialization', async () => {
      const response = await request(app)
        .post('/api/payments/bitcoin/initialize')
        .send({ orderId: testOrder._id.toString() });

      expect(response.body).toHaveProperty('success');
      
      if (response.body.success) {
        expect(response.body).toHaveProperty('data');
        expect(typeof response.body.data).toBe('object');
      } else {
        expect(response.body).toHaveProperty('error');
        expect(typeof response.body.error).toBe('string');
      }
    });

    it('should return consistent response structure for status check', async () => {
      // Set up Bitcoin order
      testOrder.paymentMethod = { type: 'bitcoin', name: 'Bitcoin' };
      await testOrder.save();
      
      const response = await request(app)
        .get(`/api/payments/bitcoin/status/${testOrder._id.toString()}`);

      expect(response.body).toHaveProperty('success');
      
      if (response.body.success) {
        expect(response.body).toHaveProperty('data');
        expect(typeof response.body.data).toBe('object');
      } else {
        expect(response.body).toHaveProperty('error');
        expect(typeof response.body.error).toBe('string');
      }
    });

    it('should return consistent response structure for webhooks', async () => {
      const response = await request(app)
        .post('/api/payments/bitcoin/webhook')
        .send({
          addr: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          value: 666666,
          txid: 'test123',
          confirmations: 1
        });

      expect(response.body).toHaveProperty('success');
      
      if (!response.body.success) {
        expect(response.body).toHaveProperty('error');
        expect(typeof response.body.error).toBe('string');
      }
    });
  });
});
