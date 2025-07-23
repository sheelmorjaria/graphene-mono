import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';

// Simple performance test to verify infrastructure
describe('Simple Performance Tests', () => {
  it('should measure basic operation performance', () => {
    const startTime = performance.now();
    
    // Simple computation
    let result = 0;
    for (let i = 0; i < 10000; i++) {
      result += i;
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
    expect(result).toBe(49995000); // Expected result
  });

  it('should test memory allocation performance', () => {
    const initialMemory = process.memoryUsage();
    
    // Create some objects
    const largeArray = new Array(100000).fill(0).map((_, i) => ({ id: i, data: `item-${i}` }));
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    expect(largeArray.length).toBe(100000);
    expect(memoryIncrease).toBeGreaterThan(0);
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Under 50MB
  });

  it('should test concurrent operation performance', async () => {
    const startTime = performance.now();
    
    // Simulate concurrent operations
    const promises = Array(50).fill(null).map((_, index) => 
      new Promise(resolve => {
        setTimeout(() => resolve(index), Math.random() * 10);
      })
    );
    
    const results = await Promise.all(promises);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(results).toHaveLength(50);
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });
});