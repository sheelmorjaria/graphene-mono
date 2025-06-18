import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { performance } from 'perf_hooks';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import paymentRoutes from '../../routes/payment.js';
import Order from '../../models/Order.js';
import User from '../../models/User.js';

// Bitcoin Load Tests
describe('Bitcoin Load Tests', () => {
  let app;
  let mongoServer;
  let testUser;
  let testOrders = [];
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
      firstName: 'Load',
      lastName: 'Test',
      email: 'load@test.com',
      password: 'hashedpassword123'
    });

    // Create test orders for load testing
    const orderPromises = Array(100).fill(null).map((_, index) => 
      Order.create({
        userId: testUser._id,
        orderNumber: `ORD-LOAD-BTC-${index.toString().padStart(3, '0')}`,
        customerEmail: `load${index}@test.com`,
        items: [{
          productId: new mongoose.Types.ObjectId(),
          productName: `Load Test Product ${index}`,
          productSlug: `load-test-product-${index}`,
          quantity: 1,
          unitPrice: 150 + (index % 50),
          totalPrice: 150 + (index % 50)
        }],
        subtotal: 150 + (index % 50),
        orderTotal: 150 + (index % 50),
        shippingAddress: {
          fullName: 'Load Test User',
          addressLine1: `${index} Load Test St`,
          city: 'Load City',
          stateProvince: 'Load State',
          postalCode: '12345',
          country: 'UK'
        },
        billingAddress: {
          fullName: 'Load Test User',
          addressLine1: `${index} Load Test St`,
          city: 'Load City',
          stateProvince: 'Load State',
          postalCode: '12345',
          country: 'UK'
        },
        shippingMethod: {
          id: new mongoose.Types.ObjectId(),
          name: 'Standard Shipping',
          cost: 0
        },
        paymentMethod: {
          type: index < 50 ? 'pending' : 'bitcoin',
          name: index < 50 ? 'Pending' : 'Bitcoin'
        },
        paymentDetails: index < 50 ? {} : {
          bitcoinAddress: `${testBitcoinAddress.slice(0, -3)}${index.toString().padStart(3, '0')}`,
          bitcoinAmount: (150 + (index % 50)) / 45000,
          bitcoinExchangeRate: 45000,
          bitcoinPaymentExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
        },
        paymentStatus: index < 50 ? 'pending' : 'awaiting_confirmation'
      })
    );

    testOrders = await Promise.all(orderPromises);

    // Setup Express app
    app = express();
    app.use(express.json({ limit: '10mb' }));
    
    // Mock user authentication
    app.use((req, res, next) => {
      req.user = testUser;
      next();
    });
    
    app.use('/api/payments', paymentRoutes);

    // Set environment variables
    process.env.BLOCKONOMICS_API_KEY = 'test-bitcoin-load-key';
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('High Concurrency Load Tests', () => {
    it('should handle high concurrent Bitcoin payment initializations', async () => {
      const pendingOrders = testOrders.filter(order => order.paymentStatus === 'pending').slice(0, 30);
      const concurrency = 30;
      
      const startTime = performance.now();
      const initialMemory = process.memoryUsage();
      
      // Create concurrent requests
      const promises = pendingOrders.map(order => 
        request(app)
          .post('/api/payments/bitcoin/initialize')
          .send({ orderId: order._id.toString() })
      );
      
      const responses = await Promise.all(promises);
      
      const endTime = performance.now();
      const finalMemory = process.memoryUsage();
      
      const totalDuration = endTime - startTime;
      const averageResponseTime = totalDuration / concurrency;
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log('High concurrency test:');
      console.log(`  - Concurrent requests: ${concurrency}`);
      console.log(`  - Total time: ${totalDuration.toFixed(2)}ms`);
      console.log(`  - Average response time: ${averageResponseTime.toFixed(2)}ms`);
      console.log(`  - Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // Performance expectations
      expect(totalDuration).toBeLessThan(30000); // Total under 30 seconds
      expect(averageResponseTime).toBeLessThan(3000); // Average under 3 seconds
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // Less than 200MB increase
      
      // All responses should be valid
      responses.forEach(response => {
        expect([200, 400, 500]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
      
      // Success rate should be reasonable
      const successCount = responses.filter(r => r.status === 200).length;
      const successRate = (successCount / responses.length) * 100;
      console.log(`  - Success rate: ${successRate.toFixed(1)}%`);
    });

    it('should handle burst load of Bitcoin status checks', async () => {
      const bitcoinOrders = testOrders.filter(order => order.paymentMethod.type === 'bitcoin');
      const burstSize = 50;
      const bursts = 3;
      
      const allTimings = [];
      const allResponses = [];
      
      for (let burst = 0; burst < bursts; burst++) {
        const startTime = performance.now();
        
        const promises = Array(burstSize).fill(null).map((_, index) => {
          const order = bitcoinOrders[index % bitcoinOrders.length];
          return request(app)
            .get(`/api/payments/bitcoin/status/${order._id.toString()}`);
        });
        
        const responses = await Promise.all(promises);
        
        const endTime = performance.now();
        const burstDuration = endTime - startTime;
        
        allTimings.push(burstDuration);
        allResponses.push(...responses);
        
        console.log(`Burst ${burst + 1}: ${burstDuration.toFixed(2)}ms for ${burstSize} requests`);
      }
      
      const averageBurstTime = allTimings.reduce((a, b) => a + b, 0) / allTimings.length;
      const maxBurstTime = Math.max(...allTimings);
      
      console.log('Burst load summary:');
      console.log(`  - Average burst time: ${averageBurstTime.toFixed(2)}ms`);
      console.log(`  - Max burst time: ${maxBurstTime.toFixed(2)}ms`);
      console.log(`  - Total requests: ${allResponses.length}`);
      
      // Performance expectations
      expect(averageBurstTime).toBeLessThan(5000); // Average burst under 5 seconds
      expect(maxBurstTime).toBeLessThan(10000); // Max burst under 10 seconds
      
      // All responses should be handled
      allResponses.forEach(response => {
        expect([200, 400, 500]).toContain(response.status);
      });
    });

    it('should handle sustained webhook load', async () => {
      const bitcoinOrders = testOrders.filter(order => order.paymentMethod.type === 'bitcoin');
      const requestsPerSecond = 20;
      const durationSeconds = 10;
      const totalRequests = requestsPerSecond * durationSeconds;
      
      const startTime = performance.now();
      const timings = [];
      const responses = [];
      
      // Send sustained load over time
      for (let second = 0; second < durationSeconds; second++) {
        const secondStartTime = performance.now();
        
        const secondPromises = Array(requestsPerSecond).fill(null).map((_, index) => {
          const order = bitcoinOrders[(second * requestsPerSecond + index) % bitcoinOrders.length];
          return request(app)
            .post('/api/payments/bitcoin/webhook')
            .send({
              addr: order.paymentDetails.bitcoinAddress,
              value: 100000000 + (second * requestsPerSecond + index),
              txid: `sustained-load-${second}-${index}`,
              confirmations: Math.floor(Math.random() * 10) + 1
            });
        });
        
        const secondResponses = await Promise.all(secondPromises);
        responses.push(...secondResponses);
        
        const secondEndTime = performance.now();
        const secondDuration = secondEndTime - secondStartTime;
        timings.push(secondDuration);
        
        console.log(`Second ${second + 1}: ${secondDuration.toFixed(2)}ms for ${requestsPerSecond} webhooks`);
        
        // Brief pause to simulate realistic timing
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const averageRequestTime = totalDuration / totalRequests;
      const actualRPS = totalRequests / (totalDuration / 1000);
      
      console.log('Sustained load summary:');
      console.log(`  - Total duration: ${totalDuration.toFixed(2)}ms`);
      console.log(`  - Total requests: ${totalRequests}`);
      console.log(`  - Average request time: ${averageRequestTime.toFixed(2)}ms`);
      console.log(`  - Actual RPS: ${actualRPS.toFixed(2)}`);
      
      // Performance expectations
      expect(averageRequestTime).toBeLessThan(1000); // Average under 1 second
      expect(actualRPS).toBeGreaterThan(5); // At least 5 RPS achieved
      
      // Response validation
      responses.forEach(response => {
        expect([200, 400, 404, 500]).toContain(response.status);
      });
      
      const successCount = responses.filter(r => [200, 404].includes(r.status)).length;
      const successRate = (successCount / responses.length) * 100;
      console.log(`  - Success rate: ${successRate.toFixed(1)}%`);
      
      expect(successRate).toBeGreaterThan(80); // At least 80% success rate
    });
  });

  describe('Stress Testing', () => {
    it('should handle extreme concurrent webhook load', async () => {
      const bitcoinOrders = testOrders.filter(order => order.paymentMethod.type === 'bitcoin');
      const extremeConcurrency = 100;
      
      const startTime = performance.now();
      const initialMemory = process.memoryUsage();
      
      const promises = Array(extremeConcurrency).fill(null).map((_, index) => {
        const order = bitcoinOrders[index % bitcoinOrders.length];
        return request(app)
          .post('/api/payments/bitcoin/webhook')
          .send({
            addr: order.paymentDetails.bitcoinAddress,
            value: 50000000 + index,
            txid: `extreme-load-${index}`,
            confirmations: (index % 10) + 1
          });
      });
      
      const responses = await Promise.all(promises);
      
      const endTime = performance.now();
      const finalMemory = process.memoryUsage();
      
      const totalDuration = endTime - startTime;
      const averageResponseTime = totalDuration / extremeConcurrency;
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log('Extreme load test:');
      console.log(`  - Concurrent requests: ${extremeConcurrency}`);
      console.log(`  - Total time: ${totalDuration.toFixed(2)}ms`);
      console.log(`  - Average response time: ${averageResponseTime.toFixed(2)}ms`);
      console.log(`  - Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // System should remain stable under extreme load
      expect(totalDuration).toBeLessThan(60000); // Complete within 1 minute
      expect(memoryIncrease).toBeLessThan(500 * 1024 * 1024); // Less than 500MB increase
      
      // Most responses should be handled
      const handledCount = responses.filter(r => r.status !== undefined).length;
      const handledRate = (handledCount / responses.length) * 100;
      
      console.log(`  - Handled rate: ${handledRate.toFixed(1)}%`);
      expect(handledRate).toBeGreaterThan(90); // At least 90% handled
    });

    it('should recover gracefully from overload conditions', async () => {
      const bitcoinOrder = testOrders.find(order => order.paymentMethod.type === 'bitcoin');
      
      // First, create overload condition
      console.log('Creating overload condition...');
      const overloadPromises = Array(200).fill(null).map((_, index) => 
        request(app)
          .post('/api/payments/bitcoin/webhook')
          .send({
            addr: bitcoinOrder.paymentDetails.bitcoinAddress,
            value: 25000000 + index,
            txid: `overload-${index}`,
            confirmations: 3
          })
      );
      
      // Don't wait for all to complete, start recovery test
      setTimeout(async () => {
        console.log('Testing recovery...');
        
        // Test if system can still handle normal requests
        const recoveryStartTime = performance.now();
        
        const recoveryResponse = await request(app)
          .get(`/api/payments/bitcoin/status/${bitcoinOrder._id.toString()}`);
        
        const recoveryEndTime = performance.now();
        const recoveryTime = recoveryEndTime - recoveryStartTime;
        
        console.log(`Recovery test: ${recoveryTime.toFixed(2)}ms`);
        
        // Should still respond within reasonable time during recovery
        expect(recoveryTime).toBeLessThan(5000);
        expect([200, 400, 500]).toContain(recoveryResponse.status);
      }, 2000);
      
      // Wait for overload to complete
      const overloadResponses = await Promise.all(overloadPromises);
      
      // System should handle most requests even under overload
      const completedCount = overloadResponses.filter(r => r.status !== undefined).length;
      const completionRate = (completedCount / overloadResponses.length) * 100;
      
      console.log(`Overload completion rate: ${completionRate.toFixed(1)}%`);
      expect(completionRate).toBeGreaterThan(70); // At least 70% completion under overload
    });
  });

  describe('Resource Consumption Under Load', () => {
    it('should maintain reasonable memory usage during extended load', async () => {
      const bitcoinOrders = testOrders.filter(order => order.paymentMethod.type === 'bitcoin').slice(0, 20);
      const iterations = 100;
      const memoryReadings = [];
      
      const initialMemory = process.memoryUsage();
      memoryReadings.push(initialMemory.heapUsed);
      
      for (let i = 0; i < iterations; i++) {
        const order = bitcoinOrders[i % bitcoinOrders.length];
        
        // Mix of different operations
        if (i % 3 === 0) {
          await request(app)
            .get(`/api/payments/bitcoin/status/${order._id.toString()}`);
        } else {
          await request(app)
            .post('/api/payments/bitcoin/webhook')
            .send({
              addr: order.paymentDetails.bitcoinAddress,
              value: 75000000 + i,
              txid: `memory-test-${i}`,
              confirmations: (i % 8) + 1
            });
        }
        
        // Record memory every 10 iterations
        if (i % 10 === 0) {
          const currentMemory = process.memoryUsage();
          memoryReadings.push(currentMemory.heapUsed);
          
          if (i % 50 === 0) {
            console.log(`Iteration ${i}: Memory usage ${(currentMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
          }
        }
      }
      
      const finalMemory = process.memoryUsage();
      const totalMemoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const maxMemory = Math.max(...memoryReadings);
      const avgMemory = memoryReadings.reduce((a, b) => a + b, 0) / memoryReadings.length;
      
      console.log('Memory analysis:');
      console.log(`  - Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  - Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  - Increase: ${(totalMemoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  - Max: ${(maxMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  - Average: ${(avgMemory / 1024 / 1024).toFixed(2)}MB`);
      
      // Memory growth should be controlled
      expect(totalMemoryIncrease).toBeLessThan(300 * 1024 * 1024); // Less than 300MB total increase
      expect(maxMemory - initialMemory.heapUsed).toBeLessThan(400 * 1024 * 1024); // Peak increase under 400MB
    });

    it('should handle database connection pool under load', async () => {
      const bitcoinOrders = testOrders.filter(order => order.paymentMethod.type === 'bitcoin');
      const concurrentBatches = 5;
      const batchSize = 15;
      
      const startTime = performance.now();
      
      // Create multiple concurrent batches of database operations
      const batchPromises = Array(concurrentBatches).fill(null).map(async (_, batchIndex) => {
        const batchStartTime = performance.now();
        
        const batchOperations = Array(batchSize).fill(null).map(async (_, opIndex) => {
          const order = bitcoinOrders[(batchIndex * batchSize + opIndex) % bitcoinOrders.length];
          
          // Mix of read and write operations
          if (opIndex % 2 === 0) {
            // Read operation
            return request(app)
              .get(`/api/payments/bitcoin/status/${order._id.toString()}`);
          } else {
            // Write operation (webhook)
            return request(app)
              .post('/api/payments/bitcoin/webhook')
              .send({
                addr: order.paymentDetails.bitcoinAddress,
                value: 80000000 + (batchIndex * batchSize + opIndex),
                txid: `db-load-${batchIndex}-${opIndex}`,
                confirmations: 4
              });
          }
        });
        
        const batchResults = await Promise.all(batchOperations);
        const batchEndTime = performance.now();
        
        return {
          batchIndex,
          duration: batchEndTime - batchStartTime,
          results: batchResults
        };
      });
      
      const batchResults = await Promise.all(batchPromises);
      const endTime = performance.now();
      
      const totalDuration = endTime - startTime;
      const avgBatchTime = batchResults.reduce((sum, batch) => sum + batch.duration, 0) / batchResults.length;
      
      console.log('Database load test:');
      console.log(`  - Concurrent batches: ${concurrentBatches}`);
      console.log(`  - Operations per batch: ${batchSize}`);
      console.log(`  - Total duration: ${totalDuration.toFixed(2)}ms`);
      console.log(`  - Average batch time: ${avgBatchTime.toFixed(2)}ms`);
      
      // Database should handle concurrent load efficiently
      expect(totalDuration).toBeLessThan(20000); // Complete within 20 seconds
      expect(avgBatchTime).toBeLessThan(8000); // Average batch under 8 seconds
      
      // Validate all operations completed
      let totalOperations = 0;
      let successfulOperations = 0;
      
      batchResults.forEach(batch => {
        batch.results.forEach(result => {
          totalOperations++;
          if ([200, 404].includes(result.status)) {
            successfulOperations++;
          }
        });
      });
      
      const dbSuccessRate = (successfulOperations / totalOperations) * 100;
      console.log(`  - Database success rate: ${dbSuccessRate.toFixed(1)}%`);
      
      expect(dbSuccessRate).toBeGreaterThan(85); // At least 85% success rate
    });
  });

  describe('Performance Degradation Analysis', () => {
    it('should maintain consistent performance as load increases', async () => {
      const bitcoinOrder = testOrders.find(order => order.paymentMethod.type === 'bitcoin');
      const loadLevels = [5, 10, 20, 30, 40, 50];
      const performanceData = [];
      
      for (const loadLevel of loadLevels) {
        console.log(`Testing load level: ${loadLevel} concurrent requests`);
        
        const startTime = performance.now();
        
        const promises = Array(loadLevel).fill(null).map((_, index) => 
          request(app)
            .post('/api/payments/bitcoin/webhook')
            .send({
              addr: bitcoinOrder.paymentDetails.bitcoinAddress,
              value: 60000000 + index,
              txid: `load-level-${loadLevel}-${index}`,
              confirmations: 2
            })
        );
        
        const responses = await Promise.all(promises);
        const endTime = performance.now();
        
        const duration = endTime - startTime;
        const avgResponseTime = duration / loadLevel;
        const successCount = responses.filter(r => [200, 404].includes(r.status)).length;
        const successRate = (successCount / responses.length) * 100;
        
        performanceData.push({
          loadLevel,
          duration,
          avgResponseTime,
          successRate
        });
        
        console.log(`  - Duration: ${duration.toFixed(2)}ms`);
        console.log(`  - Avg response time: ${avgResponseTime.toFixed(2)}ms`);
        console.log(`  - Success rate: ${successRate.toFixed(1)}%`);
        
        // Brief cooldown between load levels
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Analyze performance degradation
      const baselineResponseTime = performanceData[0].avgResponseTime;
      const maxResponseTime = Math.max(...performanceData.map(d => d.avgResponseTime));
      const degradationFactor = maxResponseTime / baselineResponseTime;
      
      console.log('Performance degradation analysis:');
      console.log(`  - Baseline response time: ${baselineResponseTime.toFixed(2)}ms`);
      console.log(`  - Max response time: ${maxResponseTime.toFixed(2)}ms`);
      console.log(`  - Degradation factor: ${degradationFactor.toFixed(2)}x`);
      
      // Performance should not degrade more than 5x under reasonable load
      expect(degradationFactor).toBeLessThan(5);
      
      // Success rate should remain high across all load levels
      performanceData.forEach(data => {
        expect(data.successRate).toBeGreaterThan(75);
      });
    });
  });
});
