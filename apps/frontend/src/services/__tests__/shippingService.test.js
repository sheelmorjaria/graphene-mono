import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateShippingRates,
  getShippingMethods,
  validateShippingMethod,
  formatCurrency
} from '../shippingService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage (shippingService reads 'authToken' optionally)
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
  statusText: ok ? 'OK' : 'Error',
  url: 'http://localhost:5000/api/shipping/calculate-rates',
  headers: {
    get: vi.fn(() => contentType)
  },
  json: async () => data,
  text: async () => JSON.stringify(data)
});

describe('shippingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateShippingRates', () => {
    it('posts cart items and address and returns rates', async () => {
      localStorageMock.setItem('authToken', 'user-token');
      const cartItems = [{ id: 'p1', qty: 1 }];
      const address = { country: 'GB' };
      const mockData = { success: true, rates: [{ method: 'standard', cost: 5.99 }] };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockData));

      const result = await calculateShippingRates(cartItems, address);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/shipping/calculate-rates',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer user-token'
          }),
          body: JSON.stringify({ cartItems, shippingAddress: address })
        })
      );
      expect(result).toEqual(mockData);
    });

    it('omits Authorization header when no token present', async () => {
      const mockData = { success: true, rates: [] };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockData));

      await calculateShippingRates([], { country: 'GB' });

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers.Authorization).toBeUndefined();
    });

    it('throws on non-ok response with JSON error', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(
        { error: 'Invalid address' },
        { ok: false, status: 400 }
      ));

      await expect(calculateShippingRates([], {})).rejects.toThrow('Invalid address');
    });

    it('throws default HTTP message when no error field', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 500 }));

      await expect(calculateShippingRates([], {})).rejects.toThrow(/HTTP 500/);
    });

    it('throws when content-type is not JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        url: 'http://localhost:5000/api/shipping/calculate-rates',
        headers: { get: vi.fn(() => 'text/plain') },
        text: async () => 'oops'
      });

      await expect(calculateShippingRates([], {})).rejects.toThrow(/invalid response format/);
    });
  });

  describe('getShippingMethods', () => {
    it('fetches the list of shipping methods', async () => {
      const mockData = { success: true, methods: [{ id: 'standard', name: 'Standard' }] };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockData));

      const result = await getShippingMethods();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/shipping/methods',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      );
      expect(result).toEqual(mockData);
    });

    it('includes Authorization header when token present', async () => {
      localStorageMock.setItem('authToken', 'user-token');
      mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, methods: [] }));

      await getShippingMethods();

      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer user-token');
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(
        { error: 'Methods unavailable' },
        { ok: false, status: 500 }
      ));

      await expect(getShippingMethods()).rejects.toThrow('Methods unavailable');
    });
  });

  describe('validateShippingMethod', () => {
    it('posts method, cart and address for validation', async () => {
      const mockData = { success: true, valid: true };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockData));

      const result = await validateShippingMethod('standard', [{ id: 'p1' }], { country: 'GB' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/shipping/validate-method',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            methodId: 'standard',
            cartItems: [{ id: 'p1' }],
            shippingAddress: { country: 'GB' }
          })
        })
      );
      expect(result).toEqual(mockData);
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(
        { error: 'Method not valid' },
        { ok: false, status: 400 }
      ));

      await expect(validateShippingMethod('x', [], {})).rejects.toThrow('Method not valid');
    });
  });

  describe('formatCurrency', () => {
    it('formats a number as GBP currency', () => {
      expect(formatCurrency(5.99)).toMatch(/5\.99/);
    });

    it('handles zero', () => {
      expect(formatCurrency(0)).toMatch(/0\.00/);
    });
  });
});
