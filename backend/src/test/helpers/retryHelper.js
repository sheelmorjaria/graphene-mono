import { vi } from 'vitest';

// Retry helper for flaky tests
export const retryTest = async (testFn, options = {}) => {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 1.5,
    shouldRetry = (_error) => true
  } = options;

  let lastError;
  let currentDelay = delay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await testFn(attempt);
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        break;
      }

      // Add delay before retry (except for first attempt)
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= backoff;
      }

      // Clear any mocks between retries
      vi.clearAllMocks();
    }
  }

  throw lastError;
};

// Common retry conditions
export const retryConditions = {
  // Retry on network-related errors
  network: (error) => {
    const networkErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'socket hang up',
      'timeout'
    ];
    return networkErrors.some(pattern => 
      error.message && error.message.toLowerCase().includes(pattern.toLowerCase())
    );
  },

  // Retry on rate limiting
  rateLimited: (error) => {
    return error.status === 429 || 
           (error.message && error.message.includes('rate limit'));
  },

  // Retry on MongoDB connection issues
  mongodb: (error) => {
    const mongoErrors = [
      'MongoNetworkError',
      'MongoTimeoutError',
      'MongoServerSelectionError',
      'connection closed'
    ];
    return mongoErrors.some(pattern =>
      error.name === pattern || 
      (error.message && error.message.includes(pattern))
    );
  },

  // Retry on external API failures
  externalApi: (error) => {
    const apiErrors = [
      'fetch failed',
      'network error',
      'service unavailable',
      'internal server error'
    ];
    return error.status >= 500 || 
           apiErrors.some(pattern =>
             error.message && error.message.toLowerCase().includes(pattern)
           );
  },

  // Combine multiple conditions
  common: (error) => {
    return retryConditions.network(error) ||
           retryConditions.rateLimited(error) ||
           retryConditions.mongodb(error) ||
           retryConditions.externalApi(error);
  }
};

// Wrapper function to make any test retryable
export const makeRetryable = (testFn, options = {}) => {
  return async function(...args) {
    return retryTest(() => testFn.apply(this, args), options);
  };
};

// Jest custom matcher for retrying assertions
export const expectWithRetry = async (getValue, matcher, options = {}) => {
  const {
    maxRetries = 5,
    delay = 100,
    timeout = 5000
  } = options;

  const startTime = Date.now();
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Check timeout
    if (Date.now() - startTime > timeout) {
      throw new Error(`Timeout after ${timeout}ms while waiting for condition`);
    }

    try {
      const value = typeof getValue === 'function' ? await getValue() : getValue;
      return expect(value)[matcher.method](...matcher.args);
    } catch (error) {
      lastError = error;
      
      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// Helper for database-dependent tests
export const withDatabaseRetry = (testFn) => {
  return makeRetryable(testFn, {
    maxRetries: 3,
    delay: 500,
    shouldRetry: retryConditions.mongodb
  });
};

// Helper for API-dependent tests
export const withApiRetry = (testFn) => {
  return makeRetryable(testFn, {
    maxRetries: 5,
    delay: 200,
    backoff: 2,
    shouldRetry: retryConditions.externalApi
  });
};

// Helper for rate-limited tests
export const withRateLimitRetry = (testFn) => {
  return makeRetryable(testFn, {
    maxRetries: 3,
    delay: 1000,
    shouldRetry: retryConditions.rateLimited
  });
};

export default {
  retryTest,
  retryConditions,
  makeRetryable,
  expectWithRetry,
  withDatabaseRetry,
  withApiRetry,
  withRateLimitRetry
};