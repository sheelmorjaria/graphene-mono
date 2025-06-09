import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import axios from 'axios';
import moneroService from '../moneroService.js';

// Mock axios
jest.mock('axios');

describe('MoneroService Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set test environment variables
    process.env.GLOBEE_API_KEY = 'test-api-key';
    process.env.GLOBEE_WEBHOOK_SECRET = 'test-webhook-secret';
    
    // Reset cache
    moneroService.exchangeRateCache = {
      rate: null,
      timestamp: null,
      validUntil: null
    };
  });

  describe('getExchangeRate', () => {
    it('should fetch exchange rate from CoinGecko API', async () => {
      const mockResponse = {
        data: {
          monero: { gbp: 0.005432 }
        }
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      const result = await moneroService.getExchangeRate();

      expect(axios.get).toHaveBeenCalledWith(
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

      expect(result).toEqual({
        rate: expect.any(Number),
        validUntil: expect.any(Date)
      });
      
      expect(result.rate).toBeCloseTo(1 / 0.005432, 6);
    });

    it('should handle API errors', async () => {
      axios.get.mockRejectedValueOnce({
        response: { status: 429, statusText: 'Too Many Requests' }
      });

      await expect(moneroService.getExchangeRate()).rejects.toThrow(
        'Failed to fetch exchange rate: 429 Too Many Requests'
      );
    });

    it('should use cached rate when available', async () => {
      // Set up cache
      const futureTime = Date.now() + 300000; // 5 minutes in future
      moneroService.exchangeRateCache = {
        rate: 184.0,
        timestamp: Date.now(),
        validUntil: futureTime
      };

      const result = await moneroService.getExchangeRate();

      expect(axios.get).not.toHaveBeenCalled();
      expect(result.rate).toBe(184.0);
    });
  });

  describe('convertGbpToXmr', () => {
    it('should convert GBP to XMR correctly', async () => {
      axios.get.mockResolvedValueOnce({
        data: { monero: { gbp: 0.01 } }
      });

      const result = await moneroService.convertGbpToXmr(100);

      expect(result).toEqual({
        gbpAmount: 100,
        xmrAmount: expect.any(Number),
        exchangeRate: expect.any(Number),
        validUntil: expect.any(Date)
      });
    });

    it('should handle zero amount', async () => {
      const result = await moneroService.convertGbpToXmr(0);

      expect(result.xmrAmount).toBe(0);
      expect(result.gbpAmount).toBe(0);
    });
  });

  describe('createPaymentRequest', () => {
    it('should create payment request with GloBee API', async () => {
      const mockOrderData = {
        orderId: 'order-123',
        amount: 199.99,
        customerEmail: 'test@example.com'
      };

      // Mock exchange rate
      axios.get.mockResolvedValueOnce({
        data: { monero: { gbp: 0.006 } }
      });

      // Mock GloBee payment creation
      axios.post.mockResolvedValueOnce({
        data: {
          id: 'globee-payment-123',
          payment_address: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
          total: 1.1994,
          currency: 'XMR',
          expiration_time: new Date().toISOString(),
          status: 'pending'
        }
      });

      const result = await moneroService.createPaymentRequest(mockOrderData);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('globee.com'),
        expect.objectContaining({
          total: expect.any(Number),
          currency: 'XMR',
          notification_email: 'test@example.com',
          custom_payment_id: 'order-123'
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
            'Content-Type': 'application/json'
          })
        })
      );

      expect(result).toEqual({
        paymentId: 'globee-payment-123',
        moneroAddress: expect.stringMatching(/^4[A-Za-z0-9]{94}$/),
        amount: 1.1994,
        expirationTime: expect.any(String),
        status: 'pending'
      });
    });
  });

  describe('processWebhookNotification', () => {
    it('should process webhook data correctly', async () => {
      const mockPayload = {
        id: 'payment-123',
        status: 'paid',
        confirmations: 12,
        paid_amount: 1.5,
        total_amount: 1.5,
        order_id: 'order-456'
      };

      const result = moneroService.processWebhookNotification(mockPayload);

      expect(result).toEqual({
        paymentId: 'payment-123',
        orderId: 'order-456',
        status: 'paid',
        confirmations: 12,
        amountPaid: 1.5,
        isFullyPaid: true,
        isConfirmed: true
      });
    });

    it('should detect underpaid transactions', async () => {
      const mockPayload = {
        id: 'payment-123',
        status: 'paid',
        confirmations: 12,
        paid_amount: 1.0,
        total_amount: 1.5,
        order_id: 'order-456'
      };

      const result = moneroService.processWebhookNotification(mockPayload);

      expect(result.isFullyPaid).toBe(false);
      expect(result.status).toBe('underpaid');
    });
  });
});