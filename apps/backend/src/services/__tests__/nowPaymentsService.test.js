import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import nowPaymentsService from '../nowPaymentsService.js';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  },
  logError: vi.fn()
}));

describe('NowPaymentsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    process.env.NOWPAYMENTS_API_KEY = 'test-api-key';
    process.env.NOWPAYMENTS_IPN_SECRET = 'test-ipn-secret';
    
    // Reset the service instance to pick up new env vars
    nowPaymentsService.apiKey = 'test-api-key';
    nowPaymentsService.ipnSecret = 'test-ipn-secret';
    
    // Reset exchange rate cache
    nowPaymentsService.exchangeRateCache = {
      rate: null,
      timestamp: null,
      validUntil: null
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getExchangeRate', () => {
    it('should fetch exchange rate from NowPayments estimate endpoint', async () => {
      const mockResponse = {
        data: {
          estimated_amount: 0.00123456
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await nowPaymentsService.getExchangeRate();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.nowpayments.io/v1/estimate',
        {
          params: {
            amount: 1,
            currency_from: 'gbp',
            currency_to: 'xmr'
          },
          headers: {
            'x-api-key': 'test-api-key'
          },
          timeout: 10000
        }
      );

      expect(result.rate).toBe(0.00123456);
      expect(result.validUntil).toBeInstanceOf(Date);
    });

    it('should use cached rate if still valid', async () => {
      const futureTime = Date.now() + 300000; // 5 minutes from now
      nowPaymentsService.exchangeRateCache = {
        rate: 0.001234,
        timestamp: Date.now(),
        validUntil: futureTime
      };

      const result = await nowPaymentsService.getExchangeRate();

      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect(result.rate).toBe(0.001234);
    });

    it('should fallback to CoinGecko if NowPayments fails', async () => {
      // Mock NowPayments failure
      mockedAxios.get.mockResolvedValueOnce({ data: {} });
      
      // Mock CoinGecko success
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          monero: {
            gbp: 150.50
          }
        }
      });

      const result = await nowPaymentsService.getExchangeRate();

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(result.rate).toBeCloseTo(1 / 150.50, 8);
    });
  });

  describe('createPaymentRequest', () => {
    it('should create payment request successfully', async () => {
      const estimateResponse = {
        data: {
          estimated_amount: 0.00123456
        }
      };

      const paymentResponse = {
        data: {
          payment_id: 'payment-123',
          pay_address: 'monero-address',
          pay_amount: 0.00123456,
          pay_currency: 'XMR',
          price_amount: 100,
          price_currency: 'GBP',
          payment_status: 'waiting',
          invoice_url: 'https://example.com/invoice'
        }
      };

      mockedAxios.get.mockResolvedValueOnce(estimateResponse);
      mockedAxios.post.mockResolvedValueOnce(paymentResponse);

      const requestData = {
        orderId: 'order-123',
        amount: 100,
        currency: 'GBP',
        customerEmail: 'test@example.com'
      };

      const result = await nowPaymentsService.createPaymentRequest(requestData);

      expect(result).toEqual({
        paymentId: 'payment-123',
        address: 'monero-address',
        amount: 0.00123456,
        currency: 'XMR',
        expirationTime: expect.any(Date),
        paymentUrl: 'https://example.com/invoice',
        status: 'pending',
        expectedAmount: 0.00123456,
        priceAmount: 100,
        priceCurrency: 'GBP'
      });
    });

    it('should throw error if API key is missing', async () => {
      delete process.env.NOWPAYMENTS_API_KEY;
      
      const requestData = {
        orderId: 'order-123',
        amount: 100,
        currency: 'GBP'
      };

      await expect(nowPaymentsService.createPaymentRequest(requestData))
        .rejects
        .toThrow('NowPayments API key not configured');
    });
  });

  describe('getPaymentStatus', () => {
    it('should fetch payment status successfully', async () => {
      const mockResponse = {
        data: {
          payment_id: 'payment-123',
          payment_status: 'confirmed',
          pay_address: 'monero-address',
          actually_paid: 0.00123456,
          pay_amount: 0.00123456,
          price_amount: 100,
          price_currency: 'GBP',
          created_at: '2025-01-23T10:00:00Z',
          updated_at: '2025-01-23T10:30:00Z',
          outcome: {
            confirmations: 15,
            hash: 'tx-hash-123'
          }
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await nowPaymentsService.getPaymentStatus('payment-123');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.nowpayments.io/v1/payment/payment-123',
        {
          headers: {
            'x-api-key': 'test-api-key'
          },
          timeout: 10000
        }
      );

      expect(result).toEqual({
        id: 'payment-123',
        status: 'confirmed',
        confirmations: 15,
        paid_amount: 0.00123456,
        payment_address: 'monero-address',
        transaction_hash: 'tx-hash-123',
        created_at: '2025-01-23T10:00:00Z',
        updated_at: '2025-01-23T10:30:00Z',
        expires_at: null,
        expected_amount: 0.00123456,
        price_amount: 100,
        price_currency: 'GBP'
      });
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const payload = '{"payment_id":"123","payment_status":"confirmed"}';
      const secret = 'test-secret';
      
      // Calculate expected signature
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha512', secret)
        .update(payload)
        .digest('hex');

      // Update service instance with test secret
      nowPaymentsService.ipnSecret = secret;
      
      const isValid = nowPaymentsService.verifyWebhookSignature(payload, expectedSignature);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const payload = '{"payment_id":"123","payment_status":"confirmed"}';
      const invalidSignature = 'invalid-signature';

      const isValid = nowPaymentsService.verifyWebhookSignature(payload, invalidSignature);
      
      expect(isValid).toBe(false);
    });
  });

  describe('processWebhookNotification', () => {
    it('should process webhook notification correctly', () => {
      const webhookData = {
        payment_id: 'payment-123',
        payment_status: 'confirmed',
        actually_paid: 0.00123456,
        pay_amount: 0.00123456,
        order_id: 'order-123',
        outcome: {
          confirmations: 15,
          hash: 'tx-hash-123'
        }
      };

      const result = nowPaymentsService.processWebhookNotification(webhookData);

      expect(result).toEqual({
        paymentId: 'payment-123',
        orderId: 'order-123',
        status: 'confirmed',
        confirmations: 15,
        paidAmount: 0.00123456,
        expectedAmount: 0.00123456,
        transactionHash: 'tx-hash-123',
        isFullyConfirmed: true,
        requiresAction: false,
        originalStatus: 'confirmed'
      });
    });

    it('should handle partially confirmed payments', () => {
      const webhookData = {
        payment_id: 'payment-123',
        payment_status: 'confirmed',
        actually_paid: 0.00123456,
        pay_amount: 0.00123456,
        order_id: 'order-123',
        outcome: {
          confirmations: 5,
          hash: 'tx-hash-123'
        }
      };

      const result = nowPaymentsService.processWebhookNotification(webhookData);

      expect(result.status).toBe('partially_confirmed');
      expect(result.isFullyConfirmed).toBe(false);
    });
  });

  describe('mapNowPaymentsStatus', () => {
    it('should map NowPayments statuses correctly', () => {
      const statusMappings = [
        ['waiting', 'pending'],
        ['confirming', 'partially_confirmed'],
        ['confirmed', 'confirmed'],
        ['finished', 'confirmed'],
        ['partially_paid', 'underpaid'],
        ['failed', 'failed'],
        ['expired', 'failed']
      ];

      statusMappings.forEach(([nowPaymentsStatus, expectedStatus]) => {
        const result = nowPaymentsService.mapNowPaymentsStatus(nowPaymentsStatus);
        expect(result).toBe(expectedStatus);
      });
    });

    it('should default to pending for unknown status', () => {
      const result = nowPaymentsService.mapNowPaymentsStatus('unknown-status');
      expect(result).toBe('pending');
    });
  });

  describe('utility methods', () => {
    it('should format XMR amount correctly', () => {
      expect(nowPaymentsService.formatXmrAmount(0.123456789000)).toBe('0.123456789');
      expect(nowPaymentsService.formatXmrAmount(1.000000000000)).toBe('1');
      expect(nowPaymentsService.formatXmrAmount(0.000000000001)).toBe('0.000000000001');
    });

    it('should calculate payment expiration time', () => {
      const createdAt = new Date('2025-01-23T10:00:00Z');
      const expirationTime = nowPaymentsService.getPaymentExpirationTime(createdAt);
      
      const expectedExpiration = new Date(createdAt.getTime() + (24 * 60 * 60 * 1000));
      expect(expirationTime).toEqual(expectedExpiration);
    });

    it('should return correct configuration values', () => {
      expect(nowPaymentsService.getRequiredConfirmations()).toBe(10);
      expect(nowPaymentsService.getPaymentWindowHours()).toBe(24);
    });
  });
});