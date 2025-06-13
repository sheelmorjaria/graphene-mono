import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as productDetailsService from '../../services/productDetailsService';

// Real API integration tests
// These tests can be run against a real backend or with mocked fetch
global.fetch = vi.fn();

const mockValidProduct = {
  success: true,
  data: {
    _id: '507f1f77bcf86cd799439011',
    name: 'GrapheneOS Pixel 9 Pro',
    slug: 'grapheneos-pixel-9-pro',
    shortDescription: 'Premium privacy-focused smartphone',
    longDescription: 'Detailed description of the GrapheneOS Pixel 9 Pro...',
    price: 899.99,
    images: [
      'https://example.com/pixel9pro-1.jpg',
      'https://example.com/pixel9pro-2.jpg'
    ],
    condition: 'new',
    stockStatus: 'in_stock',
    stockQuantity: 25,
    attributes: [
      { name: 'Display', value: '6.3" OLED, 120Hz' },
      { name: 'Storage', value: '256GB' },
      { name: 'RAM', value: '12GB' },
      { name: 'Color', value: 'Obsidian' }
    ],
    category: {
      _id: '507f1f77bcf86cd799439012',
      name: 'Smartphones',
      slug: 'smartphones'
    },
    isActive: true,
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2024-01-15T10:30:00.000Z'
  }
};


describe('Product Details API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch product details successfully', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockValidProduct
    });

    const result = await productDetailsService.getProductBySlug('grapheneos-pixel-9-pro');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/products/grapheneos-pixel-9-pro',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    expect(result).toEqual(mockValidProduct);
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('GrapheneOS Pixel 9 Pro');
    expect(result.data.slug).toBe('grapheneos-pixel-9-pro');
  });

  it('should handle product not found (404)', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    const result = await productDetailsService.getProductBySlug('non-existent-product');

    expect(result).toEqual({
      success: false,
      error: 'HTTP error! status: 404'
    });
  });

  it('should handle server errors (500)', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    const result = await productDetailsService.getProductBySlug('grapheneos-pixel-9-pro');

    expect(result).toEqual({
      success: false,
      error: 'HTTP error! status: 500'
    });
  });

  it('should handle network errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network connection failed'));

    const result = await productDetailsService.getProductBySlug('grapheneos-pixel-9-pro');

    expect(result).toEqual({
      success: false,
      error: 'Network connection failed'
    });
  });

  it('should handle malformed JSON responses', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Unexpected token in JSON');
      }
    });

    const result = await productDetailsService.getProductBySlug('grapheneos-pixel-9-pro');

    expect(result).toEqual({
      success: false,
      error: 'Unexpected token in JSON'
    });
  });

  it('should validate slug parameter', async () => {
    const result1 = await productDetailsService.getProductBySlug('');
    expect(result1).toEqual({
      success: false,
      error: 'Slug parameter is required'
    });

    const result2 = await productDetailsService.getProductBySlug(null);
    expect(result2).toEqual({
      success: false,
      error: 'Slug parameter is required'
    });

    const result3 = await productDetailsService.getProductBySlug(undefined);
    expect(result3).toEqual({
      success: false,
      error: 'Slug parameter is required'
    });

    const result4 = await productDetailsService.getProductBySlug('   ');
    expect(result4).toEqual({
      success: false,
      error: 'Slug parameter is required'
    });

    // Ensure no API calls were made for invalid slugs
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should handle special characters in slug', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockValidProduct
    });

    await productDetailsService.getProductBySlug('product-with-special-chars-123');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/products/product-with-special-chars-123',
      expect.anything()
    );
  });

  it('should handle very long slugs', async () => {
    const longSlug = 'a'.repeat(200);
    
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockValidProduct
    });

    await productDetailsService.getProductBySlug(longSlug);

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:3000/api/products/${longSlug}`,
      expect.anything()
    );
  });

  it('should handle API response with missing fields gracefully', async () => {
    const incompleteProduct = {
      success: true,
      data: {
        _id: '507f1f77bcf86cd799439011',
        name: 'Minimal Product',
        slug: 'minimal-product',
        price: 99.99,
        stockStatus: 'in_stock',
        condition: 'new'
        // Missing: images, description, attributes, category, etc.
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => incompleteProduct
    });

    const result = await productDetailsService.getProductBySlug('minimal-product');

    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Minimal Product');
    expect(result.data.images).toBeUndefined();
    expect(result.data.category).toBeUndefined();
  });

  it('should handle API timeout', async () => {
    // Mock a timeout scenario
    fetch.mockImplementationOnce(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 100)
      )
    );

    const result = await productDetailsService.getProductBySlug('slow-product');

    expect(result).toEqual({
      success: false,
      error: 'Request timeout'
    });
  });

  it('should handle concurrent API calls correctly', async () => {
    const slug1 = 'product-1';
    const slug2 = 'product-2';
    const slug3 = 'product-3';

    const response1 = { ...mockValidProduct, data: { ...mockValidProduct.data, slug: slug1 } };
    const response2 = { ...mockValidProduct, data: { ...mockValidProduct.data, slug: slug2 } };
    const response3 = { ...mockValidProduct, data: { ...mockValidProduct.data, slug: slug3 } };

    fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => response1
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => response2
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => response3
      });

    // Make concurrent calls
    const promises = [
      productDetailsService.getProductBySlug(slug1),
      productDetailsService.getProductBySlug(slug2),
      productDetailsService.getProductBySlug(slug3)
    ];

    const results = await Promise.all(promises);

    expect(results).toHaveLength(3);
    expect(results[0].data.slug).toBe(slug1);
    expect(results[1].data.slug).toBe(slug2);
    expect(results[2].data.slug).toBe(slug3);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('should handle rate limiting (429)', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests'
    });

    const result = await productDetailsService.getProductBySlug('grapheneos-pixel-9-pro');

    expect(result).toEqual({
      success: false,
      error: 'HTTP error! status: 429'
    });
  });

  it('should handle content-type validation', async () => {
    // Test with non-JSON response
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        'content-type': 'text/html'
      },
      json: async () => {
        throw new Error('Unexpected token < in JSON at position 0');
      }
    });

    const result = await productDetailsService.getProductBySlug('grapheneos-pixel-9-pro');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unexpected token');
  });

  it('should handle API response structure validation', async () => {
    // Test with unexpected response structure
    const invalidResponse = {
      // Missing 'success' field and wrong structure
      product: mockValidProduct.data,
      status: 'ok'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => invalidResponse
    });

    const result = await productDetailsService.getProductBySlug('grapheneos-pixel-9-pro');

    // Service should still return the response as-is
    expect(result).toEqual(invalidResponse);
  });

  it('should handle empty response body', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => null
    });

    const result = await productDetailsService.getProductBySlug('grapheneos-pixel-9-pro');

    expect(result).toBe(null);
  });

  it('should handle authentication errors (401)', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    });

    const result = await productDetailsService.getProductBySlug('grapheneos-pixel-9-pro');

    expect(result).toEqual({
      success: false,
      error: 'HTTP error! status: 401'
    });
  });

  it('should handle forbidden access (403)', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden'
    });

    const result = await productDetailsService.getProductBySlug('grapheneos-pixel-9-pro');

    expect(result).toEqual({
      success: false,
      error: 'HTTP error! status: 403'
    });
  });

  it('should maintain consistent API call format', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockValidProduct
    });

    await productDetailsService.getProductBySlug('test-product');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/products/test-product',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  });
});