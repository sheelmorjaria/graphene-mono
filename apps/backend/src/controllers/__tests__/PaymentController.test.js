import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentController } from '../PaymentController.class.js';

describe('PaymentController Unit Tests', () => {
  let paymentController;
  let mockModels;
  let mockServices;
  let mockDatabase;
  let req;
  let res;

  beforeEach(() => {
    // Setup comprehensive mocks
    mockModels = {
      Cart: {
        findOne: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            session: vi.fn().mockReturnThis(),
            exec: vi.fn().mockResolvedValue({
              userId: 'user123',
              items: [
                {
                  productId: {
                    _id: 'product123',
                    name: 'Test Product',
                    price: 199.99
                  },
                  quantity: 1,
                  price: 199.99
                }
              ]
            })
          })
        })
      },
      Order: vi.fn().mockImplementation((data) => ({
        ...data,
        _id: 'order123',
        save: vi.fn().mockResolvedValue({ ...data, _id: 'order123' })
      })),
      Product: {},
      User: {}
    };

    mockServices = {
      bitcoinService: {
        generateAddress: vi.fn().mockResolvedValue({
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          qrCode: 'data:image/png;base64,mock'
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
          amount: 1.599992
        })
      },
      paypalService: {
        createOrder: vi.fn().mockResolvedValue({
          id: 'paypal-order-123',
          status: 'CREATED',
          links: [{ rel: 'approve', href: 'https://paypal.com/approve' }]
        })
      },
      emailService: {
        sendEmail: vi.fn().mockResolvedValue(true)
      }
    };

    const mockSession = {
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      abortTransaction: vi.fn(),
      endSession: vi.fn(),
      withTransaction: vi.fn().mockImplementation(async (fn) => {
        return await fn(mockSession);
      })
    };

    mockDatabase = {
      mongoose: {},
      startSession: vi.fn().mockResolvedValue(mockSession)
    };

    paymentController = new PaymentController({
      models: mockModels,
      services: mockServices,
      database: mockDatabase,
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn()
      },
      logError: vi.fn(),
      logPaymentEvent: vi.fn(),
      paypalClient: null // No PayPal client for unit tests
    });

    req = {
      user: { userId: 'user123' },
      body: {}
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn()
    };
  });

  describe('getPaymentMethods', () => {
    it('should return available payment methods', async () => {
      await paymentController.getPaymentMethods(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          paypal: {
            available: false,
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

    it('should handle errors gracefully', async () => {
      // Force an error in the main flow by making res.json throw
      const jsonSpy = vi.spyOn(res, 'json').mockImplementationOnce(() => {
        throw new Error('Response error');
      });

      await paymentController.getPaymentMethods(req, res);

      // Should try to call res.json first, fail, then call it again in catch block
      expect(jsonSpy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(paymentController.logError).toHaveBeenCalledWith(
        expect.any(Error),
        { context: 'get_payment_methods' }
      );
    });
  });

  describe('createPayPalOrder', () => {
    beforeEach(() => {
      // Add PayPal client for these tests
      paymentController.paypalClient = { mock: 'client' };
      
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
    });

    it('should create PayPal order successfully', async () => {
      await paymentController.createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          orderId: 'order123',
          paypalOrderId: 'paypal-order-123',
          approvalUrl: 'https://paypal.com/approve'
        }
      });

      expect(mockServices.paypalService.createOrder).toHaveBeenCalledWith({
        orderId: 'order123',
        amount: 199.99,
        currency: 'GBP',
        items: [
          {
            productId: 'product123',
            quantity: 1,
            price: 199.99,
            name: 'Test Product'
          }
        ]
      });
    });

    it('should reject request when PayPal client unavailable', async () => {
      paymentController.paypalClient = null;

      await paymentController.createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'PayPal payment processing is not available'
      });
    });

    it('should validate required shipping address', async () => {
      req.body.shippingAddress = { fullName: 'John Doe' }; // Missing required fields

      await paymentController.createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Complete shipping address is required'
      });
    });

    it('should handle empty cart', async () => {
      mockModels.Cart.findOne.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          session: vi.fn().mockReturnThis(),
          exec: vi.fn().mockResolvedValue(null)
        })
      });

      await paymentController.createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cart is empty'
      });
    });
  });

  describe('initializeBitcoinPayment', () => {
    beforeEach(() => {
      mockModels.Order.findById = vi.fn().mockResolvedValue({
        _id: 'order123',
        userId: 'user123',
        totalAmount: 199.99
      });
    });

    it('should initialize Bitcoin payment successfully', async () => {
      req.body = { orderId: 'order123' };

      await paymentController.initializeBitcoinPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          orderId: 'order123',
          bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          btcAmount: 0.00499975, // 199.99 * 0.000025
          exchangeRate: 0.000025,
          validUntil: expect.any(Date),
          qrCode: 'data:image/png;base64,mock',
          orderTotal: 199.99
        }
      });

      expect(mockServices.bitcoinService.generateAddress).toHaveBeenCalled();
      expect(mockServices.bitcoinService.getExchangeRate).toHaveBeenCalled();
    });

    it('should require order ID', async () => {
      req.body = {};

      await paymentController.initializeBitcoinPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order ID is required'
      });
    });

    it('should handle non-existent order', async () => {
      mockModels.Order.findById = vi.fn().mockResolvedValue(null);
      req.body = { orderId: 'nonexistent' };

      await paymentController.initializeBitcoinPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order not found'
      });
    });

    it('should reject unauthorized access', async () => {
      mockModels.Order.findById = vi.fn().mockResolvedValue({
        _id: 'order123',
        userId: 'different-user',
        totalAmount: 199.99
      });
      req.body = { orderId: 'order123' };

      await paymentController.initializeBitcoinPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access to order'
      });
    });
  });

  describe('createMoneroPayment', () => {
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
        shippingMethodId: 'standard'
      };

      await paymentController.createMoneroPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          orderId: 'order123',
          moneroAddress: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F',
          xmrAmount: 1.599992,
          exchangeRate: 0.008,
          validUntil: expect.any(Date),
          expirationTime: expect.any(String),
          requiredConfirmations: 10,
          paymentWindowHours: 24,
          orderTotal: 199.99
        }
      });

      expect(mockServices.moneroService.getExchangeRate).toHaveBeenCalled();
      expect(mockServices.moneroService.createPayment).toHaveBeenCalledWith({
        amount: 199.99,
        orderId: 'order123'
      });
    });

    it('should require order ID', async () => {
      req.body = {};

      await paymentController.createMoneroPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order ID is required'
      });
    });

    it('should handle service failures with transaction rollback', async () => {
      mockServices.moneroService.getExchangeRate.mockRejectedValue(
        new Error('Service unavailable')
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
        error: 'Service unavailable'
      });

      // Verify transaction was aborted
      const mockSession = await mockDatabase.startSession();
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });

  describe('Helper Methods', () => {
    describe('_validatePaymentRequest', () => {
      it('should validate required fields', () => {
        const result = paymentController._validatePaymentRequest(
          { field1: 'value1' },
          ['field1', 'field2']
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('field2 is required');
      });

      it('should validate shipping address completeness', () => {
        const result = paymentController._validatePaymentRequest(
          {
            shippingAddress: {
              fullName: 'John Doe',
              city: 'London'
              // Missing required address fields
            }
          },
          ['shippingAddress']
        );

        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Complete shipping address is required');
      });

      it('should pass validation for complete data', () => {
        const result = paymentController._validatePaymentRequest(
          {
            shippingAddress: {
              fullName: 'John Doe',
              addressLine1: '123 Main St',
              city: 'London',
              postalCode: 'SW1A 1AA',
              country: 'GB'
            }
          },
          ['shippingAddress']
        );

        expect(result.isValid).toBe(true);
      });
    });

    describe('_getErrorStatusCode', () => {
      it('should return correct status codes for different error types', () => {
        expect(paymentController._getErrorStatusCode(new Error('Order not found'))).toBe(404);
        expect(paymentController._getErrorStatusCode(new Error('Unauthorized access'))).toBe(403);
        expect(paymentController._getErrorStatusCode(new Error('Field is required'))).toBe(400);
        expect(paymentController._getErrorStatusCode(new Error('Server error'))).toBe(500);
      });
    });
  });
});