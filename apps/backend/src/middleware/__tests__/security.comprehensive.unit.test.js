import { vi } from 'vitest';
import jwt from 'jsonwebtoken';

// Create comprehensive mocks
const mockUser = {
  findById: vi.fn()
};

const mockIsTokenBlacklisted = vi.fn();
const mockLogError = vi.fn();

// Mock external dependencies
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

describe('Security Middleware Comprehensive Tests', () => {
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

    // Set test environment
    process.env.JWT_SECRET = 'test-secret-key-for-security-testing';
  });

  describe('Authentication Security Tests', () => {
    describe('Token Format Validation', () => {
      it('should reject missing Authorization header', async () => {
        req.header.mockReturnValue(null);

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Access denied. No token provided.'
        });
        expect(next).not.toHaveBeenCalled();
      });

      it('should reject empty Authorization header', async () => {
        req.header.mockReturnValue('');

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Access denied. No token provided.'
        });
      });

      it('should reject malformed Bearer token (no space)', async () => {
        req.header.mockReturnValue('Bearer');

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Access denied. No token provided.'
        });
      });

      it('should reject Basic auth format', async () => {
        req.header.mockReturnValue('Basic dXNlcjpwYXNz');

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Access denied. No token provided.'
        });
      });

      it('should reject custom auth format', async () => {
        req.header.mockReturnValue('Custom token123');

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Access denied. No token provided.'
        });
      });

      it('should handle Bearer with multiple spaces', async () => {
        req.header.mockReturnValue('Bearer  token123');
        mockIsTokenBlacklisted.mockReturnValue(false);

        await authenticate(req, res, next);

        // Should extract token after first space
        expect(mockIsTokenBlacklisted).toHaveBeenCalledWith(' token123');
      });
    });

    describe('JWT Security Validation', () => {
      it('should reject tokens with invalid signatures', async () => {
        const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMTIzIn0.invalid_signature';
        
        req.header.mockReturnValue(`Bearer ${invalidToken}`);
        mockIsTokenBlacklisted.mockReturnValue(false);
        // Don't mock User.findById - the JWT verification should fail first

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid token.'
        });
      });

      it('should reject expired tokens', async () => {
        const expiredToken = jwt.sign(
          { userId: 'user123', exp: Math.floor(Date.now() / 1000) - 3600 }, 
          'test-secret-key-for-security-testing'
        );
        
        req.header.mockReturnValue(`Bearer ${expiredToken}`);
        mockIsTokenBlacklisted.mockReturnValue(false);

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Token has expired.'
        });
      });

      it('should reject tokens with malformed payload', async () => {
        const malformedToken = 'not.a.valid.jwt.token';
        
        req.header.mockReturnValue(`Bearer ${malformedToken}`);
        mockIsTokenBlacklisted.mockReturnValue(false);
        // Don't mock User.findById - JWT verification should fail first

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid token.'
        });
      });

      it('should handle tokens signed with different secret', async () => {
        const tokenWithWrongSecret = jwt.sign({ userId: 'user123' }, 'wrong-secret');
        
        req.header.mockReturnValue(`Bearer ${tokenWithWrongSecret}`);
        mockIsTokenBlacklisted.mockReturnValue(false);
        // Don't mock User.findById - JWT verification should fail first

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid token.'
        });
      });

      it('should handle tokens with missing claims', async () => {
        const tokenWithoutUserId = jwt.sign({ role: 'user' }, 'test-secret-key-for-security-testing');
        
        req.header.mockReturnValue(`Bearer ${tokenWithoutUserId}`);
        mockIsTokenBlacklisted.mockReturnValue(false);
        mockUser.findById.mockResolvedValue(null);

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid token. User not found.'
        });
      });
    });

    describe('Token Blacklist Security', () => {
      it('should reject blacklisted tokens immediately', async () => {
        const validToken = jwt.sign({ userId: 'user123' }, 'test-secret-key-for-security-testing');
        
        req.header.mockReturnValue(`Bearer ${validToken}`);
        mockIsTokenBlacklisted.mockReturnValue(true);

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Token has been invalidated.'
        });
        
        // Should not attempt user lookup for blacklisted tokens
        expect(mockUser.findById).not.toHaveBeenCalled();
      });

      it('should check blacklist before JWT verification', async () => {
        const expiredToken = jwt.sign(
          { userId: 'user123', exp: Math.floor(Date.now() / 1000) - 3600 }, 
          'test-secret-key-for-security-testing'
        );
        
        req.header.mockReturnValue(`Bearer ${expiredToken}`);
        mockIsTokenBlacklisted.mockReturnValue(true);

        await authenticate(req, res, next);

        // Should return blacklist error, not expiration error
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Token has been invalidated.'
        });
      });
    });

    describe('User Account Security', () => {
      it('should reject disabled user accounts', async () => {
        const validToken = jwt.sign({ userId: 'user123' }, 'test-secret-key-for-security-testing');
        const disabledUser = {
          _id: 'user123',
          email: 'test@example.com',
          accountStatus: 'disabled',
          isActive: true
        };
        
        req.header.mockReturnValue(`Bearer ${validToken}`);
        mockIsTokenBlacklisted.mockReturnValue(false);
        mockUser.findById.mockResolvedValue(disabledUser);

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Account has been deactivated. Please contact support for assistance.'
        });
      });

      it('should reject inactive user accounts', async () => {
        const validToken = jwt.sign({ userId: 'user123' }, 'test-secret-key-for-security-testing');
        const inactiveUser = {
          _id: 'user123',
          email: 'test@example.com',
          accountStatus: 'active',
          isActive: false
        };
        
        req.header.mockReturnValue(`Bearer ${validToken}`);
        mockIsTokenBlacklisted.mockReturnValue(false);
        mockUser.findById.mockResolvedValue(inactiveUser);

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Account has been deactivated. Please contact support for assistance.'
        });
      });

      it('should reject non-existent users', async () => {
        const validToken = jwt.sign({ userId: 'nonexistent' }, 'test-secret-key-for-security-testing');
        
        req.header.mockReturnValue(`Bearer ${validToken}`);
        mockIsTokenBlacklisted.mockReturnValue(false);
        mockUser.findById.mockResolvedValue(null);

        await authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid token. User not found.'
        });
      });

      it('should allow valid active users', async () => {
        const validToken = jwt.sign({ userId: 'user123' }, 'test-secret-key-for-security-testing');
        const activeUser = {
          _id: 'user123',
          email: 'test@example.com',
          accountStatus: 'active',
          isActive: true
        };
        
        req.header.mockReturnValue(`Bearer ${validToken}`);
        mockIsTokenBlacklisted.mockReturnValue(false);
        mockUser.findById.mockResolvedValue(activeUser);

        await authenticate(req, res, next);

        expect(req.user).toBe(activeUser);
        expect(req.token).toBe(validToken);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling Security', () => {
      it('should handle database connection errors securely', async () => {
        const validToken = jwt.sign({ userId: 'user123' }, 'test-secret-key-for-security-testing');
        
        req.header.mockReturnValue(`Bearer ${validToken}`);
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
      });

      it('should not leak sensitive information in error responses', async () => {
        const validToken = jwt.sign({ userId: 'user123' }, 'test-secret-key-for-security-testing');
        
        req.header.mockReturnValue(`Bearer ${validToken}`);
        mockIsTokenBlacklisted.mockReturnValue(false);
        mockUser.findById.mockRejectedValue(new Error('Internal database schema error with sensitive details'));

        await authenticate(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Server error during authentication.'
        });
        
        // Ensure sensitive error details are not exposed
        expect(res.json).not.toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining('schema')
          })
        );
      });
    });
  });

  describe('Role-based Access Control Security', () => {
    describe('Role Validation', () => {
      it('should require authentication first', () => {
        req.user = null;
        const middleware = requireRole('admin');

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Authentication required.'
        });
      });

      it('should enforce exact role match', () => {
        req.user = { role: 'customer' };
        const middleware = requireRole('admin');

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Insufficient permissions.'
        });
      });

      it('should handle multiple allowed roles', () => {
        req.user = { role: 'moderator' };
        const middleware = requireRole(['admin', 'moderator']);

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should handle single role as string', () => {
        req.user = { role: 'admin' };
        const middleware = requireRole('admin');

        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
      });

      it('should reject invalid role values', () => {
        req.user = { role: 'hacker' };
        const middleware = requireRole(['admin', 'moderator']);

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Insufficient permissions.'
        });
      });

      it('should handle undefined user role', () => {
        req.user = { email: 'test@example.com' }; // No role property
        const middleware = requireRole('admin');

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Insufficient permissions.'
        });
      });

      it('should handle empty role array', () => {
        req.user = { role: 'admin' };
        const middleware = requireRole([]);

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Insufficient permissions.'
        });
      });
    });

    describe('Role Escalation Prevention', () => {
      it('should not allow role modification through request', () => {
        req.user = { role: 'customer' };
        req.body = { role: 'admin' }; // Attempt to escalate
        
        const middleware = requireRole('admin');
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
      });

      it('should use only authenticated user role', () => {
        req.user = { role: 'customer' };
        req.headers = { 'x-role': 'admin' }; // Attempt header injection
        
        const middleware = requireRole('admin');
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
      });
    });
  });

  describe('Optional Authentication Security', () => {
    describe('Graceful Degradation', () => {
      it('should continue without user when no token provided', async () => {
        req.header.mockReturnValue(null);

        await optionalAuth(req, res, next);

        expect(req.user).toBe(null);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should continue without user on invalid token', async () => {
        req.header.mockReturnValue('Bearer invalid-token');

        await optionalAuth(req, res, next);

        expect(req.user).toBe(null);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should attach user when valid token provided', async () => {
        const validToken = jwt.sign({ userId: 'user123' }, 'test-secret-key-for-security-testing');
        const activeUser = {
          _id: 'user123',
          email: 'test@example.com',
          accountStatus: 'active'
        };
        
        req.header.mockReturnValue(`Bearer ${validToken}`);
        mockUser.findById.mockResolvedValue(activeUser);

        await optionalAuth(req, res, next);

        expect(req.user).toBe(activeUser);
        expect(next).toHaveBeenCalled();
      });

      it('should not attach inactive users', async () => {
        const validToken = jwt.sign({ userId: 'user123' }, 'test-secret-key-for-security-testing');
        const inactiveUser = {
          _id: 'user123',
          email: 'test@example.com',
          accountStatus: 'disabled'
        };
        
        req.header.mockReturnValue(`Bearer ${validToken}`);
        mockUser.findById.mockResolvedValue(inactiveUser);

        await optionalAuth(req, res, next);

        expect(req.user).toBe(null);
        expect(next).toHaveBeenCalled();
      });

      it('should handle database errors gracefully', async () => {
        const validToken = jwt.sign({ userId: 'user123' }, 'test-secret-key-for-security-testing');
        
        req.header.mockReturnValue(`Bearer ${validToken}`);
        mockUser.findById.mockRejectedValue(new Error('Database error'));

        await optionalAuth(req, res, next);

        expect(req.user).toBe(null);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });
    });
  });

  describe('Security Headers and Context', () => {
    it('should handle various header case variations', async () => {
      const validToken = jwt.sign({ userId: 'user123' }, 'test-secret-key-for-security-testing');
      
      // Test case insensitive header handling
      req.header.mockImplementation((headerName) => {
        if (headerName.toLowerCase() === 'authorization') {
          return `Bearer ${validToken}`;
        }
        return null;
      });
      
      const activeUser = {
        _id: 'user123',
        accountStatus: 'active',
        isActive: true
      };
      
      mockIsTokenBlacklisted.mockReturnValue(false);
      mockUser.findById.mockResolvedValue(activeUser);

      await authenticate(req, res, next);

      expect(req.user).toBe(activeUser);
      expect(next).toHaveBeenCalled();
    });

    it('should preserve original request context', async () => {
      const validToken = jwt.sign({ userId: 'user123' }, 'test-secret-key-for-security-testing');
      const activeUser = { _id: 'user123', accountStatus: 'active', isActive: true };
      
      req.method = 'POST';
      req.url = '/api/secure-endpoint';
      req.ip = '192.168.1.1';
      
      req.header.mockReturnValue(`Bearer ${validToken}`);
      mockIsTokenBlacklisted.mockReturnValue(false);
      mockUser.findById.mockResolvedValue(activeUser);

      await authenticate(req, res, next);

      // Ensure original request properties are preserved
      expect(req.method).toBe('POST');
      expect(req.url).toBe('/api/secure-endpoint');
      expect(req.ip).toBe('192.168.1.1');
      expect(req.user).toBe(activeUser);
      expect(req.token).toBe(validToken);
    });
  });
});