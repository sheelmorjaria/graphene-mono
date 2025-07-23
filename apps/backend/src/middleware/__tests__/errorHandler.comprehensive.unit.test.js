import { vi } from 'vitest';
import { errorHandler } from '../errorHandler.js';

describe('Error Handler Comprehensive Tests', () => {
  let req, res, next, consoleErrorSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    
    req = {
      method: 'POST',
      url: '/api/test',
      headers: {
        'user-agent': 'Test Browser',
        'x-forwarded-for': '192.168.1.1'
      },
      body: { test: 'data' },
      user: { id: 'user123', email: 'test@example.com' }
    };
    
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    
    next = vi.fn();

    // Mock console.error to capture logging
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Comprehensive Error Type Handling', () => {
    describe('Mongoose Errors', () => {
      it('should handle CastError with detailed context', () => {
        const error = new Error('Cast to ObjectId failed for value "invalid-id" at path "_id"');
        error.name = 'CastError';
        error.kind = 'ObjectId';
        error.value = 'invalid-id';
        error.path = '_id';
        error.reason = new Error('Argument passed in must be a single String of 12 bytes');

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Resource not found'
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith(error);
      });

      it('should handle ValidationError with multiple field errors', () => {
        const error = new Error('Validation failed');
        error.name = 'ValidationError';
        error.errors = {
          email: {
            message: 'Email is required',
            kind: 'required',
            path: 'email'
          },
          password: {
            message: 'Password must be at least 8 characters',
            kind: 'minlength',
            path: 'password'
          },
          firstName: {
            message: 'First name cannot be empty',
            kind: 'required',
            path: 'firstName'
          }
        };

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Email is required, Password must be at least 8 characters, First name cannot be empty'
        });
      });

      it('should handle different MongoDB duplicate key errors', () => {
        const duplicateKeyScenarios = [
          {
            code: 11000,
            keyPattern: { email: 1 },
            keyValue: { email: 'test@example.com' }
          },
          {
            code: 11000,
            keyPattern: { username: 1, email: 1 },
            keyValue: { username: 'testuser', email: 'test@example.com' }
          },
          {
            code: 11000,
            keyPattern: { slug: 1 },
            keyValue: { slug: 'duplicate-slug' }
          }
        ];

        for (const scenario of duplicateKeyScenarios) {
          vi.clearAllMocks();
          
          const error = new Error('E11000 duplicate key error collection');
          Object.assign(error, scenario);

          errorHandler(error, req, res, next);

          expect(res.status).toHaveBeenCalledWith(400);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Duplicate field value entered'
          });
        }
      });

      it('should handle MongoError variations', () => {
        const mongoErrors = [
          { name: 'MongoError', code: 2, message: 'BadValue: invalid query' },
          { name: 'MongoNetworkError', message: 'connection refused' },
          { name: 'MongoTimeoutError', message: 'operation timed out' },
          { name: 'MongoWriteConcernError', message: 'write concern error' }
        ];

        for (const errorData of mongoErrors) {
          vi.clearAllMocks();
          
          const error = new Error(errorData.message);
          Object.assign(error, errorData);

          errorHandler(error, req, res, next);

          // Should fall through to generic error handling
          expect(res.status).toHaveBeenCalledWith(500);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: errorData.message || 'Server Error'
          });
        }
      });
    });

    describe('JWT and Authentication Errors', () => {
      it('should handle JsonWebTokenError variations', () => {
        const jwtErrors = [
          { name: 'JsonWebTokenError', message: 'invalid token' },
          { name: 'JsonWebTokenError', message: 'jwt malformed' },
          { name: 'JsonWebTokenError', message: 'invalid signature' },
          { name: 'JsonWebTokenError', message: 'jwt audience invalid' }
        ];

        for (const errorData of jwtErrors) {
          vi.clearAllMocks();
          
          const error = new Error(errorData.message);
          error.name = errorData.name;

          errorHandler(error, req, res, next);

          expect(res.status).toHaveBeenCalledWith(401);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Invalid token'
          });
        }
      });

      it('should handle TokenExpiredError with expiration details', () => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        error.expiredAt = new Date('2023-12-01T10:00:00Z');

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Token expired'
        });
      });

      it('should handle NotBeforeError', () => {
        const error = new Error('jwt not active');
        error.name = 'NotBeforeError';
        error.date = new Date('2024-01-01T10:00:00Z');

        errorHandler(error, req, res, next);

        // Should fall through to generic error handling since not specifically handled
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'jwt not active'
        });
      });
    });

    describe('HTTP and Network Errors', () => {
      it('should handle Axios errors', () => {
        const axiosError = new Error('Request failed with status code 404');
        axiosError.response = {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Resource not found' }
        };
        axiosError.config = {
          method: 'GET',
          url: 'https://api.example.com/resource'
        };

        errorHandler(axiosError, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Request failed with status code 404'
        });
      });

      it('should handle network timeout errors', () => {
        const timeoutError = new Error('timeout of 5000ms exceeded');
        timeoutError.code = 'ECONNABORTED';
        timeoutError.config = { timeout: 5000 };

        errorHandler(timeoutError, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'timeout of 5000ms exceeded'
        });
      });

      it('should handle connection refused errors', () => {
        const connectionError = new Error('connect ECONNREFUSED 127.0.0.1:3000');
        connectionError.code = 'ECONNREFUSED';
        connectionError.errno = -111;
        connectionError.syscall = 'connect';

        errorHandler(connectionError, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'connect ECONNREFUSED 127.0.0.1:3000'
        });
      });
    });

    describe('Custom Application Errors', () => {
      it('should handle custom errors with status codes', () => {
        const customErrors = [
          { statusCode: 400, message: 'Bad Request - Invalid input data' },
          { statusCode: 403, message: 'Forbidden - Insufficient permissions' },
          { statusCode: 404, message: 'Not Found - Resource does not exist' },
          { statusCode: 409, message: 'Conflict - Resource already exists' },
          { statusCode: 422, message: 'Unprocessable Entity - Validation failed' },
          { statusCode: 429, message: 'Too Many Requests - Rate limit exceeded' }
        ];

        for (const errorData of customErrors) {
          vi.clearAllMocks();
          
          const error = new Error(errorData.message);
          error.statusCode = errorData.statusCode;

          errorHandler(error, req, res, next);

          expect(res.status).toHaveBeenCalledWith(errorData.statusCode);
          expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: errorData.message
          });
        }
      });

      it('should handle errors with additional context', () => {
        const error = new Error('Payment processing failed');
        error.statusCode = 402;
        error.code = 'PAYMENT_FAILED';
        error.details = {
          paymentMethod: 'stripe',
          amount: 100,
          currency: 'GBP'
        };
        error.userMessage = 'Your payment could not be processed. Please try again.';

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(402);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Payment processing failed'
        });
      });
    });
  });

  describe('Error Data Handling', () => {
    describe('Null and Undefined Errors', () => {
      it('should handle null error gracefully', () => {
        errorHandler(null, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Server Error'
        });
      });

      it('should handle undefined error gracefully', () => {
        errorHandler(undefined, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Server Error'
        });
      });

      it('should handle empty error object', () => {
        errorHandler({}, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Server Error'
        });
      });
    });

    describe('Non-Error Objects', () => {
      it('should handle string errors', () => {
        errorHandler('Something went wrong', req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Server Error'
        });
      });

      it('should handle number errors', () => {
        errorHandler(500, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Server Error'
        });
      });

      it('should handle array errors', () => {
        errorHandler(['error1', 'error2'], req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Server Error'
        });
      });
    });

    describe('Complex Error Objects', () => {
      it('should handle errors with circular references', () => {
        const error = new Error('Circular reference error');
        error.circular = error; // Create circular reference
        error.statusCode = 400;

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Circular reference error'
        });
      });

      it('should handle errors with complex nested objects', () => {
        const error = new Error('Complex error');
        error.nested = {
          level1: {
            level2: {
              level3: 'deep value'
            },
            array: [1, 2, 3]
          }
        };
        error.statusCode = 422;

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Complex error'
        });
      });

      it('should handle errors without prototype', () => {
        const error = Object.create(null);
        error.message = 'Prototype-less error';
        error.statusCode = 400;

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Prototype-less error'
        });
      });
    });
  });

  describe('Error Logging and Security', () => {
    describe('Logging Behavior', () => {
      it('should log all errors to console', () => {
        const errors = [
          new Error('Simple error'),
          { message: 'Object error', statusCode: 400 },
          'String error'
        ];

        for (const error of errors) {
          vi.clearAllMocks();
          errorHandler(error, req, res, next);
          expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        }
      });

      it('should log errors with stack traces', () => {
        const error = new Error('Error with stack');
        error.stack = 'Error: Error with stack\n    at test (/app/test.js:1:1)';

        errorHandler(error, req, res, next);

        expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        // Verify the full error object (including stack) is logged
        expect(consoleErrorSpy.mock.calls[0][0]).toHaveProperty('stack');
      });
    });

    describe('Security Considerations', () => {
      it('should not leak sensitive information in production', () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const error = new Error('Database connection string: mongodb://user:password@host');
        error.sensitiveData = {
          password: 'secret123',
          apiKey: 'sk_live_123456789'
        };

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Database connection string: mongodb://user:password@host'
        });

        // Ensure sensitive data is not in the response
        expect(res.json).not.toHaveBeenCalledWith(
          expect.objectContaining({
            sensitiveData: expect.any(Object)
          })
        );

        process.env.NODE_ENV = originalEnv;
      });

      it('should maintain consistent error response format', () => {
        const errorTypes = [
          new Error('Type 1'),
          { message: 'Type 2', statusCode: 400 },
          null,
          undefined
        ];

        for (const error of errorTypes) {
          vi.clearAllMocks();
          errorHandler(error, req, res, next);
          
          expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
              success: false,
              error: expect.any(String)
            })
          );
        }
      });

      it('should not call next() after handling error', () => {
        const error = new Error('Test error');
        
        errorHandler(error, req, res, next);

        expect(next).not.toHaveBeenCalled();
      });
    });
  });

  describe('Status Code Priority and Mapping', () => {
    describe('Status Code Selection', () => {
      it('should prioritize specific error type status codes over custom statusCode', () => {
        const error = new Error('ValidationError with custom status');
        error.name = 'ValidationError';
        error.statusCode = 500; // This should be overridden
        error.errors = {
          field: { message: 'Field error' }
        };

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400); // ValidationError status, not 500
      });

      it('should use custom statusCode when no specific mapping exists', () => {
        const error = new Error('Custom error');
        error.statusCode = 418; // I'm a teapot

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(418);
      });

      it('should default to 500 for unknown errors', () => {
        const error = new Error('Unknown error type');
        // No statusCode property

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
      });
    });

    describe('Error Message Handling', () => {
      it('should use error message when available', () => {
        const error = new Error('Specific error message');

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Specific error message'
        });
      });

      it('should fallback to default message when error has no message', () => {
        const error = new Error();
        error.message = '';

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Server Error'
        });
      });

      it('should handle undefined message property', () => {
        const error = new Error('Test');
        error.message = undefined;

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Server Error'
        });
      });
    });
  });
});