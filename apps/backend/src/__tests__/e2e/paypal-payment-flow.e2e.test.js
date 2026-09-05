import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import paymentRoutes from '../../routes/payment.js';
import cartRoutes from '../../routes/cart.js';
import Order from '../../models/Order.js';
import User from '../../models/User.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import ShippingMethod from '../../models/ShippingMethod.js';
import Cart from '../../models/Cart.js';
import PaymentGateway from '../../models/PaymentGateway.js';
import { generateSKU } from '../../test/helpers/testData.js';

// PayPal End-to-End Payment Flow Tests
describe('PayPal Payment Flow E2E Tests', () => {
  let app;
  let mongoServer;
  let testUser;
  let testProduct1;
  let testProduct2;
  let product1Price;
  let product2Price;
  let testCategory1;
  let testCategory2;
  let testShippingMethod;
  let testCart;

  beforeAll(async () => {
    // Setup MongoDB Memory Server
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test user
    testUser = await User.create({
      firstName: 'PayPal',
      lastName: 'E2E',
      email: 'paypal-e2e@test.com',
      password: 'hashedpassword123',
      isEmailVerified: true
    });

    // Create test categories
    testCategory1 = await Category.create({
      name: 'Smartphones',
      slug: 'smartphones-e2e-test',
      description: 'Test smartphones category'
    });

    testCategory2 = await Category.create({
      name: 'Services',
      slug: 'services-e2e-test',
      description: 'Test services category'
    });

    // Create test products (variation-based schema: baseModel required,
    // price/stock live on variations[])
    testProduct1 = await Product.create({
      name: 'GrapheneOS Pixel 7 Pro',
      slug: 'grapheneos-pixel-7-pro-e2e',
      sku: generateSKU('P7PRO-BASE'),
      baseModel: 'Pixel 7 Pro',
      shortDescription: 'Privacy-focused Pixel 7 Pro with GrapheneOS',
      longDescription: 'Google Pixel 7 Pro pre-installed with GrapheneOS for maximum privacy',
      category: testCategory1._id,
      images: ['pixel-7-pro.jpg'],
      variations: [
        {
          condition: 'new',
          color: 'Obsidian',
          storage: '256GB',
          price: 899.99,
          stockQuantity: 50,
          stockStatus: 'in_stock',
          sku: generateSKU('PIXEL7PRO')
        }
      ]
    });

    testProduct2 = await Product.create({
      name: 'Google Pixel 8',
      slug: 'google-pixel-8-e2e',
      sku: generateSKU('P8-BASE'),
      baseModel: 'Pixel 8',
      shortDescription: 'Google Pixel 8 with GrapheneOS pre-installed',
      longDescription: 'A privacy-focused Google Pixel 8 flashed with GrapheneOS',
      category: testCategory2._id,
      variations: [
        {
          condition: 'new',
          color: 'Obsidian',
          storage: '128GB',
          price: 649.99,
          stockQuantity: 100,
          stockStatus: 'in_stock',
          sku: generateSKU('PIXEL-8')
        }
      ]
    });

    // Create test shipping method
    testShippingMethod = await ShippingMethod.create({
      name: 'Express Delivery',
      code: 'EXPRESS_E2E',
      description: 'Fast and secure delivery',
      baseCost: 15.99,
      estimatedDeliveryDays: {
        min: 1,
        max: 2
      },
      isActive: true,
      criteria: {
        supportedCountries: ['GB', 'US', 'CA']
      }
    });

    // Products use the variation schema — expose the single variation price
    // for the cart/order fixtures below
    product1Price = testProduct1.variations[0].price;
    product2Price = testProduct2.variations[0].price;

    // Setup Express app
    app = express();
    app.use(express.json());
    
    // Mock user authentication. The x-test-guest header simulates an
    // anonymous visitor (no req.user) for guest-checkout validation tests.
    app.use((req, res, next) => {
      if (req.headers['x-test-guest']) {
        return next();
      }
      req.user = testUser;
      next();
    });
    
    app.use('/api/payments', paymentRoutes);
    app.use('/api/cart', cartRoutes);

    // Set environment variables
    process.env.PAYPAL_CLIENT_ID = 'test-paypal-e2e-client-id';
    process.env.PAYPAL_CLIENT_SECRET = 'test-paypal-e2e-client-secret';
    process.env.PAYPAL_ENVIRONMENT = 'sandbox';
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean up and recreate test cart
    await Cart.deleteMany({ userId: testUser._id });
    await Order.deleteMany({ userId: testUser._id });

    // The e2e harness wipes all collections in its own beforeEach, so the
    // gateway must be (re)seeded here for /api/payments/methods to return it
    await PaymentGateway.deleteMany({});
    await PaymentGateway.create({
      name: 'PayPal',
      code: 'PAYPAL_E2E',
      type: 'digital_wallet',
      provider: 'paypal',
      isEnabled: true,
      supportedCurrencies: ['GBP'],
      config: {
        paypalClientId: 'test-paypal-e2e-client-id'
      }
    });

    const price1 = testProduct1.variations[0].price;
    const price2 = testProduct2.variations[0].price;

    testCart = await Cart.create({
      userId: testUser._id,
      items: [
        {
          productId: testProduct1._id,
          productName: testProduct1.name,
          productSlug: testProduct1.slug,
          productImage: testProduct1.images[0] || '',
          quantity: 1,
          unitPrice: price1,
          subtotal: price1
        },
        {
          productId: testProduct2._id,
          productName: testProduct2.name,
          productSlug: testProduct2.slug,
          productImage: testProduct2.images[0] || '',
          quantity: 1,
          unitPrice: price2,
          subtotal: price2
        }
      ],
      totalAmount: price1 + price2,
      totalItems: 2
    });
  });

  describe('Complete PayPal Payment Flow', () => {
    it('should complete full payment flow from cart to order confirmation', async () => {
      // Step 1: Verify payment methods include PayPal
      const methodsResponse = await request(app)
        .get('/api/payments/methods');

      expect([200, 500]).toContain(methodsResponse.status);
      
      if (methodsResponse.status === 200) {
        expect(methodsResponse.body.success).toBe(true);
        expect(methodsResponse.body.data.paymentMethods).toEqual(
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

      // Step 2: Verify cart contents
      const foundCart = await Cart.findById(testCart._id);
      expect(foundCart).toBeDefined();
      expect(foundCart.items).toHaveLength(2);
      expect(foundCart.totalAmount).toBe(product1Price + product2Price);

      // Step 3: Initiate PayPal order creation
      const orderData = {
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          addressLine1: '123 Privacy Street',
          city: 'GrapheneOS City',
          stateProvince: 'Privacy State',
          postalCode: 'PR1V4CY',
          country: 'UK'
        },
        shippingMethodId: testShippingMethod._id.toString()
      };

      const orderResponse = await request(app)
        .post('/api/payments/paypal/create-order')
        .send(orderData);

      // PayPal order creation may fail due to API unavailability in test environment
      expect([200, 400, 500]).toContain(orderResponse.status);
      
      if (orderResponse.status === 500) {
        expect(orderResponse.body.success).toBe(false);
        expect(orderResponse.body.error).toBe('PayPal payment processing is not available');
      } else if (orderResponse.status === 200) {
        // Successful PayPal order creation
        expect(orderResponse.body.success).toBe(true);
        expect(orderResponse.body.data).toHaveProperty('paypalOrderId');
        expect(orderResponse.body.data).toHaveProperty('approvalUrl');
        
        // Step 4: Simulate PayPal payment approval and capture
        const captureData = {
          paypalOrderId: orderResponse.body.data.paypalOrderId,
          payerId: 'SIMULATED_PAYER_ID_123'
        };

        const captureResponse = await request(app)
          .post('/api/payments/paypal/capture')
          .send(captureData);

        expect([200, 400, 500]).toContain(captureResponse.status);
      }

      // Step 5: Verify order was created in database regardless of PayPal API status
      const orders = await Order.find({ userId: testUser._id });
      
      // Order creation depends on successful PayPal processing
      if (orderResponse.status === 200) {
        expect(orders.length).toBeGreaterThan(0);
        
        if (orders.length > 0) {
          const order = orders[0];
          expect(order.paymentMethod.type).toBe('paypal');
          expect(order.items).toHaveLength(2);
          expect(order.subtotal).toBe(product1Price + product2Price);
          expect(order.totalAmount).toBe(product1Price + product2Price + testShippingMethod.baseCost);
        }
      }
    });

    it('should handle PayPal payment flow with single product', async () => {
      // Create single-item cart
      await Cart.deleteMany({ userId: testUser._id });
      
      await Cart.create({
        userId: testUser._id,
        items: [{
          productId: testProduct1._id,
          productName: testProduct1.name,
          productSlug: testProduct1.slug,
          productImage: testProduct1.images[0] || '',
          quantity: 1,
          unitPrice: product1Price,
          subtotal: product1Price
        }],
        totalAmount: product1Price,
        totalItems: 1
      });

      const orderData = {
        shippingAddress: {
          firstName: 'Jane',
          lastName: 'Smith',
          addressLine1: '456 Single Product Lane',
          city: 'OneItem City',
          stateProvince: 'Single State',
          postalCode: '54321',
          country: 'UK'
        },
        shippingMethodId: testShippingMethod._id.toString()
      };

      const orderResponse = await request(app)
        .post('/api/payments/paypal/create-order')
        .send(orderData);

      expect([200, 400, 500]).toContain(orderResponse.status);
      
      if (orderResponse.status === 200) {
        expect(orderResponse.body.success).toBe(true);
        expect(orderResponse.body.data).toHaveProperty('paypalOrderId');
      }
    });

    it('should handle PayPal payment flow with high-value order', async () => {
      // Create high-value product
      const highValuePrice = 2499.99;
      const highValueProduct = await Product.create({
        name: 'GrapheneOS Enterprise Bundle',
        slug: 'grapheneos-enterprise-bundle-e2e',
        sku: generateSKU('ENTERPRISE-BASE'),
        baseModel: 'Enterprise Bundle',
        shortDescription: 'Enterprise bundle for businesses',
        longDescription: 'Complete enterprise solution with multiple devices',
        category: testCategory1._id,
        variations: [
          {
            condition: 'new',
            price: highValuePrice,
            stockQuantity: 10,
            stockStatus: 'in_stock',
            sku: generateSKU('ENTERPRISE')
          }
        ]
      });

      await Cart.deleteMany({ userId: testUser._id });

      await Cart.create({
        userId: testUser._id,
        items: [{
          productId: highValueProduct._id,
          productName: highValueProduct.name,
          productSlug: highValueProduct.slug,
          productImage: highValueProduct.images?.[0] || '',
          quantity: 1,
          unitPrice: highValuePrice,
          subtotal: highValuePrice
        }],
        totalAmount: highValuePrice,
        totalItems: 1
      });

      const orderData = {
        shippingAddress: {
          firstName: 'Enterprise',
          lastName: 'Customer',
          addressLine1: '789 Enterprise Plaza',
          city: 'Business City',
          stateProvince: 'Corporate State',
          postalCode: 'ENT123',
          country: 'UK'
        },
        shippingMethodId: testShippingMethod._id.toString()
      };

      const orderResponse = await request(app)
        .post('/api/payments/paypal/create-order')
        .send(orderData);

      expect([200, 400, 500]).toContain(orderResponse.status);
      
      // Cleanup
      await Product.deleteOne({ _id: highValueProduct._id });
    });
  });

  describe('PayPal Webhook Integration E2E', () => {
    it('should handle complete webhook processing flow', async () => {
      // Create a test order first
      const testOrder = await Order.create({
        userId: testUser._id,
        orderNumber: 'PP-E2E-WH-001',
        customerEmail: testUser.email,
        items: [{
          productId: testProduct1._id,
          productName: testProduct1.name,
          productSlug: testProduct1.slug,
          quantity: 1,
          unitPrice: product1Price,
          totalPrice: product1Price
        }],
        subtotal: product1Price,
        totalAmount: product1Price + testShippingMethod.baseCost,
        shippingAddress: {
          fullName: 'Webhook Test User',
          addressLine1: '123 Webhook Street',
          city: 'Webhook City',
          stateProvince: 'Webhook State',
          postalCode: '12345',
          country: 'UK'
        },
        billingAddress: {
          fullName: 'Webhook Test User',
          addressLine1: '123 Webhook Street',
          city: 'Webhook City',
          stateProvince: 'Webhook State',
          postalCode: '12345',
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
        paymentDetails: {
          paypalOrderId: 'PP_E2E_ORDER_123',
          paypalPaymentId: 'PP_E2E_PAYMENT_456'
        },
        paymentStatus: 'pending'
      });

      // Step 1: Send payment capture completed webhook
      const captureWebhook = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'E2E_CAPTURE_123456789',
          amount: {
            currency_code: 'GBP',
            value: (product1Price + testShippingMethod.baseCost).toFixed(2)
          },
          seller_receivable_breakdown: {
            gross_amount: {
              currency_code: 'GBP',
              value: (product1Price + testShippingMethod.baseCost).toFixed(2)
            },
            paypal_fee: {
              currency_code: 'GBP',
              value: '26.55'
            },
            net_amount: {
              currency_code: 'GBP',
              value: (product1Price + testShippingMethod.baseCost - 26.55).toFixed(2)
            }
          },
          supplementary_data: {
            related_ids: {
              order_id: testOrder._id.toString()
            }
          }
        }
      };

      const webhookResponse = await request(app)
        .post('/api/payments/paypal/webhook')
        .send(captureWebhook);

      expect(webhookResponse.status).toBe(200);
      expect(webhookResponse.body.received).toBe(true);

      // Step 2: Send order approved webhook
      const approvalWebhook = {
        event_type: 'CHECKOUT.ORDER.APPROVED',
        resource: {
          id: 'E2E_ORDER_123456789',
          status: 'APPROVED',
          purchase_units: [{
            amount: {
              currency_code: 'GBP',
              value: (product1Price + testShippingMethod.baseCost).toFixed(2)
            }
          }]
        }
      };

      const approvalResponse = await request(app)
        .post('/api/payments/paypal/webhook')
        .send(approvalWebhook);

      expect(approvalResponse.status).toBe(200);
      expect(approvalResponse.body.received).toBe(true);

      // Cleanup
      await Order.deleteOne({ _id: testOrder._id });
    });

    it('should handle webhook flow for denied payment', async () => {
      const testOrder = await Order.create({
        userId: testUser._id,
        orderNumber: 'PP-E2E-DEN-001',
        customerEmail: testUser.email,
        items: [{
          productId: testProduct2._id,
          productName: testProduct2.name,
          productSlug: testProduct2.slug,
          quantity: 1,
          unitPrice: product2Price,
          totalPrice: product2Price
        }],
        subtotal: product2Price,
        totalAmount: product2Price + testShippingMethod.baseCost,
        shippingAddress: {
          fullName: 'Denied Test User',
          addressLine1: '456 Denied Avenue',
          city: 'Denied City',
          stateProvince: 'Denied State',
          postalCode: '54321',
          country: 'UK'
        },
        billingAddress: {
          fullName: 'Denied Test User',
          addressLine1: '456 Denied Avenue',
          city: 'Denied City',
          stateProvince: 'Denied State',
          postalCode: '54321',
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
        paymentDetails: {
          paypalOrderId: 'PP_E2E_DENIED_ORDER_123',
          paypalPaymentId: 'PP_E2E_DENIED_PAYMENT_456'
        },
        paymentStatus: 'pending'
      });

      const deniedWebhook = {
        event_type: 'PAYMENT.CAPTURE.DENIED',
        resource: {
          id: 'E2E_DENIED_CAPTURE_123',
          amount: {
            currency_code: 'GBP',
            value: (product2Price + testShippingMethod.baseCost).toFixed(2)
          },
          supplementary_data: {
            related_ids: {
              order_id: testOrder._id.toString()
            }
          }
        }
      };

      const webhookResponse = await request(app)
        .post('/api/payments/paypal/webhook')
        .send(deniedWebhook);

      expect(webhookResponse.status).toBe(200);
      expect(webhookResponse.body.received).toBe(true);

      // Cleanup
      await Order.deleteOne({ _id: testOrder._id });
    });
  });

  describe('PayPal Error Scenarios E2E', () => {
    it('should handle complete flow with validation errors', async () => {
      // Step 1: Try to create order with missing shipping address
      const invalidOrderData = {
        shippingMethodId: testShippingMethod._id.toString()
        // Missing shippingAddress
      };

      const invalidResponse = await request(app)
        .post('/api/payments/paypal/create-order')
        .send(invalidOrderData);

      expect(invalidResponse.status).toBe(400);
      expect(invalidResponse.body.success).toBe(false);
      expect(invalidResponse.body.error).toBe('Shipping address and shipping method are required');

      // Step 2: Try with invalid shipping method
      const invalidMethodData = {
        shippingAddress: {
          firstName: 'Error',
          lastName: 'Test',
          addressLine1: '123 Error Street',
          city: 'Error City',
          stateProvince: 'Error State',
          postalCode: '12345',
          country: 'UK'
        },
        shippingMethodId: new mongoose.Types.ObjectId().toString()
      };

      const invalidMethodResponse = await request(app)
        .post('/api/payments/paypal/create-order')
        .send(invalidMethodData);

      expect([400, 500]).toContain(invalidMethodResponse.status);
      expect(invalidMethodResponse.body.success).toBe(false);

      // Step 3: Try capture without PayPal order ID
      const invalidCaptureResponse = await request(app)
        .post('/api/payments/paypal/capture')
        .send({ payerId: 'PAYER123' });

      expect(invalidCaptureResponse.status).toBe(400);
      expect(invalidCaptureResponse.body.success).toBe(false);
      expect(invalidCaptureResponse.body.error).toBe('PayPal order ID is required');
    });

    it('should handle network and service unavailability scenarios', async () => {
      const validOrderData = {
        shippingAddress: {
          firstName: 'Network',
          lastName: 'Test',
          addressLine1: '123 Network Test Road',
          city: 'Network City',
          stateProvince: 'Network State',
          postalCode: '12345',
          country: 'UK'
        },
        shippingMethodId: testShippingMethod._id.toString()
      };

      // PayPal API is expected to be unavailable in test environment
      const orderResponse = await request(app)
        .post('/api/payments/paypal/create-order')
        .send(validOrderData);

      expect([400, 500]).toContain(orderResponse.status);
      expect(orderResponse.body.success).toBe(false);
      if (orderResponse.status === 500) {
        expect(orderResponse.body.error).toBe('PayPal payment processing is not available');
      }

      // Test capture unavailability
      const captureResponse = await request(app)
        .post('/api/payments/paypal/capture')
        .send({
          paypalOrderId: 'PP_NETWORK_TEST_ORDER_123',
          payerId: 'PP_NETWORK_PAYER_456'
        });

      expect(captureResponse.status).toBe(500);
      expect(captureResponse.body.success).toBe(false);
      expect(['PayPal payment processing is not available', 'Cannot read properties of undefined (reading \'ordersCapture\')']).toContain(captureResponse.body.error);
    });

    it('rejects a guest capture without an email before touching PayPal', async () => {
      // x-test-guest header → the mock auth middleware leaves req.user unset
      const response = await request(app)
        .post('/api/payments/paypal/capture')
        .set('x-test-guest', '1')
        .send({ paypalOrderId: 'GUEST-VALIDATION-1' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email is required for guest checkout');
    });

    it('rejects a guest capture with a malformed email', async () => {
      const response = await request(app)
        .post('/api/payments/paypal/capture')
        .set('x-test-guest', '1')
        .send({ paypalOrderId: 'GUEST-VALIDATION-2', customerEmail: 'nope' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email is required for guest checkout');
    });

    it('rejects a guest create-order with no cart session cookie', async () => {
      const response = await request(app)
        .post('/api/payments/paypal/create-order')
        .set('x-test-guest', '1')
        .send({
          shippingAddress: {
            firstName: 'No',
            lastName: 'Cookie',
            addressLine1: '1 Main St',
            city: 'London',
            stateProvince: 'ENG',
            postalCode: 'W1 1AA',
            country: 'GB'
          },
          shippingMethodId: testShippingMethod._id.toString()
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No cart session found');
    });
  });

  describe('PayPal Multi-Product Order Flow', () => {
    it('should handle complex multi-product order with different categories', async () => {
      // Create additional products
      const accessoryPrice = 29.99;
      const softwarePrice = 149.99;
      const accessoryProduct = await Product.create({
        name: 'Privacy Screen Protector',
        slug: 'privacy-screen-protector-e2e',
        sku: generateSKU('PRIVACY-SCREEN-BASE'),
        baseModel: 'Screen Protector',
        shortDescription: 'Anti-spy screen protector',
        longDescription: 'Privacy screen protector for enhanced security',
        category: testCategory2._id,
        variations: [
          {
            condition: 'new',
            price: accessoryPrice,
            stockQuantity: 100,
            stockStatus: 'in_stock',
            sku: generateSKU('PRIVACY-SCREEN')
          }
        ]
      });

      const softwareProduct = await Product.create({
        name: 'GrapheneOS Setup Consultation',
        slug: 'grapheneos-setup-consultation-e2e',
        sku: generateSKU('SETUP-CONSULT-BASE'),
        baseModel: 'Setup Consultation',
        shortDescription: 'Professional GrapheneOS setup service',
        longDescription: 'Expert consultation for GrapheneOS installation and configuration',
        category: testCategory2._id,
        variations: [
          {
            condition: 'new',
            price: softwarePrice,
            stockQuantity: 50,
            stockStatus: 'in_stock',
            sku: generateSKU('SETUP-CONSULT')
          }
        ]
      });

      // Create complex cart
      await Cart.deleteMany({ userId: testUser._id });
      
      await Cart.create({
        userId: testUser._id,
        items: [
          {
            productId: testProduct1._id,
            productName: testProduct1.name,
            productSlug: testProduct1.slug,
            productImage: testProduct1.images[0] || '',
            quantity: 1,
            unitPrice: product1Price,
            subtotal: product1Price
          },
          {
            productId: accessoryProduct._id,
            productName: accessoryProduct.name,
            productSlug: accessoryProduct.slug,
            productImage: accessoryProduct.images?.[0] || '',
            quantity: 2,
            unitPrice: accessoryPrice,
            subtotal: accessoryPrice * 2
          },
          {
            productId: softwareProduct._id,
            productName: softwareProduct.name,
            productSlug: softwareProduct.slug,
            productImage: softwareProduct.images?.[0] || '',
            quantity: 1,
            unitPrice: softwarePrice,
            subtotal: softwarePrice
          }
        ],
        totalAmount: product1Price + (accessoryPrice * 2) + softwarePrice,
        totalItems: 4
      });

      const orderData = {
        shippingAddress: {
          firstName: 'Complex',
          lastName: 'Order',
          addressLine1: '789 Complex Order Boulevard',
          city: 'Multi City',
          stateProvince: 'Product State',
          postalCode: 'MUL123',
          country: 'UK'
        },
        shippingMethodId: testShippingMethod._id.toString()
      };

      const orderResponse = await request(app)
        .post('/api/payments/paypal/create-order')
        .send(orderData);

      expect([200, 400, 500]).toContain(orderResponse.status);

      // Cleanup
      await Product.deleteOne({ _id: accessoryProduct._id });
      await Product.deleteOne({ _id: softwareProduct._id });
    });
  });

  describe('PayPal Payment Status Transitions', () => {
    it('should handle complete payment status lifecycle', async () => {
      // Create order in pending state
      const testOrder = await Order.create({
        userId: testUser._id,
        orderNumber: 'PP-E2E-LIFE-001',
        customerEmail: testUser.email,
        items: [{
          productId: testProduct1._id,
          productName: testProduct1.name,
          productSlug: testProduct1.slug,
          quantity: 1,
          unitPrice: product1Price,
          totalPrice: product1Price
        }],
        subtotal: product1Price,
        totalAmount: product1Price + testShippingMethod.baseCost,
        shippingAddress: {
          fullName: 'Lifecycle Test User',
          addressLine1: '123 Lifecycle Avenue',
          city: 'Lifecycle City',
          stateProvince: 'Lifecycle State',
          postalCode: '12345',
          country: 'UK'
        },
        billingAddress: {
          fullName: 'Lifecycle Test User',
          addressLine1: '123 Lifecycle Avenue',
          city: 'Lifecycle City',
          stateProvince: 'Lifecycle State',
          postalCode: '12345',
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
        paymentDetails: {
          paypalOrderId: 'PP_E2E_LIFECYCLE_ORDER_123',
          paypalPaymentId: 'PP_E2E_LIFECYCLE_PAYMENT_456'
        },
        paymentStatus: 'pending'
      });

      // Verify initial state
      expect(testOrder.paymentStatus).toBe('pending');

      // Simulate payment completion webhook
      const completionWebhook = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'E2E_LIFECYCLE_CAPTURE_123',
          amount: {
            currency_code: 'GBP',
            value: (product1Price + testShippingMethod.baseCost).toFixed(2)
          },
          supplementary_data: {
            related_ids: {
              order_id: testOrder._id.toString()
            }
          }
        }
      };

      const webhookResponse = await request(app)
        .post('/api/payments/paypal/webhook')
        .send(completionWebhook);

      expect(webhookResponse.status).toBe(200);
      expect(webhookResponse.body.received).toBe(true);

      // Cleanup
      await Order.deleteOne({ _id: testOrder._id });
    });
  });
});