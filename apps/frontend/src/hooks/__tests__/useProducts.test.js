import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useProducts from '../useProducts';

// Mock the products service
vi.mock('../../services/productsService', () => ({
  default: {
    getProducts: vi.fn()
  }
}));

import productsService from '../../services/productsService';

describe('useProducts hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return initial state correctly', () => {
    const { result } = renderHook(() => useProducts());

    expect(result.current.products).toEqual([]);
    expect(result.current.pagination).toEqual({
      page: 1,
      limit: 12,
      total: 0,
      pages: 0
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.fetchProducts).toBe('function');
  });

  it('should fetch products successfully', async () => {
    const mockResponse = {
      success: true,
      data: [
        {
          id: '1',
          name: 'GrapheneOS Pixel 9 Pro',
          slug: 'grapheneos-pixel-9-pro',
          price: 899.99,
          condition: 'new',
          stockStatus: 'in_stock'
        },
        {
          id: '2',
          name: 'GrapheneOS Pixel 9',
          slug: 'grapheneos-pixel-9',
          price: 799.99,
          condition: 'excellent',
          stockStatus: 'in_stock'
        }
      ],
      pagination: {
        page: 1,
        limit: 12,
        total: 2,
        pages: 1
      }
    };

    productsService.getProducts.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useProducts());

    // Trigger fetch
    await act(async () => {
      result.current.fetchProducts();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual(mockResponse.data);
    expect(result.current.pagination).toEqual(mockResponse.pagination);
    expect(result.current.error).toBe(null);
    expect(productsService.getProducts).toHaveBeenCalledWith({});
  });

  it('should handle API errors correctly', async () => {
    const errorMessage = 'Failed to fetch products';
    productsService.getProducts.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useProducts());

    await act(async () => {
      result.current.fetchProducts();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual([]);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.pagination).toEqual({
      page: 1,
      limit: 12,
      total: 0,
      pages: 0
    });
  });

  it('should pass query parameters to API service', async () => {
    const mockResponse = {
      success: true,
      data: [],
      pagination: { page: 2, limit: 6, total: 0, pages: 0 }
    };

    productsService.getProducts.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useProducts());

    const queryParams = {
      page: 2,
      limit: 6,
      sortBy: 'price',
      sortOrder: 'asc',
      category: 'smartphones',
      condition: 'new',
      minPrice: 100,
      maxPrice: 1000
    };

    result.current.fetchProducts(queryParams);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(productsService.getProducts).toHaveBeenCalledWith(queryParams);
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network error');
    networkError.name = 'NetworkError';
    productsService.getProducts.mockRejectedValue(networkError);

    const { result } = renderHook(() => useProducts());

    result.current.fetchProducts();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
  });

  it('should handle API response with success: false', async () => {
    const errorResponse = {
      success: false,
      message: 'Server error'
    };

    productsService.getProducts.mockResolvedValue(errorResponse);

    const { result } = renderHook(() => useProducts());

    result.current.fetchProducts();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Server error');
    expect(result.current.products).toEqual([]);
  });

  it('should reset error state on new fetch', async () => {
    // First, make a request that fails
    productsService.getProducts.mockRejectedValue(new Error('First error'));
    
    const { result } = renderHook(() => useProducts());
    
    result.current.fetchProducts();
    
    await waitFor(() => {
      expect(result.current.error).toBe('First error');
    });

    // Then make a successful request
    const mockResponse = {
      success: true,
      data: [],
      pagination: { page: 1, limit: 12, total: 0, pages: 0 }
    };
    
    productsService.getProducts.mockResolvedValue(mockResponse);
    
    result.current.fetchProducts();
    
    // Error should be reset during loading
    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(null);
  });

  it('should debounce multiple rapid calls', async () => {
    const mockResponse = {
      success: true,
      data: [],
      pagination: { page: 1, limit: 12, total: 0, pages: 0 }
    };

    productsService.getProducts.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useProducts());

    // Make multiple rapid calls
    result.current.fetchProducts({ page: 1 });
    result.current.fetchProducts({ page: 2 });
    result.current.fetchProducts({ page: 3 });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should only make one API call (the last one)
    expect(productsService.getProducts).toHaveBeenCalledTimes(1);
    expect(productsService.getProducts).toHaveBeenCalledWith({ page: 3 });
  });
});