import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import {
  adminLogin,
  getDashboardMetrics,
  getAdminProfile,
  isAdminAuthenticated,
  adminLogout,
  formatCurrency,
  formatNumber,
  getAdminUser,
  issueRefund
} from '../adminService';

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn(key => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.location
delete window.location;
window.location = { href: '' };

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    fetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('adminLogin', () => {
    it('successfully logs in admin user', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 'admin1',
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin'
          },
          token: 'mock-jwt-token'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const credentials = { email: 'admin@example.com', password: 'password123' };
      const result = await adminLogin(credentials);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/admin/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials)
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('throws error on failed login', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Invalid credentials'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse
      });

      const credentials = { email: 'admin@example.com', password: 'wrongpassword' };

      await expect(adminLogin(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('handles network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const credentials = { email: 'admin@example.com', password: 'password123' };

      await expect(adminLogin(credentials)).rejects.toThrow('Network error');
    });
  });

  describe('getDashboardMetrics', () => {
    it('successfully fetches dashboard metrics', async () => {
      const mockMetrics = {
        success: true,
        data: {
          orders: { total: 100, today: 5 },
          revenue: { total: 50000, today: 1000 },
          customers: { newToday: 2 }
        }
      };

      localStorageMock.setItem('adminToken', 'valid-token');
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics
      });

      const result = await getDashboardMetrics();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/admin/dashboard-metrics',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token'
          }
        }
      );

      expect(result).toEqual(mockMetrics);
    });

    it('throws error when no token is present', async () => {
      localStorageMock.removeItem('adminToken');

      await expect(getDashboardMetrics()).rejects.toThrow('No authentication token found');
    });

    it('redirects to login on unauthorized response', async () => {
      localStorageMock.setItem('adminToken', 'invalid-token');
      localStorageMock.setItem('adminUser', JSON.stringify({ id: 'admin1' }));

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      });

      await expect(getDashboardMetrics()).rejects.toThrow('Unauthorized');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('adminToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('adminUser');
      expect(window.location.href).toBe('/admin/login');
    });
  });

  describe('getAdminProfile', () => {
    it('successfully fetches admin profile', async () => {
      const mockProfile = {
        success: true,
        data: {
          user: {
            id: 'admin1',
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin'
          }
        }
      };

      localStorageMock.setItem('adminToken', 'valid-token');
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile
      });

      const result = await getAdminProfile();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/admin/profile',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token'
          }
        }
      );

      expect(result).toEqual(mockProfile);
    });

    it('throws error when no token is present', async () => {
      localStorageMock.removeItem('adminToken');

      await expect(getAdminProfile()).rejects.toThrow('No authentication token found');
    });
  });

  describe('isAdminAuthenticated', () => {
    it('returns true when valid admin token and user exist', () => {
      localStorageMock.setItem('adminToken', 'valid-token');
      localStorageMock.setItem('adminUser', JSON.stringify({ role: 'admin' }));

      expect(isAdminAuthenticated()).toBe(true);
    });

    it('returns false when no token exists', () => {
      localStorageMock.removeItem('adminToken');
      localStorageMock.removeItem('adminUser');

      expect(isAdminAuthenticated()).toBe(false);
    });

    it('returns false when user is not admin', () => {
      localStorageMock.setItem('adminToken', 'valid-token');
      localStorageMock.setItem('adminUser', JSON.stringify({ role: 'customer' }));

      expect(isAdminAuthenticated()).toBe(false);
    });

    it('returns false when user data is invalid JSON', () => {
      localStorageMock.setItem('adminToken', 'valid-token');
      localStorageMock.setItem('adminUser', 'invalid-json');

      expect(isAdminAuthenticated()).toBe(false);
    });
  });

  describe('adminLogout', () => {
    it('clears localStorage and redirects to login', () => {
      localStorageMock.setItem('adminToken', 'token');
      localStorageMock.setItem('adminUser', 'user-data');

      adminLogout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('adminToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('adminUser');
      expect(window.location.href).toBe('/admin/login');
    });
  });

  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('£1,234.56');
      expect(formatCurrency(0)).toBe('£0.00');
      expect(formatCurrency(999999.99)).toBe('£999,999.99');
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with commas', () => {
      expect(formatNumber(1234)).toBe('1,234');
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(999999)).toBe('999,999');
    });
  });

  describe('getAdminUser', () => {
    it('returns parsed user data when valid', () => {
      const userData = { id: 'admin1', email: 'admin@example.com', role: 'admin' };
      localStorageMock.setItem('adminUser', JSON.stringify(userData));

      expect(getAdminUser()).toEqual(userData);
    });

    it('returns null when no user data exists', () => {
      localStorageMock.removeItem('adminUser');

      expect(getAdminUser()).toBeNull();
    });

    it('returns null when user data is invalid JSON', () => {
      localStorageMock.setItem('adminUser', 'invalid-json');

      expect(getAdminUser()).toBeNull();
    });
  });

  describe('issueRefund', () => {
    beforeEach(() => {
      localStorageMock.setItem('adminToken', 'test-admin-token');
    });

    it('successfully issues a refund', async () => {
      const mockRefundResponse = {
        success: true,
        message: 'Refund of £50.00 processed successfully',
        data: {
          order: {
            _id: 'order123',
            orderNumber: 'TEST-001',
            refundAmount: 50,
            refundHistory: [{
              amount: 50,
              reason: 'Customer request',
              status: 'succeeded'
            }]
          },
          refund: {
            amount: 50,
            reason: 'Customer request',
            status: 'succeeded'
          }
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockRefundResponse)
      });

      const orderId = 'order123';
      const refundData = {
        refundAmount: 50,
        refundReason: 'Customer request'
      };

      const result = await issueRefund(orderId, refundData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/admin/orders/order123/refund',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-admin-token'
          },
          body: JSON.stringify(refundData)
        }
      );
      expect(result).toEqual(mockRefundResponse);
    });

    it('handles unauthorized requests', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Unauthorized'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValueOnce(mockErrorResponse)
      });

      const orderId = 'order123';
      const refundData = {
        refundAmount: 50,
        refundReason: 'Customer request'
      };

      const result = await issueRefund(orderId, refundData);
      
      expect(result).toBeUndefined();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('adminToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('adminUser');
      expect(window.location.href).toBe('/admin/login');
    });

    it('handles refund amount validation errors', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Refund amount exceeds maximum refundable amount'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValueOnce(mockErrorResponse)
      });

      const orderId = 'order123';
      const refundData = {
        refundAmount: 1000,
        refundReason: 'Customer request'
      };

      await expect(issueRefund(orderId, refundData)).rejects.toThrow('Refund amount exceeds maximum refundable amount');
    });

    it('throws error when no authentication token', async () => {
      localStorageMock.removeItem('adminToken');

      const orderId = 'order123';
      const refundData = {
        refundAmount: 50,
        refundReason: 'Customer request'
      };

      await expect(issueRefund(orderId, refundData)).rejects.toThrow('No authentication token found');
    });

    it('handles network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const orderId = 'order123';
      const refundData = {
        refundAmount: 50,
        refundReason: 'Customer request'
      };

      await expect(issueRefund(orderId, refundData)).rejects.toThrow('Network error');
    });
  });
});