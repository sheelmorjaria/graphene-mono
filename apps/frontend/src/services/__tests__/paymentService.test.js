import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatCurrency,
  getPaymentMethods,
  paymentMethodTypes,
  validatePaymentMethod,
  requiresPaymentMethodSetup,
  createPayPalOrder,
  capturePayPalPayment,
} from '../paymentService';

// Mock fetch globally
global.fetch = vi.fn();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

describe('paymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('formatCurrency', () => {
    it('formats a number as GBP currency', () => {
      expect(formatCurrency(1234.5)).toBe('£1,234.50');
    });

    it('formats zero', () => {
      expect(formatCurrency(0)).toBe('£0.00');
    });

    it('rounds to two decimal places', () => {
      expect(formatCurrency(9.999)).toBe('£10.00');
    });
  });

  describe('getPaymentMethods', () => {
    it('fetches and returns the data array from the response', async () => {
      const methods = [{ id: 'paypal', name: 'PayPal' }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: methods }),
      });

      const result = await getPaymentMethods();

      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/payments/methods`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      expect(result).toEqual(methods);
    });

    it('throws with server error when response is not ok', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Methods unavailable' }),
      });

      await expect(getPaymentMethods()).rejects.toThrow('Methods unavailable');
    });

    it('throws generic message when response is not ok and no error field', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(getPaymentMethods()).rejects.toThrow(
        'Failed to fetch payment methods'
      );
    });

    it('rethrows when fetch rejects', async () => {
      fetch.mockRejectedValueOnce(new Error('Network down'));

      await expect(getPaymentMethods()).rejects.toThrow('Network down');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('paymentMethodTypes', () => {
    it('exposes the paypal payment method type', () => {
      expect(paymentMethodTypes.paypal).toEqual({
        name: 'PayPal',
        description: 'Pay with your PayPal account',
        icon: 'PayPalIcon',
        supportsInstantPayment: true,
      });
    });
  });

  describe('validatePaymentMethod', () => {
    it('returns true for a valid payment method type', () => {
      expect(validatePaymentMethod({ type: 'paypal' })).toBe(true);
    });

    it('throws when no payment method is provided', () => {
      expect(() => validatePaymentMethod(null)).toThrow(
        'Payment method is required'
      );
      expect(() => validatePaymentMethod(undefined)).toThrow(
        'Payment method is required'
      );
    });

    it('throws for an unknown payment method type', () => {
      expect(() => validatePaymentMethod({ type: 'bitcoin' })).toThrow(
        'Invalid payment method type'
      );
      expect(() => validatePaymentMethod({})).toThrow(
        'Invalid payment method type'
      );
    });
  });

  describe('requiresPaymentMethodSetup', () => {
    it('always returns false', () => {
      expect(requiresPaymentMethodSetup()).toBe(false);
    });
  });

  describe('createPayPalOrder', () => {
    it('creates a PayPal order and returns the data', async () => {
      const checkoutData = { amount: 100 };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: 'ORDER-123' } }),
      });

      const result = await createPayPalOrder(checkoutData);

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/payments/paypal/create-order`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(checkoutData),
        }
      );
      expect(result).toEqual({ id: 'ORDER-123' });
    });

    it('throws with server error when response is not ok', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Cannot create order' }),
      });

      await expect(createPayPalOrder({})).rejects.toThrow('Cannot create order');
    });

    it('throws generic message when response is not ok and no error field', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(createPayPalOrder({})).rejects.toThrow(
        'Failed to create PayPal order'
      );
    });

    it('rethrows when fetch rejects', async () => {
      fetch.mockRejectedValueOnce(new Error('Offline'));

      await expect(createPayPalOrder({})).rejects.toThrow('Offline');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('capturePayPalPayment', () => {
    it('captures a PayPal payment and returns the full response', async () => {
      const payload = { paypalOrderId: 'ORDER-123', payerId: 'PAYER-1' };
      const serverData = { success: true, captureId: 'CAP-1' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => serverData,
      });

      const result = await capturePayPalPayment(payload);

      expect(fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/payments/paypal/capture`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ paypalOrderId: 'ORDER-123', payerId: 'PAYER-1' }),
        }
      );
      expect(result).toEqual(serverData);
    });

    it('throws with server error when response is not ok', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Capture declined' }),
      });

      await expect(
        capturePayPalPayment({ paypalOrderId: 'X', payerId: 'Y' })
      ).rejects.toThrow('Capture declined');
    });

    it('throws generic message when response is not ok and no error field', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(
        capturePayPalPayment({ paypalOrderId: 'X', payerId: 'Y' })
      ).rejects.toThrow('Failed to capture PayPal payment');
    });

    it('rethrows when fetch rejects', async () => {
      fetch.mockRejectedValueOnce(new Error('Connection reset'));

      await expect(
        capturePayPalPayment({ paypalOrderId: 'X', payerId: 'Y' })
      ).rejects.toThrow('Connection reset');
      expect(console.error).toHaveBeenCalled();
    });
  });
});
