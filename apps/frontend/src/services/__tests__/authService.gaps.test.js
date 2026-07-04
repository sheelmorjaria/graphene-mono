import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  isAuthenticated,
  getAuthToken,
  changePassword,
  forgotPassword,
  resetPassword
} from '../authService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage (authService reads/writes 'authToken')
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

const BASE = 'http://localhost:5000/api';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('registerUser', () => {
    it('POSTs to /auth/register and stores token on success', async () => {
      const payload = { success: true, data: { token: 'reg-token', user: { id: '1' } } };
      mockFetch.mockResolvedValueOnce(jsonResponse(payload));

      const result = await registerUser({ name: 'Alice', email: 'a@b.com', password: 'pw' });

      expect(mockFetch).toHaveBeenCalledWith(`${BASE}/auth/register`, expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Alice', email: 'a@b.com', password: 'pw' })
      }));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'reg-token');
      expect(result).toEqual(payload);
    });

    it('does not store token when response has no token', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: {} }));
      await registerUser({ name: 'Alice' });
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('throws with API error message on failure', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(
        { error: 'Email already in use' },
        { ok: false, status: 409 }
      ));
      await expect(registerUser({ name: 'Alice' })).rejects.toThrow('Email already in use');
    });

    it('throws default message on failure without error field', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 500 }));
      await expect(registerUser({ name: 'Alice' })).rejects.toThrow('Registration failed');
    });

    it('rethrows network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      await expect(registerUser({ name: 'Alice' })).rejects.toThrow('Network error');
    });
  });

  describe('loginUser', () => {
    it('POSTs to /auth/login and stores token on success', async () => {
      const payload = { success: true, data: { token: 'login-token', user: { id: '2' } } };
      mockFetch.mockResolvedValueOnce(jsonResponse(payload));

      const result = await loginUser({ email: 'a@b.com', password: 'pw' });

      expect(mockFetch).toHaveBeenCalledWith(`${BASE}/auth/login`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', password: 'pw' })
      }));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'login-token');
      expect(result).toEqual(payload);
    });

    it('does not store token when no token in response', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ data: {} }));
      await loginUser({ email: 'a@b.com', password: 'pw' });
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('throws with API error message on failure', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'Invalid credentials' }, { ok: false, status: 401 }));
      await expect(loginUser({ email: 'a@b.com', password: 'pw' })).rejects.toThrow('Invalid credentials');
    });

    it('throws default message on failure without error field', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 401 }));
      await expect(loginUser({ email: 'a@b.com', password: 'pw' })).rejects.toThrow('Login failed');
    });

    it('rethrows network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      await expect(loginUser({ email: 'a@b.com', password: 'pw' })).rejects.toThrow('Network error');
    });
  });

  describe('logoutUser', () => {
    it('calls /auth/logout with bearer token and clears local storage', async () => {
      localStorageMock.setItem('authToken', 'logout-token');
      mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

      await logoutUser();

      expect(mockFetch).toHaveBeenCalledWith(`${BASE}/auth/logout`, expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer logout-token'
        })
      }));
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    });

    it('does not call backend when no token present, but still clears storage', async () => {
      await logoutUser();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    });

    it('clears local storage even when logout API call throws', async () => {
      localStorageMock.setItem('authToken', 'logout-token');
      mockFetch.mockRejectedValueOnce(new Error('Logout API down'));

      await logoutUser();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    });
  });

  describe('getCurrentUser', () => {
    it('returns null when no token present', async () => {
      const result = await getCurrentUser();
      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('GETs /auth/profile with bearer token and returns user on success', async () => {
      localStorageMock.setItem('authToken', 'profile-token');
      const payload = { data: { user: { id: '5', name: 'Alice' } } };
      mockFetch.mockResolvedValueOnce(jsonResponse(payload));

      const result = await getCurrentUser();

      expect(mockFetch).toHaveBeenCalledWith(`${BASE}/auth/profile`, expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'Authorization': 'Bearer profile-token' })
      }));
      expect(result).toEqual({ id: '5', name: 'Alice' });
    });

    it('removes token and returns null when response is not ok', async () => {
      localStorageMock.setItem('authToken', 'bad-token');
      mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'Unauthorized' }, { ok: false, status: 401 }));

      const result = await getCurrentUser();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    });

    it('removes token and returns null on network error', async () => {
      localStorageMock.setItem('authToken', 'profile-token');
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getCurrentUser();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    });
  });

  describe('updateUserProfile', () => {
    it('throws when no auth token present', async () => {
      await expect(updateUserProfile({ name: 'New' })).rejects.toThrow('No authentication token found');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('PUTs to /auth/profile with bearer token and returns data on success', async () => {
      localStorageMock.setItem('authToken', 'update-token');
      const payload = { success: true, data: { user: { id: '5' } } };
      mockFetch.mockResolvedValueOnce(jsonResponse(payload));

      const result = await updateUserProfile({ name: 'New Name' });

      expect(mockFetch).toHaveBeenCalledWith(`${BASE}/auth/profile`, expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ 'Authorization': 'Bearer update-token' }),
        body: JSON.stringify({ name: 'New Name' })
      }));
      expect(result).toEqual(payload);
    });

    it('throws with API error message on failure', async () => {
      localStorageMock.setItem('authToken', 'update-token');
      mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'Validation failed' }, { ok: false, status: 400 }));

      await expect(updateUserProfile({ name: 'New' })).rejects.toThrow('Validation failed');
    });

    it('throws default message on failure without error field', async () => {
      localStorageMock.setItem('authToken', 'update-token');
      mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 500 }));

      await expect(updateUserProfile({ name: 'New' })).rejects.toThrow('Profile update failed');
    });

    it('rethrows network errors', async () => {
      localStorageMock.setItem('authToken', 'update-token');
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(updateUserProfile({ name: 'New' })).rejects.toThrow('Network error');
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when no token present', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('returns true when a token is present', () => {
      localStorageMock.setItem('authToken', 'present-token');
      expect(isAuthenticated()).toBe(true);
    });
  });

  describe('getAuthToken', () => {
    it('returns null when no token present', () => {
      expect(getAuthToken()).toBeNull();
    });

    it('returns the stored token when present', () => {
      localStorageMock.setItem('authToken', 'stored-token');
      expect(getAuthToken()).toBe('stored-token');
    });
  });

  describe('changePassword', () => {
    it('throws when no auth token present', async () => {
      await expect(changePassword({ currentPassword: 'a', newPassword: 'b' })).rejects.toThrow('No authentication token found');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('PUTs to /auth/password with bearer token, clears token, and returns data on success', async () => {
      localStorageMock.setItem('authToken', 'pw-token');
      const payload = { success: true };
      mockFetch.mockResolvedValueOnce(jsonResponse(payload));

      const result = await changePassword({ currentPassword: 'a', newPassword: 'b' });

      expect(mockFetch).toHaveBeenCalledWith(`${BASE}/auth/password`, expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ 'Authorization': 'Bearer pw-token' }),
        body: JSON.stringify({ currentPassword: 'a', newPassword: 'b' })
      }));
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(result).toEqual(payload);
    });

    it('throws with API error message on failure', async () => {
      localStorageMock.setItem('authToken', 'pw-token');
      mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'Wrong password' }, { ok: false, status: 400 }));

      await expect(changePassword({ currentPassword: 'a', newPassword: 'b' })).rejects.toThrow('Wrong password');
    });

    it('throws default message on failure without error field', async () => {
      localStorageMock.setItem('authToken', 'pw-token');
      mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 500 }));

      await expect(changePassword({ currentPassword: 'a', newPassword: 'b' })).rejects.toThrow('Password change failed');
    });

    it('rethrows network errors', async () => {
      localStorageMock.setItem('authToken', 'pw-token');
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(changePassword({ currentPassword: 'a', newPassword: 'b' })).rejects.toThrow('Network error');
    });
  });

  describe('forgotPassword', () => {
    it('POSTs to /auth/forgot-password and returns data on success', async () => {
      const payload = { success: true, message: 'Reset email sent' };
      mockFetch.mockResolvedValueOnce(jsonResponse(payload));

      const result = await forgotPassword({ email: 'a@b.com' });

      expect(mockFetch).toHaveBeenCalledWith(`${BASE}/auth/forgot-password`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com' })
      }));
      expect(result).toEqual(payload);
    });

    it('throws with API error message on failure', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'No such user' }, { ok: false, status: 404 }));
      await expect(forgotPassword({ email: 'a@b.com' })).rejects.toThrow('No such user');
    });

    it('throws default message on failure without error field', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 500 }));
      await expect(forgotPassword({ email: 'a@b.com' })).rejects.toThrow('Password reset request failed');
    });

    it('rethrows network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      await expect(forgotPassword({ email: 'a@b.com' })).rejects.toThrow('Network error');
    });
  });

  describe('resetPassword', () => {
    it('POSTs to /auth/reset-password and returns data on success', async () => {
      const payload = { success: true };
      mockFetch.mockResolvedValueOnce(jsonResponse(payload));

      const result = await resetPassword({ token: 'reset-tok', password: 'newpw' });

      expect(mockFetch).toHaveBeenCalledWith(`${BASE}/auth/reset-password`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ token: 'reset-tok', password: 'newpw' })
      }));
      expect(result).toEqual(payload);
    });

    it('throws with API error message on failure', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ error: 'Token expired' }, { ok: false, status: 400 }));
      await expect(resetPassword({ token: 'reset-tok', password: 'newpw' })).rejects.toThrow('Token expired');
    });

    it('throws default message on failure without error field', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 500 }));
      await expect(resetPassword({ token: 'reset-tok', password: 'newpw' })).rejects.toThrow('Password reset failed');
    });

    it('rethrows network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      await expect(resetPassword({ token: 'reset-tok', password: 'newpw' })).rejects.toThrow('Network error');
    });
  });
});
