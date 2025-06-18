import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkMaintenance } from '../maintenance.js';

describe('Maintenance Middleware', () => {
  let req, res, next;
  let originalMaintenanceMode;

  beforeEach(() => {
    // Store original environment variable
    originalMaintenanceMode = process.env.MAINTENANCE_MODE;

    req = {
      path: '/api/some-endpoint',
      user: null
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    next = vi.fn();

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment variable
    if (originalMaintenanceMode !== undefined) {
      process.env.MAINTENANCE_MODE = originalMaintenanceMode;
    } else {
      delete process.env.MAINTENANCE_MODE;
    }
  });

  describe('Normal Operation Mode', () => {
    beforeEach(() => {
      process.env.MAINTENANCE_MODE = 'false';
    });

    it('should allow requests when maintenance mode is disabled', () => {
      checkMaintenance(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should allow requests when MAINTENANCE_MODE is not set', () => {
      delete process.env.MAINTENANCE_MODE;

      checkMaintenance(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should allow requests when MAINTENANCE_MODE is empty string', () => {
      process.env.MAINTENANCE_MODE = '';

      checkMaintenance(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('Maintenance Mode Enabled', () => {
    beforeEach(() => {
      process.env.MAINTENANCE_MODE = 'true';
    });

    it('should block regular requests in maintenance mode', () => {
      checkMaintenance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'System is under maintenance. Please try again later.',
        maintenanceMode: true
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow health check requests in maintenance mode', () => {
      req.path = '/api/health';

      checkMaintenance(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should allow admin access in maintenance mode', () => {
      req.user = {
        id: 'admin123',
        role: 'admin',
        email: 'admin@example.com'
      };

      checkMaintenance(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should block non-admin users in maintenance mode', () => {
      req.user = {
        id: 'user123',
        role: 'customer',
        email: 'user@example.com'
      };

      checkMaintenance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'System is under maintenance. Please try again later.',
        maintenanceMode: true
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should block users with undefined role in maintenance mode', () => {
      req.user = {
        id: 'user123',
        email: 'user@example.com'
        // role is undefined
      };

      checkMaintenance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'System is under maintenance. Please try again later.',
        maintenanceMode: true
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should block moderator users in maintenance mode', () => {
      req.user = {
        id: 'mod123',
        role: 'moderator',
        email: 'moderator@example.com'
      };

      checkMaintenance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'System is under maintenance. Please try again later.',
        maintenanceMode: true
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle different MAINTENANCE_MODE string values', () => {
      const testCases = [
        { value: 'TRUE', expectBlocked: false }, // Case sensitive
        { value: 'True', expectBlocked: false },
        { value: '1', expectBlocked: false },
        { value: 'yes', expectBlocked: false },
        { value: 'true', expectBlocked: true }, // Only exact 'true' enables maintenance
      ];

      testCases.forEach(({ value, expectBlocked }) => {
        process.env.MAINTENANCE_MODE = value;
        vi.clearAllMocks();

        checkMaintenance(req, res, next);

        if (expectBlocked) {
          expect(res.status).toHaveBeenCalledWith(503);
          expect(next).not.toHaveBeenCalled();
        } else {
          expect(next).toHaveBeenCalledWith();
          expect(res.status).not.toHaveBeenCalled();
        }
      });
    });

    it('should handle requests without user object', () => {
      process.env.MAINTENANCE_MODE = 'true';
      req.user = undefined;

      checkMaintenance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'System is under maintenance. Please try again later.',
        maintenanceMode: true
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle health check path variations', () => {
      process.env.MAINTENANCE_MODE = 'true';
      
      const healthPaths = [
        '/api/health',
        '/api/health/',
        '/api/health?check=true'
      ];

      healthPaths.forEach(path => {
        req.path = path;
        vi.clearAllMocks();

        checkMaintenance(req, res, next);

        if (path === '/api/health') {
          expect(next).toHaveBeenCalledWith();
          expect(res.status).not.toHaveBeenCalled();
        } else {
          // Only exact '/api/health' is allowed
          expect(res.status).toHaveBeenCalledWith(503);
          expect(next).not.toHaveBeenCalled();
        }
      });
    });

    it('should handle null user object', () => {
      process.env.MAINTENANCE_MODE = 'true';
      req.user = null;

      checkMaintenance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle empty user object', () => {
      process.env.MAINTENANCE_MODE = 'true';
      req.user = {};

      checkMaintenance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Response Format', () => {
    beforeEach(() => {
      process.env.MAINTENANCE_MODE = 'true';
    });

    it('should return proper maintenance response format', () => {
      checkMaintenance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'System is under maintenance. Please try again later.',
        maintenanceMode: true
      });
    });

    it('should always return 503 status code in maintenance mode', () => {
      checkMaintenance(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.status).toHaveBeenCalledTimes(1);
    });

    it('should include maintenanceMode flag in response', () => {
      checkMaintenance(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          maintenanceMode: true
        })
      );
    });
  });

  describe('Multiple Calls', () => {
    it('should handle multiple sequential calls correctly', () => {
      process.env.MAINTENANCE_MODE = 'false';

      // First call
      checkMaintenance(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Enable maintenance mode
      process.env.MAINTENANCE_MODE = 'true';
      vi.clearAllMocks();

      // Second call
      checkMaintenance(req, res, next);
      expect(res.status).toHaveBeenCalledWith(503);
      expect(next).not.toHaveBeenCalled();
    });

    it('should not interfere with other middleware', () => {
      process.env.MAINTENANCE_MODE = 'false';
      
      const nextSpy = vi.fn();
      req.customProperty = 'test';

      checkMaintenance(req, res, nextSpy);

      expect(nextSpy).toHaveBeenCalledWith();
      expect(req.customProperty).toBe('test'); // Should not modify request
    });
  });
});