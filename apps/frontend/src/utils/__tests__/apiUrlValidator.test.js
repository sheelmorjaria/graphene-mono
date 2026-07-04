import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateApiUrl, safeFetch } from '../apiUrlValidator';

describe('apiUrlValidator', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateApiUrl', () => {
    it('constructs a URL from base + endpoint', () => {
      const url = validateApiUrl('http://localhost:5000/api', '/products');
      expect(url).toBe('http://localhost:5000/api/products');
    });

    it('substitutes named params into the endpoint', () => {
      const url = validateApiUrl(
        'http://localhost:5000/api',
        '/products/${id}',
        { id: '123' }
      );
      expect(url).toBe('http://localhost:5000/api/products/123');
    });

    it('substitutes multiple named params', () => {
      const url = validateApiUrl(
        'http://localhost:5000/api',
        '/orders/${orderId}/items/${itemId}',
        { orderId: 'o1', itemId: 'i9' }
      );
      expect(url).toBe('http://localhost:5000/api/orders/o1/items/i9');
    });

    it('handles empty params object', () => {
      const url = validateApiUrl('http://localhost:5000/api', '/health');
      expect(url).toBe('http://localhost:5000/api/health');
    });

    it('throws when baseUrl is undefined', () => {
      expect(() => validateApiUrl(undefined, '/products')).toThrow(
        'API configuration error: Base URL is not defined'
      );
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('throws when baseUrl is the literal string "undefined"', () => {
      expect(() => validateApiUrl('undefined', '/products')).toThrow(
        'API configuration error: Base URL is not defined'
      );
    });

    it('throws when baseUrl is null', () => {
      expect(() => validateApiUrl(null, '/products')).toThrow(
        'API configuration error: Base URL is not defined'
      );
    });

    it('throws when an endpoint param is undefined', () => {
      expect(() =>
        validateApiUrl('http://localhost:5000/api', '/products/${id}', {})
      ).toThrow('Required parameter "id" is undefined');
    });

    it('throws when an endpoint param is null', () => {
      expect(() =>
        validateApiUrl(
          'http://localhost:5000/api',
          '/products/${id}',
          { id: null }
        )
      ).toThrow('Required parameter "id" is undefined');
    });

    it('throws when an endpoint param is the string "undefined"', () => {
      expect(() =>
        validateApiUrl(
          'http://localhost:5000/api',
          '/products/${id}',
          { id: 'undefined' }
        )
      ).toThrow('Required parameter "id" is undefined');
    });

    it('does not throw when param value is a falsy-but-defined value like 0', () => {
      const url = validateApiUrl(
        'http://localhost:5000/api',
        '/products/${id}',
        { id: 0 }
      );
      expect(url).toBe('http://localhost:5000/api/products/0');
    });
  });

  describe('safeFetch', () => {
    it('calls fetch with the validated URL and options', async () => {
      const mockResponse = { ok: true };
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(mockResponse);

      const result = await safeFetch(
        'http://localhost:5000/api',
        '/products',
        {},
        { method: 'GET' }
      );

      expect(fetchSpy).toHaveBeenCalledWith('http://localhost:5000/api/products', {
        method: 'GET'
      });
      expect(result).toBe(mockResponse);
    });

    it('passes fetchOptions through unchanged when omitted', async () => {
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue({ ok: true });

      await safeFetch('http://localhost:5000/api', '/products');

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:5000/api/products',
        {}
      );
    });

    it('rethrows when URL validation fails', async () => {
      const consoleErrorSpy2 = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      await expect(
        safeFetch(undefined, '/products')
      ).rejects.toThrow('API configuration error: Base URL is not defined');

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
