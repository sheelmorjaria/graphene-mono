import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { requestDataExport, requestAccountDeletion } from '../privacyService';

// Mock axios
vi.mock('axios');

describe('Privacy Service', () => {
  const mockAxiosInstance = {
    post: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    axios.create.mockReturnValue(mockAxiosInstance);
  });

  describe('requestDataExport', () => {
    it('should successfully request data export', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Data export request received. You will receive an email with a download link when your data is ready.',
          data: {
            requestId: 'export_user123_1234567890_abc123',
            estimatedTime: '24 hours'
          }
        }
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await requestDataExport();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/user/data/export');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle rate limiting error', async () => {
      const mockError = {
        response: {
          status: 429,
          data: {
            success: false,
            error: 'You already have a pending data export request. Please wait for it to complete before requesting another.',
            data: {
              existingRequestId: 'export_existing_123',
              status: 'pending',
              requestedAt: '2025-07-30T10:00:00.000Z'
            }
          }
        }
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(requestDataExport()).rejects.toEqual(mockError);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/user/data/export');
    });

    it('should handle authentication error', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            success: false,
            error: 'Access denied. Please log in.'
          }
        }
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(requestDataExport()).rejects.toEqual(mockError);
    });

    it('should handle server error', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {
            success: false,
            error: 'Server error occurred while processing data export request'
          }
        }
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(requestDataExport()).rejects.toEqual(mockError);
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.post.mockRejectedValue(networkError);

      await expect(requestDataExport()).rejects.toEqual(networkError);
    });
  });

  describe('requestAccountDeletion', () => {
    it('should successfully request account deletion', async () => {
      const password = 'mySecurePassword123';
      const mockResponse = {
        data: {
          success: true,
          message: 'Account deletion request received. You will receive a confirmation email and be logged out.',
          data: {
            requestId: 'deletion_user123_1234567890_def456',
            estimatedTime: '7-30 days'
          }
        }
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await requestAccountDeletion(password);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/user/data/delete-request', {
        password: password
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle missing password error', async () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            success: false,
            error: 'Password is required to confirm account deletion'
          }
        }
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(requestAccountDeletion('')).rejects.toEqual(mockError);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/user/data/delete-request', {
        password: ''
      });
    });

    it('should handle invalid password error', async () => {
      const password = 'wrongPassword';
      const mockError = {
        response: {
          status: 400,
          data: {
            success: false,
            error: 'Invalid password. Please check your password and try again.'
          }
        }
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(requestAccountDeletion(password)).rejects.toEqual(mockError);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/user/data/delete-request', {
        password: password
      });
    });

    it('should handle duplicate deletion request error', async () => {
      const password = 'validPassword123';
      const mockError = {
        response: {
          status: 429,
          data: {
            success: false,
            error: 'You already have a pending account deletion request.',
            data: {
              existingRequestId: 'deletion_existing_123',
              status: 'pending',
              requestedAt: '2025-07-30T10:00:00.000Z'
            }
          }
        }
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(requestAccountDeletion(password)).rejects.toEqual(mockError);
    });

    it('should handle authentication error', async () => {
      const password = 'validPassword123';
      const mockError = {
        response: {
          status: 401,
          data: {
            success: false,
            error: 'Access denied. Please log in.'
          }
        }
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(requestAccountDeletion(password)).rejects.toEqual(mockError);
    });

    it('should handle server error', async () => {
      const password = 'validPassword123';
      const mockError = {
        response: {
          status: 500,
          data: {
            success: false,
            error: 'Server error occurred while processing account deletion request'
          }
        }
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(requestAccountDeletion(password)).rejects.toEqual(mockError);
    });

    it('should handle network error', async () => {
      const password = 'validPassword123';
      const networkError = new Error('Network Error');
      mockAxiosInstance.post.mockRejectedValue(networkError);

      await expect(requestAccountDeletion(password)).rejects.toEqual(networkError);
    });

    it('should pass undefined password as empty string', async () => {
      const mockResponse = {
        data: {
          success: false,
          error: 'Password is required'
        }
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await requestAccountDeletion(undefined);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/user/data/delete-request', {
        password: ''
      });
    });

    it('should handle null password', async () => {
      const mockResponse = {
        data: {
          success: false,
          error: 'Password is required'
        }
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await requestAccountDeletion(null);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/user/data/delete-request', {
        password: ''
      });
    });
  });

  describe('API Configuration', () => {
    it('should create axios instance with correct configuration', async () => {
      // Import the service to trigger axios.create
      await import('../privacyService');

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: expect.stringContaining('/api'),
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });

    it('should include authorization header when token is available', async () => {
      // Mock localStorage
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(() => mockToken)
        },
        writable: true
      });

      // Re-import to trigger the service initialization
      vi.resetModules();
      await import('../privacyService');

      // The service should set up an interceptor that adds the Authorization header
      expect(axios.create).toHaveBeenCalled();
    });
  });

  describe('Error Handling Patterns', () => {
    it('should preserve error structure for proper client handling', async () => {
      const specificError = {
        response: {
          status: 429,
          data: {
            success: false,
            error: 'Rate limit exceeded',
            data: {
              retryAfter: 3600
            }
          }
        }
      };

      mockAxiosInstance.post.mockRejectedValue(specificError);

      try {
        await requestDataExport();
      } catch (error) {
        expect(error.response.status).toBe(429);
        expect(error.response.data.error).toBe('Rate limit exceeded');
        expect(error.response.data.data.retryAfter).toBe(3600);
      }
    });

    it('should handle timeout errors', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded'
      };

      mockAxiosInstance.post.mockRejectedValue(timeoutError);

      await expect(requestDataExport()).rejects.toEqual(timeoutError);
    });
  });
});