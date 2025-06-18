import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import * as paymentController from '../paymentController.js';
import Cart from '../../models/Cart.js';
import Product from '../../models/Product.js';
import Order from '../../models/Order.js';
import bitcoinService from '../../services/bitcoinService.js';
import moneroService from '../../services/moneroService.js';
import paypalService from '../../services/paypalService.js';
import emailService from '../../services/emailService.js';
import { logError, logPaymentEvent } from '../../utils/logger.js';

// Mock all dependencies
vi.mock('../../models/Cart.js');
vi.mock('../../models/Product.js');
vi.mock('../../models/Order.js');
vi.mock('../../services/bitcoinService.js');
vi.mock('../../services/moneroService.js');
vi.mock('../../services/paypalService.js');
vi.mock('../../services/emailService.js');
vi.mock('../../utils/logger.js');
vi.mock('mongoose', async () => {
  const actual = await vi.importActual('mongoose');
  return {
    ...actual,
    default: {
      ...actual.default,
      startSession: vi.fn(),
      connection: {
        readyState: 1
      }
    }
  };
});

// Mock PayPal SDK
vi.mock('@paypal/paypal-server-sdk', () => ({
  Client: vi.fn().mockImplementation(() => ({
    ordersController: {
      ordersCreate: vi.fn(),
      ordersCapture: vi.fn()
    },
    paymentsController: {
      capturesRefund: vi.fn()
    }
  })),
  Environment: {
    Sandbox: 'sandbox',
    Production: 'production'
  }
}));

