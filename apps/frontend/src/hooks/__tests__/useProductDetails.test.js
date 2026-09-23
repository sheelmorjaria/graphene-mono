import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import useProductDetails from '../useProductDetails';
import * as productDetailsService from '../../services/productDetailsService';

// Mock the service
vi.mock('../../services/productDetailsService');

const mockProduct = {
  _id: 'product-123',
  name: 'GrapheneOS Pixel 9 Pro',
  slug: 'grapheneos-pixel-9-pro',
  shortDescription: 'Premium privacy-focused smartphone',
  longDescription: 'Detailed description here...',
  price: 899.99,
  images: ['https://example.com/image1.jpg'],
  condition: 'new',
  stockStatus: 'in_stock',
  stockQuantity: 25,
  attributes: [
    { name: 'Display', value: '6.3" OLED' }
  ],
  category: {
    _id: 'cat-123',
    name: 'Smartphones',
    slug: 'smartphones'
  }
};

describe('useProductDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state correctly', () => {
    productDetailsService.getProductBySlug.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useProductDetails('test-slug'));

    expect(result.current.product).toBe(null);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should fetch product successfully', async () => {
    productDetailsService.getProductBySlug.mockResolvedValue({
      success: true,
      data: mockProduct
    });

    const { result } = renderHook(() => useProductDetails('grapheneos-pixel-9-pro'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.product).toEqual(mockProduct);
    expect(result.current.error).toBe(null);
    expect(productDetailsService.getProductBySlug).toHaveBeenCalledWith('grapheneos-pixel-9-pro');
  });

  it('should handle API errors correctly', async () => {
    const errorMessage = 'Product not found';
    productDetailsService.getProductBySlug.mockResolvedValue({
      success: false,
      error: errorMessage
    });

    const { result } = renderHook(() => useProductDetails('non-existent-slug'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.product).toBe(null);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network error');
    productDetailsService.getProductBySlug.mockRejectedValue(networkError);

    const { result } = renderHook(() => useProductDetails('test-slug'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.product).toBe(null);
    expect(result.current.error).toBe('Network error');
  });

  it('should refetch product when refetch is called', async () => {
    productDetailsService.getProductBySlug
      .mockResolvedValueOnce({
        success: false,
        error: 'First error'
      })
      .mockResolvedValueOnce({
        success: true,
        data: mockProduct
      });

    const { result } = renderHook(() => useProductDetails('test-slug'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('First error');

    // Call refetch and await its returned promise so the assertion runs
    // only after the re-fetch has settled.
    await result.current.refetch();

    // Wait specifically for the refetched product (not just loading===false,
    // which can be satisfied by a stale read before the re-render lands).
    // This keeps the assertion robust to async/timing differences, including
    // under v8 coverage instrumentation.
    await waitFor(() => {
      expect(result.current.product).toEqual(mockProduct);
    });

    expect(result.current.error).toBe(null);
    expect(productDetailsService.getProductBySlug).toHaveBeenCalledTimes(2);
  });

  it('should update when slug changes', async () => {
    productDetailsService.getProductBySlug
      .mockResolvedValueOnce({
        success: true,
        data: { ...mockProduct, slug: 'first-product' }
      })
      .mockResolvedValueOnce({
        success: true,
        data: { ...mockProduct, slug: 'second-product' }
      });

    const { result, rerender } = renderHook(
      ({ slug }) => useProductDetails(slug),
      { initialProps: { slug: 'first-product' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.product.slug).toBe('first-product');

    // Change slug
    rerender({ slug: 'second-product' });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.product.slug).toBe('second-product');
    expect(productDetailsService.getProductBySlug).toHaveBeenCalledTimes(2);
    expect(productDetailsService.getProductBySlug).toHaveBeenNthCalledWith(1, 'first-product');
    expect(productDetailsService.getProductBySlug).toHaveBeenNthCalledWith(2, 'second-product');
  });

  it('should not fetch when slug is null or undefined', () => {
    const { result } = renderHook(() => useProductDetails(null));

    expect(result.current.product).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(productDetailsService.getProductBySlug).not.toHaveBeenCalled();
  });

  it('should reset state when starting new fetch', async () => {
    productDetailsService.getProductBySlug
      .mockResolvedValueOnce({
        success: true,
        data: mockProduct
      })
      .mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result, rerender } = renderHook(
      ({ slug }) => useProductDetails(slug),
      { initialProps: { slug: 'first-slug' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.product).toEqual(mockProduct);

    // Change to a new slug
    rerender({ slug: 'second-slug' });

    // Should reset to loading state
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
  });
});
describe('useProductDetails prerendered seed (soft-404 guard)', () => {
  const SEED_PRODUCT = { _id: 'p1', name: 'Seeded Pixel', slug: 'seeded-pixel' };
  const SEED = { success: true, data: SEED_PRODUCT };

  const installSeed = () => {
    const el = document.createElement('script');
    el.id = '__PRERENDER_PRODUCT__';
    el.type = 'application/json';
    el.textContent = JSON.stringify(SEED);
    document.body.appendChild(el);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.getElementById('__PRERENDER_PRODUCT__')?.remove();
  });

  afterEach(() => {
    document.getElementById('__PRERENDER_PRODUCT__')?.remove();
  });

  it('initializes the product from the embedded seed without any fetch', () => {
    installSeed();
    const { result } = renderHook(() => useProductDetails('seeded-pixel'));
    expect(result.current.product).toEqual(SEED_PRODUCT);
    expect(result.current.error).toBeNull();
  });

  it('keeps the seeded product and shows no error when the refetch for the SAME slug fails (Google renderer scenario)', async () => {
    installSeed();
    productDetailsService.getProductBySlug.mockRejectedValue(new TypeError('Failed to fetch'));

    const { result } = renderHook(() => useProductDetails('seeded-pixel'));
    await act(async () => {}); // let the effect's fetch settle

    expect(result.current.product).toEqual(SEED_PRODUCT);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('shows errors normally when fetching a DIFFERENT slug than the seed', async () => {
    installSeed();
    productDetailsService.getProductBySlug.mockResolvedValue({ success: false, error: 'Product not found' });

    const { result } = renderHook(() => useProductDetails('other-pixel'));
    await act(async () => {});

    expect(result.current.product).toBeNull();
    expect(result.current.error).toBe('Product not found');
  });
});
