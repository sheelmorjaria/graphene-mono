import { vi } from 'vitest';
import { notFound } from '../notFound.js';

describe('NotFound Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    
    req = {
      originalUrl: '/api/nonexistent-endpoint'
    };
    
    res = {
      status: vi.fn().mockReturnThis()
    };
    
    next = vi.fn();
  });

  it('should create error with correct message and status', () => {
    notFound(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Not Found - /api/nonexistent-endpoint'
      })
    );
  });

  it('should handle root path', () => {
    req.originalUrl = '/';
    
    notFound(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Not Found - /'
      })
    );
  });

  it('should handle URLs with query parameters', () => {
    req.originalUrl = '/api/users?page=1&limit=10';
    
    notFound(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Not Found - /api/users?page=1&limit=10'
      })
    );
  });

  it('should handle URLs with fragments', () => {
    req.originalUrl = '/api/products#top';
    
    notFound(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Not Found - /api/products#top'
      })
    );
  });

  it('should handle long URLs', () => {
    req.originalUrl = '/api/very/long/path/that/does/not/exist/in/the/application/routes';
    
    notFound(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Not Found - /api/very/long/path/that/does/not/exist/in/the/application/routes'
      })
    );
  });

  it('should handle URLs with special characters', () => {
    req.originalUrl = '/api/search?q=user@example.com&sort=created_at';
    
    notFound(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Not Found - /api/search?q=user@example.com&sort=created_at'
      })
    );
  });

  it('should handle empty originalUrl', () => {
    req.originalUrl = '';
    
    notFound(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Not Found - '
      })
    );
  });

  it('should handle undefined originalUrl', () => {
    req.originalUrl = undefined;
    
    notFound(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Not Found - undefined'
      })
    );
  });

  it('should create Error instance', () => {
    notFound(req, res, next);

    const passedError = next.mock.calls[0][0];
    expect(passedError).toBeInstanceOf(Error);
    expect(passedError.message).toBe('Not Found - /api/nonexistent-endpoint');
  });

  it('should not call res.json() directly', () => {
    const jsonSpy = vi.fn();
    res.json = jsonSpy;
    
    notFound(req, res, next);

    expect(jsonSpy).not.toHaveBeenCalled();
  });

  it('should only call next() once', () => {
    notFound(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should pass error object to next middleware', () => {
    notFound(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});