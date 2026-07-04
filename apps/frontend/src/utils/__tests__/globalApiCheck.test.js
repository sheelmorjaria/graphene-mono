import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initGlobalApiValidation, validateEnvironment } from '../globalApiCheck';

describe('globalApiCheck', () => {
  let originalFetch;
  let consoleLogSpy;
  let consoleErrorSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    originalFetch = window.fetch;
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Always restore original fetch so subsequent tests get a clean window.fetch.
    window.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('initGlobalApiValidation', () => {
    it('overrides window.fetch with a validating wrapper', () => {
      initGlobalApiValidation();

      // window.fetch should now be a different function than the original.
      expect(window.fetch).not.toBe(originalFetch);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '✅ Global API validation initialized'
      );
    });

    it('blocks fetch calls whose URL contains "undefined"', async () => {
      const underlyingFetch = vi.fn();
      window.fetch = underlyingFetch;

      initGlobalApiValidation();

      await expect(
        window.fetch('http://localhost:5000/api/products/undefined')
      ).rejects.toThrow(/contains undefined values/);

      expect(underlyingFetch).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('passes through to original fetch for valid URLs', async () => {
      const mockResponse = { ok: true };
      const underlyingFetch = vi.fn().mockResolvedValue(mockResponse);
      window.fetch = underlyingFetch;

      initGlobalApiValidation();

      const result = await window.fetch('http://localhost:5000/api/products', {
        method: 'GET'
      });

      expect(underlyingFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/products',
        { method: 'GET' }
      );
      expect(result).toBe(mockResponse);
    });

    it('warns about double-slash malformed URLs (non-protocol)', async () => {
      const underlyingFetch = vi.fn().mockResolvedValue({ ok: true });
      window.fetch = underlyingFetch;

      initGlobalApiValidation();

      // URL has a "//" that is NOT part of a "://" protocol scheme, so the
      // warn branch should fire.
      await window.fetch('/api//products');

      expect(underlyingFetch).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('does not warn for protocol double slashes (://)', async () => {
      const underlyingFetch = vi.fn().mockResolvedValue({ ok: true });
      window.fetch = underlyingFetch;

      initGlobalApiValidation();

      await window.fetch('http://localhost:5000/api/products');

      expect(underlyingFetch).toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('logs API requests whose URL contains /api/', async () => {
      const underlyingFetch = vi.fn().mockResolvedValue({ ok: true });
      window.fetch = underlyingFetch;

      initGlobalApiValidation();

      await window.fetch('http://localhost:5000/api/products', {
        method: 'POST'
      });

      // Should have logged an API request (with the POST method)
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🌐 API Request:',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('uses default GET method when options omitted', async () => {
      const underlyingFetch = vi
        .fn()
        .mockResolvedValue({ ok: true });
      window.fetch = underlyingFetch;

      initGlobalApiValidation();

      await window.fetch('http://localhost:5000/api/products');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🌐 API Request:',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('validateEnvironment', () => {
    it('returns valid result when VITE_API_BASE_URL is set', () => {
      const result = validateEnvironment();

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('missingVars');
      expect(result).toHaveProperty('invalidVars');
      expect(Array.isArray(result.missingVars)).toBe(true);
      expect(Array.isArray(result.invalidVars)).toBe(true);
    });

    it('logs an environment check summary', () => {
      validateEnvironment();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '🔧 Environment Check:',
        expect.objectContaining({
          VITE_API_BASE_URL: expect.anything()
        })
      );
    });
  });
});
