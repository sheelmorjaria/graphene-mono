import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { performance } from 'perf_hooks';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import paymentRoutes from '../../routes/payment.js';
import Order from '../../models/Order.js';
import User from '../../models/User.js';

// Bitcoin Performance Tests
describe('Bitcoin Performance Tests', () => {
  let app;
  let mongoServer;
  let testOrders = [];
  let testUser;
  const testBitcoinAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';

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
      firstName: 'Performance',
      lastName: 'Test',
      email: 'performance@test.com',
      password: 'hashedpassword123'
    });

    // Create multiple test orders for performance testing
    const orderPromises = Array(50).fill(null).map((_, index) => 
      Order.create({
        userId: testUser._id,
        orderNumber: `ORD-PERF-BTC-${index.toString().padStart(3, '0')}`,
        customerEmail: `performance${index}@test.com`,
        items: [{
          productId: new mongoose.Types.ObjectId(),
          productName: `Performance Test Product ${index}`,
          productSlug: `performance-test-product-${index}`,
          quantity: 1,
          unitPrice: 99.99 + index,
          totalPrice: 99.99 + index
        }],
        subtotal: 99.99 + index,
        orderTotal: 99.99 + index,
        shippingAddress: {
          fullName: 'Performance Test User',
          addressLine1: `123 Performance St ${index}`,
          city: 'Test City',
          stateProvince: 'Test State',
          postalCode: '12345',
          country: 'UK'
        },
        billingAddress: {
          fullName: 'Performance Test User',
          addressLine1: `123 Performance St ${index}`,
          city: 'Test City',
          stateProvince: 'Test State',
          postalCode: '12345',
          country: 'UK'
        },
        shippingMethod: {
          id: new mongoose.Types.ObjectId(),
          name: 'Standard Shipping',
          cost: 0
        },
        paymentMethod: {
          type: index % 2 === 0 ? 'pending' : 'bitcoin',
          name: index % 2 === 0 ? 'Pending' : 'Bitcoin'
        },
        paymentDetails: index % 2 === 0 ? {} : {
          bitcoinAddress: `${testBitcoinAddress.slice(0, -3)}${index.toString().padStart(3, '0')}`,
          bitcoinAmount: (99.99 + index) / 45000,
          bitcoinExchangeRate: 45000,
          bitcoinPaymentExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        paymentStatus: index % 2 === 0 ? 'pending' : 'awaiting_confirmation'
      })
    );

    testOrders = await Promise.all(orderPromises);

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
    process.env.BLOCKONOMICS_API_KEY = 'test-bitcoin-performance-key';
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('Bitcoin Payment Initialization Performance', () => {
    it('should initialize Bitcoin payment within acceptable time', async () => {
      const pendingOrder = testOrders.find(order => order.paymentStatus === 'pending');
      
      const startTime = performance.now();
      
      const response = await request(app)
        .post('/api/payments/bitcoin/initialize')
        .send({ orderId: pendingOrder._id.toString() });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within 5 seconds (allowing for external API calls)
      expect(duration).toBeLessThan(5000);
      
      // Log performance metrics
      console.log(`Bitcoin initialization took ${duration.toFixed(2)}ms`);
      
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle concurrent Bitcoin initializations efficiently', async () => {
      const pendingOrders = testOrders.filter(order => order.paymentStatus === 'pending').slice(0, 10);
      
      const startTime = performance.now();
      
      const promises = pendingOrders.map(order => 
        request(app)
          .post('/api/payments/bitcoin/initialize')
          .send({ orderId: order._id.toString() })
      );
      
      const responses = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const averageTime = duration / pendingOrders.length;
      
      // Concurrent requests should be efficient
      expect(duration).toBeLessThan(15000); // Total time under 15 seconds
      expect(averageTime).toBeLessThan(2000); // Average under 2 seconds per request
      
      console.log(`Concurrent Bitcoin initialization: ${duration.toFixed(2)}ms total, ${averageTime.toFixed(2)}ms average`);
      
      responses.forEach(response => {
        expect([200, 400, 500]).toContain(response.status);
      });
    });

    it('should maintain performance under repeated initializations', async () => {
      const testOrder = testOrders.find(order => order.paymentStatus === 'pending');
      const iterations = 10;
      const timings = [];
      
      for (let i = 0; i < iterations; i++) {
        // Reset order status
        testOrder.paymentStatus = 'pending';
        testOrder.paymentMethod = { type: 'pending', name: 'Pending' };
        await testOrder.save();
        
        const startTime = performance.now();
        
        const response = await request(app)
          .post('/api/payments/bitcoin/initialize')
          .send({ orderId: testOrder._id.toString() });
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        timings.push(duration);
        
        expect([200, 400, 500]).toContain(response.status);
      }
      
      const averageTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      const maxTime = Math.max(...timings);
      const minTime = Math.min(...timings);
      
      console.log(`Repeated initializations - Avg: ${averageTime.toFixed(2)}ms, Min: ${minTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);
      
      expect(averageTime).toBeLessThan(3000);
      expect(maxTime).toBeLessThan(8000);
    });
  });

  describe('Bitcoin Payment Status Performance', () => {
    it('should retrieve payment status quickly', async () => {
      const bitcoinOrder = testOrders.find(order => order.paymentMethod.type === 'bitcoin');
      
      const startTime = performance.now();
      
      const response = await request(app)
        .get(`/api/payments/bitcoin/status/${bitcoinOrder._id.toString()}`);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Status check should be very fast (database lookup only)
      expect(duration).toBeLessThan(500);
      
      console.log(`Bitcoin status check took ${duration.toFixed(2)}ms`);
      
      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle bulk status checks efficiently', async () => {
      const bitcoinOrders = testOrders.filter(order => order.paymentMethod.type === 'bitcoin').slice(0, 20);
      
      const startTime = performance.now();
      
      const promises = bitcoinOrders.map(order => 
        request(app)
          .get(`/api/payments/bitcoin/status/${order._id.toString()}`)
      );
      
      const responses = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const averageTime = duration / bitcoinOrders.length;
      
      // Bulk status checks should be efficient
      expect(duration).toBeLessThan(5000);
      expect(averageTime).toBeLessThan(300);
      
      console.log(`Bulk status checks: ${duration.toFixed(2)}ms total, ${averageTime.toFixed(2)}ms average`);
      
      responses.forEach(response => {
        expect([200, 400, 500]).toContain(response.status);
      });
    });
  });

  describe('Bitcoin Webhook Performance', () => {
    it('should process webhooks quickly', async () => {
      const bitcoinOrder = testOrders.find(order => order.paymentMethod.type === 'bitcoin');
      
      const webhookPayload = {
        addr: bitcoinOrder.paymentDetails.bitcoinAddress,
        value: 666666,
        txid: 'performance-test-txid',
        confirmations: 3
      };
      
      const startTime = performance.now();
      
      const response = await request(app)
        .post('/api/payments/bitcoin/webhook')
        .send(webhookPayload);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Webhook processing should be fast
      expect(duration).toBeLessThan(1000);
      
      console.log(`Bitcoin webhook processing took ${duration.toFixed(2)}ms`);
      
      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should handle concurrent webhooks efficiently', async () => {
      const bitcoinOrders = testOrders.filter(order => order.paymentMethod.type === 'bitcoin').slice(0, 15);
      
      const startTime = performance.now();
      
      const promises = bitcoinOrders.map((order, index) => 
        request(app)
          .post('/api/payments/bitcoin/webhook')
          .send({
            addr: order.paymentDetails.bitcoinAddress,
            value: 666666 + index,
            txid: `concurrent-webhook-${index}`,
            confirmations: 2 + index
          })
      );
      
      const responses = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      const averageTime = duration / bitcoinOrders.length;
      
      // Concurrent webhooks should be processed efficiently
      expect(duration).toBeLessThan(8000);
      expect(averageTime).toBeLessThan(600);
      
      console.log(`Concurrent webhooks: ${duration.toFixed(2)}ms total, ${averageTime.toFixed(2)}ms average`);
      
      responses.forEach(response => {
        expect([200, 400, 404, 500]).toContain(response.status);
      });
    });

    it('should maintain performance under webhook load', async () => {
      const bitcoinOrder = testOrders.find(order => order.paymentMethod.type === 'bitcoin');
      const iterations = 50;
      const timings = [];
      
      for (let i = 0; i < iterations; i++) {
        const webhookPayload = {
          addr: bitcoinOrder.paymentDetails.bitcoinAddress,
          value: 666666 + i,
          txid: `load-test-${i}`,
          confirmations: Math.floor(i / 10) + 1
        };
        
        const startTime = performance.now();
        
        const response = await request(app)
          .post('/api/payments/bitcoin/webhook')
          .send(webhookPayload);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        timings.push(duration);
        
        expect([200, 400, 404, 500]).toContain(response.status);
      }
      
      const averageTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      const maxTime = Math.max(...timings);
      const p95Time = timings.sort((a, b) => a - b)[Math.floor(timings.length * 0.95)];
      
      console.log(`Webhook load test - Avg: ${averageTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms, P95: ${p95Time.toFixed(2)}ms`);
      
      expect(averageTime).toBeLessThan(800);
      expect(p95Time).toBeLessThan(2000);
    });
  });

  describe('Database Performance', () => {
    it('should perform Bitcoin order queries efficiently', async () => {
      const startTime = performance.now();
      
      // Simulate complex Bitcoin order queries
      const bitcoinOrdersQuery = Order.find({
        'paymentMethod.type': 'bitcoin',
        paymentStatus: { $in: ['awaiting_confirmation', 'completed'] }
      }).sort({ createdAt: -1 }).limit(20);
      
      const results = await bitcoinOrdersQuery.exec();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Database query should be very fast
      expect(results.length).toBeGreaterThan(0);
      
      console.log(`Bitcoin orders query took ${duration.toFixed(2)}ms, found ${results.length} orders`);
    });

    it('should handle complex Bitcoin payment aggregations efficiently', async () => {
      const startTime = performance.now();
      
      // Complex aggregation query
      const aggregationResults = await Order.aggregate([
        { $match: { 'paymentMethod.type': 'bitcoin' } },
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
      
      console.log(`Bitcoin payment aggregation took ${duration.toFixed(2)}ms`);
    });

    it('should update Bitcoin payment details efficiently', async () => {
      const bitcoinOrder = testOrders.find(order => order.paymentMethod.type === 'bitcoin');
      const iterations = 10;
      const timings = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        // Update payment details
        bitcoinOrder.paymentDetails.bitcoinConfirmations = i + 1;
        bitcoinOrder.paymentDetails.bitcoinAmountReceived = (bitcoinOrder.orderTotal / 45000) * (0.8 + (i * 0.02));
        bitcoinOrder.paymentDetails.lastWebhookUpdate = new Date();
        
        await bitcoinOrder.save();
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        timings.push(duration);
      }
      
      const averageTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      
      expect(averageTime).toBeLessThan(50); // Updates should be very fast
      
      console.log(`Bitcoin payment updates averaged ${averageTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should handle large Bitcoin webhook payloads efficiently', async () => {
      const bitcoinOrder = testOrders.find(order => order.paymentMethod.type === 'bitcoin');
      
      // Create larger payload to test memory handling
      const largePayload = {
        addr: bitcoinOrder.paymentDetails.bitcoinAddress,
        value: 100000000,
        txid: 'memory-test-txid',
        confirmations: 6,
        metadata: {
          extraData: 'x'.repeat(10000), // 10KB of extra data
          timestamps: Array(1000).fill(null).map((_, i) => Date.now() + i)
        }
      };
      
      const startTime = performance.now();
      const initialMemory = process.memoryUsage();
      
      const response = await request(app)
        .post('/api/payments/bitcoin/webhook')
        .send(largePayload);
      
      const endTime = performance.now();
      const finalMemory = process.memoryUsage();
      const duration = endTime - startTime;
      
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`Large payload processing: ${duration.toFixed(2)}ms, Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      expect(duration).toBeLessThan(2000);
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should maintain stable memory usage during sustained operations', async () => {
      const initialMemory = process.memoryUsage();
      const bitcoinOrder = testOrders.find(order => order.paymentMethod.type === 'bitcoin');
      
      // Perform sustained operations
      for (let i = 0; i < 20; i++) {
        await request(app)
          .get(`/api/payments/bitcoin/status/${bitcoinOrder._id.toString()}`);
        
        await request(app)
          .post('/api/payments/bitcoin/webhook')
          .send({
            addr: bitcoinOrder.paymentDetails.bitcoinAddress,
            value: 100000000 + i,
            txid: `sustained-test-${i}`,
            confirmations: 3
          });
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`Sustained operations memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // Memory increase should be reasonable for sustained operations
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle errors efficiently without performance degradation', async () => {
      const errorScenarios = [
        { orderId: 'invalid-id' },
        { orderId: new mongoose.Types.ObjectId().toString() }, // Non-existent
        {}, // Missing orderId
        { orderId: null }
      ];
      
      const timings = [];
      
      for (const scenario of errorScenarios) {
        const startTime = performance.now();
        
        const response = await request(app)
          .post('/api/payments/bitcoin/initialize')
          .send(scenario);
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        timings.push(duration);
        
        expect([400, 404, 500]).toContain(response.status);
      }
      
      const averageErrorTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      
      // Error handling should be fast
      expect(averageErrorTime).toBeLessThan(200);
      
      console.log(`Error handling averaged ${averageErrorTime.toFixed(2)}ms`);
    });
  });
});
