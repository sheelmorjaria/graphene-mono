import { vi } from 'vitest';
import { errorHandler } from '../errorHandler.js';

describe('Error Handler Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      method: 'GET',
      url: '/test',
      ip: '127.0.0.1'
    };
    
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      headersSent: false
    };
    
    mockNext = vi.fn();
    
    // Mock process.env
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle validation errors with 400 status', () => {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    error.errors = {
      email: { message: 'Email is required' },
      password: { message: 'Password is required' }
    };

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Email is required, Password is required'
    });
  });

  it('should handle mongoose duplicate key error with 400 status', () => {
    const error = new Error('Duplicate key error');
    error.code = 11000;
    error.keyPattern = { email: 1 };

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Duplicate field value entered'
    });
  });

  it('should handle JWT errors with 401 status', () => {
    const error = new Error('Invalid token');
    error.name = 'JsonWebTokenError';

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid token'
    });
  });

  it('should handle cast errors with 404 status', () => {
    const error = new Error('Cast error');
    error.name = 'CastError';
    error.path = 'userId';
    error.value = 'invalid-id';

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Resource not found'
    });
  });

  it('should handle errors with statusCode property', () => {
    const error = new Error('Too many requests');
    error.statusCode = 429;

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(429);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Too many requests'
    });
  });

  it('should handle errors with custom status codes', () => {
    const error = new Error('Custom error');
    error.statusCode = 403;

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Custom error'
    });
  });

  it('should handle generic errors with 500 status', () => {
    const error = new Error('Internal server error');

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal server error'
    });
  });

  it('should handle errors without message', () => {
    const error = new Error();
    error.message = '';

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Server Error'
    });
  });

  it('should handle TokenExpiredError', () => {
    const error = new Error('Token expired');
    error.name = 'TokenExpiredError';

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Token expired'
    });
  });

  it('should preserve original error message for unknown error types', () => {
    const error = new Error('Unknown error type');
    error.customProperty = 'custom value';

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Unknown error type'
    });
  });

  it('should handle errors with both statusCode and message', () => {
    const error = new Error('Custom message');
    error.statusCode = 422;

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(422);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Custom message'
    });
  });
});