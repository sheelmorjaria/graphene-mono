import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchProducts } from '../searchService';

// Mock fetch globally
global.fetch = vi.fn();

describe('searchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('should search products successfully', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResponse
    });

    const result = await searchProducts('pixel');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/products/search?q=pixel',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    expect(result).toEqual(mockSearchResponse);
  });

  it('should search with options', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResponse
    });

    const options = {
      page: 2,
      limit: 6,
      sortBy: 'price',
      sortOrder: 'asc',
      condition: 'new',
      minPrice: 100,
      maxPrice: 500
    };

    await searchProducts('smartphone', options);

    const expectedUrl = 'http://localhost:3000/api/products/search?q=smartphone&page=2&limit=6&sortBy=price&sortOrder=asc&condition=new&minPrice=100&maxPrice=500';
    
    expect(fetch).toHaveBeenCalledWith(
      expectedUrl,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  });

  it('should handle empty search query', async () => {
    const result = await searchProducts('');

    expect(result).toEqual({
      success: false,
      error: 'Search query is required'
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('should handle whitespace-only search query', async () => {
    const result = await searchProducts('   ');

    expect(result).toEqual({
      success: false,
      error: 'Search query is required'
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it('should handle HTTP errors', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    const result = await searchProducts('pixel');

    expect(result).toEqual({
      success: false,
      error: 'HTTP error! status: 500'
    });
  });

  it('should handle network errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network connection failed'));

    const result = await searchProducts('pixel');

    expect(result).toEqual({
      success: false,
      error: 'Network connection failed'
    });
  });

  it('should handle malformed JSON responses', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Unexpected token in JSON');
      }
    });

    const result = await searchProducts('pixel');

    expect(result).toEqual({
      success: false,
      error: 'Unexpected token in JSON'
    });
  });

  it('should URL encode search query', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResponse
    });

    await searchProducts('pixel & smartphone');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/products/search?q=pixel+%26+smartphone',
      expect.anything()
    );
  });

  it('should filter out undefined options', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResponse
    });

    const options = {
      page: 1,
      limit: undefined,
      sortBy: 'price',
      sortOrder: undefined,
      condition: 'new',
      minPrice: undefined,
      maxPrice: 500
    };

    await searchProducts('pixel', options);

    const expectedUrl = 'http://localhost:3000/api/products/search?q=pixel&page=1&sortBy=price&condition=new&maxPrice=500';
    
    expect(fetch).toHaveBeenCalledWith(expectedUrl, expect.anything());
  });

  it('should handle server error responses', async () => {
    const errorResponse = {
      success: false,
      error: 'Search query is required'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => errorResponse
    });

    const result = await searchProducts('pixel');

    expect(result).toEqual(errorResponse);
  });

  it('should handle concurrent requests', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockSearchResponse
    });

    const promise1 = searchProducts('pixel');
    const promise2 = searchProducts('smartphone');
    const promise3 = searchProducts('case');

    const results = await Promise.all([promise1, promise2, promise3]);

    expect(results).toHaveLength(3);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('should handle special characters in search query', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResponse
    });

    await searchProducts('C++ programming');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/products/search?q=C%2B%2B+programming',
      expect.anything()
    );
  });

  it('should build query string correctly with all options', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearchResponse
    });

    const options = {
      page: 3,
      limit: 20,
      sortBy: 'name',
      sortOrder: 'desc',
      condition: 'excellent',
      minPrice: 200,
      maxPrice: 800,
      category: 'smartphones'
    };

    await searchProducts('test query', options);

    const expectedUrl = 'http://localhost:3000/api/products/search?q=test+query&page=3&limit=20&sortBy=name&sortOrder=desc&condition=excellent&minPrice=200&maxPrice=800&category=smartphones';
    
    expect(fetch).toHaveBeenCalledWith(expectedUrl, expect.anything());
  });
});