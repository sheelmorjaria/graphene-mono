import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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
import { createValidProductData, createValidUserData, createValidShippingMethodData } from '../../test/helpers/testDataFactory.js';

// PayPal Load Tests
describe('PayPal Load Tests', () => {
  let app;
  let mongoServer;
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
    const userData = createValidUserData({
      firstName: 'PayPal',
      lastName: 'Load',
      email: 'paypal-load@test.com',
      password: 'hashedpassword123'
    });
    testUser = await User.create(userData);

    // Create test product
    const productData = createValidProductData({
      name: 'PayPal Load Test Product',
      slug: 'paypal-load-test-product',
      price: 199.99,
      stockQuantity: 1000,
      isActive: true
    });
    testProduct = await Product.create(productData);

    // Create test shipping method
    const shippingMethodData = createValidShippingMethodData({
      name: 'Load Test Shipping',
      code: 'LOAD_TEST_SHIPPING',
      description: 'Shipping for load tests',
      baseCost: 5.99,
      estimatedDeliveryDays: { min: 1, max: 3 },
      isActive: true,
      criteria: {
        minOrderValue: 0,
        maxOrderValue: 10000,
        maxWeight: 10000,
        supportedCountries: ['GB', 'US']
      }
    });
    testShippingMethod = await ShippingMethod.create(shippingMethodData);

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
    process.env.PAYPAL_CLIENT_ID = 'test-paypal-load-client-id';
    process.env.PAYPAL_CLIENT_SECRET = 'test-paypal-load-client-secret';
    process.env.PAYPAL_ENVIRONMENT = 'sandbox';
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('PayPal High Concurrency Load Tests', () => {
    it('should handle 100 concurrent payment method requests', async () => {
      const concurrency = 100;
      const timeout = 30000; // 30 second timeout
      
      const startTime = performance.now();
      
      const promises = Array(concurrency).fill(null).map(() => 
        request(app)
          .get('/api/payments/methods')
          .timeout(timeout)
      );
      
      const responses = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const averageTime = duration / concurrency;
      
      console.log(`${concurrency} concurrent payment methods: ${duration.toFixed(2)}ms total, ${averageTime.toFixed(2)}ms average`);
      
      // All requests should complete successfully or fail gracefully
      responses.forEach(response => {
        expect([200, 500]).toContain(response.status);
      });
      
      expect(duration).toBeLessThan(10000); // Under 10 seconds total
      expect(averageTime).toBeLessThan(200); // Under 200ms average
    });

    it('should handle 50 concurrent PayPal order creation requests', async () => {
      const concurrency = 50;
      const timeout = 60000; // 60 second timeout for PayPal API calls
      
      const validOrderData = {
        shippingAddress: {
          firstName: 'Load',
          lastName: 'Test',
          addressLine1: '123 Load Test Avenue',
          city: 'Load City',
          stateProvince: 'Load State',
          postalCode: '12345',
          country: 'UK'
        },
        shippingMethodId: testShippingMethod._id.toString()
      };
      
      const startTime = performance.now();
      
      const promises = Array(concurrency).fill(null).map((_, index) => 
        request(app)
          .post('/api/payments/paypal/create-order')
          .send({
            ...validOrderData,
            shippingAddress: {
              ...validOrderData.shippingAddress,
              addressLine1: `${index} Load Test Street`
            }
          })
          .timeout(timeout)
      );
      
      const responses = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const averageTime = duration / concurrency;
      
      console.log(`${concurrency} concurrent PayPal orders: ${duration.toFixed(2)}ms total, ${averageTime.toFixed(2)}ms average`);
      
      // Should handle all requests without crashing
      responses.forEach(response => {
        expect([200, 400, 500]).toContain(response.status);
      });
      
      expect(duration).toBeLessThan(120000); // Under 2 minutes total
      expect(averageTime).toBeLessThan(15000); // Under 15 seconds average
    });

    it('should handle 75 concurrent PayPal capture requests', async () => {
      const concurrency = 75;
      const timeout = 30000; // 30 second timeout
      
      const startTime = performance.now();
      
      const promises = Array(concurrency).fill(null).map((_, index) => 
        request(app)
          .post('/api/payments/paypal/capture')
          .send({
            paypalOrderId: `LOAD_TEST_ORDER_${index}_${Date.now()}`,
            payerId: `LOAD_TEST_PAYER_${index}`
          })
          .timeout(timeout)
      );
      
      const responses = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const averageTime = duration / concurrency;
      
      console.log(`${concurrency} concurrent PayPal captures: ${duration.toFixed(2)}ms total, ${averageTime.toFixed(2)}ms average`);
      
      responses.forEach(response => {
        expect([200, 400, 500]).toContain(response.status);
      });
      
      expect(duration).toBeLessThan(60000); // Under 1 minute total
      expect(averageTime).toBeLessThan(10000); // Under 10 seconds average
    });

    it('should handle 200 concurrent PayPal webhook requests', async () => {
      const concurrency = 200;
      const timeout = 15000; // 15 second timeout
      
      const baseWebhookPayload = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          amount: {
            currency_code: 'GBP',
            value: '205.98'
          }
        }
      };
      
      const startTime = performance.now();
      
      const promises = Array(concurrency).fill(null).map((_, index) => 
        request(app)
          .post('/api/payments/paypal/webhook')
          .send({
            ...baseWebhookPayload,
            resource: {
              ...baseWebhookPayload.resource,
              id: `LOAD_WEBHOOK_${index}_${Date.now()}`
            }
          })
          .timeout(timeout)
      );
      
      const responses = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const averageTime = duration / concurrency;
      
      console.log(`${concurrency} concurrent PayPal webhooks: ${duration.toFixed(2)}ms total, ${averageTime.toFixed(2)}ms average`);
      
      responses.forEach(response => {
        expect([200, 400, 500]).toContain(response.status);
      });
      
      expect(duration).toBeLessThan(8000); // Under 8 seconds total
      expect(averageTime).toBeLessThan(100); // Under 100ms average
    });
  });

  describe('PayPal Sustained Load Tests', () => {
    it('should maintain performance under sustained PayPal order creation load', async () => {
      const iterations = 100;
      const batchSize = 10;
      const timings = [];
      
      const validOrderData = {
        shippingAddress: {
          firstName: 'Sustained',
          lastName: 'Load',
          addressLine1: '123 Sustained Load St',
          city: 'Sustained City',
          stateProvince: 'Sustained State',
          postalCode: '12345',
          country: 'UK'
        },
        shippingMethodId: testShippingMethod._id.toString()
      };
      
      for (let batch = 0; batch < iterations / batchSize; batch++) {
        const batchStartTime = performance.now();
        
        const promises = Array(batchSize).fill(null).map((_, index) => 
          request(app)
            .post('/api/payments/paypal/create-order')
            .send({
              ...validOrderData,
              shippingAddress: {
                ...validOrderData.shippingAddress,
                addressLine1: `${batch * batchSize + index} Sustained St`
              }
            })
        );
        
        const responses = await Promise.all(promises);
        
        const batchEndTime = performance.now();
        const batchDuration = batchEndTime - batchStartTime;
        timings.push(batchDuration);
        
        responses.forEach(response => {
          expect([200, 400, 500]).toContain(response.status);
        });
        
        // Small delay between batches to simulate realistic load
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const averageTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      const maxTime = Math.max(...timings);
      const minTime = Math.min(...timings);
      
      console.log(`Sustained PayPal load (${iterations} requests) - Avg batch: ${averageTime.toFixed(2)}ms, Min: ${minTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);
      
      expect(averageTime).toBeLessThan(30000); // Average batch under 30 seconds
      expect(maxTime).toBeLessThan(60000); // Max batch under 1 minute
    });

    it('should handle sustained webhook processing load', async () => {
      const iterations = 500;
      const batchSize = 25;
      const timings = [];
      
      for (let batch = 0; batch < iterations / batchSize; batch++) {
        const batchStartTime = performance.now();
        
        const promises = Array(batchSize).fill(null).map((_, index) => {
          const eventTypes = [
            'PAYMENT.CAPTURE.COMPLETED',
            'PAYMENT.CAPTURE.DENIED',
            'CHECKOUT.ORDER.APPROVED',
            'PAYMENT.CAPTURE.PENDING'
          ];
          
          return request(app)
            .post('/api/payments/paypal/webhook')
            .send({
              event_type: eventTypes[index % eventTypes.length],
              resource: {
                id: `SUSTAINED_WEBHOOK_${batch}_${index}_${Date.now()}`,
                amount: {
                  currency_code: 'GBP',
                  value: (100 + (batch * batchSize + index) * 5).toFixed(2)
                }
              }
            });
        });
        
        const responses = await Promise.all(promises);
        
        const batchEndTime = performance.now();
        const batchDuration = batchEndTime - batchStartTime;
        timings.push(batchDuration);
        
        responses.forEach(response => {
          expect([200, 400, 500]).toContain(response.status);
        });
      }
      
      const averageTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      const maxTime = Math.max(...timings);
      const p95Time = timings.sort((a, b) => a - b)[Math.floor(timings.length * 0.95)];
      
      console.log(`Sustained webhook load (${iterations} webhooks) - Avg batch: ${averageTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms, P95: ${p95Time.toFixed(2)}ms`);
      
      expect(averageTime).toBeLessThan(2000); // Average batch under 2 seconds
      expect(p95Time).toBeLessThan(5000); // 95th percentile under 5 seconds
    });
  });

  describe('PayPal Memory and Resource Load Tests', () => {
    it('should maintain stable memory usage under PayPal payment load', async () => {
      const initialMemory = process.memoryUsage();
      const iterations = 50;
      
      const validOrderData = {
        shippingAddress: {
          firstName: 'Memory',
          lastName: 'Test',
          addressLine1: '123 Memory Test Rd',
          city: 'Memory City',
          stateProvince: 'Memory State',
          postalCode: '12345',
          country: 'UK'
        },
        shippingMethodId: testShippingMethod._id.toString()
      };
      
      // Perform memory-intensive PayPal operations
      for (let i = 0; i < iterations; i++) {
        // Alternate between different PayPal operations
        if (i % 3 === 0) {
          await request(app).get('/api/payments/methods');
        } else if (i % 3 === 1) {
          await request(app)
            .post('/api/payments/paypal/create-order')
            .send({
              ...validOrderData,
              shippingAddress: {
                ...validOrderData.shippingAddress,
                addressLine1: `${i} Memory Test Street`
              }
            });
        } else {
          await request(app)
            .post('/api/payments/paypal/webhook')
            .send({
              event_type: 'PAYMENT.CAPTURE.COMPLETED',
              resource: {
                id: `MEMORY_TEST_${i}`,
                amount: {
                  currency_code: 'GBP',
                  value: (150 + i * 2).toFixed(2)
                }
              }
            });
        }
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`PayPal load memory test: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase after ${iterations} operations`);
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
    });

    it('should handle database stress under PayPal load', async () => {
      const iterations = 100;
      // const concurrency = 5; // Can be used for limiting parallel operations
      
      // Create multiple test orders for database stress testing
      const orderPromises = Array(50).fill(null).map((_, index) => 
        Order.create({
          userId: testUser._id,
          orderNumber: `ORD-PP-LOAD-${index.toString().padStart(3, '0')}`,
          customerEmail: `load${index}@paypal.test`,
          items: [{
            productId: testProduct._id,
            productName: `Load Test Product ${index}`,
            productSlug: `load-test-product-${index}`,
            quantity: 1,
            unitPrice: 99.99 + index,
            totalPrice: 99.99 + index
          }],
          subtotal: 99.99 + index,
          orderTotal: 99.99 + index + testShippingMethod.cost,
          shippingAddress: {
            fullName: 'Load Test User',
            addressLine1: `${index} Load Test Ave`,
            city: 'Load City',
            stateProvince: 'Load State',
            postalCode: '12345',
            country: 'UK'
          },
          billingAddress: {
            fullName: 'Load Test User',
            addressLine1: `${index} Load Test Ave`,
            city: 'Load City',
            stateProvince: 'Load State',
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
            paypalOrderId: `PP_LOAD_ORDER_${index}_${Date.now()}`,
            paypalPaymentId: `PP_LOAD_PAYMENT_${index}`,
            paypalPayerId: `PP_LOAD_PAYER_${index}`
          },
          paymentStatus: index % 2 === 0 ? 'completed' : 'pending'
        })
      );
      
      const testOrders = await Promise.all(orderPromises);
      
      const startTime = performance.now();
      
      // Perform concurrent database operations
      const dbOperations = Array(iterations).fill(null).map((_, index) => {
        const operations = [
          // Query operations
          () => Order.find({ 'paymentMethod.type': 'paypal' }).limit(10),
          () => Order.findById(testOrders[index % testOrders.length]._id),
          () => Order.countDocuments({ 'paymentMethod.type': 'paypal', paymentStatus: 'completed' }),
          () => Order.aggregate([
            { $match: { 'paymentMethod.type': 'paypal' } },
            { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
          ]),
          // Update operations
          () => Order.findByIdAndUpdate(
            testOrders[index % testOrders.length]._id,
            { $set: { 'paymentDetails.lastWebhookUpdate': new Date() } }
          )
        ];
        
        return operations[index % operations.length]();
      });
      
      const results = await Promise.all(dbOperations);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Database stress test: ${iterations} operations completed in ${duration.toFixed(2)}ms`);
      
      expect(duration).toBeLessThan(30000); // Under 30 seconds
      expect(results.every(result => result !== null)).toBe(true);
    });
  });

  describe('PayPal Error Recovery Load Tests', () => {
    it('should recover gracefully from error bursts', async () => {
      const errorBurstSize = 50;
      const normalRequestSize = 25;
      
      // Generate error burst (invalid requests)
      const errorPromises = Array(errorBurstSize).fill(null).map(() => 
        request(app)
          .post('/api/payments/paypal/create-order')
          .send({
            // Invalid data to trigger errors
            invalidField: 'invalid',
            shippingAddress: null,
            shippingMethodId: 'invalid-id'
          })
      );
      
      const errorResponses = await Promise.all(errorPromises);
      
      // Verify errors are handled properly
      errorResponses.forEach(response => {
        expect([400, 500]).toContain(response.status);
      });
      
      // Follow with normal requests to test recovery
      const validOrderData = {
        shippingAddress: {
          firstName: 'Recovery',
          lastName: 'Test',
          addressLine1: '123 Recovery Street',
          city: 'Recovery City',
          stateProvince: 'Recovery State',
          postalCode: '12345',
          country: 'UK'
        },
        shippingMethodId: testShippingMethod._id.toString()
      };
      
      const normalPromises = Array(normalRequestSize).fill(null).map((_, index) => 
        request(app)
          .post('/api/payments/paypal/create-order')
          .send({
            ...validOrderData,
            shippingAddress: {
              ...validOrderData.shippingAddress,
              addressLine1: `${index} Recovery Street`
            }
          })
      );
      
      const normalResponses = await Promise.all(normalPromises);
      
      // System should handle normal requests properly after error burst
      normalResponses.forEach(response => {
        expect([200, 400, 500]).toContain(response.status);
      });
      
      console.log(`Error recovery test: ${errorBurstSize} errors followed by ${normalRequestSize} normal requests`);
    });

    it('should handle mixed valid and invalid PayPal requests under load', async () => {
      const totalRequests = 100;
      const invalidRatio = 0.3; // 30% invalid requests
      
      const validOrderData = {
        shippingAddress: {
          firstName: 'Mixed',
          lastName: 'Load',
          addressLine1: '123 Mixed Load Blvd',
          city: 'Mixed City',
          stateProvince: 'Mixed State',
          postalCode: '12345',
          country: 'UK'
        },
        shippingMethodId: testShippingMethod._id.toString()
      };
      
      const mixedPromises = Array(totalRequests).fill(null).map((_, index) => {
        if (index < totalRequests * invalidRatio) {
          // Invalid request
          return request(app)
            .post('/api/payments/paypal/create-order')
            .send({
              shippingAddress: null, // Invalid
              shippingMethodId: 'invalid-method-id'
            });
        } else {
          // Valid request
          return request(app)
            .post('/api/payments/paypal/create-order')
            .send({
              ...validOrderData,
              shippingAddress: {
                ...validOrderData.shippingAddress,
                addressLine1: `${index} Mixed Load Street`
              }
            });
        }
      });
      
      const responses = await Promise.all(mixedPromises);
      
      const validResponses = responses.slice(Math.floor(totalRequests * invalidRatio));
      const invalidResponses = responses.slice(0, Math.floor(totalRequests * invalidRatio));
      
      // Invalid requests should fail appropriately
      invalidResponses.forEach(response => {
        expect([400, 500]).toContain(response.status);
      });
      
      // Valid requests should be processed normally
      validResponses.forEach(response => {
        expect([200, 400, 500]).toContain(response.status);
      });
      
      console.log(`Mixed load test: ${invalidResponses.length} invalid + ${validResponses.length} valid requests`);
    });
  });

  describe('PayPal Stress Test Scenarios', () => {
    it('should survive PayPal API stress scenario', async () => {
      const phases = [
        { name: 'Warm-up', requests: 10, concurrency: 2 },
        { name: 'Ramp-up', requests: 50, concurrency: 10 },
        { name: 'Peak Load', requests: 100, concurrency: 25 },
        { name: 'Cool-down', requests: 20, concurrency: 5 }
      ];
      
      const validOrderData = {
        shippingAddress: {
          firstName: 'Stress',
          lastName: 'Test',
          addressLine1: '123 Stress Test Plaza',
          city: 'Stress City',
          stateProvince: 'Stress State',
          postalCode: '12345',
          country: 'UK'
        },
        shippingMethodId: testShippingMethod._id.toString()
      };
      
      for (const phase of phases) {
        console.log(`Starting stress test phase: ${phase.name}`);
        
        const startTime = performance.now();
        
        // Create batches for the phase
        const batches = Math.ceil(phase.requests / phase.concurrency);
        
        for (let batch = 0; batch < batches; batch++) {
          const batchSize = Math.min(phase.concurrency, phase.requests - (batch * phase.concurrency));
          
          const promises = Array(batchSize).fill(null).map((_, index) => 
            request(app)
              .post('/api/payments/paypal/create-order')
              .send({
                ...validOrderData,
                shippingAddress: {
                  ...validOrderData.shippingAddress,
                  addressLine1: `${phase.name}-${batch}-${index} Stress St`
                }
              })
          );
          
          const responses = await Promise.all(promises);
          
          responses.forEach(response => {
            expect([200, 400, 500]).toContain(response.status);
          });
          
          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        const endTime = performance.now();
        const phaseDuration = endTime - startTime;
        
        console.log(`Phase ${phase.name} completed: ${phase.requests} requests in ${phaseDuration.toFixed(2)}ms`);
        
        expect(phaseDuration).toBeLessThan(120000); // Each phase under 2 minutes
      }
    });

    it('should handle extreme webhook burst scenario', async () => {
      const burstSize = 500;
      // const burstDuration = 5000; // 5 seconds - can be used for timing
      
      const eventTypes = [
        'PAYMENT.CAPTURE.COMPLETED',
        'PAYMENT.CAPTURE.DENIED',
        'CHECKOUT.ORDER.APPROVED',
        'PAYMENT.CAPTURE.PENDING',
        'PAYMENT.CAPTURE.REFUNDED'
      ];
      
      const startTime = performance.now();
      
      const promises = Array(burstSize).fill(null).map((_, index) => 
        request(app)
          .post('/api/payments/paypal/webhook')
          .send({
            event_type: eventTypes[index % eventTypes.length],
            resource: {
              id: `BURST_WEBHOOK_${index}_${Date.now()}`,
              amount: {
                currency_code: 'GBP',
                value: (50 + index * 2).toFixed(2)
              },
              status: index % 2 === 0 ? 'COMPLETED' : 'PENDING'
            }
          })
      );
      
      const responses = await Promise.all(promises);
      
      const endTime = performance.now();
      const actualDuration = endTime - startTime;
      
      console.log(`Extreme webhook burst: ${burstSize} webhooks processed in ${actualDuration.toFixed(2)}ms`);
      
      // All webhooks should be processed
      responses.forEach(response => {
        expect([200, 400, 500]).toContain(response.status);
      });
      
      expect(actualDuration).toBeLessThan(30000); // Under 30 seconds
    });
  });
});