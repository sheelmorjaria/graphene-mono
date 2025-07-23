import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { performance } from 'perf_hooks';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import paymentRoutes from '../../routes/payment.js';
import Order from '../../models/Order.js';
import User from '../../models/User.js';
import Product from '../../models/Product.js';
import ShippingMethod from '../../models/ShippingMethod.js';
import Cart from '../../models/Cart.js';

// PayPal Performance Tests
describe('PayPal Performance Tests', () => {
  let app;
  let mongoServer;
  let testOrders = [];
  let testUser;
  let testProduct;
  let testShippingMethod;

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
      lastName: 'Performance',
      email: 'paypal-performance@test.com',
      password: 'hashedpassword123'
    });

    // Create test product
    testProduct = await Product.create({
      name: 'PayPal Performance Test Product',
      slug: 'paypal-performance-test-product',
      price: 399.99,
      stockQuantity: 1000,
      isActive: true
    });

    // Create test shipping method
    testShippingMethod = await ShippingMethod.create({
      name: 'Performance Test Shipping',
      description: 'Fast shipping for performance tests',
      cost: 9.99,
      estimatedDays: '1-2',
      isActive: true,
      availableCountries: ['UK', 'US'],
      calculateCost: function(_cart, _address) {
        return { cost: this.cost, available: true };
      }
    });

    // Create multiple test orders for performance testing
    const orderPromises = Array(50).fill(null).map((_, index) => 
      Order.create({
        userId: testUser._id,
        orderNumber: `ORD-PP-PERF-${index.toString().padStart(3, '0')}`,
        customerEmail: `performance${index}@paypal.test`,
        items: [{
          productId: testProduct._id,
          productName: `PayPal Performance Product ${index}`,
          productSlug: `paypal-performance-product-${index}`,
          quantity: 1,
          unitPrice: 199.99 + index,
          totalPrice: 199.99 + index
        }],
        subtotal: 199.99 + index,
        orderTotal: 199.99 + index + testShippingMethod.cost,
        shippingAddress: {
          fullName: 'PayPal Performance User',
          addressLine1: `${index} Performance St`,
          city: 'Performance City',
          stateProvince: 'Performance State',
          postalCode: '12345',
          country: 'UK'
        },
        billingAddress: {
          fullName: 'PayPal Performance User',
          addressLine1: `${index} Performance St`,
          city: 'Performance City',
          stateProvince: 'Performance State',
          postalCode: '12345',
          country: 'UK'
        },
        shippingMethod: {
          id: testShippingMethod._id,
          name: testShippingMethod.name,
          cost: testShippingMethod.cost
        },
        paymentMethod: {
          type: 'paypal',
          name: 'PayPal'
        },
        paymentDetails: {
          paypalOrderId: `PP_ORDER_${index}_${Date.now()}`,
          paypalPaymentId: `PP_PAYMENT_${index}`,
          paypalPayerId: `PP_PAYER_${index}`
        },
        paymentStatus: index % 3 === 0 ? 'completed' : 'pending'
      })
    );

    testOrders = await Promise.all(orderPromises);

    // Create test carts
    await Promise.all(
      Array(10).fill(null).map((_, index) => 
        Cart.create({
          userId: testUser._id,
          items: [{
            productId: testProduct._id,
            productName: testProduct.name,
            productSlug: testProduct.slug,
            quantity: 1 + (index % 3),
            unitPrice: testProduct.price,
            price: testProduct.price
          }],
          totalAmount: testProduct.price * (1 + (index % 3)),
          totalItems: 1 + (index % 3)
        })
      )
    );

    // Setup Express app
    app = express();
    app.use(express.json());
    
    // Mock user authentication
    app.use((req, res, next) => {
      req.user = testUser;
      next();
    });
    
    app.use('/api/payments', paymentRoutes);

    // Set environment variables
    process.env.PAYPAL_CLIENT_ID = 'test-paypal-performance-client-id';
    process.env.PAYPAL_CLIENT_SECRET = 'test-paypal-performance-client-secret';
    process.env.PAYPAL_ENVIRONMENT = 'sandbox';
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('PayPal Payment Methods Performance', () => {
    it('should retrieve payment methods quickly', async () => {
      const startTime = performance.now();
      
      const response = await request(app)
        .get('/api/payments/methods');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Payment methods should be retrieved very quickly (database + logic only)
      expect(duration).toBeLessThan(200);
      
      console.log(`PayPal payment methods retrieval took ${duration.toFixed(2)}ms`);
      
      expect([200, 500]).toContain(response.status);
    });

    it('should handle bulk payment method requests efficiently', async () => {
      const requestCount = 20;
      
      const startTime = performance.now();
      
      const promises = Array(requestCount).fill(null).map(() => 
        request(app).get('/api/payments/methods')
      );
      
      const responses = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const averageTime = duration / requestCount;
      
      // Bulk requests should be efficient
      expect(duration).toBeLessThan(2000);
      expect(averageTime).toBeLessThan(150);
      
      console.log(`Bulk payment methods: ${duration.toFixed(2)}ms total, ${averageTime.toFixed(2)}ms average`);
      
      responses.forEach(response => {
        expect([200, 500]).toContain(response.status);
      });
    });
  });

  describe('PayPal Order Creation Performance', () => {
    const validOrderData = {
      shippingAddress: {
        firstName: 'Performance',
        lastName: 'Test',
        addressLine1: '123 Performance Avenue',
        city: 'Performance City',
        stateProvince: 'Performance State',
        postalCode: '12345',
        country: 'UK'
      },
      shippingMethodId: null // Will be set in tests
    };

    beforeEach(() => {
      validOrderData.shippingMethodId = testShippingMethod._id.toString();
    });

    it('should handle PayPal order creation within acceptable time', async () => {
      const startTime = performance.now();
      
      const response = await request(app)
        .post('/api/payments/paypal/create-order')
        .send(validOrderData);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // PayPal order creation should complete within reasonable time
      // (allowing for external PayPal API calls or unavailability)
      expect(duration).toBeLessThan(8000);
      
      console.log(`PayPal order creation took ${duration.toFixed(2)}ms`);
      
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle concurrent PayPal order creations efficiently', async () => {
      const concurrency = 10;
      
      const startTime = performance.now();
      
      const promises = Array(concurrency).fill(null).map((_, index) => 
        request(app)
          .post('/api/payments/paypal/create-order')
          .send({
            ...validOrderData,
            shippingAddress: {
              ...validOrderData.shippingAddress,
              addressLine1: `${index} Concurrent PayPal St`
            }
          })
      );
      
      const responses = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const averageTime = duration / concurrency;
      
      // Concurrent requests should be reasonably efficient
      expect(duration).toBeLessThan(20000); // Total time under 20 seconds
      expect(averageTime).toBeLessThan(5000); // Average under 5 seconds per request
      
      console.log(`Concurrent PayPal orders: ${duration.toFixed(2)}ms total, ${averageTime.toFixed(2)}ms average`);
      
      responses.forEach(response => {
        expect([200, 400, 500]).toContain(response.status);
      });
    });

    it('should maintain performance under repeated order creations', async () => {
      const iterations = 8;
      const timings = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        const response = await request(app)
          .post('/api/payments/paypal/create-order')
          .send({
            ...validOrderData,
            shippingAddress: {
              ...validOrderData.shippingAddress,
              addressLine1: `${i} Repeated PayPal St`
            }
          });
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        timings.push(duration);
        
        expect([200, 400, 500]).toContain(response.status);
      }
      
      const averageTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      const maxTime = Math.max(...timings);
      const minTime = Math.min(...timings);
      
      console.log(`Repeated PayPal orders - Avg: ${averageTime.toFixed(2)}ms, Min: ${minTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);
      
      expect(averageTime).toBeLessThan(6000);
      expect(maxTime).toBeLessThan(12000);
    });
  });

  describe('PayPal Payment Capture Performance', () => {
    it('should handle PayPal payment capture quickly', async () => {
      const captureData = {
        paypalOrderId: 'PP_PERF_ORDER_123456789',
        payerId: 'PP_PERF_PAYER_123'
      };
      
      const startTime = performance.now();
      
      const response = await request(app)
        .post('/api/payments/paypal/capture')
        .send(captureData);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // PayPal capture should be processed quickly
      expect(duration).toBeLessThan(5000);
      
      console.log(`PayPal capture took ${duration.toFixed(2)}ms`);
      
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle concurrent PayPal captures efficiently', async () => {
      const concurrency = 8;
      
      const startTime = performance.now();
      
      const promises = Array(concurrency).fill(null).map((_, index) => 
        request(app)
          .post('/api/payments/paypal/capture')
          .send({
            paypalOrderId: `PP_CONCURRENT_ORDER_${index}`,
            payerId: `PP_CONCURRENT_PAYER_${index}`
          })
      );
      
      const responses = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const averageTime = duration / concurrency;
      
      // Concurrent captures should be efficient
      expect(duration).toBeLessThan(15000);
      expect(averageTime).toBeLessThan(3000);
      
      console.log(`Concurrent PayPal captures: ${duration.toFixed(2)}ms total, ${averageTime.toFixed(2)}ms average`);
      
      responses.forEach(response => {
        expect([200, 400, 500]).toContain(response.status);
      });
    });
  });

  describe('PayPal Webhook Performance', () => {
    it('should process PayPal webhooks quickly', async () => {
      const webhookPayload = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'PERF_CAPTURE_123456789',
          amount: {
            currency_code: 'GBP',
            value: '409.98'
          },
          supplementary_data: {
            related_ids: {
              order_id: testOrders[0]._id.toString()
            }
          }
        }
      };
      
      const startTime = performance.now();
      
      const response = await request(app)
        .post('/api/payments/paypal/webhook')
        .send(webhookPayload);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Webhook processing should be very fast
      expect(duration).toBeLessThan(500);
      
      console.log(`PayPal webhook processing took ${duration.toFixed(2)}ms`);
      
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle concurrent webhooks efficiently', async () => {
      const concurrency = 15;
      
      const startTime = performance.now();
      
      const promises = Array(concurrency).fill(null).map((_, index) => 
        request(app)
          .post('/api/payments/paypal/webhook')
          .send({
            event_type: 'PAYMENT.CAPTURE.COMPLETED',
            resource: {
              id: `CONCURRENT_CAPTURE_${index}`,
              amount: {
                currency_code: 'GBP',
                value: (200 + index * 10).toFixed(2)
              },
              supplementary_data: {
                related_ids: {
                  order_id: testOrders[index % testOrders.length]._id.toString()
                }
              }
            }
          })
      );
      
      const responses = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const averageTime = duration / concurrency;
      
      // Concurrent webhooks should be processed efficiently
      expect(duration).toBeLessThan(3000);
      expect(averageTime).toBeLessThan(300);
      
      console.log(`Concurrent PayPal webhooks: ${duration.toFixed(2)}ms total, ${averageTime.toFixed(2)}ms average`);
      
      responses.forEach(response => {
        expect([200, 400, 500]).toContain(response.status);
      });
    });

    it('should maintain performance under sustained webhook load', async () => {
      const iterations = 30;
      const timings = [];
      
      for (let i = 0; i < iterations; i++) {
        const webhookPayload = {
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          resource: {
            id: `SUSTAINED_CAPTURE_${i}`,
            amount: {
              currency_code: 'GBP',
              value: (150 + i * 5).toFixed(2)
            }
          }
        };
        
        const startTime = performance.now();
        
        const response = await request(app)
          .post('/api/payments/paypal/webhook')
          .send(webhookPayload);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        timings.push(duration);
        
        expect([200, 400, 500]).toContain(response.status);
      }
      
      const averageTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      const maxTime = Math.max(...timings);
      const p95Time = timings.sort((a, b) => a - b)[Math.floor(timings.length * 0.95)];
      
      console.log(`Sustained webhooks - Avg: ${averageTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms, P95: ${p95Time.toFixed(2)}ms`);
      
      expect(averageTime).toBeLessThan(400);
      expect(p95Time).toBeLessThan(800);
    });
  });

  describe('Database Performance with PayPal', () => {
    it('should perform PayPal order queries efficiently', async () => {
      const startTime = performance.now();
      
      // Simulate complex PayPal order queries
      const paypalOrdersQuery = Order.find({
        'paymentMethod.type': 'paypal',
        paymentStatus: { $in: ['pending', 'completed'] }
      }).sort({ createdAt: -1 }).limit(20);
      
      const results = await paypalOrdersQuery.exec();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Database query should be very fast
      expect(results.length).toBeGreaterThan(0);
      
      console.log(`PayPal orders query took ${duration.toFixed(2)}ms, found ${results.length} orders`);
    });

    it('should handle complex PayPal payment aggregations efficiently', async () => {
      const startTime = performance.now();
      
      // Complex aggregation query
      const aggregationResults = await Order.aggregate([
        { $match: { 'paymentMethod.type': 'paypal' } },
        {
          $group: {
            _id: '$paymentStatus',
            count: { $sum: 1 },
            totalAmount: { $sum: '$orderTotal' },
            avgAmount: { $avg: '$orderTotal' }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200);
      expect(aggregationResults).toBeDefined();
      
      console.log(`PayPal payment aggregation took ${duration.toFixed(2)}ms`);
    });

    it('should update PayPal payment details efficiently', async () => {
      const paypalOrder = testOrders.find(order => order.paymentMethod.type === 'paypal');
      const iterations = 10;
      const timings = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        // Update PayPal payment details
        paypalOrder.paymentDetails.paypalTransactionId = `PERF_TXN_${i}_${Date.now()}`;
        paypalOrder.paymentDetails.paypalCaptureId = `PERF_CAPTURE_${i}`;
        paypalOrder.paymentDetails.lastWebhookUpdate = new Date();
        
        await paypalOrder.save();
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        timings.push(duration);
      }
      
      const averageTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      
      expect(averageTime).toBeLessThan(50); // Updates should be very fast
      
      console.log(`PayPal payment updates averaged ${averageTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should handle large PayPal webhook payloads efficiently', async () => {
      // Create larger payload to test memory handling
      const largePayload = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'memory-test-capture',
          amount: {
            currency_code: 'GBP',
            value: '299.99'
          },
          metadata: {
            extraData: 'x'.repeat(10000), // 10KB of extra data
            timestamps: Array(1000).fill(null).map((_, i) => Date.now() + i),
            paypalDetails: {
              merchantInfo: 'x'.repeat(5000),
              transactionDetails: Array(500).fill({ key: 'value', timestamp: Date.now() })
            }
          }
        }
      };
      
      const startTime = performance.now();
      const initialMemory = process.memoryUsage();
      
      const response = await request(app)
        .post('/api/payments/paypal/webhook')
        .send(largePayload);
      
      const endTime = performance.now();
      const finalMemory = process.memoryUsage();
      const duration = endTime - startTime;
      
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`Large PayPal payload processing: ${duration.toFixed(2)}ms, Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      expect(duration).toBeLessThan(1500);
      expect(memoryIncrease).toBeLessThan(30 * 1024 * 1024); // Less than 30MB increase
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should maintain stable memory usage during sustained PayPal operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform sustained PayPal operations
      for (let i = 0; i < 15; i++) {
        await request(app)
          .get('/api/payments/methods');
        
        await request(app)
          .post('/api/payments/paypal/webhook')
          .send({
            event_type: 'PAYMENT.CAPTURE.COMPLETED',
            resource: {
              id: `sustained-test-${i}`,
              amount: {
                currency_code: 'GBP',
                value: (100 + i * 10).toFixed(2)
              }
            }
          });
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`Sustained PayPal operations memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // Memory increase should be reasonable for sustained operations
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle PayPal errors efficiently without performance degradation', async () => {
      const errorScenarios = [
        { shippingMethodId: 'invalid-id' },
        { shippingMethodId: new mongoose.Types.ObjectId().toString() }, // Non-existent
        {}, // Missing data
        { shippingAddress: null }
      ];
      
      const timings = [];
      
      for (const scenario of errorScenarios) {
        const startTime = performance.now();
        
        const response = await request(app)
          .post('/api/payments/paypal/create-order')
          .send(scenario);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        timings.push(duration);
        
        expect([400, 500]).toContain(response.status);
      }
      
      const averageErrorTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      
      // Error handling should be fast
      expect(averageErrorTime).toBeLessThan(300);
      
      console.log(`PayPal error handling averaged ${averageErrorTime.toFixed(2)}ms`);
    });

    it('should handle PayPal webhook errors efficiently', async () => {
      const errorPayloads = [
        { event_type: null },
        { resource: null },
        { event_type: 'INVALID.EVENT', resource: { invalid: 'data' } },
        {}
      ];
      
      const timings = [];
      
      for (const payload of errorPayloads) {
        const startTime = performance.now();
        
        const response = await request(app)
          .post('/api/payments/paypal/webhook')
          .send(payload);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        timings.push(duration);
        
        expect([200, 400, 500]).toContain(response.status);
      }
      
      const averageErrorTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      
      // Webhook error handling should be very fast
      expect(averageErrorTime).toBeLessThan(100);
      
      console.log(`PayPal webhook error handling averaged ${averageErrorTime.toFixed(2)}ms`);
    });
  });

  describe('PayPal Integration Performance', () => {
    it('should handle cart-to-order conversion efficiently', async () => {
      const startTime = performance.now();
      
      // Simulate complex cart processing
      const carts = await Cart.find({ userId: testUser._id }).limit(5);
      
      for (const cart of carts) {
        const orderData = {
          shippingAddress: {
            firstName: 'Cart',
            lastName: 'Performance',
            addressLine1: '123 Cart Performance St',
            city: 'Cart City',
            stateProvince: 'Cart State',
            postalCode: '12345',
            country: 'UK'
          },
          shippingMethodId: testShippingMethod._id.toString(),
          cartData: {
            items: cart.items,
            totalAmount: cart.totalAmount
          }
        };
        
        await request(app)
          .post('/api/payments/paypal/create-order')
          .send(orderData);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Cart-to-order processing for ${carts.length} carts took ${duration.toFixed(2)}ms`);
      
      expect(duration).toBeLessThan(15000); // Should process multiple carts efficiently
    });

    it('should handle product validation efficiently', async () => {
      const startTime = performance.now();
      
      // Test with various product scenarios
      const validOrderData = {
        shippingAddress: {
          firstName: 'Product',
          lastName: 'Validation',
          addressLine1: '123 Validation St',
          city: 'Validation City',
          stateProvince: 'Validation State',
          postalCode: '12345',
          country: 'UK'
        },
        shippingMethodId: testShippingMethod._id.toString()
      };
      
      const response = await request(app)
        .post('/api/payments/paypal/create-order')
        .send(validOrderData);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Product validation processing took ${duration.toFixed(2)}ms`);
      
      expect(duration).toBeLessThan(2000);
      expect([200, 400, 500]).toContain(response.status);
    });
  });
});
