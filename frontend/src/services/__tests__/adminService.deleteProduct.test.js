import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { deleteProduct } from '../adminService.js';

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  removeItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock window.location for logout redirects
delete window.location;
window.location = { href: '' };

describe('AdminService - Delete Product', () => {
  const mockToken = 'mock-jwt-token';
  const productId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    // Reset all mocks
    fetch.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.removeItem.mockClear();
    
    // Mock localStorage to return a valid token
    localStorageMock.getItem.mockReturnValue(mockToken);
    
    // Mock console.error to test error logging
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('Successful Product Deletion', () => {
    test('should successfully delete a product', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Product archived successfully'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await deleteProduct(productId);

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/admin/products/507f1f77bcf86cd799439011',
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });

    test('should use environment API URL when available', async () => {
      // Arrange
      const originalEnv = import.meta.env.VITE_API_BASE_URL;
      import.meta.env.VITE_API_BASE_URL = 'https://api.example.com';
      
      const mockResponse = {
        success: true,
        message: 'Product archived successfully'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      await deleteProduct(productId);

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/admin/products/507f1f77bcf86cd799439011',
        expect.any(Object)
      );

      // Cleanup
      import.meta.env.VITE_API_BASE_URL = originalEnv;
    });
  });

  describe('Authentication Handling', () => {
    test('should throw error when no token is available', async () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);

      // Act & Assert
      await expect(deleteProduct(productId)).rejects.toThrow('No authentication token found');
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should throw error when token is empty string', async () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue('');

      // Act & Assert
      await expect(deleteProduct(productId)).rejects.toThrow('No authentication token found');
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should include Authorization header with Bearer token', async () => {
      // Arrange
      const customToken = 'custom-token-123';
      localStorageMock.getItem.mockReturnValue(customToken);
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Act
      await deleteProduct(productId);

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${customToken}`
          })
        })
      );
    });
  });

  describe('Authorization Errors', () => {
    test('should handle 401 unauthorized error', async () => {
      // Arrange
      const mockErrorResponse = {
        error: 'Unauthorized access'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
      });

      // Act & Assert
      await expect(deleteProduct(productId)).rejects.toThrow('Unauthorized access');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('adminToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('adminUser');
      expect(window.location.href).toBe('/admin/login');
    });

    test('should handle 403 forbidden error', async () => {
      // Arrange
      const mockErrorResponse = {
        error: 'Access forbidden'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => mockErrorResponse,
      });

      // Act & Assert
      await expect(deleteProduct(productId)).rejects.toThrow('Access forbidden');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('adminToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('adminUser');
      expect(window.location.href).toBe('/admin/login');
    });

    test('should not redirect for non-auth errors', async () => {
      // Arrange
      const mockErrorResponse = {
        error: 'Product not found'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockErrorResponse,
      });

      // Act & Assert
      await expect(deleteProduct(productId)).rejects.toThrow('Product not found');
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
      expect(window.location.href).toBe('');
    });
  });

  describe('Error Handling', () => {
    test('should handle 400 bad request errors', async () => {
      // Arrange
      const mockErrorResponse = {
        error: 'Product ID is required'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
      });

      // Act & Assert
      await expect(deleteProduct(productId)).rejects.toThrow('Product ID is required');
      expect(console.error).toHaveBeenCalledWith('Delete product error:', expect.any(Error));
    });

    test('should handle 404 not found errors', async () => {
      // Arrange
      const mockErrorResponse = {
        error: 'Product not found'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockErrorResponse,
      });

      // Act & Assert
      await expect(deleteProduct(productId)).rejects.toThrow('Product not found');
    });

    test('should handle 500 server errors', async () => {
      // Arrange
      const mockErrorResponse = {
        error: 'Server error while archiving product'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => mockErrorResponse,
      });

      // Act & Assert
      await expect(deleteProduct(productId)).rejects.toThrow('Server error while archiving product');
    });

    test('should handle response without error message', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      // Act & Assert
      await expect(deleteProduct(productId)).rejects.toThrow('Failed to delete product');
    });

    test('should handle network errors', async () => {
      // Arrange
      fetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(deleteProduct(productId)).rejects.toThrow('Network error');
      expect(console.error).toHaveBeenCalledWith('Delete product error:', expect.any(Error));
    });

    test('should handle JSON parsing errors', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      // Act & Assert
      await expect(deleteProduct(productId)).rejects.toThrow('Invalid JSON');
    });
  });

  describe('Request Parameters Validation', () => {
    test('should construct correct URL with product ID', async () => {
      // Arrange
      const testProductId = 'test-product-123';
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Act
      await deleteProduct(testProductId);

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/admin/products/test-product-123',
        expect.any(Object)
      );
    });

    test('should use DELETE method', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Act
      await deleteProduct(productId);

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });

    test('should include Content-Type header', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Act
      await deleteProduct(productId);

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  describe('Response Processing', () => {
    test('should return parsed JSON response', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Product archived successfully',
        data: { productId }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await deleteProduct(productId);

      // Assert
      expect(result).toEqual(mockResponse);
    });

    test('should handle empty response body', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      // Act
      const result = await deleteProduct(productId);

      // Assert
      expect(result).toBeNull();
    });

    test('should handle response with additional data', async () => {
      // Arrange
      const mockResponse = {
        success: true,
        message: 'Product archived successfully',
        data: {
          productId,
          archivedAt: '2023-01-01T00:00:00Z',
          archivedBy: 'admin-user-id'
        },
        meta: {
          timestamp: '2023-01-01T00:00:00Z'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Act
      const result = await deleteProduct(productId);

      // Assert
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined product ID', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Act
      await deleteProduct(undefined);

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/admin/products/undefined',
        expect.any(Object)
      );
    });

    test('should handle null product ID', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Act
      await deleteProduct(null);

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/admin/products/null',
        expect.any(Object)
      );
    });

    test('should handle empty string product ID', async () => {
      // Arrange
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Act
      await deleteProduct('');

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/admin/products/',
        expect.any(Object)
      );
    });

    test('should handle special characters in product ID', async () => {
      // Arrange
      const specialId = 'product-123!@#$%^&*()';
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Act
      await deleteProduct(specialId);

      // Assert
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/admin/products/product-123!@#$%^&*()',
        expect.any(Object)
      );
    });
  });

  describe('Integration with getAdminToken', () => {
    test('should call getAdminToken to retrieve token', async () => {
      // Arrange
      const _mockGetAdminToken = vi.fn().mockReturnValue(mockToken);
      
      // We can't easily mock the import, so we'll verify localStorage.getItem is called
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Act
      await deleteProduct(productId);

      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith('adminToken');
    });

    test('should handle token retrieval failure', async () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);

      // Act & Assert
      await expect(deleteProduct(productId)).rejects.toThrow('No authentication token found');
      expect(fetch).not.toHaveBeenCalled();
    });
  });
});