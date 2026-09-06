import '../../test/setup.js';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import paymentRoutes from '../../routes/payment.js';
import User from '../../models/User.js';
import Cart from '../../models/Cart.js';
import Product from '../../models/Product.js';
import Order from '../../models/Order.js';
import ShippingMethod from '../../models/ShippingMethod.js';
import PaymentGateway from '../../models/PaymentGateway.js';

let app;
let userToken;
let testUser;
let testProduct;
let testCart;
let testShippingMethod;

beforeAll(async () => {
  // PayPal env vars (also set by the integration harness; re-asserted so the
  // dynamic getPayPalClient() inside paymentController returns a client).
  process.env.PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'test-client-id';
  process.env.PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || 'test-client-secret';
  process.env.PAYPAL_ENVIRONMENT = 'sandbox';

  app = express();
  app.use(express.json());
  app.use(cookieParser()); // guest checkout reads req.cookies.cartSessionId
  app.use('/api/payment', paymentRoutes);
});

// The integration harness wipes all collections between tests, so (re)seed the
// user / product / shipping method / cart / gateway before every test.
beforeEach(async () => {
  testUser = await User.create({
    email: 'paypal.test@example.com',
    password: 'TestPass123!',
    firstName: 'PayPal',
    lastName: 'Tester',
    role: 'customer',
    isActive: true,
    accountStatus: 'active'
  });

  const secret = process.env.JWT_SECRET || 'your-secret-key';
  userToken = jwt.sign(
    { userId: testUser._id, role: 'customer' },
    secret,
    { expiresIn: '24h' }
  );

  // Real Product schema requires baseModel + variations
  testProduct = await Product.create({
    name: 'Test Phone',
    slug: 'test-phone',
    sku: 'TEST-PHONE',
    baseModel: 'Test Phone',
    isActive: true,
    status: 'active',
    variations: [{
      condition: 'new',
      color: 'Black',
      storage: '128GB',
      price: 499.99,
      stockQuantity: 10,
      stockStatus: 'in_stock',
      sku: 'TEST-PHONE-V1'
    }]
  });

  testShippingMethod = await ShippingMethod.create({
    name: 'Standard Shipping',
    code: 'STANDARD',
    description: 'Standard delivery',
    baseCost: 9.99,
    estimatedDeliveryDays: {
      min: 3,
      max: 5
    },
    isActive: true,
    // create-order validates eligibility via calculateCost — give the method
    // criteria that accept the test address and cart value
    criteria: {
      supportedCountries: ['GB', 'UK'],
      minOrderValue: 0,
      maxOrderValue: 100000,
      minWeight: 0,
      maxWeight: 100000
    }
  });

  testCart = await Cart.create({
    userId: testUser._id,
    items: [{
      productId: testProduct._id,
      productName: testProduct.name,
      productSlug: testProduct.slug,
      quantity: 1,
      unitPrice: 499.99,
      subtotal: 499.99
    }],
    totalAmount: 499.99,
    totalItems: 1
  });

  // Enabled, properly-configured PayPal gateway for /methods
  await PaymentGateway.create({
    code: 'paypal',
    provider: 'paypal',
    name: 'PayPal',
    isEnabled: true,
    isDeleted: false,
    displayOrder: 1,
    config: {
      paypalClientId: 'test-client-id',
      paypalClientSecret: 'test-client-secret',
      paypalWebhookId: 'test-webhook-id'
    }
  });
});

afterAll(async () => {
  // Cleanup handled by the integration harness
});

