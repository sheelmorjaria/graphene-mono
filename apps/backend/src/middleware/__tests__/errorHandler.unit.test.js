import { vi } from 'vitest';
import { errorHandler } from '../errorHandler.js';

describe('Error Handler Middleware - Unit Tests', () => {
  let req, res, next;
  let consoleSpy;

  beforeEach(() => {
    req = {
      method: 'GET',
      url: '/api/test',
      ip: '127.0.0.1'
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    next = vi.fn();

    // Mock console.error
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Basic Error Handling', () => {
    it('should be defined and be a function', () => {
      expect(errorHandler).toBeDefined();
      expect(typeof errorHandler).toBe('function');
    });

    it('should handle generic errors with 500 status', () => {
      const error = new Error('Generic error');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Generic error'
      });
    });

    it('should log errors to console', () => {
      const error = new Error('Test error');

      errorHandler(error, req, res, next);

      expect(consoleSpy).toHaveBeenCalledWith(error);
    });

    it('should handle errors with custom status codes', () => {
      const error = new Error('Custom error');
      error.statusCode = 404;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Custom error'
      });
    });
  });

  describe('Mongoose Errors', () => {
    it('should handle CastError (bad ObjectId)', () => {
      const error = new Error('Cast to ObjectId failed');
      error.name = 'CastError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Resource not found'
      });
    });

    it('should handle duplicate key errors', () => {
      const error = new Error('Duplicate key error');
      error.code = 11000;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Duplicate field value entered'
      });
    });

    it('should handle ValidationError', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';
      error.errors = {
        email: { message: 'Email is required' },
        password: { message: 'Password is too short' }
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Email is required, Password is too short'
      });
    });
  });

  describe('JWT Errors', () => {
    it('should handle JsonWebTokenError', () => {
      const error = new Error('jwt malformed');
      error.name = 'JsonWebTokenError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token'
      });
    });

    it('should handle TokenExpiredError', () => {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token expired'
      });
    });
  });

  describe('Error Message Handling', () => {
    it('should use default error message when none provided', () => {
      const error = {};

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server Error'
      });
    });

    it('should preserve original error message', () => {
      const error = new Error('Original message');

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Original message'
      });
    });
  });

  describe('Error Object Spreading', () => {
    it('should handle errors with additional properties', () => {
      const error = new Error('Error with properties');
      error.statusCode = 422;
      error.isOperational = true;

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error with properties'
      });
    });
  });

  describe('Response Structure', () => {
    it('should always return consistent error response structure', () => {
      const error = new Error('Test error');

      errorHandler(error, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String)
        })
      );
    });

    it('should not call next() function', () => {
      const error = new Error('Test error');

      errorHandler(error, req, res, next);

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle null error', () => {
      expect(() => {
        errorHandler(null, req, res, next);
      }).not.toThrow();
    });

    it('should handle undefined error', () => {
      expect(() => {
        errorHandler(undefined, req, res, next);
      }).not.toThrow();
    });

    it('should handle error without message property', () => {
      const error = { name: 'CustomError' };

      expect(() => {
        errorHandler(error, req, res, next);
      }).not.toThrow();

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server Error'
      });
    });
  });
});