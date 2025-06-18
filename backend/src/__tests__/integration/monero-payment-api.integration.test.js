import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { importModel } from '../../test/helpers/mongooseHelper.js';
import paymentRoutes from '../../routes/payment.js';
// Simple integration tests focusing on API boundaries
describe('Monero Payment API Integration Tests', () => {
  let app;
  let mongoServer;
  let testUser;
  let testOrder;
  let Order, User;

  beforeAll(async () => {
    // Disconnect any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Import models safely to avoid overwrite conflicts
    Order = await importModel('../../models/Order.js', 'Order');
    User = await importModel('../../models/User.js', 'User');

    // Setup Express app with minimal middleware
    app = express();
    app.use(express.json());
    app.use('/api/payments', paymentRoutes);

    // Create test user and get auth token
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'hashedpassword123'
    });

    // Setup Express app
    app = express();
    app.use(express.json());
    
    // Mock user authentication in requests
    app.use((req, res, next) => {
      req.user = testUser;
      next();
    });
    
    app.use('/api/payments', paymentRoutes);
  });

  beforeEach(async () => {
    // Clear orders before each test
    await Order.deleteMany({});
    
    // Create fresh test order with all required fields
    testOrder = await Order.create({
      userId: testUser._id,
      orderNumber: `ORD-${Date.now()}`.substring(0, 20), // Limit to 20 chars
      customerEmail: 'test@example.com',
      items: [{
        productId: new mongoose.Types.ObjectId(),
        productName: 'Test Product',
        productSlug: 'test-product',
        quantity: 1,
        unitPrice: 199.99,
        totalPrice: 199.99
      }],
      subtotal: 199.99,
      orderTotal: 199.99,
      shippingAddress: {
        fullName: 'Test User',
        addressLine1: '123 Test St',
        city: 'Test City',
        stateProvince: 'Test State',
        postalCode: '12345',
        country: 'UK'
      },
      billingAddress: {
        fullName: 'Test User',
        addressLine1: '123 Test St',
        city: 'Test City',
        stateProvince: 'Test State',
        postalCode: '12345',
        country: 'UK'
      },
      shippingMethod: {
        id: new mongoose.Types.ObjectId(),
        name: 'Standard Shipping',
        cost: 0
      },
      paymentMethod: {
        type: 'monero',
        name: 'Monero (XMR)'
      },
      paymentStatus: 'pending'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('POST /api/payments/monero/create', () => {
    it('should create Monero payment successfully with valid order', async () => {
      // Mock successful external API calls
      const mockAxios = {
        get: vi.fn().mockResolvedValue({
          data: { monero: { gbp: 161.23 } }
        }),
        post: vi.fn().mockResolvedValue({
          data: {
            id: 'globee-123',
            payment_address: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
            total: 1.2376,
            currency: 'XMR',
            expiration_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            payment_url: 'https://globee.com/payment/123',
            status: 'pending'
          }
        })
      };

      // Temporarily replace axios
      const axios = require('axios');
      Object.assign(axios, mockAxios);

      const response = await request(app)
        .post('/api/payments/monero/create')
        .send({ orderId: testOrder._id.toString() })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        orderId: testOrder._id.toString(),
        orderNumber: expect.stringMatching(/^ORD-\d+$/),
        moneroAddress: expect.stringMatching(/^4[A-Za-z0-9]+$/),
        xmrAmount: expect.any(Number),
        exchangeRate: expect.any(Number),
        paymentUrl: expect.stringContaining('globee.com'),
        requiredConfirmations: expect.any(Number),
        paymentWindowHours: expect.any(Number)
      });

      // Verify order was updated in database
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentDetails).toBeDefined();
      expect(updatedOrder.paymentDetails.globeePaymentId).toBe('globee-payment-id');
    });

    it('should return 400 for invalid order ID format', async () => {
      const response = await request(app)
        .post('/api/payments/monero/create')
        .send({ orderId: 'invalid-id' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid order ID');
    });

    it('should return 404 for non-existent order', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post('/api/payments/monero/create')
        .send({ orderId: nonExistentId.toString() })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order not found');
    });
  });

  describe('GET /api/payments/monero/status/:orderId', () => {
    beforeEach(async () => {
      // Add Monero payment to test order using correct field structure
      await Order.findByIdAndUpdate(testOrder._id, {
        paymentDetails: {
          globeePaymentId: 'globee-123',
          moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
          xmrAmount: 1.2376,
          exchangeRate: 0.00617,
          expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: 'pending'
        }
      });
    });

    it('should return payment status for valid order', async () => {
      // Mock GloBee status response
      const axios = require('axios');
      axios.get = vi.fn().mockResolvedValue({
        data: {
          id: 'globee-123',
          status: 'pending',
          confirmations: 0,
          paid_amount: 0,
          payment_address: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q'
        }
      });

      const response = await request(app)
        .get(`/api/payments/monero/status/${testOrder._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        orderId: testOrder._id.toString(),
        paymentStatus: 'pending',
        confirmations: 0,
        paidAmount: 0,
        transactionHash: null,
        isExpired: false,
        requiredConfirmations: 10
      });
    });

    it('should detect expired payments', async () => {
      // Update order with past expiration
      await Order.findByIdAndUpdate(testOrder._id, {
        'paymentDetails.expirationTime': new Date(Date.now() - 60 * 1000)
      });

      const axios = require('axios');
      axios.get = vi.fn().mockResolvedValue({
        data: {
          id: 'globee-123',
          status: 'pending',
          confirmations: 0
        }
      });

      const response = await request(app)
        .get(`/api/payments/monero/status/${testOrder._id}`)
        .expect(200);

      expect(response.body.data.isExpired).toBe(true);
    });
  });

  describe('POST /api/payments/monero/webhook', () => {
    beforeEach(async () => {
      await Order.findByIdAndUpdate(testOrder._id, {
        paymentDetails: {
          globeePaymentId: 'globee-123',
          status: 'pending'
        }
      });
    });

    it('should process valid webhook and update order', async () => {
      const webhookPayload = {
        id: 'globee-123',
        status: 'paid',
        confirmations: 12,
        paid_amount: 1.2376,
        total_amount: 1.2376,
        order_id: testOrder._id.toString()
      };

      // Mock signature verification to return true for this test
      const moneroService = await import('../../services/moneroService.js');
      vi.mocked(moneroService.default.verifyWebhookSignature).mockReturnValueOnce(true);

      const response = await request(app)
        .post('/api/payments/monero/webhook')
        .set('X-GloBee-Signature', 'valid-signature')
        .send(webhookPayload);

      // Log the response to debug
      if (response.status !== 200) {
        console.log('Webhook response:', response.status, response.body);
      }

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify order was updated
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentStatus).toBe('completed');
      expect(updatedOrder.paymentDetails.confirmations).toBe(12);
      expect(updatedOrder.paymentDetails.paidAmount).toBe(1.2376);
    });

    it('should reject webhook with invalid signature', async () => {
      // Mock signature verification to return false for this test
      const moneroService = await import('../../services/moneroService.js');
      vi.mocked(moneroService.default.verifyWebhookSignature).mockReturnValueOnce(false);

      const response = await request(app)
        .post('/api/payments/monero/webhook')
        .set('X-GloBee-Signature', 'invalid-signature')
        .send({ id: 'test' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid webhook signature');
    });
  });

  describe('Error Handling', () => {
    it('should handle external API failures gracefully', async () => {
      // Mock the moneroService to throw an error
      const moneroService = await import('../../services/moneroService.js');
      vi.mocked(moneroService.default.convertGbpToXmr).mockRejectedValueOnce(new Error('External API unavailable'));

      const response = await request(app)
        .post('/api/payments/monero/create')
        .send({ orderId: testOrder._id.toString() })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('External API unavailable');
    });

    it('should validate request data properly', async () => {
      const response = await request(app)
        .post('/api/payments/monero/create')
        .send({}) // Missing orderId
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order ID is required');
    });
  });
});