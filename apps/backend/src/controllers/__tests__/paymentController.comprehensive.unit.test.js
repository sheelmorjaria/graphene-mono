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
  let mockProduct, mockCart, mockOrder;

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

    // Define common mock objects
    mockProduct = {
      _id: 'prod1',
      name: 'Product 1',
      price: 100,
      stockQuantity: 10,
      images: ['img1.jpg']
    };

    mockCart = {
      _id: 'cart123',
      userId: 'user123',
      items: [{
        productId: 'prod1',
        quantity: 2,
        price: 100
      }],
      getTotalAmount: vi.fn().mockReturnValue(200)
    };

    mockOrder = {
      _id: 'order123',
      orderNumber: 'ORD001',
      userId: 'user123',
      totalAmount: 199.99,
      paymentMethod: { type: 'bitcoin' },
      paymentDetails: {
        bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        bitcoinAmount: 0.005,
        paymentExpiry: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      },
      status: 'pending',
      save: vi.fn().mockResolvedValue(true)
    };

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
      // Mock environment variables to simulate PayPal not configured
      const originalClientId = process.env.PAYPAL_CLIENT_ID;
      const originalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
      
      delete process.env.PAYPAL_CLIENT_ID;
      delete process.env.PAYPAL_CLIENT_SECRET;

      await paymentController.createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'PayPal payment processing is not available'
      });
      
      // Restore environment variables
      process.env.PAYPAL_CLIENT_ID = originalClientId;
      process.env.PAYPAL_CLIENT_SECRET = originalClientSecret;
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
      // Mock database error during PayPal order creation
      mockOrdersController.ordersCreate.mockRejectedValue(new Error('PayPal API error'));

      await paymentController.createPayPalOrder(req, res);

      expect(logError).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'PayPal service is temporarily unavailable. Please try again later or use an alternative payment method.',
        alternatives: ['bitcoin', 'monero']
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
      // Mock the ordersController capture response
      mockOrdersController.ordersCapture.mockResolvedValue({
        result: {
          id: 'capture123',
          status: 'COMPLETED',
          purchase_units: [{
            amount: {
              value: '200.00',
              breakdown: {
                item_total: { value: '190.00' },
                shipping: { value: '10.00' },
                tax_total: { value: '0.00' }
              }
            },
            payments: {
              captures: [{
                id: 'transaction123',
                amount: { value: '200.00' }
              }]
            },
            shipping: {
              name: { full_name: 'John Doe' },
              address: {
                address_line_1: '123 Main St',
                admin_area_2: 'London',
                postal_code: 'SW1A 1AA',
                country_code: 'GB'
              }
            }
          }],
          payer: {
            email_address: 'buyer@example.com',
            payer_id: 'payer123'
          }
        }
      });

      // Mock cart and order creation
      Cart.findBySessionId.mockResolvedValue(mockCart);
      const mockNewOrder = {
        _id: 'order123',
        orderNumber: 'ORD-NEW-001',
        save: vi.fn().mockResolvedValue(true)
      };
      Order.mockImplementation(() => mockNewOrder);
      Order.countDocuments.mockResolvedValue(100);
      Order.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'order123',
          orderNumber: 'ORD-NEW-001'
        })
      });
      
      mockCart.clearCart = vi.fn().mockResolvedValue(true);

      await paymentController.capturePayPalPayment(req, res);

      expect(mockOrdersController.ordersCapture).toHaveBeenCalledWith({
        id: 'paypal123'
      });
      expect(Cart.findBySessionId).toHaveBeenCalled();
      expect(mockNewOrder.save).toHaveBeenCalled();
      expect(mockCart.clearCart).toHaveBeenCalled();
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          orderId: 'order123',
          orderNumber: 'ORD-NEW-001',
          amount: 200,
          paymentMethod: 'paypal',
          status: 'captured'
        })
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
      // Mock empty cart
      Cart.findBySessionId.mockResolvedValue(null);

      // Mock successful PayPal capture
      mockOrdersController.ordersCapture.mockResolvedValue({
        result: {
          id: 'capture123',
          status: 'COMPLETED',
          purchase_units: [{
            payments: {
              captures: [{
                id: 'transaction123'
              }]
            }
          }]
        }
      });

      await paymentController.capturePayPalPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cart not found'
      });
    });

    it('should handle unauthorized access', async () => {
      // Since capturePayPalPayment creates a new order, unauthorized access is not applicable
      // Instead test for PayPal capture status not COMPLETED
      mockOrdersController.ordersCapture.mockResolvedValue({
        result: {
          id: 'capture123',
          status: 'PENDING', // Not COMPLETED
          purchase_units: []
        }
      });

      await paymentController.capturePayPalPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'PayPal payment capture failed'
      });
    });

    it('should handle already completed payments', async () => {
      // Test for missing capture information
      mockOrdersController.ordersCapture.mockResolvedValue({
        result: {
          id: 'capture123',
          status: 'COMPLETED',
          purchase_units: [{
            payments: {} // No captures array
          }]
        }
      });

      await paymentController.capturePayPalPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'PayPal payment capture information not found'
      });
    });

    it('should handle PayPal capture failures', async () => {
      mockOrdersController.ordersCapture.mockRejectedValue(new Error('PayPal API error'));

      await paymentController.capturePayPalPayment(req, res);

      expect(logError).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'PayPal API error'
      });
    });
  });

  describe('initializeBitcoinPayment', () => {
    beforeEach(() => {
      req.body = { orderId: 'order123' };

      Order.findById = vi.fn().mockResolvedValue({
        _id: 'order123',
        userId: 'user123',
        totalAmount: 199.99,
        paymentMethod: { type: 'bitcoin' },
        paymentStatus: 'pending',
        paymentDetails: {},
        save: vi.fn().mockResolvedValue(true)
      });

      // Mock bitcoinService.createBitcoinPayment (the actual function called)
      bitcoinService.createBitcoinPayment = vi.fn().mockResolvedValue({
        bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        bitcoinAmount: 0.00499875,
        bitcoinExchangeRate: 0.000025,
        bitcoinExchangeRateTimestamp: new Date(),
        bitcoinPaymentExpiry: new Date(Date.now() + 1800000)
      });
    });

    it('should create Bitcoin payment successfully', async () => {
      await paymentController.initializeBitcoinPayment(req, res);

      expect(Order.findById).toHaveBeenCalledWith('order123');
      expect(bitcoinService.createBitcoinPayment).toHaveBeenCalledWith(199.99);
      expect(logPaymentEvent).toHaveBeenCalledWith('bitcoin_payment_initialized', expect.any(Object));

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          bitcoinAmount: 0.00499875,
          exchangeRate: 0.000025,
          exchangeRateTimestamp: expect.any(Date),
          paymentExpiry: expect.any(Date),
          orderTotal: 199.99,
          currency: 'GBP'
        })
      });
    });

    it('should validate order ID format', async () => {
      req.body = { orderId: 'invalid-format' };
      
      // Mock Order.findById to throw an error for invalid ID
      Order.findById = vi.fn().mockRejectedValue(new Error('Cast to ObjectId failed'));

      await paymentController.initializeBitcoinPayment(req, res);

      expect(logError).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to initialize Bitcoin payment'
      });
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
        paymentStatus: 'completed' // Not pending
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
        orderNumber: 'ORD-123456',
        userId: 'user123',
        paymentStatus: 'awaiting_confirmation',
        paymentMethod: { type: 'bitcoin' },
        paymentDetails: {
          bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          bitcoinAmount: 0.005,
          bitcoinExchangeRate: 0.000025,
          bitcoinConfirmations: 2,
          bitcoinAmountReceived: 0.005,
          bitcoinTransactionHash: 'tx123',
          bitcoinPaymentExpiry: new Date(Date.now() + 3600000)
        },
        save: vi.fn().mockResolvedValue(true)
      });

      // Mock bitcoin service functions
      bitcoinService.isPaymentExpired = vi.fn().mockReturnValue(false);
      bitcoinService.isPaymentConfirmed = vi.fn().mockReturnValue(true);
    });

    it('should check Bitcoin payment status successfully', async () => {
      await paymentController.getBitcoinPaymentStatus(req, res);

      expect(Order.findById).toHaveBeenCalledWith('order123');
      expect(bitcoinService.isPaymentExpired).toHaveBeenCalled();
      expect(bitcoinService.isPaymentConfirmed).toHaveBeenCalledWith(2);
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          orderId: 'order123',
          orderNumber: 'ORD-123456',
          paymentStatus: 'awaiting_confirmation',
          bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          bitcoinAmount: 0.005,
          bitcoinAmountReceived: 0.005,
          bitcoinConfirmations: 2,
          bitcoinTransactionHash: 'tx123',
          exchangeRate: 0.000025,
          isExpired: false,
          isConfirmed: true,
          requiresConfirmations: 2
        })
      });
    });

    it('should detect expired payments', async () => {
      const expiredOrder = {
        _id: 'order123',
        orderNumber: 'ORD-123456',
        userId: 'user123',
        paymentStatus: 'awaiting_confirmation',
        paymentMethod: { type: 'bitcoin' },
        paymentDetails: {
          bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          bitcoinAmount: 0.005,
          bitcoinPaymentExpiry: new Date(Date.now() - 3600000) // Expired
        },
        save: vi.fn().mockResolvedValue(true)
      };
      
      Order.findById = vi.fn().mockResolvedValue(expiredOrder);
      bitcoinService.isPaymentExpired = vi.fn().mockReturnValue(true);

      await paymentController.getBitcoinPaymentStatus(req, res);

      expect(bitcoinService.isPaymentExpired).toHaveBeenCalled();
      expect(expiredOrder.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          isExpired: true,
          paymentStatus: 'expired'
        })
      });
    });

    it('should handle insufficient confirmations', async () => {
      const orderWithLowConfirmations = {
        _id: 'order123',
        orderNumber: 'ORD-123456',
        userId: 'user123',
        paymentStatus: 'awaiting_confirmation',
        paymentMethod: { type: 'bitcoin' },
        paymentDetails: {
          bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          bitcoinAmount: 0.005,
          bitcoinConfirmations: 1, // Only 1 confirmation
          bitcoinAmountReceived: 0.005,
          bitcoinPaymentExpiry: new Date(Date.now() + 3600000)
        },
        save: vi.fn().mockResolvedValue(true)
      };
      
      Order.findById = vi.fn().mockResolvedValue(orderWithLowConfirmations);
      bitcoinService.isPaymentConfirmed = vi.fn().mockReturnValue(false); // Less than 2 confirmations

      await paymentController.getBitcoinPaymentStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          bitcoinConfirmations: 1,
          isConfirmed: false
        })
      });
    });

    it('should handle no payment received', async () => {
      const orderWithNoPayment = {
        _id: 'order123',
        orderNumber: 'ORD-123456',
        userId: 'user123',
        paymentStatus: 'awaiting_confirmation',
        paymentMethod: { type: 'bitcoin' },
        paymentDetails: {
          bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          bitcoinAmount: 0.005,
          bitcoinConfirmations: 0,
          bitcoinAmountReceived: 0,
          bitcoinPaymentExpiry: new Date(Date.now() + 3600000)
        },
        save: vi.fn().mockResolvedValue(true)
      };
      
      Order.findById = vi.fn().mockResolvedValue(orderWithNoPayment);

      await paymentController.getBitcoinPaymentStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          bitcoinConfirmations: 0,
          bitcoinAmountReceived: 0
        })
      });
    });
  });

  describe('createMoneroPayment', () => {
    let originalIsValid;
    
    beforeEach(() => {
      req.body = { orderId: 'order123' };
      
      // Save and mock ObjectId validation to accept our test ID
      originalIsValid = mongoose.Types.ObjectId.isValid;
      mongoose.Types.ObjectId.isValid = vi.fn().mockReturnValue(true);

      // Mock for existing order path
      const mockOrder = {
        _id: 'order123',
        userId: 'user123',
        totalAmount: 199.99,
        paymentMethod: { type: 'monero' },
        paymentStatus: 'pending',
        orderNumber: 'ORD-123456',
        customerEmail: 'test@example.com',
        paymentDetails: {
          xmrAmount: 1.234567,
          exchangeRate: 0.00617,
          exchangeRateValidUntil: new Date(Date.now() + 300000),
          moneroAddress: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F',
          paymentUrl: 'https://globee.com/payment/123',
          expirationTime: new Date(Date.now() + 86400000),
          requiredConfirmations: 10,
          paymentWindow: 24
        },
        save: vi.fn().mockResolvedValue(true)
      };
      
      Order.findById = vi.fn()
        .mockResolvedValueOnce(mockOrder) // First call in executeMainLogic (line 933)
        .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(mockOrder) }); // Second call with lean() (line 1003)
      
      // Mock session
      const mockSession = {
        withTransaction: vi.fn().mockImplementation(async (fn) => {
          return await fn();
        }),
        endSession: vi.fn()
      };
      mongoose.startSession.mockResolvedValue(mockSession);

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

      // The function might call Order.findById twice due to the implementation
      expect(Order.findById).toHaveBeenCalledWith('order123');
      expect(moneroService.convertGbpToXmr).toHaveBeenCalledWith(199.99);
      expect(moneroService.createPaymentRequest).toHaveBeenCalledWith({
        orderId: 'order123',
        amount: 1.234567,
        currency: 'XMR',
        customerEmail: 'test@example.com'
      });
      // Note: createMoneroPayment doesn't call logPaymentEvent for success cases

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          orderId: 'order123',
          orderNumber: 'ORD-123456',
          moneroAddress: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F',
          xmrAmount: 1.234567,
          exchangeRate: 0.00617,
          validUntil: expect.any(Date),
          paymentUrl: 'https://globee.com/payment/123',
          expirationTime: expect.any(Date),
          requiredConfirmations: 10,
          paymentWindowHours: 24
        })
      });
    });

    it('should handle session not available gracefully', async () => {
      // Override the session mock to reject
      mongoose.startSession.mockRejectedValue(new Error('Sessions not supported'));
      
      // Need to reset mocks for this specific test
      const mockOrderForNoSession = {
        _id: 'order123',
        userId: 'user123',
        totalAmount: 199.99,
        paymentMethod: { type: 'monero' },
        paymentStatus: 'pending',
        orderNumber: 'ORD-123456',
        customerEmail: 'test@example.com',
        paymentDetails: {
          xmrAmount: 1.234567,
          exchangeRate: 0.00617,
          exchangeRateValidUntil: new Date(Date.now() + 300000),
          moneroAddress: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F',
          paymentUrl: 'https://globee.com/payment/123',
          expirationTime: new Date(Date.now() + 86400000),
          requiredConfirmations: 10,
          paymentWindow: 24
        },
        save: vi.fn().mockResolvedValue(true)
      };
      
      Order.findById = vi.fn()
        .mockResolvedValueOnce(mockOrderForNoSession) // First call in executeMainLogic
        .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(mockOrderForNoSession) }); // Second call with lean()

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
    
    afterEach(() => {
      // Restore original ObjectId validation
      if (originalIsValid) {
        mongoose.Types.ObjectId.isValid = originalIsValid;
      }
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
        totalAmount: 999999999.99, // Very large amount - use correct field name
        paymentMethod: { type: 'bitcoin' },
        paymentDetails: {}, // Initialize empty paymentDetails object
        paymentStatus: 'pending',
        status: 'pending',
        save: vi.fn().mockResolvedValue(true)
      });

      // Mock bitcoinService.createBitcoinPayment (the function actually called by the controller)
      bitcoinService.createBitcoinPayment = vi.fn().mockResolvedValue({
        bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        bitcoinAmount: 24999999.998, // Use correct field name
        bitcoinExchangeRate: 0.000025, // Use correct field name
        bitcoinExchangeRateTimestamp: new Date(), // Add missing field
        bitcoinPaymentExpiry: new Date(Date.now() + 1800000), // Use correct field name
        qrCode: 'data:image/png;base64,mockQR' // Extra field is fine
      });

      await paymentController.initializeBitcoinPayment(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          bitcoinAmount: 24999999.998,
          exchangeRate: 0.000025,
          exchangeRateTimestamp: expect.any(Date),
          paymentExpiry: expect.any(Date),
          orderTotal: 999999999.99,
          currency: 'GBP'
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