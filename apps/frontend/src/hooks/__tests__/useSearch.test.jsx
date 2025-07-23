import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useSearch from '../useSearch';

// Mock the search service
vi.mock('../../services/searchService', () => ({
  searchProducts: vi.fn()
}));

import { searchProducts as mockSearchProducts } from '../../services/searchService';

const mockSearchResponse = {
  success: true,
  data: {
    products: [
      {
        id: '1',
        name: 'GrapheneOS Pixel 9 Pro',
        slug: 'grapheneos-pixel-9-pro',
        price: 899.99,
        images: ['image1.jpg'],
        condition: 'new',
        stockStatus: 'in_stock',
        category: { name: 'Smartphones' }
      }
    ],
    totalProducts: 1,
    totalPages: 1,
    currentPage: 1
  }
};

describe('useSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSearch());

    expect(result.current.searchResults).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.performSearch).toBe('function');
  });

  it('should perform search successfully', async () => {
    mockSearchProducts.mockResolvedValue(mockSearchResponse);
    
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.performSearch('pixel');
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.searchResults).toEqual(mockSearchResponse.data);
    expect(result.current.error).toBeNull();
    expect(mockSearchProducts).toHaveBeenCalledWith('pixel', {});
  });

  it('should handle search with options', async () => {
    mockSearchProducts.mockResolvedValue(mockSearchResponse);
    
    const { result } = renderHook(() => useSearch());

    const searchOptions = {
      page: 2,
      sortBy: 'price',
      sortOrder: 'asc',
      condition: 'new'
    };

    act(() => {
      result.current.performSearch('smartphone', searchOptions);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockSearchProducts).toHaveBeenCalledWith('smartphone', searchOptions);
  });

  it('should handle search errors', async () => {
    const errorMessage = 'Network error';
    mockSearchProducts.mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.performSearch('pixel');
    });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.searchResults).toBeNull();
    expect(result.current.error).toBe(errorMessage);
  });

  it('should handle API error responses', async () => {
    const errorResponse = {
      success: false,
      error: 'Product not found'
    };
    mockSearchProducts.mockResolvedValue(errorResponse);
    
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.performSearch('nonexistent');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.searchResults).toBeNull();
    expect(result.current.error).toBe('Product not found');
  });

  it('should clear previous results when starting new search', async () => {
    mockSearchProducts.mockResolvedValue(mockSearchResponse);
    
    const { result } = renderHook(() => useSearch());

    // First search
    act(() => {
      result.current.performSearch('pixel');
    });

    await waitFor(() => {
      expect(result.current.searchResults).toEqual(mockSearchResponse.data);
    });

    // Second search should clear previous results
    mockSearchProducts.mockResolvedValue({
      success: true,
      data: { products: [], totalProducts: 0, totalPages: 0, currentPage: 1 }
    });

    act(() => {
      result.current.performSearch('nonexistent');
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.searchResults).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should not search with empty query', async () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.performSearch('');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.searchResults).toBeNull();
    expect(result.current.error).toBeNull();
    expect(mockSearchProducts).not.toHaveBeenCalled();
  });

  it('should not search with whitespace-only query', async () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.performSearch('   ');
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.searchResults).toBeNull();
    expect(result.current.error).toBeNull();
    expect(mockSearchProducts).not.toHaveBeenCalled();
  });

  it('should handle concurrent searches correctly', async () => {
    const firstResponse = {
      success: true,
      data: { products: [{ id: '1', name: 'First' }], totalProducts: 1, totalPages: 1, currentPage: 1 }
    };
    const secondResponse = {
      success: true,
      data: { products: [{ id: '2', name: 'Second' }], totalProducts: 1, totalPages: 1, currentPage: 1 }
    };

    mockSearchProducts
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(secondResponse);
    
    const { result } = renderHook(() => useSearch());

    // Start two searches quickly
    act(() => {
      result.current.performSearch('first');
      result.current.performSearch('second');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have the result from the second search
    expect(result.current.searchResults).toEqual(secondResponse.data);
  });

  it('should handle rapid search calls', async () => {
    mockSearchProducts.mockResolvedValue(mockSearchResponse);
    
    const { result } = renderHook(() => useSearch());

    // Make multiple rapid calls - only the last one should complete
    act(() => {
      result.current.performSearch('p');
      result.current.performSearch('pi');
      result.current.performSearch('pix');
      result.current.performSearch('pixel');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have the result from the final query
    expect(result.current.searchResults).toEqual(mockSearchResponse.data);
    expect(mockSearchProducts).toHaveBeenCalledWith('pixel', {});
  });

  it('should handle search cancellation', async () => {
    // Setup different responses for each call
    mockSearchProducts
      .mockResolvedValueOnce({
        success: true,
        data: { products: [{ id: '1', name: 'First' }], totalProducts: 1, totalPages: 1, currentPage: 1 }
      })
      .mockResolvedValueOnce({
        success: true,
        data: { products: [{ id: '2', name: 'Second' }], totalProducts: 1, totalPages: 1, currentPage: 1 }
      });

    const { result } = renderHook(() => useSearch());

    // Start a search
    act(() => {
      result.current.performSearch('pixel');
    });

    expect(result.current.loading).toBe(true);

    // Start another search immediately (should cancel the first)
    act(() => {
      result.current.performSearch('smartphone');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Both API calls are made, but only the second result should be set
    expect(mockSearchProducts).toHaveBeenCalledTimes(2);
    expect(result.current.searchResults.products[0].name).toBe('Second');
  });

  it('should maintain search options across calls', async () => {
    mockSearchProducts.mockResolvedValue(mockSearchResponse);
    
    const { result } = renderHook(() => useSearch());

    const options = { page: 2, sortBy: 'price' };

    act(() => {
      result.current.performSearch('pixel', options);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockSearchProducts).toHaveBeenCalledWith('pixel', options);
  });
});