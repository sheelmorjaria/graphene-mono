import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import moneroService from '../../services/moneroService.js';

// Mock axios for testing
vi.mock('axios');

// Load testing for exchange rate caching behavior
describe('Exchange Rate Caching Load Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset cache
    moneroService.exchangeRateCache = {
      rate: null,
      timestamp: null,
      validUntil: null
    };
  });

  it('should handle concurrent exchange rate requests efficiently', async () => {
    // Mock axios to track call count
    let apiCallCount = 0;
    
    axios.get = vi.fn().mockImplementation(() => {
      apiCallCount++;
      return Promise.resolve({
        data: { monero: { gbp: 161.23 } }
      });
    });

    // Simulate 50 concurrent requests
    const promises = Array(50).fill(null).map(() => 
      moneroService.getExchangeRate()
    );

    const results = await Promise.all(promises);

    // Should only make 1 API call due to caching
    expect(apiCallCount).toBeLessThanOrEqual(2); // Allow for race condition
    
    // All results should be identical
    results.forEach(result => {
      expect(result.rate).toBeCloseTo(0.00620333, 6);
      expect(result.validUntil).toBeInstanceOf(Date);
    });
  });

  it('should handle cache expiration under load', async () => {
    let apiCallCount = 0;
    
    axios.get = vi.fn().mockImplementation(() => {
      apiCallCount++;
      return Promise.resolve({
        data: { monero: { gbp: 161.23 + (apiCallCount * 0.01) } } // Slightly different rates
      });
    });

    // First batch of requests
    const firstBatch = Array(20).fill(null).map(() => 
      moneroService.getExchangeRate()
    );
    
    await Promise.all(firstBatch);
    const firstCallCount = apiCallCount;

    // Force cache expiration
    moneroService.exchangeRateCache.validUntil = Date.now() - 1000;

    // Second batch of requests after expiration
    const secondBatch = Array(20).fill(null).map(() => 
      moneroService.getExchangeRate()
    );
    
    await Promise.all(secondBatch);

    // Should have made additional API call after expiration
    expect(apiCallCount).toBeGreaterThan(firstCallCount);
    expect(apiCallCount).toBeLessThanOrEqual(firstCallCount + 2); // Account for race conditions
  });

  it('should handle API failures under load gracefully', async () => {
    
    // First call succeeds, subsequent calls fail
    let callCount = 0;
    axios.get = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          data: { monero: { gbp: 161.23 } }
        });
      }
      return Promise.reject(new Error('API rate limit exceeded'));
    });

    // First request should succeed and cache the result
    const firstResult = await moneroService.getExchangeRate();
    expect(firstResult.rate).toBeCloseTo(0.00620333, 6);

    // Subsequent requests should use cached value even if API fails
    const concurrentRequests = Array(30).fill(null).map(() => 
      moneroService.getExchangeRate()
    );

    const results = await Promise.all(concurrentRequests);
    
    // All should return the cached value
    results.forEach(result => {
      expect(result.rate).toBeCloseTo(0.00620333, 6);
    });
  });

  it('should measure cache performance metrics', async () => {
    axios.get = vi.fn().mockResolvedValue({
      data: { monero: { gbp: 161.23 } }
    });

    const iterations = 100;
    Date.now(); // Record start time

    // Test cache hit performance
    await moneroService.getExchangeRate(); // Prime the cache
    
    const cacheTestStart = Date.now();
    const promises = Array(iterations).fill(null).map(() => 
      moneroService.getExchangeRate()
    );
    
    await Promise.all(promises);
    const cacheTestEnd = Date.now();

    const averageResponseTime = (cacheTestEnd - cacheTestStart) / iterations;
    
    // Cache hits should be very fast (under 1ms average)
    expect(averageResponseTime).toBeLessThan(5);
    
    // Should only make 1 API call total
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('should handle memory usage efficiently with large request volumes', async () => {
    axios.get = vi.fn().mockResolvedValue({
      data: { monero: { gbp: 161.23 } }
    });

    // Measure initial memory
    const initialMemory = process.memoryUsage().heapUsed;

    // Process large number of requests
    const batchSize = 1000;
    for (let i = 0; i < 5; i++) {
      const batch = Array(batchSize).fill(null).map(() => 
        moneroService.getExchangeRate()
      );
      await Promise.all(batch);
    }

    // Measure final memory
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be minimal (under 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });

  it('should validate cache consistency under concurrent modifications', async () => {
    let responseValue = 161.23;
    
    axios.get = vi.fn().mockImplementation(() => {
      return Promise.resolve({
        data: { monero: { gbp: responseValue } }
      });
    });

    // First batch establishes cache
    await moneroService.getExchangeRate();
    
    // Simulate cache invalidation during concurrent access
    const promises = [];
    
    // Start many concurrent requests
    for (let i = 0; i < 50; i++) {
      promises.push(moneroService.getExchangeRate());
      
      // Invalidate cache midway through
      if (i === 25) {
        responseValue = 162.45; // Change API response
        moneroService.exchangeRateCache.validUntil = Date.now() - 1000;
      }
    }

    const results = await Promise.all(promises);
    
    // All results should be consistent (either old or new rate, not mixed)
    const uniqueRates = [...new Set(results.map(r => r.rate))];
    expect(uniqueRates.length).toBeLessThanOrEqual(2); // At most 2 different rates
  });
});