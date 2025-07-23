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
vi.mock('../../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    http: vi.fn(),
    stream: {
      write: vi.fn()
    }
  },
  logError: vi.fn(),
  logPaymentEvent: vi.fn(),
  logAuthEvent: vi.fn(),
  logSecurityEvent: vi.fn()
}));
vi.mock('../../models/ShippingMethod.js', () => ({
  default: {
    findOne: vi.fn().mockResolvedValue({
      _id: 'standard-shipping',
      isActive: true,
      calculateCost: vi.fn().mockReturnValue({ cost: 10 })
    })
  }
}));
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
const mockOrdersController = {
  ordersCreate: vi.fn(),
  ordersCapture: vi.fn()
};
const mockPaymentsController = {
  capturesRefund: vi.fn()
};

vi.mock('@paypal/paypal-server-sdk', () => ({
  Client: vi.fn().mockImplementation(() => ({
    ordersController: mockOrdersController,
    paymentsController: mockPaymentsController
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
    // Reset environment to force paypalClient initialization
    delete process.env.PAYPAL_CLIENT_ID;
    delete process.env.PAYPAL_CLIENT_SECRET;
    
    // Set up PayPal environment variables for testing
    process.env.PAYPAL_CLIENT_ID = 'test-client-id';
    process.env.PAYPAL_CLIENT_SECRET = 'test-client-secret';
    process.env.PAYPAL_ENVIRONMENT = 'sandbox';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    
    // Setup request object (guest user for cart session testing)
    req = {
      // No user for guest checkout
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

      expect(logError).toHaveBeenCalledWith(error, { context: 'paypal_payment_methods' });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while fetching payment methods'
      });
    });
  });

  describe('createPayPalOrder', () => {
    beforeEach(() => {
      req.body = {
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Main St',
          addressLine2: '',
          city: 'London',
          stateProvince: 'England',
          postalCode: 'SW1A 1AA',
          country: 'GB'
        },
        shippingMethodId: 'standard-shipping'
      };

      // Mock cart with items
      Cart.findBySessionId = vi.fn().mockResolvedValue({
        _id: 'cart123',
        sessionId: 'session123',
        items: [
          {
            productId: 'prod1',
            quantity: 2,
            subtotal: 200
          }
        ],
        totalAmount: 200
      });

      // Mock product stock check
      Product.findById = vi.fn().mockResolvedValue({
        _id: 'prod1',
        inStock: true,
        stockQuantity: 10
      });
      
      // Mock Product.find for stock validation
      Product.find = vi.fn().mockResolvedValue([
        {
          _id: 'prod1',
          name: 'Product 1',
          price: 100,
          stockQuantity: 10,
          isActive: true
        }
      ]);

      // Mock ShippingMethod - already mocked at module level

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
      
      // Mock PayPal SDK orders controller response
      mockOrdersController.ordersCreate.mockResolvedValue({
        result: {
          id: 'paypal-order-123',
          status: 'CREATED',
          links: [
            { rel: 'approve', href: 'https://paypal.com/approve' }
          ]
        }
      });
    });

    it('should create PayPal order successfully', async () => {
      await paymentController.createPayPalOrder(req, res);

      expect(Cart.findBySessionId).toHaveBeenCalledWith('session123');
      // Note: createPayPalOrder doesn't create DB order, only PayPal order
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          paypalOrderId: 'paypal-order-123',
          orderSummary: expect.objectContaining({
            cartTotal: expect.any(Number),
            shippingCost: expect.any(Number),
            orderTotal: expect.any(Number),
            currency: 'GBP'
          }),
          approvalUrl: 'https://paypal.com/approve'
        })
      });
    });

    it('should validate required fields', async () => {
      req.body = { shippingAddress: {} }; // Missing shippingMethodId

      await paymentController.createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Shipping address and shipping method are required'
      });
    });

    it('should handle empty cart', async () => {
      Cart.findBySessionId = vi.fn().mockResolvedValue({
        _id: 'cart123',
        items: [],
        totalAmount: 0
      });

      await paymentController.createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cart is empty'
      });
    });

    it('should handle PayPal client not initialized', async () => {
      // Mock paypalService to simulate client not initialized
      paypalService.createOrder = vi.fn().mockRejectedValue(new Error('PayPal client not initialized'));

      await paymentController.createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'PayPal service temporarily unavailable'
      });
    });

    it('should handle out of stock products', async () => {
      // Mock product with insufficient stock
      Product.find = vi.fn().mockResolvedValue([
        {
          _id: 'prod1',
          name: 'Product 1',
          price: 100,
          stockQuantity: 0  // No stock available
        }
      ]);

      await paymentController.createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient stock for product Product 1'
      });
    });

    it('should handle database transaction errors', async () => {
      // Mock database error during save
      Product.find = vi.fn().mockResolvedValue([mockProduct]);
      Order.prototype.save = vi.fn().mockRejectedValue(new Error('Database transaction failed'));

      await paymentController.createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('capturePayPalPayment', () => {
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
      await paymentController.capturePayPalPayment(req, res);

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

      await paymentController.capturePayPalPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'PayPal order ID is required'
      });
    });

    it('should handle non-existent order', async () => {
      Order.findById = vi.fn().mockReturnValue({
        session: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(null)
      });

      await paymentController.capturePayPalPayment(req, res);

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

      await paymentController.capturePayPalPayment(req, res);

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

      await paymentController.capturePayPalPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Payment has already been completed'
      });
    });

    it('should handle PayPal capture failures', async () => {
      paypalService.captureOrder = vi.fn().mockRejectedValue(new Error('PayPal API error'));

      await paymentController.capturePayPalPayment(req, res);

      expect(logError).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('initializeBitcoinPayment', () => {
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

      // Mock bitcoinService.createBitcoinPayment (the actual function called)
      bitcoinService.createBitcoinPayment = vi.fn().mockResolvedValue({
        bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        btcAmount: 0.00499875,
        exchangeRate: 0.000025,
        qrCode: 'data:image/png;base64,mockQR',
        paymentExpiresAt: new Date(Date.now() + 1800000)
      });
    });

    it('should create Bitcoin payment successfully', async () => {
      await paymentController.initializeBitcoinPayment(req, res);

      expect(Order.findById).toHaveBeenCalledWith('order123');
      expect(bitcoinService.createBitcoinPayment).toHaveBeenCalled();
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

      await paymentController.initializeBitcoinPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid order ID format'
      });

      mongoose.Types.ObjectId.isValid = originalIsValid;
    });

    it('should handle missing order ID', async () => {
      req.body = {};

      await paymentController.initializeBitcoinPayment(req, res);

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
        paymentMethod: { type: 'paypal' },
        paymentStatus: 'pending'
      });

      await paymentController.initializeBitcoinPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order is not in pending payment state'
      });
    });

    it('should handle exchange rate service failure', async () => {
      bitcoinService.createBitcoinPayment = vi.fn().mockRejectedValue(new Error('API error'));

      await paymentController.initializeBitcoinPayment(req, res);

      expect(logError).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to initialize Bitcoin payment'
      });
    });
  });

  describe('getBitcoinPaymentStatus', () => {
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

      // Mock bitcoinService.checkPaymentStatus (the actual function called)
      bitcoinService.checkPaymentStatus = vi.fn().mockResolvedValue({
        status: 'confirmed',
        confirmations: 3,
        amountReceived: 0.005,
        isExpired: false
      });
    });

    it('should check Bitcoin payment status successfully', async () => {
      await paymentController.getBitcoinPaymentStatus(req, res);

      expect(Order.findById).toHaveBeenCalledWith('order123');
      expect(bitcoinService.checkPaymentStatus).toHaveBeenCalled();
      
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

      await paymentController.getBitcoinPaymentStatus(req, res);

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

      await paymentController.getBitcoinPaymentStatus(req, res);

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

      await paymentController.getBitcoinPaymentStatus(req, res);

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
      
      // Mock mongoose.Types.ObjectId.isValid to return true for valid format
      const originalIsValid = mongoose.Types.ObjectId.isValid;
      mongoose.Types.ObjectId.isValid = vi.fn().mockReturnValue(true);
      
      Order.findById = vi.fn().mockResolvedValue({
        _id: 'order123',
        userId: 'user123',
        orderTotal: 999999999.99, // Very large amount
        paymentMethod: { type: 'bitcoin' },
        paymentStatus: 'pending',
        status: 'pending',
        save: vi.fn().mockResolvedValue(true)
      });

      // Mock bitcoinService.createBitcoinPayment (the function actually called by the controller)
      bitcoinService.createBitcoinPayment = vi.fn().mockResolvedValue({
        bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        btcAmount: 24999999.998,
        exchangeRate: 0.000025,
        qrCode: 'data:image/png;base64,mockQR',
        paymentExpiresAt: new Date(Date.now() + 1800000)
      });

      await paymentController.initializeBitcoinPayment(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          btcAmount: expect.any(Number)
        })
      });
      
      // Restore original function
      mongoose.Types.ObjectId.isValid = originalIsValid;
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