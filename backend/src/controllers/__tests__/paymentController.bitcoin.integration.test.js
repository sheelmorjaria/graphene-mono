import { vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { initializeBitcoinPayment, getBitcoinPaymentStatus, handleBlockonomicsWebhook } from '../paymentController.js';
import Order from '../../models/Order.js';
import bitcoinService from '../../services/bitcoinService.js';

// Mock Bitcoin service
vi.mock('../../services/bitcoinService.js', () => ({
  default: {
    createBitcoinPayment: vi.fn(),
    isPaymentExpired: vi.fn(),
    isPaymentConfirmed: vi.fn(),
    isPaymentSufficient: vi.fn(),
    satoshisToBtc: vi.fn()
  }
}));

const app = express();
app.use(express.json());
app.post('/api/payment/bitcoin/initialize', initializeBitcoinPayment);
app.get('/api/payment/bitcoin/status/:orderId', getBitcoinPaymentStatus);
app.post('/api/payment/bitcoin/webhook', handleBlockonomicsWebhook);

describe('Bitcoin Payment Controller', () => {
  let mongoServer;
  let testOrder;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Order.deleteMany({});
    
    // Create test order
    testOrder = new Order({
      orderNumber: 'TEST-BTC-001',
      userId: new mongoose.Types.ObjectId(),
      customerEmail: 'test@example.com',
      items: [{
        productId: new mongoose.Types.ObjectId(),
        productName: 'Test Product',
        productSlug: 'test-product',
        unitPrice: 100,
        totalPrice: 100,
        quantity: 1
      }],
      subtotal: 100,
      tax: 0,
      shipping: 10,
      totalAmount: 110,
      shippingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Test St',
        city: 'Test City',
        stateProvince: 'Test State',
        postalCode: 'TE1 1ST',
        country: 'United Kingdom'
      },
      billingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Test St',
        city: 'Test City',
        stateProvince: 'Test State',
        postalCode: 'TE1 1ST',
        country: 'United Kingdom'
      },
      shippingMethod: {
        id: new mongoose.Types.ObjectId(),
        name: 'Standard Delivery',
        cost: 10
      },
      paymentMethod: {
        type: 'paypal',
        name: 'PayPal'
      },
      paymentStatus: 'pending'
    });
    
    await testOrder.save();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/payment/bitcoin/initialize', () => {
    it('should initialize Bitcoin payment for pending order', async () => {
      const mockBitcoinData = {
        bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        bitcoinAmount: 0.0044,
        bitcoinExchangeRate: 25000,
        bitcoinExchangeRateTimestamp: new Date(),
        bitcoinPaymentExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      bitcoinService.createBitcoinPayment.mockResolvedValue(mockBitcoinData);

      const response = await request(app)
        .post('/api/payment/bitcoin/initialize')
        .send({ orderId: testOrder._id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        bitcoinAddress: mockBitcoinData.bitcoinAddress,
        bitcoinAmount: mockBitcoinData.bitcoinAmount,
        exchangeRate: mockBitcoinData.bitcoinExchangeRate,
        orderTotal: 110,
        currency: 'GBP'
      });

      // Check that order was updated
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentMethod.type).toBe('bitcoin');
      expect(updatedOrder.paymentStatus).toBe('awaiting_confirmation');
      expect(updatedOrder.paymentDetails.bitcoinAddress).toBe(mockBitcoinData.bitcoinAddress);
    });

    it('should return 400 if order ID is missing', async () => {
      const response = await request(app)
        .post('/api/payment/bitcoin/initialize')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order ID is required');
    });

    it('should return 404 if order not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post('/api/payment/bitcoin/initialize')
        .send({ orderId: nonExistentId });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order not found');
    });

    it('should return 400 if order is not in pending state', async () => {
      testOrder.paymentStatus = 'completed';
      await testOrder.save();

      const response = await request(app)
        .post('/api/payment/bitcoin/initialize')
        .send({ orderId: testOrder._id });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order is not in pending payment state');
    });

    it('should handle Bitcoin service errors', async () => {
      bitcoinService.createBitcoinPayment.mockRejectedValue(new Error('API error'));

      const response = await request(app)
        .post('/api/payment/bitcoin/initialize')
        .send({ orderId: testOrder._id });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to initialize Bitcoin payment');
    });
  });

  describe('GET /api/payment/bitcoin/status/:orderId', () => {
    beforeEach(async () => {
      // Set up order as Bitcoin payment
      testOrder.paymentMethod = { type: 'bitcoin', name: 'Bitcoin' };
      testOrder.paymentDetails = {
        bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        bitcoinAmount: 0.0044,
        bitcoinExchangeRate: 25000,
        bitcoinConfirmations: 1,
        bitcoinAmountReceived: 0.0044,
        bitcoinPaymentExpiry: new Date(Date.now() + 60000) // 1 minute from now
      };
      testOrder.paymentStatus = 'awaiting_confirmation';
      await testOrder.save();
    });

    it('should return Bitcoin payment status', async () => {
      bitcoinService.isPaymentExpired.mockReturnValue(false);
      bitcoinService.isPaymentConfirmed.mockReturnValue(false);

      const response = await request(app)
        .get(`/api/payment/bitcoin/status/${testOrder._id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        orderId: testOrder._id.toString(),
        paymentStatus: 'awaiting_confirmation',
        bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        bitcoinAmount: 0.0044,
        bitcoinConfirmations: 1,
        requiresConfirmations: 2,
        isConfirmed: false
      });
    });

    it('should mark expired payments as expired', async () => {
      bitcoinService.isPaymentExpired.mockReturnValue(true);

      const response = await request(app)
        .get(`/api/payment/bitcoin/status/${testOrder._id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.isExpired).toBe(true);

      // Check that order was updated
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentStatus).toBe('expired');
    });

    it('should return 400 for non-Bitcoin orders', async () => {
      testOrder.paymentMethod = { type: 'paypal', name: 'PayPal' };
      await testOrder.save();

      const response = await request(app)
        .get(`/api/payment/bitcoin/status/${testOrder._id}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Order is not a Bitcoin payment');
    });
  });

  describe('POST /api/payment/bitcoin/webhook', () => {
    beforeEach(async () => {
      // Set up order as Bitcoin payment
      testOrder.paymentMethod = { type: 'bitcoin', name: 'Bitcoin' };
      testOrder.paymentDetails = {
        bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        bitcoinAmount: 0.0044,
        bitcoinPaymentExpiry: new Date(Date.now() + 60000)
      };
      testOrder.paymentStatus = 'awaiting_confirmation';
      await testOrder.save();
    });

    it('should process valid payment confirmation webhook', async () => {
      const webhookData = {
        addr: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        value: 440000, // 0.0044 BTC in satoshis
        txid: 'test-transaction-hash',
        confirmations: 2
      };

      bitcoinService.satoshisToBtc.mockReturnValue(0.0044);
      bitcoinService.isPaymentExpired.mockReturnValue(false);
      bitcoinService.isPaymentSufficient.mockReturnValue(true);
      bitcoinService.isPaymentConfirmed.mockReturnValue(true);

      const response = await request(app)
        .post('/api/payment/bitcoin/webhook')
        .send(webhookData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Check that order was updated
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentStatus).toBe('completed');
      expect(updatedOrder.status).toBe('processing');
      expect(updatedOrder.paymentDetails.bitcoinAmountReceived).toBe(0.0044);
      expect(updatedOrder.paymentDetails.bitcoinConfirmations).toBe(2);
      expect(updatedOrder.paymentDetails.bitcoinTransactionHash).toBe('test-transaction-hash');
    });

    it('should handle underpayment', async () => {
      const webhookData = {
        addr: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        value: 400000, // Less than expected
        txid: 'test-transaction-hash',
        confirmations: 2
      };

      bitcoinService.satoshisToBtc.mockReturnValue(0.004);
      bitcoinService.isPaymentExpired.mockReturnValue(false);
      bitcoinService.isPaymentSufficient.mockReturnValue(false);

      const response = await request(app)
        .post('/api/payment/bitcoin/webhook')
        .send(webhookData);

      expect(response.status).toBe(200);

      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentStatus).toBe('underpaid');
    });

    it('should handle expired payments', async () => {
      const webhookData = {
        addr: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        value: 440000,
        txid: 'test-transaction-hash',
        confirmations: 2
      };

      bitcoinService.satoshisToBtc.mockReturnValue(0.0044);
      bitcoinService.isPaymentExpired.mockReturnValue(true);

      const response = await request(app)
        .post('/api/payment/bitcoin/webhook')
        .send(webhookData);

      expect(response.status).toBe(200);

      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.paymentStatus).toBe('expired');
    });

    it('should return 400 for invalid webhook data', async () => {
      const response = await request(app)
        .post('/api/payment/bitcoin/webhook')
        .send({ addr: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' }); // Missing txid

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid webhook data');
    });

    it('should return 404 if no order found for address', async () => {
      const webhookData = {
        addr: '1NotFoundAddress',
        value: 440000,
        txid: 'test-transaction-hash',
        confirmations: 2
      };

      const response = await request(app)
        .post('/api/payment/bitcoin/webhook')
        .send(webhookData);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Order not found for this Bitcoin address');
    });
  });
});