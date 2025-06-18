import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { PaymentController } from '../PaymentController.class.js';
import { createTestUser, createTestProduct, createTestOrder, createTestCart } from '../../test/setup.integration.js';

// Import actual models for integration testing
import User from '../../models/User.js';
import Product from '../../models/Product.js';
import Order from '../../models/Order.js';
import Cart from '../../models/Cart.js';

describe('PaymentController Integration Tests', () => {
  let paymentController;
  let testUser;
  let testProduct;
  let testCart;
  let req;
  let res;

  beforeEach(async () => {
    // Create test data
    testUser = await User.create(createTestUser({
      email: 'payment.test@example.com'
    }));

    testProduct = await Product.create(createTestProduct({
      name: 'Test Payment Product',
      slug: 'test-payment-product-' + Date.now(),
      sku: 'TEST-PAY-' + Date.now(),
      price: 299.99
    }));

    // Create test cart with all required fields
    testCart = await Cart.create({
      userId: testUser._id,
      items: [{
        productId: testProduct._id,
        productName: testProduct.name,
        productSlug: testProduct.slug,
        unitPrice: testProduct.price,
        quantity: 2,
        subtotal: testProduct.price * 2
      }]
    });

    // Setup mock services for integration tests
    const mockServices = {
      bitcoinService: {
        generateAddress: vi.fn().mockResolvedValue({
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          qrCode: 'data:image/png;base64,mock-qr-code'
        }),
        getExchangeRate: vi.fn().mockResolvedValue({
          rate: 0.000025,
          validUntil: new Date(Date.now() + 300000)
        })
      },
      moneroService: {
        getExchangeRate: vi.fn().mockResolvedValue({
          rate: 0.008,
          validUntil: new Date(Date.now() + 300000)
        }),
        createPayment: vi.fn().mockResolvedValue({
          address: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F',
          amount: 4.7992
        })
      },
      paypalService: {
        createOrder: vi.fn().mockResolvedValue({
          id: 'paypal-order-123',
          status: 'CREATED',
          links: [{
            rel: 'approve',
            href: 'https://www.sandbox.paypal.com/checkoutnow?token=mock-token'
          }]
        })
      },
      emailService: {
        sendEmail: vi.fn().mockResolvedValue(true)
      }
    };

    // Create payment controller with real models but mocked services
    paymentController = new PaymentController({
      models: { User, Product, Order, Cart },
      services: mockServices,
      database: {
        mongoose,
        startSession: () => mongoose.startSession()
      },
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn()
      },
      logError: vi.fn(),
      logPaymentEvent: vi.fn(),
      paypalClient: { mock: 'paypal-client' } // Add PayPal client for integration tests
    });

    // Setup request/response mocks
    req = {
      user: { userId: testUser._id.toString() },
      body: {}
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn()
    };
  });

  describe('PayPal Order Creation', () => {
    it('should create PayPal order with valid cart', async () => {
      req.body = {
        shippingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'London',
          postalCode: 'SW1A 1AA',
          country: 'GB'
        },
        shippingMethodId: 'standard'
      };

      await paymentController.createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            orderId: expect.any(String),
            paypalOrderId: 'paypal-order-123',
            approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=mock-token'
          })
        })
      );

      // Verify order was created in database
      const orders = await Order.find({ userId: testUser._id });
      expect(orders).toHaveLength(1);
      expect(orders[0].totalAmount).toBe(599.98); // 2 * 299.99
      expect(orders[0].status).toBe('pending');
    });

    it('should handle empty cart', async () => {
      // Clear the cart
      await Cart.deleteMany({ userId: testUser._id });

      req.body = {
        shippingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'London',
          postalCode: 'SW1A 1AA',
          country: 'GB'
        },
        shippingMethodId: 'standard'
      };

      await paymentController.createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cart is empty'
      });
    });

    it('should validate required shipping address fields', async () => {
      req.body = {
        shippingAddress: {
          fullName: 'John Doe',
          // Missing required fields
          city: 'London'
        },
        shippingMethodId: 'standard'
      };

      await paymentController.createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Complete shipping address is required'
      });
    });
  });

  describe('Bitcoin Payment Initialization', () => {
    it('should initialize Bitcoin payment for existing order', async () => {
      // First create an order
      const order = await Order.create(createTestOrder({
        userId: testUser._id,
        totalAmount: 199.99
      }));

      req.body = { orderId: order._id.toString() };

      await paymentController.initializeBitcoinPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            orderId: order._id.toString(),
            bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            btcAmount: expect.any(Number),
            exchangeRate: 0.000025,
            qrCode: 'data:image/png;base64,mock-qr-code',
            orderTotal: 199.99
          })
        })
      );

      // Verify services were called
      expect(paymentController.services.bitcoinService.generateAddress).toHaveBeenCalled();
      expect(paymentController.services.bitcoinService.getExchangeRate).toHaveBeenCalled();
    });

    it('should reject access to other users orders', async () => {
      // Create order for different user
      const otherUser = await User.create(createTestUser({
        email: 'other@example.com'
      }));

      const order = await Order.create(createTestOrder({
        userId: otherUser._id,
        totalAmount: 199.99
      }));

      req.body = { orderId: order._id.toString() };

      await paymentController.initializeBitcoinPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access to order'
      });
    });

    it('should handle non-existent order', async () => {
      req.body = { orderId: new mongoose.Types.ObjectId().toString() };

      await paymentController.initializeBitcoinPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order not found'
      });
    });
  });

  describe('Monero Payment Creation', () => {
    it('should create Monero payment from cart', async () => {
      req.body = {
        orderId: 'new',
        shippingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'London',
          postalCode: 'SW1A 1AA',
          country: 'GB'
        },
        billingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'London',
          postalCode: 'SW1A 1AA',
          country: 'GB'
        },
        shippingMethodId: 'standard'
      };

      await paymentController.createMoneroPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            orderId: expect.any(String),
            moneroAddress: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F',
            xmrAmount: 4.7992,
            exchangeRate: 0.008,
            requiredConfirmations: 10,
            paymentWindowHours: 24,
            orderTotal: 599.98
          })
        })
      );

      // Verify order was created
      const orders = await Order.find({ userId: testUser._id });
      expect(orders).toHaveLength(1);
      expect(orders[0].totalAmount).toBe(599.98);

      // Verify services were called
      expect(paymentController.services.moneroService.getExchangeRate).toHaveBeenCalled();
      expect(paymentController.services.moneroService.createPayment).toHaveBeenCalledWith({
        amount: 599.98,
        orderId: orders[0]._id.toString()
      });
    });

    it('should create Monero payment for existing order', async () => {
      const order = await Order.create(createTestOrder({
        userId: testUser._id,
        totalAmount: 199.99
      }));

      req.body = { orderId: order._id.toString() };

      await paymentController.createMoneroPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            orderId: order._id.toString(),
            orderTotal: 199.99
          })
        })
      );
    });

    it('should handle transaction rollback on service failure', async () => {
      // Make monero service fail
      paymentController.services.moneroService.getExchangeRate.mockRejectedValue(
        new Error('Monero service unavailable')
      );

      req.body = {
        orderId: 'new',
        shippingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'London',
          postalCode: 'SW1A 1AA',
          country: 'GB'
        },
        shippingMethodId: 'standard'
      };

      await paymentController.createMoneroPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Monero service unavailable'
      });

      // Verify no order was created due to transaction rollback
      const orders = await Order.find({ userId: testUser._id });
      expect(orders).toHaveLength(0);
    });
  });

  describe('Payment Methods', () => {
    it('should return available payment methods', async () => {
      await paymentController.getPaymentMethods(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          paypal: {
            available: true, // PayPal client available in integration test
            name: 'PayPal',
            description: 'Pay securely with PayPal'
          },
          bitcoin: {
            available: true,
            name: 'Bitcoin',
            description: 'Pay with Bitcoin cryptocurrency'
          },
          monero: {
            available: true,
            name: 'Monero',
            description: 'Pay with Monero for enhanced privacy'
          }
        }
      });
    });
  });

  describe('Database Transactions', () => {
    it('should properly handle concurrent payment attempts', async () => {
      const promises = [];
      
      // Simulate concurrent PayPal order creation attempts
      for (let i = 0; i < 3; i++) {
        const concurrentReq = {
          ...req,
          body: {
            shippingAddress: {
              fullName: `User ${i}`,
              addressLine1: '123 Main St',
              city: 'London',
              postalCode: 'SW1A 1AA',
              country: 'GB'
            },
            shippingMethodId: 'standard'
          }
        };

        const concurrentRes = {
          status: vi.fn().mockReturnThis(),
          json: vi.fn()
        };

        promises.push(
          paymentController.createPayPalOrder(concurrentReq, concurrentRes)
        );
      }

      await Promise.all(promises);

      // All should succeed (cart should be available for all)
      const orders = await Order.find({ userId: testUser._id });
      expect(orders).toHaveLength(3);
    });
  });
});