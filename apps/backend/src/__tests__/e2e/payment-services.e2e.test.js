import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Payment from '../../models/Payment.js';
import Product from '../../models/Product.js';
import Cart from '../../models/Cart.js';
import PaymentGateway from '../../models/PaymentGateway.js';
import Category from '../../models/Category.js';
import bitcoinService from '../../services/bitcoinService.js';
import moneroService from '../../services/moneroService.js';
import paypalService from '../../services/paypalService.js';

describe('Payment Services E2E Tests', () => {
  let adminUser, customerUser, adminToken, customerToken;
  let testProduct1, testProduct2;
  let bitcoinGateway, moneroGateway, paypalGateway;
  let testCategory;

  beforeAll(async () => {
    // Clear test data
    await User.deleteMany({ email: { $in: ['admin@service.test', 'customer@service.test'] } });
    await Product.deleteMany({ name: { $in: ['Service Test Product 1', 'Service Test Product 2'] } });
    await Order.deleteMany({ orderId: { $regex: /^SERVICE-TEST/ } });
    await Payment.deleteMany({ paymentId: { $regex: /^service-test/ } });
    await PaymentGateway.deleteMany({});
    await Category.deleteMany({ slug: 'test-smartphones' });

    // Create test category
    testCategory = await Category.create({
      name: 'Test Smartphones',
      slug: 'test-smartphones',
      description: 'Test category for smartphones'
    });

    // Create payment gateways
    bitcoinGateway = await PaymentGateway.create({
      name: 'Bitcoin',
      slug: 'bitcoin',
      code: 'BTC',
      isActive: true,
      configuration: {
        apiKey: 'test-btc-key',
        webhookSecret: 'test-btc-secret',
        network: 'testnet',
        confirmations: 2
      }
    });

    moneroGateway = await PaymentGateway.create({
      name: 'Monero',
      slug: 'monero',
      code: 'XMR',
      isActive: true,
      configuration: {
        apiKey: 'test-xmr-key',
        webhookSecret: 'test-xmr-secret',
        walletAddress: 'test-wallet',
        confirmations: 10
      }
    });

    paypalGateway = await PaymentGateway.create({
      name: 'PayPal',
      slug: 'paypal',
      code: 'PAYPAL',
      isActive: true,
      configuration: {
        clientId: 'test-paypal-client',
        clientSecret: 'test-paypal-secret',
        mode: 'sandbox'
      }
    });

    // Create test users
    adminUser = await User.create({
      email: 'admin@service.test',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'Service',
      role: 'admin',
      isActive: true
    });

    customerUser = await User.create({
      email: 'customer@service.test',
      password: 'Customer123!',
      firstName: 'Customer',
      lastName: 'Service',
      role: 'customer',
      isActive: true
    });

    // Login and get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@service.test', password: 'Admin123!' });
    
    if (!adminLogin.body.data || !adminLogin.body.data.token) {
      console.error('Admin login failed:', adminLogin.body);
      throw new Error('Admin login failed');
    }
    adminToken = adminLogin.body.data.token;

    const customerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer@service.test', password: 'Customer123!' });
    
    if (!customerLogin.body.data || !customerLogin.body.data.token) {
      console.error('Customer login failed:', customerLogin.body);
      throw new Error('Customer login failed');
    }
    customerToken = customerLogin.body.data.token;

    // Create test products
    testProduct1 = await Product.create({
      name: 'Service Test Product 1',
      slug: 'service-test-product-1',
      sku: 'STP001',
      price: 599.99,
      stock: 100,
      category: testCategory._id,
      isActive: true
    });

    testProduct2 = await Product.create({
      name: 'Service Test Product 2',
      slug: 'service-test-product-2',
      sku: 'STP002',
      price: 899.99,
      stock: 50,
      category: testCategory._id,
      isActive: true
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['admin@service.test', 'customer@service.test'] } });
    await Product.deleteMany({ name: { $in: ['Service Test Product 1', 'Service Test Product 2'] } });
    await Order.deleteMany({ orderId: { $regex: /^SERVICE-TEST/ } });
    await Payment.deleteMany({ paymentId: { $regex: /^service-test/ } });
    if (customerUser && customerUser._id) {
      await Cart.deleteMany({ user: { $in: [customerUser._id] } });
    }
    await PaymentGateway.deleteMany({});
    await Category.deleteMany({ slug: 'test-smartphones' });
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe('Bitcoin Service Integration', () => {
    it('should handle complete Bitcoin payment flow with service layer', async () => {
      // Mock Bitcoin service responses
      vi.spyOn(bitcoinService, 'generateBitcoinAddress').mockResolvedValue({
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        amount: 0.015,
        expiresAt: new Date(Date.now() + 3600000)
      });

      vi.spyOn(bitcoinService, 'getBitcoinAddressInfo').mockResolvedValue({
        status: 'confirmed',
        confirmations: 3,
        txHash: 'mock-tx-hash-123'
      });

      // Add to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct1._id, quantity: 1 });

      // Create order
      const orderRes = await request(app)
        .post('/api/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'GB'
          },
          paymentMethod: 'bitcoin'
        });

      expect(orderRes.status).toBe(201);
      const orderId = orderRes.body.data.orderId;

      // Initialize Bitcoin payment
      const paymentRes = await request(app)
        .post('/api/payments/bitcoin/initialize')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId });

      expect(paymentRes.status).toBe(200);
      expect(paymentRes.body.data).toHaveProperty('address');
      expect(paymentRes.body.data.address).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');

      // Simulate webhook callback
      const webhookRes = await request(app)
        .post('/api/payments/bitcoin/webhook')
        .send({
          orderId,
          status: 'confirmed',
          txHash: 'mock-tx-hash-123',
          confirmations: 3
        });

      expect(webhookRes.status).toBe(200);

      // Verify payment was created
      const payment = await Payment.findOne({ order: orderRes.body.data._id });
      expect(payment).toBeTruthy();
      expect(payment.status).toBe('completed');
    });

    it('should handle Bitcoin service errors gracefully', async () => {
      vi.spyOn(bitcoinService, 'generateBitcoinAddress').mockRejectedValue(
        new Error('Bitcoin network unavailable')
      );

      // Add to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct1._id, quantity: 1 });

      // Create order
      const orderRes = await request(app)
        .post('/api/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'GB'
          },
          paymentMethod: 'bitcoin'
        });

      const orderId = orderRes.body.data.orderId;

      // Try to initialize Bitcoin payment
      const paymentRes = await request(app)
        .post('/api/payments/bitcoin/initialize')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId });

      expect(paymentRes.status).toBe(500);
      expect(paymentRes.body.message).toContain('Payment initialization failed');
    });

    it('should handle Bitcoin timeout scenarios', async () => {
      vi.spyOn(bitcoinService, 'generateBitcoinAddress').mockResolvedValue({
        address: 'timeout-address',
        amount: 0.015,
        expiresAt: new Date(Date.now() - 1000) // Already expired
      });

      // Add to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct1._id, quantity: 1 });

      // Create order
      const orderRes = await request(app)
        .post('/api/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'GB'
          },
          paymentMethod: 'bitcoin'
        });

      const orderId = orderRes.body.data.orderId;

      // Initialize Bitcoin payment
      const paymentRes = await request(app)
        .post('/api/payments/bitcoin/initialize')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId });

      // Check payment status
      const statusRes = await request(app)
        .get(`/api/payments/bitcoin/status/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(statusRes.body.data.status).toBe('expired');
    });
  });

  describe('Monero Service Integration', () => {
    it('should handle complete Monero payment flow with service layer', async () => {
      // Mock Monero service responses using a different approach
      const mockCreatePaymentRequest = vi.fn().mockResolvedValue({
        paymentId: 'xmr-payment-123',
        address: '888tNkZrPN6JsEgekjMnABU4TBzc2Dt29EPAvkRxbANsAnjyPbb3iQ1YBRk1UXcdRsiKc9dhwMVgN5S9cQUiyoogDavup3H',
        amount: 2.5,
        paymentUri: 'monero:888tNkZrPN6JsEgekjMnABU4TBzc2Dt29EPAvkRxbANsAnjyPbb3iQ1YBRk1UXcdRsiKc9dhwMVgN5S9cQUiyoogDavup3H?amount=2.5'
      });

      const mockGetPaymentStatus = vi.fn().mockResolvedValue({
        confirmed: true,
        confirmations: 10,
        txHash: 'xmr-tx-hash-456'
      });

      // Replace methods directly
      const originalCreatePaymentRequest = moneroService.createPaymentRequest;
      const originalGetPaymentStatus = moneroService.getPaymentStatus;
      moneroService.createPaymentRequest = mockCreatePaymentRequest;
      moneroService.getPaymentStatus = mockGetPaymentStatus;

      // Restore after test
      const restoreMethods = () => {
        moneroService.createPaymentRequest = originalCreatePaymentRequest;
        moneroService.getPaymentStatus = originalGetPaymentStatus;
      };

      // Add to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct2._id, quantity: 1 });

      // Create order
      const orderRes = await request(app)
        .post('/api/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'GB'
          },
          paymentMethod: 'monero'
        });

      expect(orderRes.status).toBe(201);
      const orderId = orderRes.body.data.orderId;

      // Initialize Monero payment
      const paymentRes = await request(app)
        .post('/api/payments/monero/initialize')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId });

      expect(paymentRes.status).toBe(200);
      expect(paymentRes.body.data).toHaveProperty('paymentUri');

      // Simulate webhook callback
      const webhookRes = await request(app)
        .post('/api/payments/monero/webhook')
        .send({
          paymentId: 'xmr-payment-123',
          status: 'confirmed',
          txHash: 'xmr-tx-hash-456',
          confirmations: 10
        });

      expect(webhookRes.status).toBe(200);
      
      // Restore original methods
      restoreMethods();
    });

    it('should handle Monero service connection failures', async () => {
      // Mock Monero service failure
      const originalCreatePaymentRequest = moneroService.createPaymentRequest;
      moneroService.createPaymentRequest = vi.fn().mockRejectedValue(
        new Error('Cannot connect to Monero daemon')
      );

      const restoreMethod = () => {
        moneroService.createPaymentRequest = originalCreatePaymentRequest;
      };

      // Add to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct2._id, quantity: 1 });

      // Create order
      const orderRes = await request(app)
        .post('/api/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'GB'
          },
          paymentMethod: 'monero'
        });

      const orderId = orderRes.body.data.orderId;

      // Try to initialize Monero payment
      const paymentRes = await request(app)
        .post('/api/payments/monero/initialize')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId });

      expect(paymentRes.status).toBe(500);
      expect(paymentRes.body.message).toContain('Payment initialization failed');
      
      // Restore original method
      restoreMethod();
    });
  });

  describe('PayPal Service Integration', () => {
    it('should handle complete PayPal payment flow with service layer', async () => {
      // Mock PayPal service responses
      vi.spyOn(paypalService, 'createOrder').mockResolvedValue({
        orderId: 'PAYPAL-ORDER-789',
        approvalUrl: 'https://sandbox.paypal.com/approve/PAYPAL-ORDER-789'
      });

      vi.spyOn(paypalService, 'captureOrder').mockResolvedValue({
        status: 'COMPLETED',
        captureId: 'CAPTURE-123',
        amount: 599.99
      });

      // Add to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct1._id, quantity: 1 });

      // Create order
      const orderRes = await request(app)
        .post('/api/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'GB'
          },
          paymentMethod: 'paypal'
        });

      expect(orderRes.status).toBe(201);
      const orderId = orderRes.body.data.orderId;

      // Create PayPal order
      const paypalRes = await request(app)
        .post('/api/payments/paypal/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId });

      expect(paypalRes.status).toBe(200);
      expect(paypalRes.body.data).toHaveProperty('approvalUrl');

      // Capture PayPal payment
      const captureRes = await request(app)
        .post('/api/payments/paypal/capture-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId,
          paypalOrderId: 'PAYPAL-ORDER-789'
        });

      expect(captureRes.status).toBe(200);
      expect(captureRes.body.data.status).toBe('COMPLETED');
    });

    it('should handle PayPal API rate limiting', async () => {
      vi.spyOn(paypalService, 'createOrder').mockRejectedValue(
        Object.assign(new Error('Rate limit exceeded'), { statusCode: 429 })
      );

      // Add to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct1._id, quantity: 1 });

      // Create order
      const orderRes = await request(app)
        .post('/api/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'GB'
          },
          paymentMethod: 'paypal'
        });

      if (!orderRes.body.data) {
        console.error('Order creation failed:', orderRes.body);
        throw new Error(`Order creation failed with status ${orderRes.status}: ${JSON.stringify(orderRes.body)}`);
      }

      const orderId = orderRes.body.data.orderId;

      // Try to create PayPal order
      const paypalRes = await request(app)
        .post('/api/payments/paypal/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId });

      expect(paypalRes.status).toBe(429);
      expect(paypalRes.body.message).toContain('Too many requests');
    });

    it('should handle PayPal refund scenarios', async () => {
      // Mock PayPal service responses
      vi.spyOn(paypalService, 'refundPayment').mockResolvedValue({
        refundId: 'REFUND-456',
        status: 'COMPLETED',
        amount: 599.99
      });

      // Create a completed payment first
      const payment = await Payment.create({
        paymentId: 'service-test-paypal-payment',
        order: new mongoose.Types.ObjectId(),
        user: customerUser._id,
        amount: 599.99,
        currency: 'GBP',
        method: 'paypal',
        status: 'completed',
        gatewayResponse: {
          captureId: 'CAPTURE-789'
        }
      });

      // Request refund
      const refundRes = await request(app)
        .post('/api/payments/paypal/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          paymentId: payment._id,
          amount: 599.99,
          reason: 'Customer request'
        });

      expect(refundRes.status).toBe(200);
      expect(refundRes.body.data.status).toBe('COMPLETED');

      // Verify payment status updated
      const updatedPayment = await Payment.findById(payment._id);
      expect(updatedPayment.status).toBe('refunded');
    });
  });

  describe('Multi-Gateway Error Scenarios', () => {
    it('should handle gateway switching on failure', async () => {
      // First payment method fails
      vi.spyOn(bitcoinService, 'generateBitcoinAddress').mockRejectedValue(
        new Error('Bitcoin service unavailable')
      );

      // Add to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct1._id, quantity: 1 });

      // Create order with Bitcoin
      const orderRes = await request(app)
        .post('/api/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'GB'
          },
          paymentMethod: 'bitcoin'
        });

      const orderId = orderRes.body.data.orderId;

      // Bitcoin payment fails
      const btcRes = await request(app)
        .post('/api/payments/bitcoin/initialize')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId });

      expect(btcRes.status).toBe(500);

      // Update order to use PayPal
      vi.spyOn(paypalService, 'createOrder').mockResolvedValue({
        orderId: 'PAYPAL-FALLBACK-123',
        approvalUrl: 'https://sandbox.paypal.com/approve/PAYPAL-FALLBACK-123'
      });

      const updateRes = await request(app)
        .put(`/api/user/orders/${orderId}/payment-method`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ paymentMethod: 'paypal' });

      expect(updateRes.status).toBe(200);

      // PayPal payment succeeds
      const paypalRes = await request(app)
        .post('/api/payments/paypal/create-order')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId });

      expect(paypalRes.status).toBe(200);
    });

    it('should handle concurrent payment attempts', async () => {
      // Add to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct1._id, quantity: 1 });

      // Create order
      const orderRes = await request(app)
        .post('/api/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'GB'
          },
          paymentMethod: 'bitcoin'
        });

      const orderId = orderRes.body.data.orderId;

      // Mock successful responses
      vi.spyOn(bitcoinService, 'generateBitcoinAddress').mockResolvedValue({
        address: 'concurrent-test-address',
        amount: 0.015,
        expiresAt: new Date(Date.now() + 3600000)
      });

      // Attempt concurrent payment initializations
      const attempts = await Promise.allSettled([
        request(app)
          .post('/api/payments/bitcoin/initialize')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({ orderId }),
        request(app)
          .post('/api/payments/bitcoin/initialize')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({ orderId }),
        request(app)
          .post('/api/payments/bitcoin/initialize')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({ orderId })
      ]);

      // At least one should succeed, others should fail with conflict
      const successful = attempts.filter(a => a.status === 'fulfilled' && a.value.status === 200);
      const conflicts = attempts.filter(a => a.status === 'fulfilled' && a.value.status === 409);

      expect(successful.length).toBeGreaterThanOrEqual(1);
      expect(conflicts.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Service Health and Monitoring', () => {
    it('should track service performance metrics', async () => {
      const startTime = Date.now();

      // Mock slow Bitcoin service
      vi.spyOn(bitcoinService, 'generateBitcoinAddress').mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          address: 'perf-test-address',
          amount: 0.015,
          expiresAt: new Date(Date.now() + 3600000)
        };
      });

      // Add to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct1._id, quantity: 1 });

      // Create order
      const orderRes = await request(app)
        .post('/api/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'GB'
          },
          paymentMethod: 'bitcoin'
        });

      const orderId = orderRes.body.data.orderId;

      // Initialize payment
      const paymentRes = await request(app)
        .post('/api/payments/bitcoin/initialize')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId });

      const responseTime = Date.now() - startTime;

      expect(paymentRes.status).toBe(200);
      expect(responseTime).toBeGreaterThan(1000);
      expect(paymentRes.headers).toHaveProperty('x-response-time');
    });

    it('should handle service degradation gracefully', async () => {
      // Mock service degradation
      let callCount = 0;
      vi.spyOn(moneroService, 'createPaymentRequest').mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Service temporarily unavailable');
        }
        return {
          paymentId: 'retry-success',
          address: 'monero-retry-address',
          amount: 2.5
        };
      });

      // Add to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct2._id, quantity: 1 });

      // Create order
      const orderRes = await request(app)
        .post('/api/user/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'GB'
          },
          paymentMethod: 'monero'
        });

      const orderId = orderRes.body.data.orderId;

      // First attempts should fail
      const attempt1 = await request(app)
        .post('/api/payments/monero/initialize')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId });

      expect(attempt1.status).toBe(500);

      // Eventually succeeds with retry
      await new Promise(resolve => setTimeout(resolve, 100));

      const attempt3 = await request(app)
        .post('/api/payments/monero/initialize')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId });

      expect(attempt3.status).toBe(200);
    });
  });
});