import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock winston before importing logger
vi.mock('winston', async () => {
  const actual = await vi.importActual('winston');
  return {
    ...actual,
    default: {
      createLogger: vi.fn(() => ({
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        http: vi.fn(),
        debug: vi.fn(),
        stream: { write: vi.fn() }
      })),
      format: actual.format,
      transports: actual.transports,
      addColors: vi.fn()
    }
  };
});

vi.mock('winston-daily-rotate-file');

import logger, { logError, logPaymentEvent, logAuthEvent, logSecurityEvent } from '../logger.js';

// Store original NODE_ENV
const originalNodeEnv = process.env.NODE_ENV;
const originalLogLevel = process.env.LOG_LEVEL;

describe('Logger Utility - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env.NODE_ENV = originalNodeEnv;
    process.env.LOG_LEVEL = originalLogLevel;
  });

  describe('Logger Configuration', () => {
    it('should have logger available', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should have logging helper functions', () => {
      expect(typeof logError).toBe('function');
      expect(typeof logPaymentEvent).toBe('function');
      expect(typeof logAuthEvent).toBe('function');
      expect(typeof logSecurityEvent).toBe('function');
    });
  });

  describe('Logger Methods', () => {
    it('should have all logging methods', () => {
      expect(logger.info).toBeTypeOf('function');
      expect(logger.error).toBeTypeOf('function');
      expect(logger.warn).toBeTypeOf('function');
      expect(logger.debug).toBeTypeOf('function');
      expect(logger.http).toBeTypeOf('function');
    });

    it('should have stream object for Morgan integration', () => {
      expect(logger.stream).toBeDefined();
      expect(logger.stream.write).toBeTypeOf('function');
    });

    it('should handle stream write correctly', () => {
      const spy = vi.spyOn(logger, 'http');
      const message = 'GET /api/test 200 15ms\n';
      
      logger.stream.write(message);
      
      expect(spy).toHaveBeenCalledWith('GET /api/test 200 15ms');
    });
  });

  describe('logError Function', () => {
    it('should call logError function without throwing', () => {
      const error = new Error('Test error message');
      const context = { userId: '123', action: 'test' };

      expect(() => logError(error, context)).not.toThrow();
    });

    it('should handle errors without context', () => {
      const error = new Error('Simple error');

      expect(() => logError(error)).not.toThrow();
    });

    it('should handle non-Error objects', () => {
      const error = { message: 'Object error', code: 'ERR001' };

      expect(() => logError(error)).not.toThrow();
    });
  });

  describe('logPaymentEvent Function', () => {
    it('should call logPaymentEvent function without throwing', () => {
      const eventData = {
        orderId: '12345',
        amount: 99.99,
        currency: 'GBP',
        method: 'paypal'
      };

      expect(() => logPaymentEvent('payment_completed', eventData)).not.toThrow();
    });

    it('should handle payment events without data', () => {
      expect(() => logPaymentEvent('payment_initiated', {})).not.toThrow();
    });
  });

  describe('logAuthEvent Function', () => {
    it('should call logAuthEvent function without throwing', () => {
      const details = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      expect(() => logAuthEvent('login_success', 'user123', details)).not.toThrow();
    });

    it('should handle auth events without details', () => {
      expect(() => logAuthEvent('logout', 'user456')).not.toThrow();
    });
  });

  describe('logSecurityEvent Function', () => {
    it('should call logSecurityEvent function without throwing', () => {
      const details = {
        ip: '10.0.0.1',
        reason: 'Too many failed attempts',
        attempts: 5
      };

      expect(() => logSecurityEvent('account_locked', details)).not.toThrow();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle null error gracefully', () => {
      expect(() => logError(null)).not.toThrow();
    });

    it('should handle undefined error gracefully', () => {
      expect(() => logError(undefined)).not.toThrow();
    });

    it('should handle circular reference in context', () => {
      const error = new Error('Circular error');
      const context = { user: {} };
      context.user.context = context; // Create circular reference

      // Should not throw
      expect(() => logError(error, context)).not.toThrow();
    });
  });
});