import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// --- Mock PayPal SDK (getPayPalClient instantiates Client from this) ---
// Use vi.hoisted so the mock fns are available to both the (hoisted) vi.mock
// factory and the rest of the test file. Build the client lazily inside the
// Client factory to avoid TDZ self-references.
const paypal = vi.hoisted(() => ({
  ordersCreate: vi.fn(),
  ordersCapture: vi.fn()
}));

vi.mock('@paypal/paypal-server-sdk', () => ({
  // Must use a real `function` so `new Client(...)` is detected by vitest.
  Client: vi.fn(function () {
    return {
      ordersController: {
        ordersCreate: paypal.ordersCreate,
        ordersCapture: paypal.ordersCapture
      }
    };
  }),
  Environment: {
    Sandbox: 'sandbox',
    Production: 'live'
  }
}));

const { ordersCreate, ordersCapture } = paypal;

// --- Mock models ---
vi.mock('../../models/Cart.js', () => {
  const CartMock = vi.fn();
  CartMock.findByUserId = vi.fn();
  CartMock.findBySessionId = vi.fn();
  return { default: CartMock };
});

vi.mock('../../models/Product.js', () => ({
  default: {
    find: vi.fn(),
    updateOne: vi.fn()
  }
}));

vi.mock('../../models/Order.js', () => {
  // Constructor that supports `new Order(data)` with a save() returning this.
  function OrderMock(data) {
    Object.assign(this, data);
    this.save = vi.fn().mockResolvedValue(this);
  }
  OrderMock.findOne = vi.fn();
  OrderMock.exists = vi.fn();
  OrderMock.countDocuments = vi.fn();
  return { default: OrderMock };
});

vi.mock('../../models/PaymentGateway.js', () => ({
  default: {
    find: vi.fn()
  }
}));

// ShippingMethod is dynamically imported; mock it via factory returning
// a default with a chainable findOne.
vi.mock('../../models/ShippingMethod.js', () => ({
  default: {
    findOne: vi.fn()
  }
}));

vi.mock('../../services/fraudDetectionService.js', () => ({
  validateFraudDetectionCookie: vi.fn(),
  assessOrderFraudRisk: vi.fn()
}));

vi.mock('../../services/emailService.js', () => ({
  default: {
    sendOrderConfirmationEmail: vi.fn()
  }
}));

// mongoose is mocked globally by setup.vitest.js; we override startSession
// so the returned session exposes withTransaction + endSession.
import mongoose from 'mongoose';

// Import controller AFTER mocks are registered
import {
  getPaymentMethods,
  createPayPalOrder,
  capturePayPalPayment,
  handlePayPalWebhook
} from '../paymentController.js';

import Cart from '../../models/Cart.js';
import Product from '../../models/Product.js';
import Order from '../../models/Order.js';
import PaymentGateway from '../../models/PaymentGateway.js';
import ShippingMethod from '../../models/ShippingMethod.js';
import emailService from '../../services/emailService.js';
import {
  validateFraudDetectionCookie,
  assessOrderFraudRisk
} from '../../services/fraudDetectionService.js';

// ---------- helpers ----------
const shippingAddress = {
  firstName: 'Jane',
  lastName: 'Doe',
  addressLine1: '1 Main St',
  city: 'London',
  stateProvince: 'ENG',
  postalCode: 'W1 1AA',
  country: 'GB'
};

// Chainable query helper for a single resolved value (findOne-style)
const chain = (value) => ({
  populate: vi.fn().mockReturnThis(),
  sort: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(value),
  then: undefined
});

