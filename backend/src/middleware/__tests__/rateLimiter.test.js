import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock express-rate-limit before importing
const mockRateLimit = vi.fn(() => vi.fn());

vi.mock('express-rate-limit', () => ({
  default: mockRateLimit
}));

// Import after mocking
const { apiLimiter, authLimiter, passwordResetLimiter } = await import('../rateLimiter.js');

describe('Rate Limiter Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('apiLimiter', () => {
    it('should export apiLimiter as middleware function', () => {
      expect(typeof apiLimiter).toBe('function');
    });
  });

  describe('authLimiter', () => {
    it('should export authLimiter as middleware function', () => {
      expect(typeof authLimiter).toBe('function');
    });
  });

  describe('passwordResetLimiter', () => {
    it('should export passwordResetLimiter as middleware function', () => {
      expect(typeof passwordResetLimiter).toBe('function');
    });
  });

  describe('Rate Limiter Exports', () => {
    it('should export three different middleware functions', () => {
      expect(apiLimiter).not.toBe(authLimiter);
      expect(authLimiter).not.toBe(passwordResetLimiter);
      expect(apiLimiter).not.toBe(passwordResetLimiter);
    });

    it('should have all limiters as functions', () => {
      expect(typeof apiLimiter).toBe('function');
      expect(typeof authLimiter).toBe('function');
      expect(typeof passwordResetLimiter).toBe('function');
    });
  });
});