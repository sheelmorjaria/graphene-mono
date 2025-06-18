import { vi } from 'vitest';

// Mock all external dependencies
const mockPayPalService = {
  createOrder: vi.fn(),
  captureOrder: vi.fn(),
  getOrderDetails: vi.fn(),
  refundPayment: vi.fn()
};

const mockBitcoinService = {
  generateAddress: vi.fn(),
  getExchangeRate: vi.fn(),
  checkTransaction: vi.fn(),
  getBalance: vi.fn()
};

const mockMoneroService = {
  createPayment: vi.fn(),
  getExchangeRate: vi.fn(),
  checkPaymentStatus: vi.fn(),
  getPaymentDetails: vi.fn()
};

const mockEmailService = {
  sendEmail: vi.fn(),
  sendPaymentConfirmation: vi.fn(),
  sendOrderConfirmation: vi.fn()
};

// Mock the models
const mockOrder = {
  findById: vi.fn(),
  findByIdAndUpdate: vi.fn()
};

const mockPayment = {
  findOne: vi.fn(),
  findById: vi.fn(),
  prototype: {
    save: vi.fn()
  }
};

const mockUser = {
  findById: vi.fn()
};

vi.doMock('../../services/paypalService.js', () => ({ default: mockPayPalService }), { virtual: true });
vi.doMock('../../services/bitcoinService.js', () => ({ default: mockBitcoinService }), { virtual: true });
vi.doMock('../../services/moneroService.js', () => ({ default: mockMoneroService }), { virtual: true });
vi.doMock('../../services/emailService.js', () => ({ default: mockEmailService }), { virtual: true });
vi.doMock('../../models/Order.js', () => ({ default: mockOrder }), { virtual: true });
vi.doMock('../../models/Payment.js', () => ({ default: mockPayment }), { virtual: true });
vi.doMock('../../models/User.js', () => ({ default: mockUser }), { virtual: true });
vi.doMock('../../models/Cart.js', () => ({ default: mockOrder }), { virtual: true });
vi.doMock('../../models/Product.js', () => ({ default: mockOrder }), { virtual: true });

// Import the controller after mocking
const paymentController = await import('../../controllers/paymentController.js');

