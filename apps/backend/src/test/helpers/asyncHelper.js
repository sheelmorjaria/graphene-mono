import { vi } from 'vitest';

// Helper to ensure proper async/await handling in tests
export const asyncTestWrapper = (testFn) => {
  return async (...args) => {
    try {
      const result = await testFn(...args);
      // Ensure all promises are settled
      await new Promise(resolve => setImmediate(resolve));
      return result;
    } catch (error) {
      // Ensure cleanup happens even on error
      await new Promise(resolve => setImmediate(resolve));
      throw error;
    }
  };
};

// Helper to wait for async operations to complete
export const waitForAsync = async (ms = 0) => {
  return new Promise(resolve => {
    if (ms > 0) {
      setTimeout(resolve, ms);
    } else {
      setImmediate(resolve);
    }
  });
};

// Helper to wait for condition with timeout
export const waitForCondition = async (condition, options = {}) => {
  const {
    timeout = 5000,
    interval = 100,
    timeoutMessage = 'Condition not met within timeout'
  } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const result = await condition();
      if (result) {
        return result;
      }
    } catch (error) {
      // Continue trying unless timeout is reached
    }
    
    await waitForAsync(interval);
  }

  throw new Error(timeoutMessage);
};

// Helper to ensure database operations are complete
export const waitForDatabase = async (operation) => {
  const result = await operation();
  // Wait for any pending database operations
  await waitForAsync(10);
  return result;
};

// Helper to wait for all pending promises
export const flushPromises = async () => {
  await new Promise(resolve => setImmediate(resolve));
};

// Helper for testing async callbacks
export const promisifyCallback = (callbackFn) => {
  return (...args) => {
    return new Promise((resolve, reject) => {
      const callback = (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      };
      
      try {
        callbackFn(...args, callback);
      } catch (error) {
        reject(error);
      }
    });
  };
};

// Helper to ensure async mocks are properly awaited
export const createAsyncMock = (implementation) => {
  return vi.fn(async (...args) => {
    const result = await implementation(...args);
    await waitForAsync(); // Ensure async operations complete
    return result;
  });
};

// Helper to batch async operations
export const batchAsync = async (operations, batchSize = 5) => {
  const results = [];
  
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(op => op()));
    results.push(...batchResults);
    
    // Small delay between batches to prevent overwhelming
    if (i + batchSize < operations.length) {
      await waitForAsync(10);
    }
  }
  
  return results;
};

// Helper for sequential async operations
export const sequentialAsync = async (operations) => {
  const results = [];
  
  for (const operation of operations) {
    const result = await operation();
    results.push(result);
    await waitForAsync(5); // Small delay between operations
  }
  
  return results;
};

// Helper to timeout async operations
export const withTimeout = (promise, timeoutMs, timeoutMessage) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(timeoutMessage || `Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
};

export default {
  asyncTestWrapper,
  waitForAsync,
  waitForCondition,
  waitForDatabase,
  flushPromises,
  promisifyCallback,
  createAsyncMock,
  batchAsync,
  sequentialAsync,
  withTimeout
};