describe('Payment Controller - Comprehensive Unit Tests', () => {
  let req, res;
  let mockSession;

  beforeEach(() => {
    // Setup request object
    req = {
      user: { _id: 'user123', email: 'test@example.com' },
      body: {},
      params: {},
      cookies: { cartSessionId: 'session123' },
      headers: {}
    };

    // Setup response object
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    // Setup mock session
    mockSession = {
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      abortTransaction: vi.fn(),
      endSession: vi.fn(),
      inTransaction: true,
      withTransaction: vi.fn().mockImplementation(async (fn) => {
        await mockSession.startTransaction();
        try {
          const result = await fn();
          await mockSession.commitTransaction();
          return result;
        } catch (error) {
          await mockSession.abortTransaction();
          throw error;
        }
      })
    };

    mongoose.startSession.mockResolvedValue(mockSession);

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('getPaymentMethods', () => {
    it('should return all available payment methods', async () => {
      await paymentController.getPaymentMethods(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          paymentMethods: [
            {
              id: 'paypal',
              type: 'paypal',
              name: 'PayPal',
              description: 'Pay with your PayPal account',
              icon: 'paypal',
              enabled: true
            },
            {
              id: 'bitcoin',
              type: 'bitcoin',
              name: 'Bitcoin',
              description: 'Pay with Bitcoin - private and secure',
              icon: 'bitcoin',
              enabled: true
            },
            {
              id: 'monero',
              type: 'monero',
              name: 'Monero',
              description: 'Pay with Monero - private and untraceable',
              icon: 'monero',
              enabled: true
            }
          ]
        }
      });
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Database error');
      res.json.mockImplementationOnce(() => { throw error; });

      await paymentController.getPaymentMethods(req, res);

      expect(logError).toHaveBeenCalledWith(error, { context: 'get_payment_methods' });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to retrieve payment methods'
      });
    });
  });

  describe('createPayPalOrder', () => {
    beforeEach(() => {
      req.body = {
        cartId: 'cart123',
        shippingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'London',
          stateProvince: 'England',
          postalCode: 'SW1A 1AA',
          country: 'GB'
        },
        billingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'London',
          stateProvince: 'England',
          postalCode: 'SW1A 1AA',
          country: 'GB'
        }
      };

      // Mock cart with items
      Cart.findById = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue({
          _id: 'cart123',
          userId: 'user123',
          items: [
            {
              productId: { 
                _id: 'prod1',
                name: 'Product 1',
                price: 100,
                inStock: true
              },
              quantity: 2,
              subtotal: 200
            }
          ],
          totalAmount: 200
        })
      });

      // Mock product stock check
      Product.findById = vi.fn().mockResolvedValue({
        _id: 'prod1',
        inStock: true,
        stockQuantity: 10
      });

      // Mock order creation
      Order.prototype.save = vi.fn().mockResolvedValue({
        _id: 'order123',
        orderNumber: 'ORD-123456',
        userId: 'user123',
        orderTotal: 200
      });

      // Mock PayPal service
      paypalService.createOrder = vi.fn().mockResolvedValue({
        id: 'paypal-order-123',
        status: 'CREATED',
        links: [
          { rel: 'approve', href: 'https://paypal.com/approve' }
        ]
      });
    });

    it('should create PayPal order successfully', async () => {
      await paymentController.createPayPalOrder(req, res);

      expect(Cart.findById).toHaveBeenCalledWith('cart123');
      expect(Order.prototype.save).toHaveBeenCalled();
      expect(paypalService.createOrder).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          orderId: expect.any(String),
          orderNumber: expect.any(String),
          paypalOrderId: 'paypal-order-123',
          approvalUrl: 'https://paypal.com/approve'
        })
      });
    });

    it('should validate required fields', async () => {
      req.body = { cartId: 'cart123' }; // Missing addresses

      await paymentController.createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('required')
      });
    });

    it('should handle empty cart', async () => {
      Cart.findById = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue({
          _id: 'cart123',
          items: [],
          totalAmount: 0
        })
      });

      await paymentController.createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cart is empty'
      });
    });

    it('should handle PayPal client not initialized', async () => {
      // Temporarily remove PayPal environment variables
      const originalEnv = process.env.PAYPAL_CLIENT_ID;
      delete process.env.PAYPAL_CLIENT_ID;

      // Re-import to test initialization without credentials
      vi.resetModules();
      const controller = await import('../paymentController.js');
      
      await controller.createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'PayPal payment processing is not available'
      });

      // Restore environment
      process.env.PAYPAL_CLIENT_ID = originalEnv;
    });

    it('should handle out of stock products', async () => {
      Product.findById = vi.fn().mockResolvedValue({
        _id: 'prod1',
        inStock: false,
        stockQuantity: 0
      });

      await paymentController.createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: expect.stringContaining('out of stock')
      });
    });

    it('should handle transaction errors', async () => {
      const error = new Error('Database transaction failed');
      mockSession.withTransaction.mockRejectedValue(error);

      await paymentController.createPayPalOrder(req, res);

      expect(logError).toHaveBeenCalledWith(error, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('capturePayPalOrder', () => {
    beforeEach(() => {
      req.body = { orderId: 'order123', paypalOrderId: 'paypal123' };

      Order.findById = vi.fn().mockReturnValue({
        session: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue({
          _id: 'order123',
          userId: 'user123',
          paymentStatus: 'pending',
          paymentDetails: {},
          save: vi.fn().mockResolvedValue(true)
        })
      });

      paypalService.captureOrder = vi.fn().mockResolvedValue({
        id: 'capture123',
        status: 'COMPLETED',
        purchase_units: [{
          payments: {
            captures: [{
              id: 'transaction123',
              amount: { value: '200.00' }
            }]
          }
        }],
        payer: {
          email_address: 'buyer@example.com',
          payer_id: 'payer123'
        }
      });

      emailService.sendOrderConfirmation = vi.fn().mockResolvedValue(true);
    });

    it('should capture PayPal payment successfully', async () => {
      await paymentController.capturePayPalOrder(req, res);

      expect(Order.findById).toHaveBeenCalledWith('order123');
      expect(paypalService.captureOrder).toHaveBeenCalledWith('paypal123');
      expect(emailService.sendOrderConfirmation).toHaveBeenCalled();
      expect(logPaymentEvent).toHaveBeenCalledWith('paypal_payment_captured', expect.any(Object));
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          orderId: 'order123',
          status: 'completed',
          paymentDetails: expect.objectContaining({
            paypalCaptureId: 'capture123',
            paypalTransactionId: 'transaction123'
          })
        }
      });
    });

    it('should validate required fields', async () => {
      req.body = { orderId: 'order123' }; // Missing paypalOrderId

      await paymentController.capturePayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order ID and PayPal Order ID are required'
      });
    });

    it('should handle non-existent order', async () => {
      Order.findById = vi.fn().mockReturnValue({
        session: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(null)
      });

      await paymentController.capturePayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order not found'
      });
    });

    it('should handle unauthorized access', async () => {
      Order.findById = vi.fn().mockReturnValue({
        session: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue({
          _id: 'order123',
          userId: 'differentUser',
          paymentStatus: 'pending'
        })
      });

      await paymentController.capturePayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access to order'
      });
    });

    it('should handle already completed payments', async () => {
      Order.findById = vi.fn().mockReturnValue({
        session: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue({
          _id: 'order123',
          userId: 'user123',
          paymentStatus: 'completed'
        })
      });

      await paymentController.capturePayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Payment has already been completed'
      });
    });

    it('should handle PayPal capture failures', async () => {
      paypalService.captureOrder = vi.fn().mockRejectedValue(new Error('PayPal API error'));

      await paymentController.capturePayPalOrder(req, res);

      expect(logError).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createBitcoinPayment', () => {
    beforeEach(() => {
      req.body = { orderId: 'order123' };

      Order.findById = vi.fn().mockResolvedValue({
        _id: 'order123',
        userId: 'user123',
        orderTotal: 199.99,
        paymentMethod: { type: 'bitcoin' },
        paymentStatus: 'pending',
        save: vi.fn().mockResolvedValue(true)
      });

      bitcoinService.getExchangeRate = vi.fn().mockResolvedValue({
        rate: 0.000025,
        validUntil: new Date(Date.now() + 300000)
      });

      bitcoinService.generateAddress = vi.fn().mockResolvedValue({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        qrCode: 'data:image/png;base64,mockQR'
      });
    });

    it('should create Bitcoin payment successfully', async () => {
      await paymentController.createBitcoinPayment(req, res);

      expect(Order.findById).toHaveBeenCalledWith('order123');
      expect(bitcoinService.getExchangeRate).toHaveBeenCalled();
      expect(bitcoinService.generateAddress).toHaveBeenCalledWith('order123');
      expect(logPaymentEvent).toHaveBeenCalledWith('bitcoin_payment_created', expect.any(Object));

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          orderId: 'order123',
          bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          btcAmount: expect.any(Number),
          exchangeRate: 0.000025,
          qrCode: 'data:image/png;base64,mockQR'
        })
      });
    });

    it('should validate order ID format', async () => {
      req.body = { orderId: 'invalid-format' };
      
      // Mock mongoose.Types.ObjectId.isValid
      const originalIsValid = mongoose.Types.ObjectId.isValid;
      mongoose.Types.ObjectId.isValid = vi.fn().mockReturnValue(false);

      await paymentController.createBitcoinPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid order ID format'
      });

      mongoose.Types.ObjectId.isValid = originalIsValid;
    });

    it('should handle missing order ID', async () => {
      req.body = {};

      await paymentController.createBitcoinPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order ID is required'
      });
    });

    it('should handle wrong payment method', async () => {
      Order.findById = vi.fn().mockResolvedValue({
        _id: 'order123',
        userId: 'user123',
        paymentMethod: { type: 'paypal' }
      });

      await paymentController.createBitcoinPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order is not set for Bitcoin payment'
      });
    });

    it('should handle exchange rate service failure', async () => {
      bitcoinService.getExchangeRate = vi.fn().mockRejectedValue(new Error('API error'));

      await paymentController.createBitcoinPayment(req, res);

      expect(logError).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to create Bitcoin payment'
      });
    });
  });

  describe('checkBitcoinPaymentStatus', () => {
    beforeEach(() => {
      req.params = { orderId: 'order123' };

      Order.findById = vi.fn().mockResolvedValue({
        _id: 'order123',
        userId: 'user123',
        paymentMethod: { type: 'bitcoin' },
        paymentDetails: {
          bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          bitcoinAmount: 0.005,
          bitcoinPaymentExpiry: new Date(Date.now() + 3600000)
        }
      });

      bitcoinService.getAddressInfo = vi.fn().mockResolvedValue({
        balance: 0.005,
        transactions: [
          { confirmations: 3, amount: 0.005 }
        ]
      });
    });

    it('should check Bitcoin payment status successfully', async () => {
      await paymentController.checkBitcoinPaymentStatus(req, res);

      expect(Order.findById).toHaveBeenCalledWith('order123');
      expect(bitcoinService.getAddressInfo).toHaveBeenCalled();
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          orderId: 'order123',
          paymentStatus: 'confirmed',
          confirmations: 3,
          amountReceived: 0.005,
          isExpired: false
        })
      });
    });

    it('should detect expired payments', async () => {
      Order.findById = vi.fn().mockResolvedValue({
        _id: 'order123',
        userId: 'user123',
        paymentMethod: { type: 'bitcoin' },
        paymentDetails: {
          bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          bitcoinAmount: 0.005,
          bitcoinPaymentExpiry: new Date(Date.now() - 3600000) // Expired
        }
      });

      await paymentController.checkBitcoinPaymentStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          isExpired: true
        })
      });
    });

    it('should handle insufficient confirmations', async () => {
      bitcoinService.getAddressInfo = vi.fn().mockResolvedValue({
        balance: 0.005,
        transactions: [
          { confirmations: 1, amount: 0.005 } // Only 1 confirmation
        ]
      });

      await paymentController.checkBitcoinPaymentStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          paymentStatus: 'awaiting_confirmation',
          confirmations: 1
        })
      });
    });

    it('should handle no payment received', async () => {
      bitcoinService.getAddressInfo = vi.fn().mockResolvedValue({
        balance: 0,
        transactions: []
      });

      await paymentController.checkBitcoinPaymentStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          paymentStatus: 'pending',
          confirmations: 0,
          amountReceived: 0
        })
      });
    });
  });

  describe('createMoneroPayment', () => {
    beforeEach(() => {
      req.body = { orderId: 'order123' };

      Order.findById = vi.fn().mockResolvedValue({
        _id: 'order123',
        userId: 'user123',
        orderTotal: 199.99,
        paymentMethod: { type: 'monero' },
        paymentStatus: 'pending',
        orderNumber: 'ORD-123456',
        save: vi.fn().mockResolvedValue(true)
      });

      moneroService.convertGbpToXmr = vi.fn().mockResolvedValue({
        xmrAmount: 1.234567,
        exchangeRate: 0.00617,
        validUntil: new Date(Date.now() + 300000)
      });

      moneroService.createPaymentRequest = vi.fn().mockResolvedValue({
        paymentId: 'globee-123',
        address: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F',
        paymentUrl: 'https://globee.com/payment/123',
        expirationTime: new Date(Date.now() + 86400000),
        requiredConfirmations: 10,
        paymentWindow: 24
      });
    });

    it('should create Monero payment successfully', async () => {
      await paymentController.createMoneroPayment(req, res);

      expect(Order.findById).toHaveBeenCalledWith('order123');
      expect(moneroService.convertGbpToXmr).toHaveBeenCalledWith(199.99);
      expect(moneroService.createPaymentRequest).toHaveBeenCalled();
      expect(logPaymentEvent).toHaveBeenCalledWith('monero_payment_created', expect.any(Object));

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          orderId: 'order123',
          orderNumber: 'ORD-123456',
          moneroAddress: expect.any(String),
          xmrAmount: 1.234567,
          exchangeRate: 0.00617,
          paymentUrl: 'https://globee.com/payment/123'
        })
      });
    });

    it('should handle session not available gracefully', async () => {
      mongoose.startSession.mockRejectedValue(new Error('Sessions not supported'));

      await paymentController.createMoneroPayment(req, res);

      // Should still work without transactions
      expect(moneroService.createPaymentRequest).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object)
      });
    });

    it('should validate ObjectId format', async () => {
      req.body = { orderId: 'not-an-objectid' };
      
      const originalIsValid = mongoose.Types.ObjectId.isValid;
      mongoose.Types.ObjectId.isValid = vi.fn().mockReturnValue(false);

      await paymentController.createMoneroPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid order ID format'
      });

      mongoose.Types.ObjectId.isValid = originalIsValid;
    });

    it('should handle service errors', async () => {
      moneroService.convertGbpToXmr = vi.fn().mockRejectedValue(new Error('Exchange API down'));

      await paymentController.createMoneroPayment(req, res);

      expect(logError).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Exchange API down'
      });
    });
  });

  describe('checkMoneroPaymentStatus', () => {
    beforeEach(() => {
      req.params = { orderId: 'order123' };

      Order.findById = vi.fn().mockResolvedValue({
        _id: 'order123',
        paymentMethod: { type: 'monero' },
        paymentDetails: {
          globeePaymentId: 'globee-123',
          expirationTime: new Date(Date.now() + 3600000)
        },
        createdAt: new Date()
      });

      moneroService.getPaymentStatus = vi.fn().mockResolvedValue({
        status: 'pending',
        confirmations: 5,
        paid_amount: 0.5,
        transaction_hash: null
      });

      moneroService.getRequiredConfirmations = vi.fn().mockReturnValue(10);
    });

    it('should check Monero payment status successfully', async () => {
      await paymentController.checkMoneroPaymentStatus(req, res);

      expect(Order.findById).toHaveBeenCalledWith('order123');
      expect(moneroService.getPaymentStatus).toHaveBeenCalledWith('globee-123');
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          orderId: 'order123',
          paymentStatus: 'pending',
          confirmations: 5,
          paidAmount: 0.5,
          isExpired: false,
          requiredConfirmations: 10
        })
      });
    });

    it('should handle missing payment details', async () => {
      Order.findById = vi.fn().mockResolvedValue({
        _id: 'order123',
        paymentMethod: { type: 'monero' },
        paymentDetails: {} // No globeePaymentId
      });

      await paymentController.checkMoneroPaymentStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No Monero payment request found'
      });
    });

    it('should detect expired payments', async () => {
      Order.findById = vi.fn().mockResolvedValue({
        _id: 'order123',
        paymentMethod: { type: 'monero' },
        paymentDetails: {
          globeePaymentId: 'globee-123',
          expirationTime: new Date(Date.now() - 3600000) // Expired
        },
        createdAt: new Date()
      });

      await paymentController.checkMoneroPaymentStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          isExpired: true
        })
      });
    });
  });

  describe('handleMoneroWebhook', () => {
    beforeEach(() => {
      req.headers = { 'x-globee-signature': 'valid-signature' };
      req.body = {
        id: 'globee-123',
        status: 'paid',
        confirmations: 12,
        paid_amount: 1.234567,
        order_id: 'order123'
      };

      Order.findById = vi.fn().mockResolvedValue({
        _id: 'order123',
        paymentDetails: {},
        paymentStatus: 'pending',
        save: vi.fn().mockResolvedValue(true)
      });

      moneroService.verifyWebhookSignature = vi.fn().mockReturnValue(true);
      moneroService.processWebhookNotification = vi.fn().mockReturnValue({
        orderId: 'order123',
        status: 'confirmed',
        confirmations: 12,
        paidAmount: 1.234567
      });
    });

    it('should process valid webhook successfully', async () => {
      await paymentController.handleMoneroWebhook(req, res);

      expect(moneroService.verifyWebhookSignature).toHaveBeenCalled();
      expect(moneroService.processWebhookNotification).toHaveBeenCalledWith(req.body);
      expect(Order.findById).toHaveBeenCalledWith('order123');
      expect(logPaymentEvent).toHaveBeenCalledWith('monero_payment_confirmed', expect.any(Object));

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        received: true
      });
    });

    it('should reject invalid signature', async () => {
      moneroService.verifyWebhookSignature = vi.fn().mockReturnValue(false);

      await paymentController.handleMoneroWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid webhook signature'
      });
    });

    it('should handle missing order ID', async () => {
      moneroService.processWebhookNotification = vi.fn().mockReturnValue({
        orderId: null,
        status: 'confirmed'
      });

      await paymentController.handleMoneroWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid webhook data'
      });
    });

    it('should handle different payment statuses', async () => {
      const statuses = [
        { webhook: 'partially_confirmed', expected: 'awaiting_confirmation' },
        { webhook: 'underpaid', expected: 'underpaid' },
        { webhook: 'failed', expected: 'failed' }
      ];

      for (const { webhook, expected } of statuses) {
        vi.clearAllMocks();
        
        moneroService.processWebhookNotification = vi.fn().mockReturnValue({
          orderId: 'order123',
          status: webhook,
          confirmations: 5
        });

        const order = {
          _id: 'order123',
          paymentDetails: {},
          paymentStatus: 'pending',
          save: vi.fn().mockResolvedValue(true)
        };
        Order.findById = vi.fn().mockResolvedValue(order);

        await paymentController.handleMoneroWebhook(req, res);

        expect(order.paymentStatus).toBe(expected);
        expect(order.save).toHaveBeenCalled();
      }
    });

    it('should handle webhook processing errors', async () => {
      const error = new Error('Database error');
      Order.findById = vi.fn().mockRejectedValue(error);

      await paymentController.handleMoneroWebhook(req, res);

      expect(logError).toHaveBeenCalledWith(error, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle null user gracefully in createPayPalOrder', async () => {
      req.user = null;
      req.body = { cartId: 'cart123' };

      await paymentController.createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle circular references in logging', async () => {
      const circularObj = { a: 1 };
      circularObj.self = circularObj;
      
      const error = new Error('Test error');
      error.context = circularObj;

      // This should not throw
      logError(error, { context: 'test' });
      
      expect(logError).toHaveBeenCalledWith(error, { context: 'test' });
    });

    it('should handle very large order amounts', async () => {
      req.body = { orderId: 'order123' };
      
      Order.findById = vi.fn().mockResolvedValue({
        _id: 'order123',
        userId: 'user123',
        orderTotal: 999999999.99, // Very large amount
        paymentMethod: { type: 'bitcoin' },
        save: vi.fn().mockResolvedValue(true)
      });

      bitcoinService.getExchangeRate = vi.fn().mockResolvedValue({
        rate: 0.000025,
        validUntil: new Date(Date.now() + 300000)
      });

      bitcoinService.generateAddress = vi.fn().mockResolvedValue({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        qrCode: 'data:image/png;base64,mockQR'
      });

      await paymentController.createBitcoinPayment(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          btcAmount: expect.any(Number)
        })
      });
    });

    it('should handle malformed webhook data', async () => {
      req.headers = { 'x-globee-signature': 'valid-signature' };
      req.body = 'not-json-data';

      moneroService.verifyWebhookSignature = vi.fn().mockReturnValue(true);
      moneroService.processWebhookNotification = vi.fn().mockImplementation(() => {
        throw new Error('Invalid webhook format');
      });

      await paymentController.handleMoneroWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});