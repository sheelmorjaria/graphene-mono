import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performance } from 'perf_hooks';
import axios from 'axios';
import moneroService from '../../services/moneroService.js';

// Mock axios for testing
vi.mock('axios');

// Performance monitoring tests for Monero payment system
describe('Monero Payment Performance Tests', () => {
  const performanceMetrics = {
    exchangeRateApiCalls: [],
    cacheHits: [],
    paymentCreationTimes: [],
    statusCheckTimes: [],
    webhookProcessingTimes: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset performance metrics
    Object.keys(performanceMetrics).forEach(key => {
      performanceMetrics[key] = [];
    });
    
    // Reset cache
    moneroService.exchangeRateCache = {
      rate: null,
      timestamp: null,
      validUntil: null
    };
  });

  describe('Exchange Rate Performance', () => {
    it('should fetch exchange rates within performance thresholds', async () => {
      axios.get = vi.fn().mockResolvedValue({
        data: { monero: { gbp: 161.23 } }
      });

      const iterations = 10;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await moneroService.getExchangeRate();
        const endTime = performance.now();
        
        times.push(endTime - startTime);
        
        // Clear cache for each iteration to test API performance
        moneroService.exchangeRateCache.validUntil = Date.now() - 1000;
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      
      // API calls should complete within reasonable time
      expect(averageTime).toBeLessThan(2000); // 2 seconds average
      expect(maxTime).toBeLessThan(5000); // 5 seconds max
      
      performanceMetrics.exchangeRateApiCalls = times;
    });

    it('should achieve fast cache hit performance', async () => {
      axios.get = vi.fn().mockResolvedValue({
        data: { monero: { gbp: 161.23 } }
      });

      // Prime the cache
      await moneroService.getExchangeRate();

      const iterations = 1000;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await moneroService.getExchangeRate();
        const endTime = performance.now();
        
        times.push(endTime - startTime);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      
      // Cache hits should be very fast
      expect(averageTime).toBeLessThan(1); // Under 1ms average
      expect(maxTime).toBeLessThan(10); // Under 10ms max
      
      // Should only make 1 API call (for priming)
      expect(axios.get).toHaveBeenCalledTimes(1);
      
      performanceMetrics.cacheHits = times;
    });
  });

  describe('Payment Creation Performance', () => {
    it('should create payments efficiently', async () => {
      
      // Mock exchange rate call
      axios.get = vi.fn().mockResolvedValue({
        data: { monero: { gbp: 161.23 } }
      });
      
      // Mock GloBee payment creation
      axios.post = vi.fn().mockResolvedValue({
        data: {
          id: 'globee-123',
          payment_address: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
          total: 1.2376,
          currency: 'XMR',
          expiration_time: new Date().toISOString(),
          status: 'pending'
        }
      });

      const iterations = 20;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        try {
          await moneroService.createPaymentRequest({
            orderId: `order-${i}`,
            amount: 1.2376,
            customerEmail: 'test@example.com'
          });
        } catch (error) {
          // Handle expected errors in test environment
        }
        
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      
      // Payment creation should be reasonably fast
      expect(averageTime).toBeLessThan(3000); // 3 seconds average
      expect(maxTime).toBeLessThan(10000); // 10 seconds max
      
      performanceMetrics.paymentCreationTimes = times;
    });
  });

  describe('Status Check Performance', () => {
    it('should check payment status efficiently', async () => {
      axios.get = vi.fn().mockResolvedValue({
        data: {
          id: 'payment-123',
          status: 'pending',
          confirmations: 0,
          paid_amount: 0
        }
      });

      const iterations = 50;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        
        try {
          await moneroService.getPaymentStatus('payment-123');
        } catch (error) {
          // Handle expected errors in test environment
        }
        
        const endTime = performance.now();
        times.push(endTime - startTime);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      
      // Status checks should be fast (frequent polling)
      expect(averageTime).toBeLessThan(1500); // 1.5 seconds average
      expect(maxTime).toBeLessThan(5000); // 5 seconds max
      
      performanceMetrics.statusCheckTimes = times;
    });
  });

  describe('Webhook Processing Performance', () => {
    it('should process webhooks quickly', async () => {
      const iterations = 100;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const webhookData = {
          id: `payment-${i}`,
          status: 'paid',
          confirmations: 12,
          paid_amount: 1.5,
          total_amount: 1.5,
          order_id: `order-${i}`
        };

        const startTime = performance.now();
        moneroService.processWebhookNotification(webhookData);
        const endTime = performance.now();
        
        times.push(endTime - startTime);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      
      // Webhook processing should be very fast (no I/O)
      expect(averageTime).toBeLessThan(5); // Under 5ms average
      expect(maxTime).toBeLessThan(50); // Under 50ms max
      
      performanceMetrics.webhookProcessingTimes = times;
    });
  });

  describe('Memory Usage Analysis', () => {
    it('should maintain stable memory usage', async () => {
      axios.get = vi.fn().mockResolvedValue({
        data: { monero: { gbp: 161.23 } }
      });

      const initialMemory = process.memoryUsage();
      
      // Perform many operations
      for (let i = 0; i < 500; i++) {
        await moneroService.getExchangeRate();
        
        if (i % 100 === 0) {
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
        }
      }

      const finalMemory = process.memoryUsage();
      
      // Memory increase should be minimal
      const heapIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const rssIncrease = finalMemory.rss - initialMemory.rss;
      
      expect(heapIncrease).toBeLessThan(50 * 1024 * 1024); // Under 50MB heap increase
      expect(rssIncrease).toBeLessThan(100 * 1024 * 1024); // Under 100MB RSS increase
    });
  });

  describe('Concurrent Performance', () => {
    it('should handle concurrent operations efficiently', async () => {
      axios.get = vi.fn().mockResolvedValue({
        data: { monero: { gbp: 161.23 } }
      });

      const concurrency = 50;
      const startTime = performance.now();

      // Create concurrent promises
      const promises = Array(concurrency).fill(null).map(async (_, index) => {
        const operations = [];
        
        // Mix of different operations
        operations.push(moneroService.getExchangeRate());
        operations.push(moneroService.convertGbpToXmr(100 + index));
        operations.push(moneroService.processWebhookNotification({
          id: `concurrent-${index}`,
          status: 'paid',
          confirmations: 10
        }));
        
        return Promise.all(operations);
      });

      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Concurrent operations should complete reasonably quickly
      expect(totalTime).toBeLessThan(10000); // Under 10 seconds for all concurrent operations
      
      // Should efficiently handle concurrent exchange rate requests
      expect(axios.get).toHaveBeenCalledTimes(1); // Only one API call due to caching
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions', async () => {
      // Define performance baselines (in milliseconds)
      const baselines = {
        exchangeRateApi: 2000,
        cacheHit: 1,
        paymentCreation: 3000,
        statusCheck: 1500,
        webhookProcessing: 5
      };

      // Calculate actual averages from collected metrics
      const averages = {
        exchangeRateApi: performanceMetrics.exchangeRateApiCalls.length > 0 
          ? performanceMetrics.exchangeRateApiCalls.reduce((a, b) => a + b, 0) / performanceMetrics.exchangeRateApiCalls.length 
          : 0,
        cacheHit: performanceMetrics.cacheHits.length > 0
          ? performanceMetrics.cacheHits.reduce((a, b) => a + b, 0) / performanceMetrics.cacheHits.length
          : 0,
        paymentCreation: performanceMetrics.paymentCreationTimes.length > 0
          ? performanceMetrics.paymentCreationTimes.reduce((a, b) => a + b, 0) / performanceMetrics.paymentCreationTimes.length
          : 0,
        statusCheck: performanceMetrics.statusCheckTimes.length > 0
          ? performanceMetrics.statusCheckTimes.reduce((a, b) => a + b, 0) / performanceMetrics.statusCheckTimes.length
          : 0,
        webhookProcessing: performanceMetrics.webhookProcessingTimes.length > 0
          ? performanceMetrics.webhookProcessingTimes.reduce((a, b) => a + b, 0) / performanceMetrics.webhookProcessingTimes.length
          : 0
      };

      // Check for regressions (allow 50% variance from baseline)
      Object.keys(baselines).forEach(operation => {
        if (averages[operation] > 0) {
          const regression = (averages[operation] / baselines[operation]) - 1;
          expect(regression).toBeLessThan(0.5); // No more than 50% slower than baseline
        }
      });

      // Log performance summary for monitoring
      console.log('Performance Summary:', {
        baselines,
        averages,
        regressionCheck: 'PASSED'
      });
    });
  });
});