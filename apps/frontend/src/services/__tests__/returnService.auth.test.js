import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getEligibleReturnItems,
  submitReturnRequest,
  getUserReturnRequests,
  getReturnRequestDetails
} from '../returnService';

// Regression: every /user/* call in returnService shipped without an
// Authorization header (cookie-era fetch pattern) — My Returns 401'd
// ("Access denied. No token provided") for every logged-in user.

const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

global.fetch = vi.fn();

const okResponse = () => ({
  ok: true,
  json: () => Promise.resolve({ success: true, data: {} })
});

describe('Return Service Authentication Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['getEligibleReturnItems', () => getEligibleReturnItems('507f1f77bcf86cd799439011')],
    ['submitReturnRequest', () => submitReturnRequest({ items: [] })],
    ['getUserReturnRequests', () => getUserReturnRequests({ page: 1 })],
    ['getReturnRequestDetails', () => getReturnRequestDetails('507f1f77bcf86cd799439012')]
  ])('%s sends the Bearer token', async (_name, invoke) => {
    mockLocalStorage.setItem('authToken', 'mock-jwt-token');
    fetch.mockResolvedValueOnce(okResponse());

    await invoke();

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, options] = fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer mock-jwt-token');
  });

  it('throws without calling the API when no token is present', async () => {
    await expect(getUserReturnRequests()).rejects.toThrow('No auth token found');
    expect(fetch).not.toHaveBeenCalled();
  });
});
