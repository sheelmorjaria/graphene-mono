import { vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { 
  createMoneroPayment,
  checkMoneroPaymentStatus,
  handleMoneroWebhook
} from '../paymentController.js';
import Order from '../../models/Order.js';
import User from '../../models/User.js';
import moneroService from '../../services/moneroService.js';

// Mock the moneroService
vi.mock('../../services/moneroService.js', () => ({
  createMoneroPayment: vi.fn(),
  checkPaymentStatus: vi.fn(),
  verifyWebhookSignature: vi.fn(),
  processWebhookPayload: vi.fn()
}));

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = { _id: 'user123', email: 'test@example.com' };
  next();
};

// Mock admin authentication (prepared for admin-specific tests)
// const mockAdminAuth = (req, res, next) => {
//   req.user = { _id: 'admin123', role: 'admin' };
//   next();
// };

describe('Payment Controller - Monero Integration Tests', () => {
  let app;
  let mongoServer;
  let testOrder;
  let testUser;

  beforeAll(async () => {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Setup Express app
    app = express();
    app.use(express.json());
    
    // Add routes
    app.post('/api/payments/monero/create', mockAuth, createMoneroPayment);
    app.get('/api/payments/monero/status/:orderId', mockAuth, checkMoneroPaymentStatus);
    app.post('/api/payments/monero/webhook', handleMoneroWebhook);
  });

  beforeEach(async () => {
    // Clear all collections
    await Order.deleteMany({});
    await User.deleteMany({});
    
    // Create test user
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'hashedpassword'
    });

    // Create test order
    testOrder = await Order.create({
      user: testUser._id,
      orderNumber: 'ORD-TEST-001',
      items: [{
        product: mongoose.Types.ObjectId(),
        productName: 'Test Product',
        quantity: 1,
        price: 199.99
      }],
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
      orderTotal: 199.99,
      paymentMethod: 'monero',
      paymentStatus: 'pending'
    });

    // Clear mocks
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('POST /api/payments/monero/create', () => {
    it('should create Monero payment successfully', async () => {
      const mockMoneroPayment = {
        paymentId: 'globee-payment-123',
        moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
        xmrAmount: 1.9999,
        orderTotal: 199.99,
        exchangeRate: 0.01,
        expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        validUntil: new Date(Date.now() + 5 * 60 * 1000),
        requiredConfirmations: 10,
        paymentWindowHours: 24,
        status: 'pending'
      };

      moneroService.createMoneroPayment.mockResolvedValue(mockMoneroPayment);

      const response = await request(app)
        .post('/api/payments/monero/create')
        .send({ orderId: testOrder._id.toString() })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          orderId: testOrder._id.toString(),
          moneroAddress: mockMoneroPayment.moneroAddress,
          xmrAmount: mockMoneroPayment.xmrAmount,
          orderTotal: mockMoneroPayment.orderTotal,
          exchangeRate: mockMoneroPayment.exchangeRate
        })
      });

      // Verify order was updated in database
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.moneroPayment).toBeDefined();
      expect(updatedOrder.moneroPayment.paymentId).toBe('globee-payment-123');
      expect(updatedOrder.moneroPayment.moneroAddress).toBe(mockMoneroPayment.moneroAddress);
    });

    it('should return 404 for non-existent order', async () => {
      const nonExistentOrderId = mongoose.Types.ObjectId();

      const response = await request(app)
        .post('/api/payments/monero/create')
        .send({ orderId: nonExistentOrderId.toString() })
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Order not found'
      });
    });

    it('should return 403 for unauthorized user', async () => {
      // Create order for different user
      const anotherUser = await User.create({
        firstName: 'Another',
        lastName: 'User',
        email: 'another@example.com',
        password: 'hashedpassword'
      });

      const anotherOrder = await Order.create({
        user: anotherUser._id,
        orderNumber: 'ORD-TEST-002',
        items: [{ product: mongoose.Types.ObjectId(), quantity: 1, price: 99.99 }],
        orderTotal: 99.99,
        paymentMethod: 'monero',
        paymentStatus: 'pending'
      });

      const response = await request(app)
        .post('/api/payments/monero/create')
        .send({ orderId: anotherOrder._id.toString() })
        .expect(403);

      expect(response.body).toEqual({
        success: false,
        error: 'Unauthorized access to this order'
      });
    });

    it('should return 400 for orders that already have Monero payment', async () => {
      // Update order to have existing Monero payment
      await Order.findByIdAndUpdate(testOrder._id, {
        moneroPayment: {
          paymentId: 'existing-payment',
          moneroAddress: 'existing-address',
          xmrAmount: 1.0,
          status: 'pending'
        }
      });

      const response = await request(app)
        .post('/api/payments/monero/create')
        .send({ orderId: testOrder._id.toString() })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Monero payment already exists for this order'
      });
    });

    it('should handle moneroService errors', async () => {
      moneroService.createMoneroPayment.mockRejectedValue(
        new Error('GloBee API unavailable')
      );

      const response = await request(app)
        .post('/api/payments/monero/create')
        .send({ orderId: testOrder._id.toString() })
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to create Monero payment: GloBee API unavailable'
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/payments/monero/create')
        .send({}) // Missing orderId
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Order ID is required'
      });
    });

    it('should validate orderId format', async () => {
      const response = await request(app)
        .post('/api/payments/monero/create')
        .send({ orderId: 'invalid-id' })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid order ID format'
      });
    });
  });

  describe('GET /api/payments/monero/status/:orderId', () => {
    beforeEach(async () => {
      // Setup order with Monero payment
      await Order.findByIdAndUpdate(testOrder._id, {
        moneroPayment: {
          paymentId: 'globee-payment-123',
          moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
          xmrAmount: 1.9999,
          exchangeRate: 0.01,
          expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: 'pending'
        }
      });
    });

    it('should return payment status successfully', async () => {
      const mockStatus = {
        paymentId: 'globee-payment-123',
        status: 'confirmed',
        confirmations: 15,
        expectedAmount: 1.9999,
        receivedAmount: 1.9999,
        isConfirmed: true,
        isUnderpaid: false
      };

      moneroService.checkPaymentStatus.mockResolvedValue(mockStatus);

      const response = await request(app)
        .get(`/api/payments/monero/status/${testOrder._id}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          orderId: testOrder._id.toString(),
          paymentStatus: 'confirmed',
          confirmations: 15,
          moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
          xmrAmount: 1.9999,
          exchangeRate: 0.01,
          isExpired: expect.any(Boolean)
        })
      });
    });

    it('should return 404 for non-existent order', async () => {
      const nonExistentOrderId = mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/payments/monero/status/${nonExistentOrderId}`)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Order not found'
      });
    });

    it('should return 400 for order without Monero payment', async () => {
      // Create order without Monero payment
      const orderWithoutMonero = await Order.create({
        user: testUser._id,
        orderNumber: 'ORD-TEST-003',
        items: [{ product: mongoose.Types.ObjectId(), quantity: 1, price: 99.99 }],
        orderTotal: 99.99,
        paymentMethod: 'paypal',
        paymentStatus: 'pending'
      });

      const response = await request(app)
        .get(`/api/payments/monero/status/${orderWithoutMonero._id}`)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'No Monero payment found for this order'
      });
    });

    it('should handle moneroService errors', async () => {
      moneroService.checkPaymentStatus.mockRejectedValue(
        new Error('Payment service unavailable')
      );

      const response = await request(app)
        .get(`/api/payments/monero/status/${testOrder._id}`)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to check payment status: Payment service unavailable'
      });
    });

    it('should calculate expiration correctly', async () => {
      // Set expiration time to past
      const pastExpiration = new Date(Date.now() - 60 * 1000); // 1 minute ago
      await Order.findByIdAndUpdate(testOrder._id, {
        'moneroPayment.expirationTime': pastExpiration
      });

      moneroService.checkPaymentStatus.mockResolvedValue({
        paymentId: 'globee-payment-123',
        status: 'pending',
        confirmations: 0,
        isConfirmed: false,
        isUnderpaid: false
      });

      const response = await request(app)
        .get(`/api/payments/monero/status/${testOrder._id}`)
        .expect(200);

      expect(response.body.data.isExpired).toBe(true);
    });
  });

  describe('POST /api/payments/monero/webhook', () => {
    let validWebhookPayload;

    beforeEach(async () => {
      // Initialize webhook payload with testOrder ID
      validWebhookPayload = {
        id: 'globee-payment-123',
        status: 'confirmed',
        confirmations: 12,
        payment_amount: 1.9999,
        received_amount: 1.9999,
        custom_data: {
          orderId: testOrder._id.toString()
        }
      };

      // Setup order with Monero payment
      await Order.findByIdAndUpdate(testOrder._id, {
        moneroPayment: {
          paymentId: 'globee-payment-123',
          moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
          xmrAmount: 1.9999,
          exchangeRate: 0.01,
          status: 'pending'
        }
      });
    });

    it('should process webhook successfully', async () => {
      moneroService.verifyWebhookSignature.mockReturnValue(true);
      moneroService.processWebhookPayload.mockReturnValue({
        paymentId: 'globee-payment-123',
        orderId: testOrder._id.toString(),
        status: 'confirmed',
        confirmations: 12,
        isConfirmed: true,
        isUnderpaid: false,
        timestamp: new Date()
      });

      const response = await request(app)
        .post('/api/payments/monero/webhook')
        .set('X-GloBee-Signature', 'sha256=valid-signature')
        .send(validWebhookPayload)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Webhook processed successfully'
      });

      // Verify order was updated
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentStatus).toBe('paid');
      expect(updatedOrder.moneroPayment.status).toBe('confirmed');
      expect(updatedOrder.moneroPayment.confirmations).toBe(12);
    });

    it('should reject webhook with invalid signature', async () => {
      moneroService.verifyWebhookSignature.mockReturnValue(false);

      const response = await request(app)
        .post('/api/payments/monero/webhook')
        .set('X-GloBee-Signature', 'sha256=invalid-signature')
        .send(validWebhookPayload)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid webhook signature'
      });
    });

    it('should handle missing signature header', async () => {
      const response = await request(app)
        .post('/api/payments/monero/webhook')
        .send(validWebhookPayload)
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        error: 'Missing webhook signature'
      });
    });

    it('should handle webhook for non-existent order', async () => {
      const nonExistentOrderId = mongoose.Types.ObjectId();
      
      moneroService.verifyWebhookSignature.mockReturnValue(true);
      moneroService.processWebhookPayload.mockReturnValue({
        paymentId: 'globee-payment-456',
        orderId: nonExistentOrderId.toString(),
        status: 'confirmed',
        isConfirmed: true,
        isUnderpaid: false,
        timestamp: new Date()
      });

      const webhookPayload = {
        ...validWebhookPayload,
        custom_data: { orderId: nonExistentOrderId.toString() }
      };

      const response = await request(app)
        .post('/api/payments/monero/webhook')
        .set('X-GloBee-Signature', 'sha256=valid-signature')
        .send(webhookPayload)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Order not found'
      });
    });

    it('should handle underpaid webhook', async () => {
      moneroService.verifyWebhookSignature.mockReturnValue(true);
      moneroService.processWebhookPayload.mockReturnValue({
        paymentId: 'globee-payment-123',
        orderId: testOrder._id.toString(),
        status: 'partially_confirmed',
        confirmations: 5,
        isConfirmed: false,
        isUnderpaid: true,
        timestamp: new Date()
      });

      const underpaidPayload = {
        ...validWebhookPayload,
        status: 'partially_confirmed',
        received_amount: 1.5
      };

      const response = await request(app)
        .post('/api/payments/monero/webhook')
        .set('X-GloBee-Signature', 'sha256=valid-signature')
        .send(underpaidPayload)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify order payment status remains pending for underpaid
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentStatus).toBe('pending');
      expect(updatedOrder.moneroPayment.status).toBe('partially_confirmed');
    });

    it('should handle failed payment webhook', async () => {
      moneroService.verifyWebhookSignature.mockReturnValue(true);
      moneroService.processWebhookPayload.mockReturnValue({
        paymentId: 'globee-payment-123',
        orderId: testOrder._id.toString(),
        status: 'failed',
        confirmations: 0,
        isConfirmed: false,
        isUnderpaid: false,
        timestamp: new Date()
      });

      const failedPayload = {
        ...validWebhookPayload,
        status: 'failed'
      };

      const response = await request(app)
        .post('/api/payments/monero/webhook')
        .set('X-GloBee-Signature', 'sha256=valid-signature')
        .send(failedPayload)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify order payment status is marked as failed
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentStatus).toBe('failed');
      expect(updatedOrder.moneroPayment.status).toBe('failed');
    });

    it('should handle webhook processing errors', async () => {
      moneroService.verifyWebhookSignature.mockReturnValue(true);
      moneroService.processWebhookPayload.mockImplementation(() => {
        throw new Error('Processing error');
      });

      const response = await request(app)
        .post('/api/payments/monero/webhook')
        .set('X-GloBee-Signature', 'sha256=valid-signature')
        .send(validWebhookPayload)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to process webhook: Processing error'
      });
    });

    it('should ignore duplicate webhooks', async () => {
      // First webhook
      moneroService.verifyWebhookSignature.mockReturnValue(true);
      moneroService.processWebhookPayload.mockReturnValue({
        paymentId: 'globee-payment-123',
        orderId: testOrder._id.toString(),
        status: 'confirmed',
        confirmations: 12,
        isConfirmed: true,
        isUnderpaid: false,
        timestamp: new Date()
      });

      await request(app)
        .post('/api/payments/monero/webhook')
        .set('X-GloBee-Signature', 'sha256=valid-signature')
        .send(validWebhookPayload)
        .expect(200);

      // Second identical webhook (should be handled gracefully)
      const response = await request(app)
        .post('/api/payments/monero/webhook')
        .set('X-GloBee-Signature', 'sha256=valid-signature')
        .send(validWebhookPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Payment Status Updates', () => {
    it('should update order status to shipped after payment confirmation', async () => {
      // Setup confirmed payment
      await Order.findByIdAndUpdate(testOrder._id, {
        paymentStatus: 'paid',
        moneroPayment: {
          paymentId: 'globee-payment-123',
          status: 'confirmed',
          confirmations: 15
        }
      });

      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentStatus).toBe('paid');
    });

    it('should handle payment timeout scenarios', async () => {
      // Setup expired payment
      const expiredTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      
      await Order.findByIdAndUpdate(testOrder._id, {
        moneroPayment: {
          paymentId: 'globee-payment-123',
          expirationTime: expiredTime,
          status: 'pending'
        }
      });

      moneroService.checkPaymentStatus.mockResolvedValue({
        paymentId: 'globee-payment-123',
        status: 'expired',
        isConfirmed: false,
        isUnderpaid: false
      });

      const response = await request(app)
        .get(`/api/payments/monero/status/${testOrder._id}`)
        .expect(200);

      expect(response.body.data.isExpired).toBe(true);
    });
  });
});