describe('Payment Controller Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock mongoose sessions for payment controller (simplest approach)
    const mockSession = {
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      abortTransaction: vi.fn(),
      endSession: vi.fn(),
      withTransaction: vi.fn().mockImplementation(async (fn) => {
        return await fn(mockSession);
      })
    };

    // Since we can't easily access the mongoose mock, let's just ensure the mocked models work
    // The session issue should be handled by the virtual mongoose mock

    // Set up standard request/response mocks
    req = {
      body: {},
      params: {},
      user: { userId: 'user123', email: 'test@example.com' }
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn()
    };

    next = vi.fn();

    // Set up default successful responses
    mockPayPalService.createOrder.mockResolvedValue({
      id: 'PAYPAL-ORDER-123',
      status: 'CREATED',
      links: [{ rel: 'approve', href: 'https://paypal.com/approve' }]
    });

    mockBitcoinService.generateAddress.mockResolvedValue('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
    mockBitcoinService.getExchangeRate.mockResolvedValue(45000);

    mockMoneroService.getExchangeRate.mockResolvedValue(150);
    mockMoneroService.createPayment.mockResolvedValue({
      id: 'monero-payment-123',
      address: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F'
    });

    mockEmailService.sendEmail.mockResolvedValue(true);
  });

  describe('createPayPalOrder', () => {
    it('should create PayPal payment successfully', async () => {
      // Setup
      req.body = { 
        orderId: 'order123', 
        currency: 'GBP',
        shippingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'London',
          postalCode: 'SW1A 1AA',
          country: 'GB'
        },
        shippingMethodId: 'standard'
      };
      
      mockOrder.findById.mockResolvedValue({
        _id: 'order123',
        userId: 'user123',
        totalAmount: 100.00,
        status: 'pending'
      });

      // Execute
      await paymentController.createPayPalOrder(req, res, next);

      // Verify
      expect(mockPayPalService.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'GBP'
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            paypalOrderId: 'PAYPAL-ORDER-123'
          })
        })
      );
    });

    it('should handle invalid order ID', async () => {
      // Setup
      req.body = { orderId: 'invalid', currency: 'GBP' };
      mockOrder.findById.mockResolvedValue(null);

      // Execute
      await paymentController.createPayPalOrder(req, res, next);

      // Verify
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Order not found')
        })
      );
    });

    it('should handle unauthorized access to order', async () => {
      // Setup
      req.body = { 
        orderId: 'order123', 
        currency: 'GBP',
        shippingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'London',
          postalCode: 'SW1A 1AA',
          country: 'GB'
        },
        shippingMethodId: 'standard'
      };
      
      mockOrder.findById.mockResolvedValue({
        _id: 'order123',
        userId: 'different-user',
        totalAmount: 100.00,
        status: 'pending'
      });

      // Execute
      await paymentController.createPayPalOrder(req, res, next);

      // Verify
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Unauthorized')
        })
      );
    });

    it('should handle PayPal service errors', async () => {
      // Setup
      req.body = { 
        orderId: 'order123', 
        currency: 'GBP',
        shippingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'London',
          postalCode: 'SW1A 1AA',
          country: 'GB'
        },
        shippingMethodId: 'standard'
      };
      
      mockOrder.findById.mockResolvedValue({
        _id: 'order123',
        userId: 'user123',
        totalAmount: 100.00,
        status: 'pending'
      });

      mockPayPalService.createOrder.mockRejectedValue(new Error('PayPal API Error'));

      // Execute
      await paymentController.createPayPalOrder(req, res, next);

      // Verify
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('PayPal payment creation failed')
        })
      );
    });
  });

  describe('initializeBitcoinPayment', () => {
    it('should create Bitcoin payment successfully', async () => {
      // Setup
      req.body = { orderId: 'order123' };
      
      mockOrder.findById.mockResolvedValue({
        _id: 'order123',
        userId: 'user123',
        totalAmount: 100.00,
        status: 'pending'
      });

      // Execute
      await paymentController.initializeBitcoinPayment(req, res, next);

      // Verify
      expect(mockBitcoinService.generateAddress).toHaveBeenCalled();
      expect(mockBitcoinService.getExchangeRate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            address: expect.any(String),
            amount: expect.any(Number)
          })
        })
      );
    });

    it('should handle Bitcoin service errors', async () => {
      // Setup
      req.body = { orderId: 'order123' };
      
      mockOrder.findById.mockResolvedValue({
        _id: 'order123',
        userId: 'user123',
        totalAmount: 100.00,
        status: 'pending'
      });

      mockBitcoinService.getExchangeRate.mockRejectedValue(new Error('Bitcoin service unavailable'));

      // Execute
      await paymentController.initializeBitcoinPayment(req, res, next);

      // Verify
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Bitcoin payment creation failed')
        })
      );
    });
  });

  describe('createMoneroPayment', () => {
    it('should create Monero payment successfully', async () => {
      // Setup
      req.body = { 
        orderId: 'order123',
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
      
      mockOrder.findById.mockResolvedValue({
        _id: 'order123',
        userId: 'user123',
        totalAmount: 100.00,
        status: 'pending'
      });

      // Execute
      await paymentController.createMoneroPayment(req, res, next);

      // Verify
      expect(mockMoneroService.getExchangeRate).toHaveBeenCalled();
      expect(mockMoneroService.createPayment).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            address: expect.any(String)
          })
        })
      );
    });

    it('should handle Monero service errors', async () => {
      // Setup
      req.body = { 
        orderId: 'order123',
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
      
      mockOrder.findById.mockResolvedValue({
        _id: 'order123',
        userId: 'user123',
        totalAmount: 100.00,
        status: 'pending'
      });

      mockMoneroService.getExchangeRate.mockRejectedValue(new Error('Monero service unavailable'));

      // Execute
      await paymentController.createMoneroPayment(req, res, next);

      // Verify
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Monero payment creation failed')
        })
      );
    });
  });

  describe('validation helpers', () => {
    it('should validate required fields', async () => {
      // Setup - missing orderId
      req.body = { currency: 'GBP' };

      // Execute
      await paymentController.createPayPalOrder(req, res, next);

      // Verify
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('required')
        })
      );
    });

    it('should validate currency format', async () => {
      // Setup - invalid currency
      req.body = { orderId: 'order123', currency: 'INVALID' };

      // Execute
      await paymentController.createPayPalOrder(req, res, next);

      // Verify
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Invalid currency')
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      // Setup
      req.body = { 
        orderId: 'order123', 
        currency: 'GBP',
        shippingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'London',
          postalCode: 'SW1A 1AA',
          country: 'GB'
        },
        shippingMethodId: 'standard'
      };
      mockOrder.findById.mockRejectedValue(new Error('Database connection failed'));

      // Execute
      await paymentController.createPayPalOrder(req, res, next);

      // Verify
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Internal server error')
        })
      );
    });

    it('should handle missing user context', async () => {
      // Setup
      req.user = null;
      req.body = { 
        orderId: 'order123', 
        currency: 'GBP',
        shippingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          city: 'London',
          postalCode: 'SW1A 1AA',
          country: 'GB'
        },
        shippingMethodId: 'standard'
      };

      // Execute
      await paymentController.createPayPalOrder(req, res, next);

      // Verify
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Authentication required')
        })
      );
    });
  });
});