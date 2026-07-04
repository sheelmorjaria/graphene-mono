import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getEmailPreferences, updateEmailPreferences } from '../profileService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage (profileService reads 'authToken')
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
const jsonResponse = (data, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  json: async () => data
});

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getEmailPreferences', () => {
    it('fetches preferences successfully', async () => {
      const mockData = { preferences: { globalUnsubscribe: false } };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockData));

      const result = await getEmailPreferences();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/webhook/email-preferences',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockData);
    });

    it('includes Authorization header when token present', async () => {
      localStorageMock.setItem('authToken', 'my-token');
      mockFetch.mockResolvedValueOnce(jsonResponse({ preferences: {} }));

      await getEmailPreferences();

      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer my-token');
    });

    it('omits Authorization header when no token', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ preferences: {} }));

      await getEmailPreferences();

      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
    });

    it('throws when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 500 }));

      await expect(getEmailPreferences()).rejects.toThrow('Failed to fetch email preferences');
    });

    it('rethrows network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(getEmailPreferences()).rejects.toThrow('Network error');
    });
  });

  describe('updateEmailPreferences', () => {
    it('updates preferences successfully', async () => {
      const preferences = { globalUnsubscribe: true };
      const mockResponse = { success: true };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockResponse));

      const result = await updateEmailPreferences(preferences);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/webhook/email-preferences',
        expect.objectContaining({
          method: 'PUT',
          credentials: 'include',
          body: JSON.stringify(preferences)
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('includes Authorization header when token present', async () => {
      localStorageMock.setItem('authToken', 'tok');
      mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

      await updateEmailPreferences({ globalUnsubscribe: false });

      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
    });

    it('throws server error message when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ message: 'Invalid preferences' }, { ok: false, status: 400 })
      );

      await expect(updateEmailPreferences({})).rejects.toThrow('Invalid preferences');
    });

    it('throws default message when response not ok and no message field', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 500 }));

      await expect(updateEmailPreferences({})).rejects.toThrow('Failed to update email preferences');
    });

    it('rethrows network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(updateEmailPreferences({})).rejects.toThrow('Network error');
    });
  });
});
