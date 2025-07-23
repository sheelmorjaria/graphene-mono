import { vi } from 'vitest';
import jwt from 'jsonwebtoken';

// Mock User model
const mockUser = {
  findById: vi.fn()
};

// Mock auth controller functions
const mockIsTokenBlacklisted = vi.fn();

// Mock logger
const mockLogError = vi.fn();

// Set up mocks before importing
vi.mock('../../models/User.js', () => ({
  default: mockUser
}));

vi.mock('../../controllers/authController.js', () => ({
  isTokenBlacklisted: mockIsTokenBlacklisted
}));

vi.mock('../../utils/logger.js', () => ({
  logError: mockLogError
}));

// Import after mocking
const { authenticate, requireRole, optionalAuth } = await import('../auth.js');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    
    req = {
      header: vi.fn(),
      user: null,
      token: null
    };
    
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    
    next = vi.fn();

    // Default JWT secret
    process.env.JWT_SECRET = 'test-secret-key';
  });

  describe('authenticate middleware', () => {
    it('should authenticate user with valid token', async () => {
      const mockUserData = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
        accountStatus: 'active',
        isActive: true
      };

      const token = jwt.sign({ userId: 'user123' }, 'test-secret-key');
      
      req.header.mockReturnValue(`Bearer ${token}`);
      mockIsTokenBlacklisted.mockReturnValue(false);
      mockUser.findById.mockResolvedValue(mockUserData);

      await authenticate(req, res, next);

      expect(req.user).toBe(mockUserData);
      expect(req.token).toBe(token);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject request without Authorization header', async () => {
      req.header.mockReturnValue(null);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied. No token provided.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid Authorization header format', async () => {
      req.header.mockReturnValue('InvalidFormat token123');

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied. No token provided.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject blacklisted token', async () => {
      const token = jwt.sign({ userId: 'user123' }, 'test-secret-key');
      
      req.header.mockReturnValue(`Bearer ${token}`);
      mockIsTokenBlacklisted.mockReturnValue(true);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token has been invalidated.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid JWT token', async () => {
      req.header.mockReturnValue('Bearer invalid-token');
      mockIsTokenBlacklisted.mockReturnValue(false);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject expired JWT token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user123', exp: Math.floor(Date.now() / 1000) - 3600 }, 
        'test-secret-key'
      );
      
      req.header.mockReturnValue(`Bearer ${expiredToken}`);
      mockIsTokenBlacklisted.mockReturnValue(false);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token has expired.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject token for non-existent user', async () => {
      const token = jwt.sign({ userId: 'nonexistent' }, 'test-secret-key');
      
      req.header.mockReturnValue(`Bearer ${token}`);
      mockIsTokenBlacklisted.mockReturnValue(false);
      mockUser.findById.mockResolvedValue(null);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token. User not found.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject token for disabled user account', async () => {
      const mockUserData = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
        accountStatus: 'disabled',
        isActive: true
      };

      const token = jwt.sign({ userId: 'user123' }, 'test-secret-key');
      
      req.header.mockReturnValue(`Bearer ${token}`);
      mockIsTokenBlacklisted.mockReturnValue(false);
      mockUser.findById.mockResolvedValue(mockUserData);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Account has been deactivated. Please contact support for assistance.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject token for inactive user account', async () => {
      const mockUserData = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
        accountStatus: 'active',
        isActive: false
      };

      const token = jwt.sign({ userId: 'user123' }, 'test-secret-key');
      
      req.header.mockReturnValue(`Bearer ${token}`);
      mockIsTokenBlacklisted.mockReturnValue(false);
      mockUser.findById.mockResolvedValue(mockUserData);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Account has been deactivated. Please contact support for assistance.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const token = jwt.sign({ userId: 'user123' }, 'test-secret-key');
      
      req.header.mockReturnValue(`Bearer ${token}`);
      mockIsTokenBlacklisted.mockReturnValue(false);
      mockUser.findById.mockRejectedValue(new Error('Database connection failed'));

      await authenticate(req, res, next);

      expect(mockLogError).toHaveBeenCalledWith(
        expect.any(Error),
        { context: 'authentication_middleware' }
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error during authentication.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireRole middleware', () => {
    it('should allow access for user with correct role', () => {
      req.user = { role: 'admin' };
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access for user with one of multiple allowed roles', () => {
      req.user = { role: 'moderator' };
      const middleware = requireRole(['admin', 'moderator']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for user without required role', () => {
      req.user = { role: 'user' };
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when user is not authenticated', () => {
      req.user = null;
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle single role as string', () => {
      req.user = { role: 'admin' };
      const middleware = requireRole('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle multiple roles as array', () => {
      req.user = { role: 'user' };
      const middleware = requireRole(['admin', 'moderator', 'user']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('optionalAuth middleware', () => {
    it('should continue without user when no token provided', async () => {
      req.header.mockReturnValue(null);

      await optionalAuth(req, res, next);

      expect(req.user).toBe(null);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should continue without user when invalid Authorization header', async () => {
      req.header.mockReturnValue('InvalidFormat token123');

      await optionalAuth(req, res, next);

      expect(req.user).toBe(null);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should attach user when valid token provided', async () => {
      const mockUserData = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
        accountStatus: 'active'
      };

      const token = jwt.sign({ userId: 'user123' }, 'test-secret-key');
      
      req.header.mockReturnValue(`Bearer ${token}`);
      mockUser.findById.mockResolvedValue(mockUserData);

      await optionalAuth(req, res, next);

      expect(req.user).toBe(mockUserData);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should continue without user when token is invalid', async () => {
      req.header.mockReturnValue('Bearer invalid-token');

      await optionalAuth(req, res, next);

      expect(req.user).toBe(null);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should continue without user when user is not found', async () => {
      const token = jwt.sign({ userId: 'nonexistent' }, 'test-secret-key');
      
      req.header.mockReturnValue(`Bearer ${token}`);
      mockUser.findById.mockResolvedValue(null);

      await optionalAuth(req, res, next);

      expect(req.user).toBe(null);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should continue without user when user account is inactive', async () => {
      const mockUserData = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
        accountStatus: 'disabled'
      };

      const token = jwt.sign({ userId: 'user123' }, 'test-secret-key');
      
      req.header.mockReturnValue(`Bearer ${token}`);
      mockUser.findById.mockResolvedValue(mockUserData);

      await optionalAuth(req, res, next);

      expect(req.user).toBe(null);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const token = jwt.sign({ userId: 'user123' }, 'test-secret-key');
      
      req.header.mockReturnValue(`Bearer ${token}`);
      mockUser.findById.mockRejectedValue(new Error('Database error'));

      await optionalAuth(req, res, next);

      expect(req.user).toBe(null);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});