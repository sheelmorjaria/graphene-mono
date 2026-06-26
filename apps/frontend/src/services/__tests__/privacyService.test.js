import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requestDataExport, requestAccountDeletion } from '../privacyService';

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const mockToken = 'test-auth-token';

describe('Privacy Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(mockToken);
  });

  describe('requestDataExport', () => {
    it('should successfully request data export', async () => {
      const mockData = {
        success: true,
        message: 'Data export request received.',
        data: {
          requestId: 'export_user123_1234567890_abc123',
          estimatedTime: '24 hours',
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await requestDataExport();

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/user/data/export`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
        }
      );
      expect(result).toEqual(mockData);
    });

    it('should handle rate limiting error', async () => {
      const mockData = {
        success: false,
        error:
          'You already have a pending data export request. Please wait for it to complete before requesting another.',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockData,
      });

      await expect(requestDataExport()).rejects.toThrow(mockData.error);
    });

    it('should handle authentication error', async () => {
      const mockData = {
        success: false,
        error: 'Access denied. Please log in.',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockData,
      });

      await expect(requestDataExport()).rejects.toThrow(mockData.error);
    });

    it('should handle server error', async () => {
      const mockData = {
        success: false,
        error: 'Server error occurred while processing data export request',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockData,
      });

      await expect(requestDataExport()).rejects.toThrow(mockData.error);
    });

    it('should fall back to default message when error response has no message', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(requestDataExport()).rejects.toThrow(
        'Failed to request data export'
      );
    });

    it('should throw Authentication required when no token is available', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      await expect(requestDataExport()).rejects.toThrow('Authentication required');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network Error'));

      await expect(requestDataExport()).rejects.toThrow('Network Error');
    });
  });

  describe('requestAccountDeletion', () => {
    it('should successfully request account deletion', async () => {
      const password = 'mySecurePassword123';
      const mockData = {
        success: true,
        message: 'Account deletion request received.',
        data: {
          requestId: 'deletion_user123_1234567890_def456',
          estimatedTime: '7-30 days',
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await requestAccountDeletion(password);

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/user/data/delete-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          },
          body: JSON.stringify({ password }),
        }
      );
      expect(result).toEqual(mockData);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
    });

    it('should handle missing password error from server', async () => {
      const mockData = {
        success: false,
        error: 'Password is required to confirm account deletion',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockData,
      });

      await expect(requestAccountDeletion('')).rejects.toThrow(mockData.error);

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/user/data/delete-request`,
        expect.objectContaining({
          body: JSON.stringify({ password: '' }),
        })
      );
    });

    it('should handle invalid password error', async () => {
      const password = 'wrongPassword';
      const mockData = {
        success: false,
        error: 'Invalid password. Please check your password and try again.',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockData,
      });

      await expect(requestAccountDeletion(password)).rejects.toThrow(mockData.error);
    });

    it('should handle duplicate deletion request error', async () => {
      const password = 'validPassword123';
      const mockData = {
        success: false,
        error: 'You already have a pending account deletion request.',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockData,
      });

      await expect(requestAccountDeletion(password)).rejects.toThrow(mockData.error);
    });

    it('should handle authentication error', async () => {
      const password = 'validPassword123';
      const mockData = {
        success: false,
        error: 'Access denied. Please log in.',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockData,
      });

      await expect(requestAccountDeletion(password)).rejects.toThrow(mockData.error);
    });

    it('should handle server error', async () => {
      const password = 'validPassword123';
      const mockData = {
        success: false,
        error: 'Server error occurred while processing account deletion request',
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockData,
      });

      await expect(requestAccountDeletion(password)).rejects.toThrow(mockData.error);
    });

    it('should throw Authentication required when no token is available', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      await expect(requestAccountDeletion('password')).rejects.toThrow(
        'Authentication required'
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      const password = 'validPassword123';
      fetch.mockRejectedValueOnce(new Error('Network Error'));

      await expect(requestAccountDeletion(password)).rejects.toThrow('Network Error');
    });
  });
});
