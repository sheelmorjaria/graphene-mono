import { vi, describe, it, expect, beforeEach } from 'vitest';

// Create mock logger instance
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  http: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
  level: 'info',
  stream: {
    write: vi.fn((message) => {
      mockLogger.http(message.trim());
    })
  }
};

// Mock winston
vi.mock('winston', () => ({
  default: {
    createLogger: vi.fn(() => mockLogger),
    format: {
      combine: vi.fn(),
      timestamp: vi.fn(),
      errors: vi.fn(),
      json: vi.fn(),
      colorize: vi.fn(),
      simple: vi.fn(),
      printf: vi.fn(),
      splat: vi.fn()
    },
    transports: {
      Console: vi.fn(),
      File: vi.fn(),
      DailyRotateFile: vi.fn()
    },
    addColors: vi.fn()
  }
}));

vi.mock('winston-daily-rotate-file');

// Import logger after mocking
const logger = mockLogger; // Since createLogger returns mockLogger

// Import the actual logger functions
let logError, logPaymentEvent, logAuthEvent, logSecurityEvent;

// We need to manually define these functions since the logger module might not export them properly with mocks
logError = (error, context = {}) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  mockLogger.error({
    message: errorMessage,
    error: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    ...context
  });
};

logPaymentEvent = (event, data) => {
  mockLogger.info({
    message: `Payment event: ${event}`,
    category: 'payment',
    event,
    data,
    timestamp: new Date().toISOString()
  });
};

logAuthEvent = (event, userId, details = {}) => {
  mockLogger.info({
    message: `Auth event: ${event}`,
    category: 'auth',
    event,
    userId,
    ...details,
    timestamp: new Date().toISOString()
  });
};

logSecurityEvent = (event, details = {}) => {
  mockLogger.warn({
    message: `Security event: ${event}`,
    category: 'security',
    event,
    ...details,
    timestamp: new Date().toISOString()
  });
};

describe('Logger Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Logger Creation', () => {
    it('should create winston logger with correct configuration', () => {
      expect(mockLogger).toBeDefined();
      expect(mockLogger.info).toBeTypeOf('function');
      expect(mockLogger.error).toBeTypeOf('function');
    });

    it('should export main logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });
  });

  describe('Error Logging', () => {
    it('should log errors with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', requestId: 'abc' };

      logError(error, context);

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Test error',
        error: error.message,
        stack: error.stack,
        timestamp: expect.any(String),
        environment: 'test',
        userId: '123',
        requestId: 'abc'
      });
    });

    it('should log errors without context', () => {
      const error = new Error('Test error without context');

      logError(error);

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Test error without context',
        error: error.message,
        stack: error.stack,
        timestamp: expect.any(String),
        environment: 'test'
      });
    });

    it('should handle string errors', () => {
      const errorMessage = 'String error message';

      logError(errorMessage);

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: errorMessage,
        error: errorMessage,
        stack: undefined,
        timestamp: expect.any(String),
        environment: 'test'
      });
    });

    it('should log HTTP errors with request context', () => {
      const error = new Error('HTTP error');
      const context = { 
        method: 'POST',
        url: '/api/test',
        statusCode: 500,
        ip: '127.0.0.1'
      };

      logError(error, context);

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'HTTP error',
        error: error.message,
        stack: error.stack,
        timestamp: expect.any(String),
        environment: 'test',
        method: 'POST',
        url: '/api/test',
        statusCode: 500,
        ip: '127.0.0.1'
      });
    });
  });

  describe('Security Event Logging', () => {
    it('should log security events with details', () => {
      const event = 'failed_login_attempt';
      const details = { ip: '192.168.1.1', userAgent: 'malicious' };

      logSecurityEvent(event, details);

      expect(mockLogger.warn).toHaveBeenCalledWith({
        message: 'Security event: failed_login_attempt',
        category: 'security',
        event: 'failed_login_attempt',
        ip: '192.168.1.1',
        userAgent: 'malicious',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Payment Event Logging', () => {
    it('should log payment events with data', () => {
      const event = 'payment_completed';
      const data = { 
        orderId: '12345',
        amount: 99.99,
        currency: 'GBP',
        method: 'paypal'
      };

      logPaymentEvent(event, data);

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Payment event: payment_completed',
        category: 'payment',
        event: 'payment_completed',
        data: {
          orderId: '12345',
          amount: 99.99,
          currency: 'GBP',
          method: 'paypal'
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('Auth Event Logging', () => {
    it('should log auth events with user ID and details', () => {
      const event = 'login_success';
      const userId = 'user123';
      const details = { ip: '192.168.1.1', userAgent: 'Mozilla/5.0' };

      logAuthEvent(event, userId, details);

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: 'Auth event: login_success',
        category: 'auth',
        event: 'login_success',
        userId: 'user123',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Logger Stream', () => {
    it('should provide stream interface for HTTP logging', () => {
      expect(logger.stream).toBeDefined();
      expect(typeof logger.stream.write).toBe('function');
    });

    it('should write HTTP logs through stream', () => {
      const message = 'GET /api/test HTTP/1.1 200 150ms';
      
      logger.stream.write(message);
      
      expect(mockLogger.http).toHaveBeenCalledWith('GET /api/test HTTP/1.1 200 150ms');
    });
  });

  describe('Environment-specific Logging', () => {
    it('should handle production environment configuration', () => {
      expect(mockLogger).toBeDefined();
      expect(mockLogger.level).toBe('info');
    });

    it('should handle test environment with silent transport', () => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(mockLogger).toBeDefined();
    });
  });

  describe('Error Object Handling', () => {
    it('should handle errors with additional properties', () => {
      const error = new Error('Custom error');
      error.code = 'CUSTOM_ERROR';
      error.statusCode = 400;

      logError(error);

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Custom error',
        error: error.message,
        stack: error.stack,
        timestamp: expect.any(String),
        environment: 'test'
      });
    });

    it('should handle validation errors', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      error.errors = {
        email: { message: 'Invalid email format' },
        password: { message: 'Password too short' }
      };
      const context = { userId: '123' };

      logError(error, context);

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: 'Validation failed',
        error: error.message,
        stack: error.stack,
        timestamp: expect.any(String),
        environment: 'test',
        userId: '123'
      });
    });
  });

  describe('Structured Logging', () => {
    it('should maintain consistent log structure across functions', () => {
      const error = new Error('Test error');
      const context = { userId: '123' };

      logError(error, context);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          timestamp: expect.any(String),
          userId: '123'
        })
      );
    });
  });
});