describe('paymentController - unit tests', () => {
  let req, res;
  const savedEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();

    // PayPal client available by default
    process.env.PAYPAL_CLIENT_ID = 'test-client-id';
    process.env.PAYPAL_CLIENT_SECRET = 'test-client-secret';
    process.env.PAYPAL_ENVIRONMENT = 'sandbox';

    req = {
      user: { _id: 'user123', email: 'user@example.com' },
      body: {},
      params: {},
      cookies: {}
    };

    res = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis()
    };

    // Ensure mongoose.startSession returns a session with withTransaction
    // (the global mock's bare startSession omits it).
    const session = {
      withTransaction: vi.fn(async (fn) => fn(session)),
      endSession: vi.fn().mockResolvedValue(undefined),
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      abortTransaction: vi.fn()
    };
    mongoose.startSession = vi.fn().mockResolvedValue(session);
  });

  afterEach(() => {
    // restore env without mutating object identity weirdly
    process.env.PAYPAL_CLIENT_ID = savedEnv.PAYPAL_CLIENT_ID;
    process.env.PAYPAL_CLIENT_SECRET = savedEnv.PAYPAL_CLIENT_SECRET;
    process.env.PAYPAL_ENVIRONMENT = savedEnv.PAYPAL_ENVIRONMENT;
  });

  // ---------- getPaymentMethods ----------
  describe('getPaymentMethods', () => {
    it('returns enabled, properly-configured payment methods', async () => {
      const gateway = {
        provider: 'PAYPAL',
        name: 'PayPal',
        description: 'Pay with PayPal',
        customerMessage: 'Pay via PayPal',
        isEnabled: true,
        isProperlyConfigured: vi.fn().mockReturnValue(true)
      };
      // find() returns a chainable with .sort()
      const sortedChain = {
        sort: vi.fn().mockResolvedValue([gateway])
      };
      PaymentGateway.find.mockReturnValue(sortedChain);

      await getPaymentMethods(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          paymentMethods: [
            expect.objectContaining({
              id: 'paypal',
              type: 'paypal',
              name: 'PayPal',
              enabled: true
            })
          ]
        }
      });
    });

    it('filters out gateways that are not properly configured', async () => {
      const gateways = [
        {
          provider: 'PAYPAL',
          name: 'PayPal',
          description: 'desc',
          customerMessage: 'msg',
          isEnabled: true,
          isProperlyConfigured: vi.fn().mockReturnValue(true)
        },
        {
          provider: 'STRIPE',
          name: 'Stripe',
          description: 'desc2',
          customerMessage: 'msg2',
          isEnabled: true,
          isProperlyConfigured: vi.fn().mockReturnValue(false)
        }
      ];
      PaymentGateway.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue(gateways)
      });

      await getPaymentMethods(req, res);

      const call = res.json.mock.calls[0][0];
      expect(call.data.paymentMethods).toHaveLength(1);
      expect(call.data.paymentMethods[0].id).toBe('paypal');
    });

    it('uses customerMessage fallback to description', async () => {
      const gateway = {
        provider: 'PAYPAL',
        name: 'PayPal',
        description: 'fallback-desc',
        customerMessage: null,
        isEnabled: true,
        isProperlyConfigured: vi.fn().mockReturnValue(true)
      };
      PaymentGateway.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue([gateway])
      });

      await getPaymentMethods(req, res);

      const method = res.json.mock.calls[0][0].data.paymentMethods[0];
      expect(method.description).toBe('fallback-desc');
    });

    it('returns 500 on server error', async () => {
      PaymentGateway.find.mockReturnValue({
        sort: vi.fn().mockRejectedValue(new Error('DB down'))
      });

      await getPaymentMethods(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while fetching payment methods'
      });
    });
  });

  // ---------- createPayPalOrder ----------
  describe('createPayPalOrder', () => {
    const productId = '507f1f77bcf86cd799439011';
    const variationId = '507f1f77bcf86cd799439012';

    const buildCart = (overrides = {}) => ({
      _id: 'cart1',
      userId: 'user123',
      items: [
        {
          productId: { toString: () => productId },
          variationId,
          quantity: 2
        }
      ],
      ...overrides
    });

    const buildProducts = () => [
      {
        _id: { toString: () => productId },
        name: 'Pixel 8',
        variations: [
          {
            _id: { toString: () => variationId },
            condition: 'new',
            color: 'black',
            price: 99.99,
            stockQuantity: 10
          }
        ]
      }
    ];

    const setupHappyPath = () => {
      const cart = buildCart();
      Cart.findByUserId.mockResolvedValue(cart);
      Product.find.mockResolvedValue(buildProducts());

      const shippingMethod = {
        _id: 'ship1',
        name: 'Standard',
        calculateCost: vi.fn().mockReturnValue({ cost: 5.99 })
      };
      ShippingMethod.findOne.mockReturnValue({
        sort: vi.fn().mockResolvedValue(shippingMethod)
      });
      // Actually findOne returns a chain that resolves the doc directly;
      // controller does `await ShippingMethod.findOne({...})`. Provide a thenable.
      ShippingMethod.findOne.mockResolvedValue(shippingMethod);

      ordersCreate.mockResolvedValue({
        result: {
          id: 'PAYPAL-ORDER-1',
          links: [
            { rel: 'approve', href: 'https://paypal.approve/url' },
            { rel: 'self', href: 'https://paypal.self/url' }
          ]
        }
      });

      return { cart, shippingMethod };
    };

    it('creates a PayPal order on happy path (variation-based pricing)', async () => {
      const { shippingMethod } = setupHappyPath();
      req.body = { shippingAddress, shippingMethodId: 'ship1' };

      await createPayPalOrder(req, res);

      expect(ordersCreate).toHaveBeenCalledTimes(1);
      const call = res.json.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.paypalOrderId).toBe('PAYPAL-ORDER-1');
      expect(call.data.approvalUrl).toBe('https://paypal.approve/url');
      // 2 units @ 99.99 = 199.98, shipping 5.99 => 205.97
      expect(call.data.orderSummary.cartTotal).toBeCloseTo(199.98);
      expect(call.data.orderSummary.shippingCost).toBeCloseTo(5.99);
      expect(call.data.orderSummary.orderTotal).toBeCloseTo(205.97);
      expect(call.data.orderSummary.items[0].unitPrice).toBeCloseTo(99.99);
    });

    it('uses salePrice when present', async () => {
      setupHappyPath();
      const products = buildProducts();
      products[0].variations[0].salePrice = 79.99;
      Product.find.mockResolvedValue(products);

      req.body = { shippingAddress, shippingMethodId: 'ship1' };
      await createPayPalOrder(req, res);

      const item = res.json.mock.calls[0][0].data.orderSummary.items[0];
      expect(item.unitPrice).toBeCloseTo(79.99);
    });

    it('threads cartId + shippingMethodId through purchase_unit custom_id', async () => {
      const { cart } = setupHappyPath();
      req.body = { shippingAddress, shippingMethodId: 'ship1' };

      await createPayPalOrder(req, res);

      expect(ordersCreate).toHaveBeenCalledTimes(1);
      const request = ordersCreate.mock.calls[0][0].body || ordersCreate.mock.calls[0][0];
      const customId = request.purchase_units[0].custom_id;

      // PayPal caps custom_id at 127 characters
      expect(customId.length).toBeLessThanOrEqual(127);

      const parsed = JSON.parse(customId);
      expect(parsed.c).toBe(cart._id);
      expect(parsed.s).toBe('ship1');
    });

    it('returns 500 when PayPal client unavailable', async () => {
      delete process.env.PAYPAL_CLIENT_ID;
      delete process.env.PAYPAL_CLIENT_SECRET;
      req.body = { shippingAddress, shippingMethodId: 'ship1' };

      await createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'PayPal payment processing is not available'
      });
    });

    it('returns 400 when shippingAddress or shippingMethodId missing', async () => {
      req.body = { shippingAddress }; // missing shippingMethodId
      await createPayPalOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Shipping address and shipping method are required'
      });
    });

    it('returns 400 when cart lookup throws (no session)', async () => {
      req.user = null; // guest
      req.cookies = {}; // no cartSessionId
      req.body = { shippingAddress, shippingMethodId: 'ship1' };

      await createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No cart session found'
      });
    });

    it('returns 400 when cart is empty', async () => {
      Cart.findByUserId.mockResolvedValue({ ...buildCart(), items: [] });
      req.body = { shippingAddress, shippingMethodId: 'ship1' };

      await createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cart is empty'
      });
    });

    it('returns 400 when some products no longer available', async () => {
      Cart.findByUserId.mockResolvedValue(buildCart());
      Product.find.mockResolvedValue([]); // none returned

      req.body = { shippingAddress, shippingMethodId: 'ship1' };
      await createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Some products in cart are no longer available'
      });
    });

    it('returns 400 when variation cannot be resolved (no variations)', async () => {
      Cart.findByUserId.mockResolvedValue(buildCart());
      Product.find.mockResolvedValue([
        { _id: { toString: () => productId }, name: 'Pixel 8', variations: [] }
      ]);

      req.body = { shippingAddress, shippingMethodId: 'ship1' };
      await createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Selected variation no longer available'
      });
    });

    it('returns 400 for insufficient stock', async () => {
      Cart.findByUserId.mockResolvedValue(
        buildCart({ items: [{ productId: { toString: () => productId }, variationId, quantity: 50 }] })
      );
      const products = buildProducts();
      products[0].variations[0].stockQuantity = 10;
      Product.find.mockResolvedValue(products);

      req.body = { shippingAddress, shippingMethodId: 'ship1' };
      await createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      const err = res.json.mock.calls[0][0];
      expect(err.error).toMatch(/Insufficient stock/);
    });

    it('returns 400 when shipping method invalid (not found)', async () => {
      Cart.findByUserId.mockResolvedValue(buildCart());
      Product.find.mockResolvedValue(buildProducts());
      ShippingMethod.findOne.mockResolvedValue(null);

      req.body = { shippingAddress, shippingMethodId: 'ship1' };
      await createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid shipping method'
      });
    });

    it('returns 400 when shipping cost calculation returns null', async () => {
      Cart.findByUserId.mockResolvedValue(buildCart());
      Product.find.mockResolvedValue(buildProducts());
      ShippingMethod.findOne.mockResolvedValue({
        _id: 'ship1',
        name: 'Standard',
        calculateCost: vi.fn().mockReturnValue(null)
      });

      req.body = { shippingAddress, shippingMethodId: 'ship1' };
      await createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Shipping method not available for this cart and address'
      });
    });

    it('returns 503 when PayPal ordersCreate throws', async () => {
      setupHappyPath();
      ordersCreate.mockRejectedValue(new Error('PayPal down'));

      req.body = { shippingAddress, shippingMethodId: 'ship1' };
      await createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json.mock.calls[0][0].success).toBe(false);
    });

    it('returns 500 on unexpected server error', async () => {
      // Cart resolves so findOrCreateCart succeeds; Product.find throws to
      // reach the outer catch (500 path).
      Cart.findByUserId.mockResolvedValue(buildCart());
      Product.find.mockRejectedValue(new Error('DB exploded'));
      req.body = { shippingAddress, shippingMethodId: 'ship1' };

      await createPayPalOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while creating PayPal order'
      });
    });
  });

  // ---------- capturePayPalPayment ----------
  describe('capturePayPalPayment', () => {
    const buildCaptureResponse = (overrides = {}) => ({
      result: {
        status: 'COMPLETED',
        payer: { email_address: 'payer@example.com' },
        purchase_units: [
          {
            amount: {
              currency_code: 'GBP',
              value: '205.97',
              breakdown: {
                item_total: { value: '199.98' },
                shipping: { value: '5.99' },
                tax_total: { value: '0.00' }
              }
            },
            shipping: {
              name: { full_name: 'Jane Doe' },
              address: {
                address_line_1: '1 Main St',
                admin_area_2: 'London',
                admin_area_1: 'ENG',
                postal_code: 'W1 1AA',
                country_code: 'GB'
              }
            },
            payments: {
              captures: [
                {
                  id: 'CAPTURE-1'
                }
              ]
            }
          }
        ],
        ...overrides
      }
    });

    const setupCaptureHappyPath = () => {
      ordersCapture.mockResolvedValue(buildCaptureResponse());
      validateFraudDetectionCookie.mockReturnValue({ ip: '1.2.3.4', deviceFingerprint: 'abc' });
      assessOrderFraudRisk.mockReturnValue({ riskLevel: 'low', indicators: [] });

      const cart = {
        _id: 'cart1',
        userId: 'user123',
        items: [
          {
            productId: '507f1f77bcf86cd799439011',
            variationId: '507f1f77bcf86cd799439012',
            productName: 'Pixel 8',
            productSlug: 'pixel-8',
            quantity: 2,
            unitPrice: 99.99
          }
        ],
        save: vi.fn().mockResolvedValue(true)
      };
      Cart.findByUserId.mockResolvedValue(cart);

      // Stock decrement succeeds by default
      Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

      // Order constructor + save + countDocuments + findOne
      Order.countDocuments.mockResolvedValue(0);
      Order.exists.mockResolvedValue(null);
      Order.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'order1',
          orderNumber: 'ORD-1',
          customerEmail: 'user@example.com'
        })
      });

      return { cart };
    };

    it('captures payment and returns order on happy path', async () => {
      setupCaptureHappyPath();
      req.body = { paypalOrderId: 'PAYPAL-ORDER-1', payerId: 'PAYER1' };

      await capturePayPalPayment(req, res);

      expect(ordersCapture).toHaveBeenCalledWith({ id: 'PAYPAL-ORDER-1' });
      expect(emailService.sendOrderConfirmationEmail).toHaveBeenCalled();
      const call = res.json.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.orderId).toBe('order1');
      expect(call.data.paymentMethod).toBe('paypal');
      expect(call.data.status).toBe('captured');
    });

    it('returns 400 when paypalOrderId is missing', async () => {
      req.body = { payerId: 'PAYER1' };
      await capturePayPalPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'PayPal order ID is required'
      });
    });

    // Cart/order mocks for tests that get past the pre-capture guards
    const setupPreCaptureCart = () => {
      Cart.findByUserId.mockResolvedValue({
        _id: 'cart1',
        userId: 'user123',
        items: [
          {
            productId: '507f1f77bcf86cd799439011',
            variationId: '507f1f77bcf86cd799439012',
            productName: 'Pixel 8',
            productSlug: 'pixel-8',
            quantity: 2,
            unitPrice: 99.99
          }
        ],
        save: vi.fn().mockResolvedValue(true)
      });
      Cart.findBySessionId.mockResolvedValue(null);
      Order.exists.mockResolvedValue(null);
      Product.updateOne.mockResolvedValue({ modifiedCount: 1 });
      validateFraudDetectionCookie.mockReturnValue({ ip: '1.2.3.4', deviceFingerprint: 'abc' });
      assessOrderFraudRisk.mockReturnValue({ riskLevel: 'low', indicators: [] });
    };

    it('returns 500 when PayPal client unavailable', async () => {
      setupPreCaptureCart();
      delete process.env.PAYPAL_CLIENT_ID;
      delete process.env.PAYPAL_CLIENT_SECRET;
      req.body = { paypalOrderId: 'PAYPAL-ORDER-1' };

      await capturePayPalPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'PayPal payment processing is not available'
      });
    });

    it('returns 400 when capture status is not COMPLETED', async () => {
      setupPreCaptureCart();
      ordersCapture.mockResolvedValue({
        result: { status: 'PENDING', purchase_units: [] }
      });
      req.body = { paypalOrderId: 'PAYPAL-ORDER-1' };

      await capturePayPalPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'PayPal payment capture failed'
      });
    });

    it('returns 400 when capture info not found in purchase unit', async () => {
      setupPreCaptureCart();
      ordersCapture.mockResolvedValue({
        result: {
          status: 'COMPLETED',
          purchase_units: [
            {
              amount: { value: '205.97' },
              payments: { captures: [] }
            }
          ]
        }
      });
      req.body = { paypalOrderId: 'PAYPAL-ORDER-1' };

      await capturePayPalPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'PayPal payment capture information not found'
      });
    });

    it('blocks high-risk orders with 403', async () => {
      setupPreCaptureCart();
      ordersCapture.mockResolvedValue(buildCaptureResponse());
      validateFraudDetectionCookie.mockReturnValue({ ip: '9.9.9.9' });
      assessOrderFraudRisk.mockReturnValue({
        riskLevel: 'high',
        indicators: ['suspicious'],
        recommendation: { message: 'Blocked for security' }
      });
      req.body = { paypalOrderId: 'PAYPAL-ORDER-1' };

      await capturePayPalPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Blocked for security'
      });
    });

    it('returns 400 when cart lookup throws BEFORE capture (guest, no session)', async () => {
      validateFraudDetectionCookie.mockReturnValue({ ip: '1.2.3.4' });
      assessOrderFraudRisk.mockReturnValue({ riskLevel: 'low', indicators: [] });
      req.user = null;
      req.cookies = {}; // triggers 'No cart session found'
      req.body = { paypalOrderId: 'PAYPAL-ORDER-1', customerEmail: 'guest@example.com' };

      await capturePayPalPayment(req, res);

      // Must fail BEFORE PayPal takes money
      expect(ordersCapture).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].error).toBe('No cart session found');
    });

    it('returns 400 when cart is empty BEFORE capture', async () => {
      validateFraudDetectionCookie.mockReturnValue({ ip: '1.2.3.4' });
      assessOrderFraudRisk.mockReturnValue({ riskLevel: 'low', indicators: [] });
      Cart.findByUserId.mockResolvedValue({ items: [], save: vi.fn() });
      req.body = { paypalOrderId: 'PAYPAL-ORDER-1' };

      await capturePayPalPayment(req, res);

      expect(ordersCapture).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json.mock.calls[0][0].error).toBe('Cart is empty');
    });

    // ---------- guest checkout ----------
    describe('guest checkout', () => {
      const setupGuest = ({ captureOverrides } = {}) => {
        ordersCapture.mockResolvedValue(
          captureOverrides ? buildCaptureResponse(captureOverrides) : buildCaptureResponse()
        );
        validateFraudDetectionCookie.mockReturnValue({ ip: '1.2.3.4', deviceFingerprint: 'abc' });
        assessOrderFraudRisk.mockReturnValue({ riskLevel: 'low', indicators: [] });

        const cart = {
          _id: 'cart1',
          userId: null,
          items: [
            {
              productId: '507f1f77bcf86cd799439011',
              variationId: '507f1f77bcf86cd799439012',
              productName: 'Pixel 8',
              productSlug: 'pixel-8',
              quantity: 2,
              unitPrice: 99.99
            }
          ],
          save: vi.fn().mockResolvedValue(true)
        };
        Cart.findBySessionId.mockResolvedValue(cart);
        Product.updateOne.mockResolvedValue({ modifiedCount: 1 });
        Order.exists.mockResolvedValue(null);
        Order.countDocuments.mockResolvedValue(0);
        Order.findOne.mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            _id: 'order-guest',
            orderNumber: 'ORD-GUEST',
            customerEmail: 'guest@example.com',
            isGuest: true,
            totalAmount: 205.97
          })
        });

        req.user = null; // guest
        req.cookies = { cartSessionId: 'guest-session-1' };

        return { cart };
      };

      it('returns 400 (pre-capture) when guest email is missing', async () => {
        setupGuest();
        req.body = { paypalOrderId: 'PAYPAL-ORDER-1' }; // no customerEmail

        await capturePayPalPayment(req, res);

        expect(ordersCapture).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Email is required for guest checkout'
        });
      });

      it('returns 400 (pre-capture) when guest email is malformed', async () => {
        setupGuest();
        req.body = { paypalOrderId: 'PAYPAL-ORDER-1', customerEmail: 'not-an-email' };

        await capturePayPalPayment(req, res);

        expect(ordersCapture).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Email is required for guest checkout'
        });
      });

      it('creates a guest order with body email preferred over payer email', async () => {
        const { cart } = setupGuest();
        req.body = { paypalOrderId: 'PAYPAL-ORDER-1', customerEmail: 'Guest@Example.com ' };

        await capturePayPalPayment(req, res);

        const call = res.json.mock.calls[0][0];
        expect(call.success).toBe(true);
        expect(call.data.customerEmail).toBe('guest@example.com');

        expect(cart.save).toHaveBeenCalled(); // cart cleared + persisted

        // Stock decremented per cart item
        const stockCall = Product.updateOne.mock.calls[0];
        expect(stockCall[0]._id).toBe('507f1f77bcf86cd799439011');
        expect(stockCall[0]['variations._id']).toBe('507f1f77bcf86cd799439012');
        expect(stockCall[1].$inc['variations.$.stockQuantity']).toBe(-2);
        expect(call.data).not.toHaveProperty('paymentDetails'); // no raw PayPal payload
      });

      it('falls back to PayPal payer email when body email absent but user exists', async () => {
        // logged-in user with no body email → account email wins
        setupCaptureHappyPath();
        req.body = { paypalOrderId: 'PAYPAL-ORDER-1', payerId: 'PAYER1' };
        req.user = { _id: 'user123', email: 'user@example.com' };

        await capturePayPalPayment(req, res);

        const call = res.json.mock.calls[0][0];
        expect(call.data.customerEmail).toBe('user@example.com');
      });
    });

    // ---------- idempotency ----------
    describe('idempotency', () => {
      it('returns the existing order (200 already_captured) without re-capturing', async () => {
        Order.exists.mockResolvedValue({ _id: 'order-existing' });
        Order.findOne.mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            _id: 'order-existing',
            orderNumber: 'ORD-EXISTING',
            customerEmail: 'guest@example.com',
            isGuest: true,
            totalAmount: 205.97
          })
        });
        req.body = { paypalOrderId: 'PAYPAL-ORDER-1', customerEmail: 'guest@example.com' };
        req.user = null;

        await capturePayPalPayment(req, res);

        expect(ordersCapture).not.toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalledWith(500);
        const call = res.json.mock.calls[0][0];
        expect(call.success).toBe(true);
        expect(call.data.status).toBe('already_captured');
        expect(call.data.orderId).toBe('order-existing');
      });
    });

    // ---------- custom_id handling ----------
    describe('custom_id handling', () => {
      const setupCaptureWithCustomId = (customId) => {
        const response = buildCaptureResponse();
        response.result.purchase_units[0].custom_id = customId;
        ordersCapture.mockResolvedValue(response);
        validateFraudDetectionCookie.mockReturnValue({ ip: '1.2.3.4', deviceFingerprint: 'abc' });
        assessOrderFraudRisk.mockReturnValue({ riskLevel: 'low', indicators: [] });

        const cart = {
          _id: 'cart1',
          userId: 'user123',
          items: [
            {
              productId: '507f1f77bcf86cd799439011',
              variationId: '507f1f77bcf86cd799439012',
              productName: 'Pixel 8',
              productSlug: 'pixel-8',
              quantity: 2,
              unitPrice: 99.99
            }
          ],
          save: vi.fn().mockResolvedValue(true)
        };
        Cart.findByUserId.mockResolvedValue(cart);
        Product.updateOne.mockResolvedValue({ modifiedCount: 1 });
        Order.exists.mockResolvedValue(null);
        Order.countDocuments.mockResolvedValue(0);
        Order.findOne.mockReturnValue({
          lean: vi.fn().mockResolvedValue({ _id: 'order1', orderNumber: 'ORD-1' })
        });
        ShippingMethod.findOne.mockResolvedValue({
          _id: 'ship1',
          name: 'Express',
          estimatedDeliveryDays: { min: 1, max: 2 }
        });
        return { cart };
      };

      it('resolves the real shipping method from custom_id', async () => {
        setupCaptureWithCustomId(JSON.stringify({ c: 'cart1', s: 'ship1' }));
        req.body = { paypalOrderId: 'PAYPAL-ORDER-1' };

        await capturePayPalPayment(req, res);

        expect(ShippingMethod.findOne).toHaveBeenCalledWith({ _id: 'ship1' });
      });

      it('rejects with 409 when the cart changed after approval', async () => {
        setupCaptureWithCustomId(JSON.stringify({ c: 'different-cart', s: 'ship1' }));
        req.body = { paypalOrderId: 'PAYPAL-ORDER-1' };

        await capturePayPalPayment(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        const call = res.json.mock.calls[0][0];
        expect(call.success).toBe(false);
        expect(call.data.paypalOrderId).toBe('PAYPAL-ORDER-1');
      });

      it('falls back to default shipping method on garbage custom_id', async () => {
        setupCaptureWithCustomId('garbage-not-json');
        req.body = { paypalOrderId: 'PAYPAL-ORDER-1' };

        await capturePayPalPayment(req, res);

        expect(res.status).not.toHaveBeenCalled(); // success path
        expect(ShippingMethod.findOne).not.toHaveBeenCalled();
        const call = res.json.mock.calls[0][0];
        expect(call.success).toBe(true);
      });
    });

    // ---------- stock + cart persistence ----------
    it('returns 502 with paypalOrderId when stock is insufficient after capture', async () => {
      setupCaptureHappyPath();
      Product.updateOne.mockResolvedValue({ modifiedCount: 0 }); // no stock decremented
      req.body = { paypalOrderId: 'PAYPAL-ORDER-1' };

      await capturePayPalPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(502);
      const call = res.json.mock.calls[0][0];
      expect(call.success).toBe(false);
      expect(call.error).toContain('stock');
      expect(call.data.paypalOrderId).toBe('PAYPAL-ORDER-1');
    });

    it('returns 500 when ordersCapture throws', async () => {
      ordersCapture.mockRejectedValue(new Error('capture failed'));
      req.body = { paypalOrderId: 'PAYPAL-ORDER-1' };

      await capturePayPalPayment(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json.mock.calls[0][0].error).toBe('capture failed');
    });
  });

  // ---------- handlePayPalWebhook ----------
  describe('handlePayPalWebhook', () => {
    it('acknowledges an unknown event type with 200', async () => {
      req.body = { event_type: 'SOME.UNKNOWN.EVENT' };
      await handlePayPalWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it('handles PAYMENT.CAPTURE.COMPLETED event', async () => {
      req.body = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          supplementary_data: { related_ids: { order_id: 'ORDER-1' } }
        }
      };
      await handlePayPalWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it('handles PAYMENT.CAPTURE.DENIED event', async () => {
      req.body = {
        event_type: 'PAYMENT.CAPTURE.DENIED',
        resource: {
          supplementary_data: { related_ids: { order_id: 'ORDER-1' } }
        }
      };
      await handlePayPalWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('handles CHECKOUT.ORDER.APPROVED event', async () => {
      req.body = {
        event_type: 'CHECKOUT.ORDER.APPROVED',
        resource: { id: 'ORDER-1' }
      };
      await handlePayPalWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 500 when processing throws', async () => {
      // Force a throw by making webhookEvent.event_type access throw via a
      // getter on a property.
      req.body = {};
      Object.defineProperty(req.body, 'event_type', {
        get() { throw new Error('boom'); },
        configurable: true
      });

      await handlePayPalWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Webhook processing failed' });
    });
  });
});
