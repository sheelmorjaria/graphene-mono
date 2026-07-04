import { describe, it, expect, beforeEach, vi } from 'vitest';
import { submitContactForm } from '../supportService';

// Mock fetch globally
global.fetch = vi.fn();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

describe('supportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('submitContactForm', () => {
    it('submits the contact form and returns parsed JSON on success', async () => {
      const formData = { name: 'John', email: 'john@example.com', message: 'Hi' };
      const serverData = { success: true, message: 'Received' };

      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => serverData,
      });

      const result = await submitContactForm(formData);

      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/support/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      expect(result).toEqual(serverData);
    });

    it('returns null data when response has no JSON content-type', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: { get: () => 'text/plain' },
        json: async () => ({}),
      });

      const result = await submitContactForm({ name: 'x' });

      expect(result).toBeNull();
    });

    it('returns null when content-type header is missing', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({}),
      });

      const result = await submitContactForm({ name: 'x' });

      expect(result).toBeNull();
    });

    it('throws with server message when response is not ok and has JSON', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: { get: () => 'application/json' },
        json: async () => ({ message: 'Email is required' }),
      });

      await expect(submitContactForm({})).rejects.toThrow('Email is required');
    });

    it('throws generic status message when not ok and no data message', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: { get: () => 'application/json' },
        json: async () => ({}),
      });

      await expect(submitContactForm({})).rejects.toThrow(
        'Request failed with status 500'
      );
    });

    it('throws generic status message when not ok and non-json content-type', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        headers: { get: () => 'text/html' },
        json: async () => ({}),
      });

      await expect(submitContactForm({})).rejects.toThrow(
        'Request failed with status 502'
      );
    });

    it('throws "Invalid response format from server" when JSON parsing fails', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      });

      await expect(submitContactForm({})).rejects.toThrow(
        'Invalid response format from server'
      );
    });

    it('rethrows when fetch itself rejects', async () => {
      const networkError = new Error('Network failure');
      fetch.mockRejectedValueOnce(networkError);

      await expect(submitContactForm({})).rejects.toThrow('Network failure');
      expect(console.error).toHaveBeenCalled();
    });
  });
});
