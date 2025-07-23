import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import productsService from '../productsService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('productsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default environment
    import.meta.env = {
      VITE_API_BASE_URL: 'http://localhost:3000'
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getProducts', () => {
    it('should fetch products with default parameters', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: '1',
            name: 'GrapheneOS Pixel 9 Pro',
            price: 899.99
          }
        ],
        pagination: {
          page: 1,
          limit: 12,
          total: 1,
          pages: 1
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await productsService.getProducts();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/products',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should build query string with parameters', async () => {
      const mockResponse = { success: true, data: [], pagination: {} };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const params = {
        page: 2,
        limit: 6,
        sortBy: 'price',
        sortOrder: 'asc',
        category: 'smartphones',
        condition: 'new',
        minPrice: 100,
        maxPrice: 1000
      };

      await productsService.getProducts(params);

      const expectedUrl = 'http://localhost:3000/api/products?page=2&limit=6&sortBy=price&sortOrder=asc&category=smartphones&condition=new&minPrice=100&maxPrice=1000';
      
      expect(mockFetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(productsService.getProducts()).rejects.toThrow(
        'HTTP error! status: 500'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(productsService.getProducts()).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle invalid JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(productsService.getProducts()).rejects.toThrow(
        'Invalid JSON'
      );
    });

    it('should filter out undefined and null parameters', async () => {
      const mockResponse = { success: true, data: [], pagination: {} };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const params = {
        page: 1,
        category: undefined,
        condition: null,
        minPrice: 0,
        maxPrice: ''
      };

      await productsService.getProducts(params);

      // Should only include page and minPrice (0 is valid)
      const expectedUrl = 'http://localhost:3000/api/products?page=1&minPrice=0';
      
      expect(mockFetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should use environment variable for API base URL', async () => {
      import.meta.env.VITE_API_BASE_URL = 'https://api.example.com';
      
      const mockResponse = { success: true, data: [], pagination: {} };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await productsService.getProducts();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/products',
        expect.anything()
      );
    });

    it('should fall back to default URL when env var is not set', async () => {
      delete import.meta.env.VITE_API_BASE_URL;
      
      const mockResponse = { success: true, data: [], pagination: {} };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await productsService.getProducts();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/products',
        expect.anything()
      );
    });

    it('should handle 404 responses appropriately', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(productsService.getProducts()).rejects.toThrow(
        'HTTP error! status: 404'
      );
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      await expect(productsService.getProducts()).rejects.toThrow(
        'Request timeout'
      );
    });
  });
});