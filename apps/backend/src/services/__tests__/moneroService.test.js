import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

// Set environment variables before importing the service
process.env.NOWPAYMENTS_API_KEY = 'test-nowpayments-api-key';
process.env.NOWPAYMENTS_IPN_SECRET = 'test-webhook-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.BACKEND_URL = 'http://localhost:5000';

import moneroService from '../moneroService.js';

describe('MoneroService Tests', () => {
  let axiosGetSpy;
  let axiosPostSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set test environment variables  
    process.env.NODE_ENV = 'test';
    process.env.NOWPAYMENTS_API_KEY = 'test-nowpayments-api-key';
    process.env.NOWPAYMENTS_IPN_SECRET = 'test-webhook-secret';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.BACKEND_URL = 'http://localhost:5000';
    
    // Reinitialize service properties
    moneroService.nowPayments.apiKey = 'test-nowpayments-api-key';
    moneroService.nowPayments.ipnSecret = 'test-webhook-secret';
    
    // Mock axios methods using spyOn
    axiosGetSpy = vi.spyOn(axios, 'get').mockResolvedValue({ data: {} });
    axiosPostSpy = vi.spyOn(axios, 'post').mockResolvedValue({ data: {} });
    
    // Reset cache
    moneroService.exchangeRateCache = {
      rate: null,
      timestamp: null,
      validUntil: null
    };
  });

  describe('getExchangeRate', () => {
    it('should fetch exchange rate from CoinGecko API', async () => {
      // First mock NowPayments estimate call to fail (to trigger CoinGecko fallback)
      axiosGetSpy.mockRejectedValueOnce(new Error('NowPayments API error'));
      
      // Then mock CoinGecko success response
      const mockCoinGeckoResponse = {
        data: {
          monero: { gbp: 161.23 } // XMR price in GBP
        }
      };

      axiosGetSpy.mockResolvedValueOnce(mockCoinGeckoResponse);

      const result = await moneroService.getExchangeRate();

      // Should have called NowPayments first (which failed)
      expect(axiosGetSpy).toHaveBeenCalledWith(
        'https://api.nowpayments.io/v1/estimate',
        expect.objectContaining({
          params: {
            amount: 1,
            currency_from: 'gbp',
            currency_to: 'xmr'
          },
          headers: {
            'x-api-key': 'test-nowpayments-api-key'
          },
          timeout: 10000
        })
      );

      // Then should have called CoinGecko as fallback
      expect(axiosGetSpy).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price',
        expect.objectContaining({
          params: {
            ids: 'monero',
            vs_currencies: 'gbp',
            precision: 8
          },
          timeout: 10000
        })
      );

      // 1 GBP = 1/161.23 XMR ≈ 0.00620333 XMR
      expect(result.rate).toBeCloseTo(0.00620333, 5);
      expect(result.validUntil).toBeInstanceOf(Date);
    });

    it('should use cached rate when still valid', async () => {
      // Set up cache with future expiration
      const futureTime = Date.now() + 10 * 60 * 1000; // 10 minutes from now
      moneroService.exchangeRateCache = {
        rate: 0.005,
        timestamp: Date.now(),
        validUntil: futureTime
      };

      const result = await moneroService.getExchangeRate();

      expect(axiosGetSpy).not.toHaveBeenCalled();
      expect(result.rate).toBe(0.005);
    });

    it('should handle API errors gracefully', async () => {
      // Clear cache to force API call
      moneroService.exchangeRateCache = {
        rate: null,
        timestamp: null,
        validUntil: null
      };

      // Mock both NowPayments and CoinGecko to fail
      axiosGetSpy.mockRejectedValueOnce(new Error('NowPayments network error'));
      axiosGetSpy.mockRejectedValueOnce(new Error('CoinGecko network error'));

      await expect(moneroService.getExchangeRate()).rejects.toThrow(
        'Unable to fetch current Monero exchange rate'
      );
    });
  });

  describe('convertGbpToXmr', () => {
    beforeEach(() => {
      // Mock the NowPayments service's getExchangeRate method
      vi.spyOn(moneroService.nowPayments, 'getExchangeRate').mockResolvedValue({
        rate: 0.01, // 1 GBP = 0.01 XMR
        timestamp: Date.now(),
        validUntil: new Date(Date.now() + 5 * 60 * 1000)
      });
    });

    it('should convert GBP to XMR correctly', async () => {
      const result = await moneroService.convertGbpToXmr(100);

      expect(result.xmrAmount).toBe(1); // 100 * 0.01
      expect(result.exchangeRate).toBe(0.01);
      expect(result.validUntil).toBeInstanceOf(Date);
    });

    it('should handle decimal amounts correctly', async () => {
      const result = await moneroService.convertGbpToXmr(49.99);

      expect(result.xmrAmount).toBe(0.4999); // 49.99 * 0.01
    });
  });

  describe('createPaymentRequest', () => {
    it('should create payment request with GloBee API', async () => {
      const mockGloBeeResponse = {
        data: {
          id: 'globee-payment-123',
          payment_address: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
          total: 1.9999,
          currency: 'XMR',
          expiration_time: '2024-01-01T12:00:00Z',
          payment_url: 'https://globee.com/payment/123',
          status: 'pending'
        }
      };

      axiosPostSpy.mockResolvedValueOnce(mockGloBeeResponse);

      const paymentData = {
        orderId: 'order-123',
        amount: 1.9999,
        currency: 'XMR',
        customerEmail: 'test@example.com'
      };

      const result = await moneroService.createPaymentRequest(paymentData);

      expect(axiosPostSpy).toHaveBeenCalledWith(
        'https://api.globee.com/v1/payment-request',
        expect.objectContaining({
          total: 1.9999,
          currency: 'XMR',
          order_id: 'order-123',
          customer_email: 'test@example.com'
        }),
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer test-globee-api-key',
            'Content-Type': 'application/json'
          }
        })
      );

      expect(result).toEqual({
        paymentId: 'globee-payment-123',
        address: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
        amount: 1.9999,
        currency: 'XMR',
        expirationTime: '2024-01-01T12:00:00Z',
        paymentUrl: 'https://globee.com/payment/123',
        status: 'pending'
      });
    });

    it('should handle missing API key', async () => {
      const originalApiKey = moneroService.nowPayments.apiKey;
      moneroService.nowPayments.apiKey = null;

      await expect(moneroService.createPaymentRequest({
        orderId: 'test',
        amount: 1.0
      })).rejects.toThrow('NowPayments API key not configured');

      moneroService.nowPayments.apiKey = originalApiKey;
    });
  });

  describe('getPaymentStatus', () => {
    it('should fetch payment status from GloBee', async () => {
      const mockStatusResponse = {
        data: {
          id: 'payment-123',
          status: 'paid',
          confirmations: 12,
          paid_amount: 1.5,
          transaction_hash: 'abc123',
          payment_address: '4AdUndXHHZ...',
          created_at: '2024-01-01T10:00:00Z',
          expires_at: '2024-01-02T10:00:00Z'
        }
      };

      axiosGetSpy.mockResolvedValueOnce(mockStatusResponse);

      const result = await moneroService.getPaymentStatus('payment-123');

      expect(axiosGetSpy).toHaveBeenCalledWith(
        'https://api.nowpayments.io/v1/payment/payment-123',
        expect.objectContaining({
          headers: {
            'x-api-key': 'test-nowpayments-api-key'
          },
          timeout: 10000
        })
      );

      expect(result).toEqual({
        id: 'payment-123',
        status: 'paid',
        confirmations: 12,
        paid_amount: 1.5,
        transaction_hash: 'abc123',
        payment_address: '4AdUndXHHZ...',
        created_at: '2024-01-01T10:00:00Z',
        expires_at: '2024-01-02T10:00:00Z'
      });
    });
  });

  describe('processWebhookNotification', () => {
    it('should process confirmed payment webhook', () => {
      const webhookData = {
        id: 'payment-123',
        status: 'paid',
        confirmations: 12,
        paid_amount: 1.5,
        total_amount: 1.5,
        transaction_hash: 'abc123',
        order_id: 'order-456'
      };

      const result = moneroService.processWebhookNotification(webhookData);

      expect(result).toEqual({
        paymentId: 'payment-123',
        orderId: 'order-456',
        status: 'confirmed', // Because confirmations >= 10
        confirmations: 12,
        paidAmount: 1.5,
        totalAmount: 1.5,
        transactionHash: 'abc123',
        isFullyConfirmed: true,
        requiresAction: false
      });
    });

    it('should detect underpaid transactions', () => {
      const webhookData = {
        id: 'payment-123',
        status: 'underpaid',
        confirmations: 5,
        paid_amount: 1.2,
        total_amount: 1.5,
        order_id: 'order-456'
      };

      const result = moneroService.processWebhookNotification(webhookData);

      expect(result.status).toBe('underpaid');
      expect(result.requiresAction).toBe(true);
      expect(result.isFullyConfirmed).toBe(false);
    });

    it('should handle partially confirmed payments', () => {
      const webhookData = {
        id: 'payment-123',
        status: 'paid',
        confirmations: 5, // Less than required 10
        paid_amount: 1.5,
        total_amount: 1.5,
        order_id: 'order-456'
      };

      const result = moneroService.processWebhookNotification(webhookData);

      expect(result.status).toBe('partially_confirmed');
      expect(result.isFullyConfirmed).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    it('should format XMR amounts correctly', () => {
      expect(moneroService.formatXmrAmount(1.000000000000)).toBe('1');
      expect(moneroService.formatXmrAmount(1.234567890123)).toBe('1.234567890123');
      expect(moneroService.formatXmrAmount(0.000000001000)).toBe('0.000000001');
    });

    it('should calculate payment expiration correctly', () => {
      const createdAt = new Date('2024-01-01T10:00:00Z');
      const expiration = moneroService.getPaymentExpirationTime(createdAt);
      
      const expectedExpiration = new Date('2024-01-02T10:00:00Z'); // 24 hours later
      expect(expiration).toEqual(expectedExpiration);
    });

    it('should detect expired payments', () => {
      const past = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const recent = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
      
      expect(moneroService.isPaymentExpired(past)).toBe(true);
      expect(moneroService.isPaymentExpired(recent)).toBe(false);
    });

    it('should return correct constants', () => {
      expect(moneroService.getRequiredConfirmations()).toBe(10);
      expect(moneroService.getPaymentWindowHours()).toBe(24);
    });
  });
});