describe('PayPal Payment Integration', () => {
  describe('GET /api/payment/methods', () => {
    it('should include PayPal as an available payment method', async () => {
      const response = await request(app)
        .get('/api/payment/methods');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentMethods).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'paypal',
            type: 'paypal',
            name: 'PayPal',
            enabled: true
          })
        ])
      );
    });
  });

  describe('POST /api/payment/paypal/create-order', () => {
    const validOrderData = {
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Test St',
        city: 'Test City',
        stateProvince: 'Test State',
        postalCode: '12345',
        country: 'GB'
      },
      shippingMethodId: null // Will be set in beforeEach
    };

    beforeEach(() => {
      validOrderData.shippingMethodId = testShippingMethod._id.toString();
    });

    it('should create PayPal order successfully with valid data', async () => {
      // Mock PayPal API success response (structure preserved for reference)
      // const mockPayPalResponse = {
      //   result: {
      //     id: 'PAYPAL_ORDER_ID_123',
      //     status: 'CREATED',
      //     links: [
      //       {
      //         rel: 'approve',
      //         href: 'https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL_ORDER_ID_123'
      //       }
      //     ]
      //   }
      // };

      const response = await request(app)
        .post('/api/payment/paypal/create-order')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validOrderData);

      // The harness mocks the PayPal SDK client, so a valid request now
      // creates the order end-to-end (it previously 500'd because the old
      // arrow Client mock made `new Client()` throw).
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.paypalOrderId).toBe('mock-paypal-order-id');
      expect(response.body.data.approvalUrl).toContain('mock-approval-url');
      expect(response.body.data.orderSummary.orderTotal).toBeCloseTo(509.98); // 499.99 cart + 9.99 shipping
    });

    it('should reject request without shipping address', async () => {
      const invalidData = { ...validOrderData };
      delete invalidData.shippingAddress;

      const response = await request(app)
        .post('/api/payment/paypal/create-order')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should reject request without shipping method', async () => {
      const invalidData = { ...validOrderData };
      delete invalidData.shippingMethodId;

      const response = await request(app)
        .post('/api/payment/paypal/create-order')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid shipping method', async () => {
      const invalidData = {
        ...validOrderData,
        shippingMethodId: new mongoose.Types.ObjectId().toString()
      };

      const response = await request(app)
        .post('/api/payment/paypal/create-order')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should not require authentication (optionalAuth)', async () => {
      // The create-order route uses optionalAuth, so an unauthenticated request
      // is still processed (and fails on PayPal availability, not on auth).
      const response = await request(app)
        .post('/api/payment/paypal/create-order')
        .send(validOrderData);

      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('POST /api/payment/paypal/capture', () => {
    it('should complete a guest purchase end-to-end (order, stock, cart)', async () => {
      const { Client } = await import('@paypal/paypal-server-sdk');

      // Guest cart bound to a session cookie (replaces the seeded user cart)
      const guestCart = await Cart.create({
        sessionId: 'guest-session-int-1',
        items: [{
          productId: testProduct._id,
          variationId: testProduct.variations[0]._id.toString(),
          productName: testProduct.name,
          productSlug: testProduct.slug,
          quantity: 1,
          unitPrice: 499.99,
          subtotal: 499.99
        }],
        totalAmount: 499.99,
        totalItems: 1
      });

      const captureResult = {
        result: {
          id: 'GUEST-PP-ORDER-1',
          status: 'COMPLETED',
          payer: { email_address: 'payer@paypal.example' },
          purchase_units: [{
            custom_id: JSON.stringify({
              c: guestCart._id.toString(),
              s: testShippingMethod._id.toString()
            }),
            amount: {
              currency_code: 'GBP',
              value: '509.98',
              breakdown: {
                item_total: { value: '499.99' },
                shipping: { value: '9.99' },
                tax_total: { value: '0.00' }
              }
            },
            shipping: {
              name: { full_name: 'Jane Guest' },
              address: {
                address_line_1: '1 Main St',
                admin_area_2: 'London',
                admin_area_1: 'ENG',
                postal_code: 'W1 1AA',
                country_code: 'GB'
              }
            },
            payments: { captures: [{ id: 'GUEST-CAPTURE-1' }] }
          }]
        }
      };
      // Plain async fns are enough — the controller just awaits the calls.
      // NOTE: the implementation MUST be a regular function — `new Client()`
      // rejects arrow implementations ("not a constructor").
      Client.mockImplementation(function () {
        return {
          ordersController: {
            ordersCreate: async () => ({}),
            ordersCapture: async () => captureResult
          },
          paymentsController: {}
        };
      });

      const response = await request(app)
        .post('/api/payment/paypal/capture')
        .set('Cookie', ['cartSessionId=guest-session-int-1'])
        .send({
          paypalOrderId: 'GUEST-PP-ORDER-1',
          payerId: 'GUEST-PAYER-1',
          customerEmail: 'guest@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('captured');
      expect(response.body.data.customerEmail).toBe('guest@example.com');
      expect(response.body.data).not.toHaveProperty('paymentDetails');

      // Order persisted with guest fields
      const order = await Order.findOne({ 'paymentDetails.paypalOrderId': 'GUEST-PP-ORDER-1' });
      expect(order).toBeTruthy();
      expect(order.isGuest).toBe(true);
      expect(order.userId).toBeNull();
      expect(order.customerEmail).toBe('guest@example.com');
      expect(order.paymentDetails.paypalPayerEmail).toBe('payer@paypal.example');
      expect(order.shippingMethod.name).toBe('Standard Shipping'); // resolved via custom_id
      expect(order.shippingMethod.id.toString()).toBe(testShippingMethod._id.toString());

      // Stock decremented on the matched variation
      const product = await Product.findById(testProduct._id);
      expect(product.variations[0].stockQuantity).toBe(9);

      // Cart actually cleared in the database
      const cartAfter = await Cart.findById(guestCart._id);
      expect(cartAfter.items).toHaveLength(0);
      expect(cartAfter.totalItems).toBe(0);

      // Idempotent re-capture returns the existing order
      const retry = await request(app)
        .post('/api/payment/paypal/capture')
        .set('Cookie', ['cartSessionId=guest-session-int-1'])
        .send({
          paypalOrderId: 'GUEST-PP-ORDER-1',
          payerId: 'GUEST-PAYER-1',
          customerEmail: 'guest@example.com'
        });

      expect(retry.status).toBe(200);
      expect(retry.body.data.status).toBe('already_captured');
      expect(retry.body.data.orderId).toBe(order._id.toString());
      const orderCount = await Order.countDocuments({ 'paymentDetails.paypalOrderId': 'GUEST-PP-ORDER-1' });
      expect(orderCount).toBe(1);
    });

    it('rejects a guest capture without an email BEFORE capturing', async () => {
      const { Client } = await import('@paypal/paypal-server-sdk');
      let captureCalled = false;
      Client.mockImplementation(function () {
        return {
          ordersController: {
            ordersCreate: async () => ({}),
            ordersCapture: async () => {
              captureCalled = true;
              return { result: { status: 'COMPLETED' } };
            }
          },
          paymentsController: {}
        };
      });

      const response = await request(app)
        .post('/api/payment/paypal/capture')
        .send({ paypalOrderId: 'GUEST-NO-EMAIL-1' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email is required for guest checkout');
      expect(captureCalled).toBe(false);
    });

    it('should reject request without PayPal order ID', async () => {
      const response = await request(app)
        .post('/api/payment/paypal/capture')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ payerId: 'PAYER123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('PayPal order ID is required');
    });

    it('should fail when PayPal API is not available', async () => {
      // Deterministic: other tests in this file leave a working Client mock,
      // so force unavailability via env rather than relying on mock state.
      const savedId = process.env.PAYPAL_CLIENT_ID;
      const savedSecret = process.env.PAYPAL_CLIENT_SECRET;
      delete process.env.PAYPAL_CLIENT_ID;
      delete process.env.PAYPAL_CLIENT_SECRET;

      const response = await request(app)
        .post('/api/payment/paypal/capture')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paypalOrderId: 'PAYPAL_ORDER_123',
          payerId: 'PAYER123'
        });

      process.env.PAYPAL_CLIENT_ID = savedId;
      process.env.PAYPAL_CLIENT_SECRET = savedSecret;

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('PayPal payment processing is not available');
    });

    it('should not require authentication (optionalAuth)', async () => {
      // The capture route uses optionalAuth; without a token it still proceeds
      // and fails on PayPal availability (500), not on auth.
      const response = await request(app)
        .post('/api/payment/paypal/capture')
        .send({
          paypalOrderId: 'PAYPAL_ORDER_123',
          payerId: 'PAYER123'
        });

      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('POST /api/payment/paypal/webhook', () => {
    it('should accept PayPal webhook events', async () => {
      const webhookEvent = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'CAPTURE123',
          amount: {
            currency_code: 'GBP',
            value: '509.98'
          },
          supplementary_data: {
            related_ids: {
              order_id: 'ORDER123'
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/payment/paypal/webhook')
        .send(webhookEvent);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should handle unknown webhook events gracefully', async () => {
      const webhookEvent = {
        event_type: 'UNKNOWN.EVENT.TYPE',
        resource: {}
      };

      const response = await request(app)
        .post('/api/payment/paypal/webhook')
        .send(webhookEvent);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });
  });
});

describe('PayPal Order Model Integration', () => {
  it('should support PayPal payment details in Order model', async () => {
    const orderData = {
      userId: testUser._id,
      customerEmail: testUser.email,
      items: [{
        productId: testProduct._id,
        productName: testProduct.name,
        productSlug: testProduct.slug,
        quantity: 1,
        unitPrice: 499.99,
        totalPrice: 499.99
      }],
      subtotal: 499.99,
      shipping: 9.99,
      tax: 0,
      totalAmount: 499.99 + 9.99,
      paymentMethod: {
        type: 'paypal',
        name: 'PayPal'
      },
      paymentDetails: {
        paypalOrderId: 'PP_ORDER_123',
        paypalPaymentId: 'PP_PAYMENT_456',
        paypalPayerId: 'PP_PAYER_789',
        paypalTransactionId: 'PP_TXN_012',
        paypalPayerEmail: 'customer@example.com',
        transactionId: 'PP_TXN_012'
      },
      paymentStatus: 'completed',
      status: 'processing',
      shippingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Test St',
        city: 'Test City',
        stateProvince: 'Test State',
        postalCode: '12345',
        country: 'UK'
      },
      billingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Test St',
        city: 'Test City',
        stateProvince: 'Test State',
        postalCode: '12345',
        country: 'UK'
      },
      shippingMethod: {
        id: testShippingMethod._id,
        name: testShippingMethod.name,
        cost: testShippingMethod.baseCost
      }
    };

    const order = new Order(orderData);
    await order.save();

    expect(order.paymentMethod.type).toBe('paypal');
    expect(order.paymentDetails.paypalOrderId).toBe('PP_ORDER_123');
    expect(order.paymentDetails.paypalPaymentId).toBe('PP_PAYMENT_456');
    expect(order.paymentDetails.paypalPayerId).toBe('PP_PAYER_789');
    expect(order.paymentDetails.transactionId).toBe('PP_TXN_012');
    expect(order.paymentStatus).toBe('completed');

    // Clean up
    await Order.deleteOne({ _id: order._id });
  });

  it('should validate PayPal payment method type', async () => {
    const orderData = {
      userId: testUser._id,
      customerEmail: testUser.email,
      items: [{
        productId: testProduct._id,
        productName: testProduct.name,
        productSlug: testProduct.slug,
        quantity: 1,
        unitPrice: 499.99,
        totalPrice: 499.99
      }],
      subtotal: 499.99,
      shipping: 0,
      tax: 0,
      totalAmount: 499.99,
      paymentMethod: {
        type: 'invalid_payment_type',
        name: 'Invalid Payment'
      },
      paymentStatus: 'completed',
      status: 'processing',
      shippingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Test St',
        city: 'Test City',
        stateProvince: 'Test State',
        postalCode: '12345',
        country: 'UK'
      },
      billingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Test St',
        city: 'Test City',
        stateProvince: 'Test State',
        postalCode: '12345',
        country: 'UK'
      },
      shippingMethod: {
        id: testShippingMethod._id,
        name: testShippingMethod.name,
        cost: testShippingMethod.baseCost
      }
    };

    const order = new Order(orderData);
    
    await expect(order.save()).rejects.toThrow();
  });
});