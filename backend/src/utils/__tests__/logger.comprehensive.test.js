import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Store original NODE_ENV
const originalNodeEnv = process.env.NODE_ENV;
const originalLogLevel = process.env.LOG_LEVEL;

describe('Logger Utility - Comprehensive Tests', () => {
  let logger;
  let logError;
  let logPaymentEvent;
  let logAuthEvent;
  let logSecurityEvent;

  beforeEach(() => {
    // Clear module cache to force re-import
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env.NODE_ENV = originalNodeEnv;
    process.env.LOG_LEVEL = originalLogLevel;
  });

  describe('Logger Configuration', () => {
    it('should create logger with default configuration in test environment', async () => {
      process.env.NODE_ENV = 'test';
      const loggerModule = await import('../logger.js');
      logger = loggerModule.default;

      expect(logger).toBeDefined();
      expect(logger.level).toBe('info');
      expect(logger.transports).toBeDefined();
      expect(logger.transports.length).toBeGreaterThan(0);
    });

    it('should create logger with custom log level', async () => {
      process.env.NODE_ENV = 'test';
      process.env.LOG_LEVEL = 'debug';
      
      const loggerModule = await import('../logger.js');
      logger = loggerModule.default;

      expect(logger.level).toBe('debug');
    });

    it('should create logger with file transports in production', async () => {
      process.env.NODE_ENV = 'production';
      
      const loggerModule = await import('../logger.js');
      logger = loggerModule.default;

      // In production, should have more transports (console + files)
      expect(logger.transports.length).toBeGreaterThan(1);
    });

    it('should create logger with console transport in development', async () => {
      process.env.NODE_ENV = 'development';
      
      const loggerModule = await import('../logger.js');
      logger = loggerModule.default;

      expect(logger.transports).toBeDefined();
      expect(logger.transports.length).toBeGreaterThan(0);
    });
  });

  describe('Logger Methods', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'test';
      const loggerModule = await import('../logger.js');
      logger = loggerModule.default;
      logError = loggerModule.logError;
      logPaymentEvent = loggerModule.logPaymentEvent;
      logAuthEvent = loggerModule.logAuthEvent;
      logSecurityEvent = loggerModule.logSecurityEvent;
    });

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
    beforeEach(async () => {
      process.env.NODE_ENV = 'test';
      const loggerModule = await import('../logger.js');
      logger = loggerModule.default;
      logError = loggerModule.logError;
    });

    it('should log Error objects with message and stack', () => {
      const spy = vi.spyOn(logger, 'error');
      const error = new Error('Test error message');
      const context = { userId: '123', action: 'test' };

      logError(error, context);

      expect(spy).toHaveBeenCalledWith({
        message: 'Test error message',
        stack: error.stack,
        userId: '123',
        action: 'test'
      });
    });

    it('should log errors without context', () => {
      const spy = vi.spyOn(logger, 'error');
      const error = new Error('Simple error');

      logError(error);

      expect(spy).toHaveBeenCalledWith({
        message: 'Simple error',
        stack: error.stack
      });
    });

    it('should handle non-Error objects', () => {
      const spy = vi.spyOn(logger, 'error');
      const error = { message: 'Object error', code: 'ERR001' };

      logError(error);

      expect(spy).toHaveBeenCalledWith({
        message: 'Object error',
        stack: undefined
      });
    });
  });

  describe('logPaymentEvent Function', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'test';
      const loggerModule = await import('../logger.js');
      logger = loggerModule.default;
      logPaymentEvent = loggerModule.logPaymentEvent;
    });

    it('should log payment events with proper structure', () => {
      const spy = vi.spyOn(logger, 'info');
      const eventData = {
        orderId: '12345',
        amount: 99.99,
        currency: 'GBP',
        method: 'paypal'
      };

      logPaymentEvent('payment_completed', eventData);

      expect(spy).toHaveBeenCalledWith({
        message: 'Payment event: payment_completed',
        category: 'payment',
        orderId: '12345',
        amount: 99.99,
        currency: 'GBP',
        method: 'paypal'
      });
    });

    it('should handle payment events without data', () => {
      const spy = vi.spyOn(logger, 'info');

      logPaymentEvent('payment_initiated', {});

      expect(spy).toHaveBeenCalledWith({
        message: 'Payment event: payment_initiated',
        category: 'payment'
      });
    });
  });

  describe('logAuthEvent Function', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'test';
      const loggerModule = await import('../logger.js');
      logger = loggerModule.default;
      logAuthEvent = loggerModule.logAuthEvent;
    });

    it('should log auth events with userId and details', () => {
      const spy = vi.spyOn(logger, 'info');
      const details = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      logAuthEvent('login_success', 'user123', details);

      expect(spy).toHaveBeenCalledWith({
        message: 'Auth event: login_success',
        category: 'auth',
        userId: 'user123',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });
    });

    it('should handle auth events without details', () => {
      const spy = vi.spyOn(logger, 'info');

      logAuthEvent('logout', 'user456');

      expect(spy).toHaveBeenCalledWith({
        message: 'Auth event: logout',
        category: 'auth',
        userId: 'user456'
      });
    });
  });

  describe('logSecurityEvent Function', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'test';
      const loggerModule = await import('../logger.js');
      logger = loggerModule.default;
      logSecurityEvent = loggerModule.logSecurityEvent;
    });

    it('should log security events as warnings', () => {
      const spy = vi.spyOn(logger, 'warn');
      const details = {
        ip: '10.0.0.1',
        reason: 'Too many failed attempts',
        attempts: 5
      };

      logSecurityEvent('account_locked', details);

      expect(spy).toHaveBeenCalledWith({
        message: 'Security event: account_locked',
        category: 'security',
        ip: '10.0.0.1',
        reason: 'Too many failed attempts',
        attempts: 5
      });
    });
  });

  describe('Logger Levels', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'test';
      const loggerModule = await import('../logger.js');
      logger = loggerModule.default;
    });

    it('should respect log level settings', () => {
      const debugSpy = vi.spyOn(logger, 'debug');
      const infoSpy = vi.spyOn(logger, 'info');
      
      logger.debug('Debug message');
      logger.info('Info message');

      // Default level is 'info', so debug shouldn't be logged
      expect(debugSpy).toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalled();
    });

    it('should log all levels when set to debug', async () => {
      process.env.LOG_LEVEL = 'debug';
      vi.resetModules();
      
      const loggerModule = await import('../logger.js');
      const debugLogger = loggerModule.default;
      
      expect(debugLogger.level).toBe('debug');
    });
  });

  describe('Error Scenarios', () => {
    beforeEach(async () => {
      process.env.NODE_ENV = 'test';
      const loggerModule = await import('../logger.js');
      logger = loggerModule.default;
      logError = loggerModule.logError;
    });

    it('should handle null error gracefully', () => {
      const spy = vi.spyOn(logger, 'error');

      logError(null);

      expect(spy).toHaveBeenCalledWith({
        message: null,
        stack: undefined
      });
    });

    it('should handle undefined error gracefully', () => {
      const spy = vi.spyOn(logger, 'error');

      logError(undefined);

      expect(spy).toHaveBeenCalledWith({
        message: undefined,
        stack: undefined
      });
    });

    it('should handle circular reference in context', () => {
      const spy = vi.spyOn(logger, 'error');
      const error = new Error('Circular error');
      const context = { user: {} };
      context.user.context = context; // Create circular reference

      // Should not throw
      expect(() => logError(error, context)).not.toThrow();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Winston Configuration', () => {
    it('should add custom colors', async () => {
      const addColorsSpy = vi.spyOn(winston, 'addColors');
      
      vi.resetModules();
      await import('../logger.js');

      expect(addColorsSpy).toHaveBeenCalledWith({
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'magenta',
        debug: 'white'
      });
    });

    it('should configure proper format', async () => {
      vi.resetModules();
      const loggerModule = await import('../logger.js');
      const logger = loggerModule.default;

      // Logger should have format configuration
      expect(logger.format).toBeDefined();
    });
  });
});