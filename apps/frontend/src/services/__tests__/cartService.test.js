import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  formatCurrency
} from '../cartService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage (cartService reads 'authToken')
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn(key => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Helper to build a JSON fetch response
const jsonResponse = (data, { ok = true, status = 200, contentType = 'application/json' } = {}) => ({
  ok,
  status,
  headers: {
    get: vi.fn(() => contentType)
  },
  json: async () => data,
  text: async () => JSON.stringify(data)
});

describe('cartService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCart', () => {
    it('fetches cart successfully with auth token', async () => {
      localStorageMock.setItem('authToken', 'user-token');
      const mockCart = { success: true, items: [{ productId: 'p1', quantity: 2 }] };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockCart));

      const result = await getCart();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/cart',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer user-token'
          })
        })
      );
      expect(result).toEqual(mockCart);
    });

    it('omits Authorization header when no token present', async () => {
      const mockCart = { success: true, items: [] };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockCart));

      await getCart();

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(callArgs.headers.Authorization).toBeUndefined();
    });

    it('throws when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(
        { error: 'Failed to fetch cart' },
        { ok: false, status: 500 }
      ));

      await expect(getCart()).rejects.toThrow('Failed to fetch cart');
    });

    it('throws default message when response is not ok and no error field', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 500 }));

      await expect(getCart()).rejects.toThrow('Failed to fetch cart');
    });

    it('throws when content-type is not JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: vi.fn(() => 'text/html') },
        text: async () => '<html>error</html>'
      });

      await expect(getCart()).rejects.toThrow(/Cart API returned 200/);
    });

    it('throws when content-type header is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: vi.fn(() => null) },
        text: async () => 'no content type'
      });

      await expect(getCart()).rejects.toThrow(/Cart API returned 200/);
    });

    it('rethrows network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(getCart()).rejects.toThrow('Network error');
    });
  });

  describe('addToCart', () => {
    it('adds product with default quantity and no variationId', async () => {
      const mockResponse = { success: true, items: [{ productId: 'p1', quantity: 1 }] };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockResponse));

      const result = await addToCart('p1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/cart/add',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ productId: 'p1', quantity: 1 })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('includes quantity and variationId when provided', async () => {
      localStorageMock.setItem('authToken', 'tok');
      const mockResponse = { success: true };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockResponse));

      await addToCart('p1', 3, 'v2');

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.body).toBe(JSON.stringify({ productId: 'p1', quantity: 3, variationId: 'v2' }));
      expect(callArgs.headers.Authorization).toBe('Bearer tok');
    });

    it('throws when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(
        { error: 'Out of stock' },
        { ok: false, status: 400 }
      ));

      await expect(addToCart('p1', 1)).rejects.toThrow('Out of stock');
    });

    it('throws default message on failure without error field', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 400 }));

      await expect(addToCart('p1')).rejects.toThrow('Failed to add to cart');
    });

    it('rethrows network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(addToCart('p1')).rejects.toThrow('Network error');
    });
  });

  describe('updateCartItem', () => {
    it('updates item using productId as itemId when no variationId', async () => {
      const mockResponse = { success: true };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockResponse));

      const result = await updateCartItem('p1', 5);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/cart/item/p1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ quantity: 5 })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('builds composite itemId when variationId provided', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

      await updateCartItem('p1', 2, 'v3');

      expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:5000/api/cart/item/p1_v3');
    });

    it('includes auth header when token present', async () => {
      localStorageMock.setItem('authToken', 'tok');
      mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

      await updateCartItem('p1', 2);

      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
    });

    it('throws when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(
        { error: 'Invalid quantity' },
        { ok: false, status: 400 }
      ));

      await expect(updateCartItem('p1', 0)).rejects.toThrow('Invalid quantity');
    });

    it('throws default message on failure without error field', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 400 }));

      await expect(updateCartItem('p1', 1)).rejects.toThrow('Failed to update cart item');
    });

    it('rethrows network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(updateCartItem('p1', 1)).rejects.toThrow('Network error');
    });
  });

  describe('removeFromCart', () => {
    it('removes item using productId when no variationId', async () => {
      const mockResponse = { success: true };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockResponse));

      const result = await removeFromCart('p1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/cart/item/p1',
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include'
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('builds composite itemId when variationId provided', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

      await removeFromCart('p1', 'v4');

      expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:5000/api/cart/item/p1_v4');
    });

    it('throws when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(
        { error: 'Item not found' },
        { ok: false, status: 404 }
      ));

      await expect(removeFromCart('p1')).rejects.toThrow('Item not found');
    });

    it('throws default message on failure without error field', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 404 }));

      await expect(removeFromCart('p1')).rejects.toThrow('Failed to remove from cart');
    });

    it('rethrows network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(removeFromCart('p1')).rejects.toThrow('Network error');
    });
  });

  describe('clearCart', () => {
    it('clears the entire cart successfully', async () => {
      const mockResponse = { success: true, message: 'Cart cleared' };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockResponse));

      const result = await clearCart();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/cart/clear',
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include'
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('includes auth header when token present', async () => {
      localStorageMock.setItem('authToken', 'tok');
      mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

      await clearCart();

      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
    });

    it('throws when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(
        { error: 'Server error' },
        { ok: false, status: 500 }
      ));

      await expect(clearCart()).rejects.toThrow('Server error');
    });

    it('throws default message on failure without error field', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 500 }));

      await expect(clearCart()).rejects.toThrow('Failed to clear cart');
    });

    it('rethrows network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(clearCart()).rejects.toThrow('Network error');
    });
  });

  describe('formatCurrency', () => {
    it('formats whole numbers with 2 decimal places', () => {
      expect(formatCurrency(1234)).toBe('£1,234.00');
    });

    it('formats decimals correctly', () => {
      expect(formatCurrency(1234.56)).toBe('£1,234.56');
    });

    it('formats zero', () => {
      expect(formatCurrency(0)).toBe('£0.00');
    });

    it('formats large amounts with thousands separators', () => {
      expect(formatCurrency(999999.99)).toBe('£999,999.99');
    });
  });
});
