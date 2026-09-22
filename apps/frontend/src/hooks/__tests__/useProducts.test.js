import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useProducts from '../useProducts';

// Mock the products service
vi.mock('../../services/productsService', () => ({
  default: {
    getProducts: vi.fn()
  }
}));

import productsService from '../../services/productsService';

// Advance fake timers AND flush the queued microtasks (promise continuations)
// that run after the debounce timer fires. With a 300ms debounce in the hook,
// this is what actually drives setLoading/setProducts/setError inside act.
const flushDebounce = async () => {
  await act(async () => {
    vi.advanceTimersByTime(300);
    // Allow the inner async work (await productsService.getProducts) to settle
    await vi.runAllTicks();
  });
};

describe('useProducts hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
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
    act(() => {
      result.current.fetchProducts();
    });

    await flushDebounce();

    expect(result.current.loading).toBe(false);
    expect(result.current.products).toEqual(mockResponse.data);
    expect(result.current.pagination).toEqual(mockResponse.pagination);
    expect(result.current.error).toBe(null);
    expect(productsService.getProducts).toHaveBeenCalledWith({});
  });

  it('should handle API errors correctly', async () => {
    const errorMessage = 'Failed to fetch products';
    productsService.getProducts.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useProducts());

    act(() => {
      result.current.fetchProducts();
    });

    await flushDebounce();

    expect(result.current.loading).toBe(false);
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

    act(() => {
      result.current.fetchProducts(queryParams);
    });

    await flushDebounce();

    expect(result.current.loading).toBe(false);
    expect(productsService.getProducts).toHaveBeenCalledWith(queryParams);
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network error');
    networkError.name = 'NetworkError';
    productsService.getProducts.mockRejectedValue(networkError);

    const { result } = renderHook(() => useProducts());

    act(() => {
      result.current.fetchProducts();
    });

    await flushDebounce();

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
  });

  it('should handle API response with success: false', async () => {
    const errorResponse = {
      success: false,
      message: 'Server error'
    };

    productsService.getProducts.mockResolvedValue(errorResponse);

    const { result } = renderHook(() => useProducts());

    act(() => {
      result.current.fetchProducts();
    });

    await flushDebounce();

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Server error');
    expect(result.current.products).toEqual([]);
  });

  it('should reset error state on new fetch', async () => {
    // First, make a request that fails
    productsService.getProducts.mockRejectedValue(new Error('First error'));

    const { result } = renderHook(() => useProducts());

    act(() => {
      result.current.fetchProducts();
    });

    await flushDebounce();

    expect(result.current.error).toBe('First error');

    // Then make a successful request
    const mockResponse = {
      success: true,
      data: [],
      pagination: { page: 1, limit: 12, total: 0, pages: 0 }
    };

    productsService.getProducts.mockResolvedValue(mockResponse);

    // Start the new fetch; right after firing, loading flips on and error
    // is reset synchronously inside the (debounced) callback once it runs.
    act(() => {
      result.current.fetchProducts();
    });

    await flushDebounce();

    expect(result.current.loading).toBe(false);
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

    // Make multiple rapid calls; only the last debounce timer survives.
    act(() => {
      result.current.fetchProducts({ page: 1 });
      result.current.fetchProducts({ page: 2 });
      result.current.fetchProducts({ page: 3 });
    });

    await flushDebounce();

    expect(result.current.loading).toBe(false);
    // Should only make one API call (the last one)
    expect(productsService.getProducts).toHaveBeenCalledTimes(1);
    expect(productsService.getProducts).toHaveBeenCalledWith({ page: 3 });
  });
});
describe('useProducts prerendered seed (soft-404 guard)', () => {
  const SEED = {
    success: true,
    data: [{ _id: 'p1', name: 'Seeded Pixel', slug: 'seeded-pixel' }],
    pagination: { page: 1, limit: 12, total: 1, pages: 1 }
  };

  const installSeed = () => {
    const el = document.createElement('script');
    el.id = '__PRERENDER_PRODUCTS__';
    el.type = 'application/json';
    el.textContent = JSON.stringify(SEED);
    document.body.appendChild(el);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    document.getElementById('__PRERENDER_PRODUCTS__')?.remove();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.getElementById('__PRERENDER_PRODUCTS__')?.remove();
  });

  it('initializes products from the embedded seed without any fetch', () => {
    installSeed();
    const { result } = renderHook(() => useProducts());
    expect(result.current.products).toEqual(SEED.data);
    expect(result.current.pagination.total).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('keeps the seeded catalog and shows no error when the first refetch fails (Google renderer scenario)', async () => {
    installSeed();
    productsService.getProducts.mockRejectedValue(new TypeError('Failed to fetch'));

    const { result } = renderHook(() => useProducts());
    act(() => { result.current.fetchProducts({ sort: 'price-low' }); });
    await flushDebounce();

    expect(result.current.products).toEqual(SEED.data);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('shows errors normally for fetches AFTER the first (seed protection is one-shot)', async () => {
    installSeed();
    productsService.getProducts.mockResolvedValue({ success: true, data: SEED.data, pagination: SEED.pagination });

    const { result } = renderHook(() => useProducts());
    act(() => { result.current.fetchProducts({}); });
    await flushDebounce();

    productsService.getProducts.mockRejectedValue(new TypeError('Failed to fetch'));
    act(() => { result.current.fetchProducts({ sort: 'name-asc' }); });
    await flushDebounce();

    expect(result.current.error).toBe('Failed to fetch');
    expect(result.current.products).toEqual([]);
  });

  it('consumes the seed script so later mounts do not reuse stale data', () => {
    installSeed();
    const first = renderHook(() => useProducts());
    expect(first.result.current.products).toEqual(SEED.data);
    first.unmount();

    const second = renderHook(() => useProducts());
    expect(second.result.current.products).toEqual([]);
  });
});
