import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress
} from '../addressService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage (addressService reads 'authToken')
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
  url: 'http://localhost:5000/api/user/addresses',
  headers: {
    get: vi.fn(() => contentType)
  },
  json: async () => data,
  text: async () => JSON.stringify(data)
});

describe('addressService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getUserAddresses', () => {
    it('fetches addresses successfully with auth token', async () => {
      localStorageMock.setItem('authToken', 'user-token');
      const mockData = { success: true, addresses: [{ id: 'a1', line1: '123 St' }] };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockData));

      const result = await getUserAddresses();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/user/addresses',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer user-token'
          })
        })
      );
      expect(result).toEqual(mockData);
    });

    it('throws when no auth token is present', async () => {
      await expect(getUserAddresses()).rejects.toThrow('No authentication token found');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('throws when response is not ok (JSON error body)', async () => {
      localStorageMock.setItem('authToken', 'user-token');
      mockFetch.mockResolvedValueOnce(jsonResponse(
        { error: 'Unauthorized' },
        { ok: false, status: 401 }
      ));

      await expect(getUserAddresses()).rejects.toThrow('Unauthorized');
    });

    it('falls back to default HTTP error message when no error field', async () => {
      localStorageMock.setItem('authToken', 'user-token');
      mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 500 }));

      await expect(getUserAddresses()).rejects.toThrow(/HTTP 500/);
    });

    it('throws when content-type is not JSON', async () => {
      localStorageMock.setItem('authToken', 'user-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        url: 'http://localhost:5000/api/user/addresses',
        headers: { get: vi.fn(() => 'text/html'), entries: () => [['content-type', 'text/html']] },
        text: async () => '<html>error</html>'
      });

      await expect(getUserAddresses()).rejects.toThrow(/invalid response format/);
    });
  });

  describe('addUserAddress', () => {
    it('posts address data successfully with auth token', async () => {
      localStorageMock.setItem('authToken', 'user-token');
      const newAddress = { line1: '1 Main St', city: 'London', postcode: 'E1 1AA' };
      const mockData = { success: true, address: { id: 'a2', ...newAddress } };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockData));

      const result = await addUserAddress(newAddress);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/user/addresses',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newAddress)
        })
      );
      expect(result).toEqual(mockData);
    });

    it('throws when no auth token present', async () => {
      await expect(addUserAddress({ line1: 'x' })).rejects.toThrow('No authentication token found');
    });

    it('throws on non-ok response', async () => {
      localStorageMock.setItem('authToken', 'user-token');
      mockFetch.mockResolvedValueOnce(jsonResponse(
        { error: 'Validation failed' },
        { ok: false, status: 400 }
      ));

      await expect(addUserAddress({})).rejects.toThrow('Validation failed');
    });
  });

  describe('updateUserAddress', () => {
    it('puts address data to the address-specific URL', async () => {
      localStorageMock.setItem('authToken', 'user-token');
      const updates = { city: 'Manchester' };
      const mockData = { success: true, address: { id: 'a1', ...updates } };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockData));

      const result = await updateUserAddress('a1', updates);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/user/addresses/a1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates)
        })
      );
      expect(result).toEqual(mockData);
    });

    it('throws when no auth token present', async () => {
      await expect(updateUserAddress('a1', {})).rejects.toThrow('No authentication token found');
    });

    it('throws on non-ok response', async () => {
      localStorageMock.setItem('authToken', 'user-token');
      mockFetch.mockResolvedValueOnce(jsonResponse(
        { message: 'Not found' },
        { ok: false, status: 404 }
      ));

      await expect(updateUserAddress('missing', {})).rejects.toThrow('Not found');
    });
  });

  describe('deleteUserAddress', () => {
    it('deletes the address by id', async () => {
      localStorageMock.setItem('authToken', 'user-token');
      const mockData = { success: true };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockData));

      const result = await deleteUserAddress('a1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/user/addresses/a1',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(result).toEqual(mockData);
    });

    it('throws when no auth token present', async () => {
      await expect(deleteUserAddress('a1')).rejects.toThrow('No authentication token found');
    });

    it('throws on non-ok response', async () => {
      localStorageMock.setItem('authToken', 'user-token');
      mockFetch.mockResolvedValueOnce(jsonResponse(
        { error: 'Cannot delete' },
        { ok: false, status: 400 }
      ));

      await expect(deleteUserAddress('a1')).rejects.toThrow('Cannot delete');
    });
  });
});
