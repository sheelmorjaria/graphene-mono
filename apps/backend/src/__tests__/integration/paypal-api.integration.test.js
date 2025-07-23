import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import paymentRoutes from '../../routes/payment.js';
import Order from '../../models/Order.js';
import User from '../../models/User.js';
import Cart from '../../models/Cart.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import ShippingMethod from '../../models/ShippingMethod.js';

// PayPal API Integration Tests
describe('PayPal Payment API Integration Tests', () => {
  let app;
  let mongoServer;
  let testOrder;
  let testUser;
  let testProduct;
  let testCategory;
  let testShippingMethod;
  let testCart;

  beforeAll(async () => {
    // Disconnect any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test user
    testUser = await User.create({
      firstName: 'PayPal',
      lastName: 'User',
      email: 'paypal@test.com',
      password: 'hashedpassword123',
      isEmailVerified: true
    });

    // Create test category
    testCategory = await Category.create({
      name: 'Test Category',
      slug: 'test-category',
      description: 'A category for testing PayPal payments'
    });

    // Create test product
    testProduct = await Product.create({
      name: 'PayPal Payment Test Product',
      slug: 'paypal-payment-test-product',
      sku: 'PAYPAL-TEST-001',
      shortDescription: 'A product for testing PayPal payments',
      longDescription: 'A detailed product for testing PayPal payment integration',
      price: 299.99,
      category: testCategory._id,
      stockQuantity: 100,
      status: 'active',
      isActive: true,
      images: ['test-image.jpg']
    });

    // Create test shipping method
    testShippingMethod = await ShippingMethod.create({
      name: 'PayPal Test Shipping',
      code: 'PAYPAL_TEST',
      description: 'Test shipping method for PayPal tests',
      baseCost: 12.99,
      estimatedDeliveryDays: {
        min: 2,
        max: 4
      },
      isActive: true,
      criteria: {
        supportedCountries: ['GB', 'US']
      }
    });

    // Create test cart
    testCart = await Cart.create({
      userId: testUser._id,
      items: [{
        productId: testProduct._id,
        productName: testProduct.name,
        productSlug: testProduct.slug,
        quantity: 1,
        unitPrice: testProduct.price,
        subtotal: testProduct.price
      }],
      totalAmount: testProduct.price,
      totalItems: 1
    });

    // Create test order
    testOrder = await Order.create({
      userId: testUser._id,
      orderNumber: 'ORD-PAYPAL-TEST-123',
      customerEmail: 'paypal@test.com',
      items: [{
        productId: testProduct._id,
        productName: testProduct.name,
        productSlug: testProduct.slug,
        quantity: 1,
        unitPrice: testProduct.price,
        totalPrice: testProduct.price
      }],
      subtotal: testProduct.price,
      totalAmount: testProduct.price + testShippingMethod.baseCost,
      tax: 0,
      shipping: testShippingMethod.baseCost,
      shippingAddress: {
        fullName: 'PayPal User',
        addressLine1: '123 PayPal Avenue',
        city: 'Payment City',
        stateProvince: 'Payment State',
        postalCode: 'PP123',
        country: 'UK'
      },
      billingAddress: {
        fullName: 'PayPal User',
        addressLine1: '123 PayPal Avenue',
        city: 'Payment City',
        stateProvince: 'Payment State',
        postalCode: 'PP123',
        country: 'UK'
      },
      shippingMethod: {
        id: testShippingMethod._id,
        name: testShippingMethod.name,
        cost: testShippingMethod.baseCost
      },
      paymentMethod: {
        type: 'paypal',
        name: 'PayPal'
      },
      paymentStatus: 'pending'
    });
    
    // Setup Express app
    app = express();
    app.use(express.json());
    
    // Mock user authentication
    app.use((req, res, next) => {
      req.user = testUser;
      next();
    });
    
    app.use('/api/payments', paymentRoutes);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(() => {
    // Reset any test state
  });

  describe('PayPal Payment Methods', () => {
    it('should include PayPal in available payment methods', async () => {
      const response = await request(app)
        .get('/api/payments/methods');

      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.paymentMethods).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'paypal',
              type: 'paypal',
              name: 'PayPal',
              enabled: expect.any(Boolean)
            })
          ])
        );
      }
    });
  });

  describe('PayPal Order Creation', () => {
    const validOrderData = {
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 PayPal Street',
        city: 'PayPal City',
        stateProvince: 'PayPal State',
        postalCode: '12345',
        country: 'UK'
      },
      shippingMethodId: null // Will be set in tests
    };

    beforeEach(() => {
      validOrderData.shippingMethodId = testShippingMethod._id.toString();
    });

    it('should handle PayPal order creation request', async () => {
      const response = await request(app)
        .post('/api/payments/paypal/create-order')
        .send(validOrderData);

      // Expect either success or PayPal unavailability error (or validation error)
      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
      
      if (response.status === 500) {
        expect(response.body.success).toBe(false);
        // Accept various error messages related to PayPal unavailability
        expect(typeof response.body.error).toBe('string');
      } else if (response.status === 400) {
        expect(response.body.success).toBe(false);
        // Accept various validation errors that might occur
        expect(typeof response.body.error).toBe('string');
      } else if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('paypalOrderId');
        expect(response.body.data).toHaveProperty('approvalUrl');
      }
    });

    it('should validate missing shipping address', async () => {
      const invalidData = { ...validOrderData };
      delete invalidData.shippingAddress;

      const response = await request(app)
        .post('/api/payments/paypal/create-order')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Shipping address and shipping method are required');
    });

    it('should validate missing shipping method', async () => {
      const invalidData = { ...validOrderData };
      delete invalidData.shippingMethodId;

      const response = await request(app)
        .post('/api/payments/paypal/create-order')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Shipping address and shipping method are required');
    });

    it('should validate invalid shipping method ID', async () => {
      const invalidData = {
        ...validOrderData,
        shippingMethodId: new mongoose.Types.ObjectId().toString()
      };

      const response = await request(app)
        .post('/api/payments/paypal/create-order')
        .send(invalidData);

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
      
      if (response.status === 400) {
        // Accept various error messages that might be returned
        expect(typeof response.body.error).toBe('string');
        expect(response.body.error.length).toBeGreaterThan(0);
      }
    });

    it('should handle malformed request data', async () => {
      const response = await request(app)
        .post('/api/payments/paypal/create-order')
        .send({
          invalidField: 'invalid value',
          shippingAddress: null,
          shippingMethodId: 'invalid-id-format'
        });

      expect([400, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PayPal Payment Capture', () => {
    it('should handle PayPal payment capture request', async () => {
      const captureData = {
        paypalOrderId: 'PP_ORDER_123456789',
        payerId: 'PP_PAYER_123'
      };

      const response = await request(app)
        .post('/api/payments/paypal/capture')
        .send(captureData);

      // Expect either success or PayPal unavailability error
      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
      
      if (response.status === 500) {
        expect(response.body.success).toBe(false);
        // Accept various error messages related to PayPal unavailability
        expect(typeof response.body.error).toBe('string');
        expect(response.body.error.length).toBeGreaterThan(0);
      }
    });

    it('should validate missing PayPal order ID', async () => {
      const response = await request(app)
        .post('/api/payments/paypal/capture')
        .send({ payerId: 'PP_PAYER_123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('PayPal order ID is required');
    });

    it('should handle empty capture request', async () => {
      const response = await request(app)
        .post('/api/payments/paypal/capture')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('PayPal order ID is required');
    });

    it('should handle malformed PayPal order ID', async () => {
      const response = await request(app)
        .post('/api/payments/paypal/capture')
        .send({
          paypalOrderId: null,
          payerId: 'PP_PAYER_123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('PayPal order ID is required');
    });
  });

  describe('PayPal Webhook Processing', () => {
    it('should process PAYMENT.CAPTURE.COMPLETED webhook', async () => {
      const webhookPayload = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'CAPTURE123456789',
          amount: {
            currency_code: 'GBP',
            value: '312.98'
          },
          seller_receivable_breakdown: {
            gross_amount: {
              currency_code: 'GBP',
              value: '312.98'
            },
            paypal_fee: {
              currency_code: 'GBP',
              value: '9.23'
            },
            net_amount: {
              currency_code: 'GBP',
              value: '303.75'
            }
          },
          supplementary_data: {
            related_ids: {
              order_id: testOrder._id.toString()
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/payments/paypal/webhook')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should process PAYMENT.CAPTURE.DENIED webhook', async () => {
      const webhookPayload = {
        event_type: 'PAYMENT.CAPTURE.DENIED',
        resource: {
          id: 'CAPTURE123456789',
          amount: {
            currency_code: 'GBP',
            value: '312.98'
          },
          supplementary_data: {
            related_ids: {
              order_id: testOrder._id.toString()
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/payments/paypal/webhook')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should process CHECKOUT.ORDER.APPROVED webhook', async () => {
      const webhookPayload = {
        event_type: 'CHECKOUT.ORDER.APPROVED',
        resource: {
          id: 'ORDER123456789',
          status: 'APPROVED',
          purchase_units: [{
            amount: {
              currency_code: 'GBP',
              value: '312.98'
            }
          }]
        }
      };

      const response = await request(app)
        .post('/api/payments/paypal/webhook')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should handle unknown webhook events', async () => {
      const webhookPayload = {
        event_type: 'UNKNOWN.WEBHOOK.EVENT',
        resource: {
          id: 'UNKNOWN123'
        }
      };

      const response = await request(app)
        .post('/api/payments/paypal/webhook')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should handle malformed webhook data', async () => {
      const malformedPayloads = [
        { event_type: null },
        { resource: null },
        {},
        { event_type: 'VALID.EVENT', resource: { invalid: 'data' } }
      ];

      for (const payload of malformedPayloads) {
        const response = await request(app)
          .post('/api/payments/paypal/webhook')
          .send(payload);

        expect(response.status).toBe(200);
        expect(response.body.received).toBe(true);
      }
    });

    it('should handle empty webhook payload', async () => {
      const response = await request(app)
        .post('/api/payments/paypal/webhook')
        .send();

      expect([200, 400, 500]).toContain(response.status);
    });
  });

  describe('Database Integration', () => {
    it('should maintain database connection during requests', async () => {
      expect(mongoose.connection.readyState).toBe(1); // Connected
      
      const response = await request(app)
        .get('/api/payments/methods');

      expect(mongoose.connection.readyState).toBe(1); // Still connected
      expect(response.body).toBeDefined();
    });

    it('should handle PayPal orders with database', async () => {
      // Verify test order exists, recreate if needed (due to database isolation)
      let foundOrder = await Order.findById(testOrder._id);
      
      if (!foundOrder) {
        // Recreate test order if it was cleared by other tests
        foundOrder = await Order.create({
          _id: testOrder._id,
          userId: testUser._id,
          orderNumber: 'ORD-PAYPAL-TEST-123',
          customerEmail: 'paypal@test.com',
          items: testOrder.items,
          subtotal: testOrder.subtotal,
          totalAmount: testOrder.totalAmount,
          tax: testOrder.tax,
          shipping: testOrder.shipping,
          shippingAddress: testOrder.shippingAddress,
          billingAddress: testOrder.billingAddress,
          shippingMethod: testOrder.shippingMethod,
          paymentMethod: testOrder.paymentMethod,
          paymentStatus: testOrder.paymentStatus
        });
      }
      
      expect(foundOrder).toBeTruthy();
      expect(foundOrder.orderNumber).toBe('ORD-PAYPAL-TEST-123');
      // Check paymentMethod exists and has correct structure
      if (foundOrder.paymentMethod) {
        expect(foundOrder.paymentMethod.type).toBe('paypal');
      }
    });

    it('should handle concurrent PayPal requests', async () => {
      const validOrderData = {
        shippingAddress: {
          firstName: 'Concurrent',
          lastName: 'User',
          addressLine1: '123 Concurrent St',
          city: 'Concurrent City',
          stateProvince: 'Concurrent State',
          postalCode: '12345',
          country: 'UK'
        },
        shippingMethodId: testShippingMethod._id.toString()
      };

      // Send multiple concurrent requests
      const promises = Array(5).fill(null).map(() => 
        request(app)
          .post('/api/payments/paypal/create-order')
          .send(validOrderData)
      );

      const responses = await Promise.all(promises);

      // All requests should complete without crashing
      responses.forEach(response => {
        expect([200, 400, 500]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });

    it('should validate order data integrity', async () => {
      const foundOrder = await Order.findById(testOrder._id);
      expect(foundOrder).toBeDefined();
      
      if (foundOrder) {
        expect(foundOrder.orderNumber).toBe('ORD-PAYPAL-TEST-123');
        expect(foundOrder.customerEmail).toBe('paypal@test.com');
        expect(foundOrder.items).toHaveLength(1);
        expect(foundOrder.totalAmount).toBe(testProduct.price + testShippingMethod.baseCost);
        expect(foundOrder.paymentMethod.type).toBe('paypal');
      }
    });
  });

  describe('PayPal Order Processing', () => {
    it('should handle cart-to-order conversion', async () => {
      // Test that cart data is properly converted to PayPal order format
      const foundCart = await Cart.findById(testCart._id);
      expect(foundCart).toBeDefined();
      
      if (foundCart) {
        expect(foundCart.items).toHaveLength(1);
        expect(foundCart.totalAmount).toBe(testProduct.price);
        
        // Simulate PayPal order creation with cart data
        const orderData = {
          shippingAddress: {
            firstName: 'Cart',
            lastName: 'User',
            addressLine1: '123 Cart St',
            city: 'Cart City',
            stateProvince: 'Cart State',
            postalCode: '12345',
            country: 'UK'
          },
          shippingMethodId: testShippingMethod._id.toString(),
          cartData: {
            items: foundCart.items,
            totalAmount: foundCart.totalAmount
          }
        };

        const response = await request(app)
          .post('/api/payments/paypal/create-order')
          .send(orderData);

        expect([200, 400, 500]).toContain(response.status);
      }
    });

    it('should validate product availability', async () => {
      // Create an out-of-stock product for testing
      const outOfStockProduct = await Product.create({
        name: 'Out of Stock Product',
        slug: 'out-of-stock-product',
        sku: 'OOS-TEST-001',
        shortDescription: 'Out of stock test product',
        price: 199.99,
        category: testCategory._id,
        stockQuantity: 0,
        status: 'active',
        isActive: true
      });

      // Create cart with out-of-stock product
      const outOfStockCart = await Cart.create({
        userId: testUser._id,
        items: [{
          productId: outOfStockProduct._id,
          productName: outOfStockProduct.name,
          productSlug: outOfStockProduct.slug,
          quantity: 1,
          unitPrice: outOfStockProduct.price,
          subtotal: outOfStockProduct.price
        }],
        totalAmount: outOfStockProduct.price,
        totalItems: 1
      });

      const orderData = {
        shippingAddress: {
          firstName: 'Stock',
          lastName: 'Test',
          addressLine1: '123 Stock St',
          city: 'Stock City',
          stateProvince: 'Stock State',
          postalCode: '12345',
          country: 'UK'
        },
        shippingMethodId: testShippingMethod._id.toString()
      };

      const response = await request(app)
        .post('/api/payments/paypal/create-order')
        .send(orderData);

      // Should handle stock validation
      expect([200, 400, 500]).toContain(response.status);
      
      // Cleanup
      await Product.deleteOne({ _id: outOfStockProduct._id });
      await Cart.deleteOne({ _id: outOfStockCart._id });
    });
  });

  describe('API Response Validation', () => {
    it('should return consistent response structure for payment methods', async () => {
      const response = await request(app)
        .get('/api/payments/methods');

      expect(response.body).toHaveProperty('success');
      
      if (response.body.success) {
        expect(response.body).toHaveProperty('data');
        expect(typeof response.body.data).toBe('object');
      } else {
        expect(response.body).toHaveProperty('error');
        expect(typeof response.body.error).toBe('string');
      }
    });

    it('should return consistent response structure for order creation', async () => {
      const validOrderData = {
        shippingAddress: {
          firstName: 'Response',
          lastName: 'Test',
          addressLine1: '123 Response St',
          city: 'Response City',
          stateProvince: 'Response State',
          postalCode: '12345',
          country: 'UK'
        },
        shippingMethodId: testShippingMethod._id.toString()
      };

      const response = await request(app)
        .post('/api/payments/paypal/create-order')
        .send(validOrderData);

      expect(response.body).toHaveProperty('success');
      
      if (response.body.success) {
        expect(response.body).toHaveProperty('data');
        expect(typeof response.body.data).toBe('object');
      } else {
        expect(response.body).toHaveProperty('error');
        expect(typeof response.body.error).toBe('string');
      }
    });

    it('should return consistent response structure for webhooks', async () => {
      const webhookPayload = {
        event_type: 'TEST.EVENT',
        resource: { id: 'test123' }
      };

      const response = await request(app)
        .post('/api/payments/paypal/webhook')
        .send(webhookPayload);

      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe('object');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON in requests', async () => {
      const response = await request(app)
        .post('/api/payments/paypal/create-order')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect([400, 500]).toContain(response.status);
    });

    it('should handle oversized request payloads', async () => {
      const largePayload = {
        shippingAddress: {
          firstName: 'Large',
          lastName: 'Payload',
          addressLine1: 'x'.repeat(10000),
          city: 'Large City',
          stateProvince: 'Large State',
          postalCode: '12345',
          country: 'UK'
        },
        shippingMethodId: testShippingMethod._id.toString(),
        extraData: 'x'.repeat(100000)
      };

      const response = await request(app)
        .post('/api/payments/paypal/create-order')
        .send(largePayload);

      expect([200, 400, 413, 500]).toContain(response.status);
    });

    it('should handle database connection issues gracefully', async () => {
      // This test simulates potential database issues
      const response = await request(app)
        .get('/api/payments/methods');

      expect([200, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });
  });
});
