import moneroService from '../moneroService.js';

// Mock fetch globally
global.fetch = jest.fn();

// Mock crypto for webhook verification
jest.mock('crypto', () => ({
  createHmac: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'mocked-signature')
  }))
}));

describe('MoneroService', () => {
  let consoleSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Set test environment variables
    process.env.GLOBEE_API_KEY = 'test-api-key';
    process.env.GLOBEE_WEBHOOK_SECRET = 'test-webhook-secret';
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('getExchangeRate', () => {
    it('should fetch and cache exchange rate successfully', async () => {
      const mockExchangeResponse = {
        monero: { gbp: 0.005432 }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockExchangeResponse)
      });

      const result = await moneroService.getExchangeRate();

      expect(fetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price?ids=monero&vs_currencies=gbp',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        })
      );

      expect(result).toEqual({
        rate: 0.005432,
        validUntil: expect.any(Date),
        source: 'coingecko'
      });

      // Verify cache timestamp
      const validUntil = new Date(result.validUntil);
      const now = new Date();
      const diffMinutes = (validUntil - now) / (1000 * 60);
      expect(diffMinutes).toBeCloseTo(5, 0); // Should be ~5 minutes from now
    });

    it('should return cached rate if still valid', async () => {
      const futureTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
      
      // Set up cache with valid data
      moneroService.exchangeRateCache = {
        rate: 0.006789,
        validUntil: futureTime,
        source: 'coingecko'
      };

      const result = await moneroService.getExchangeRate();

      expect(fetch).not.toHaveBeenCalled();
      expect(result.rate).toBe(0.006789);
      expect(result.validUntil).toEqual(futureTime);
    });

    it('should handle API errors gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      await expect(moneroService.getExchangeRate()).rejects.toThrow(
        'Failed to fetch exchange rate: 429 Too Many Requests'
      );
    });

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(moneroService.getExchangeRate()).rejects.toThrow(
        'Failed to fetch exchange rate: Network error'
      );
    });

    it('should handle invalid API response format', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'data' })
      });

      await expect(moneroService.getExchangeRate()).rejects.toThrow(
        'Invalid exchange rate data received'
      );
    });
  });

  describe('convertGbpToXmr', () => {
    beforeEach(() => {
      // Mock successful exchange rate
      moneroService.exchangeRateCache = {
        rate: 0.01, // 1 GBP = 0.01 XMR
        validUntil: new Date(Date.now() + 5 * 60 * 1000),
        source: 'coingecko'
      };
    });

    it('should convert GBP to XMR correctly', async () => {
      const result = await moneroService.convertGbpToXmr(100);

      expect(result).toEqual({
        gbpAmount: 100,
        xmrAmount: 1, // 100 * 0.01
        exchangeRate: 0.01,
        validUntil: expect.any(Date)
      });
    });

    it('should handle zero amount', async () => {
      const result = await moneroService.convertGbpToXmr(0);

      expect(result.xmrAmount).toBe(0);
      expect(result.gbpAmount).toBe(0);
    });

    it('should handle decimal amounts', async () => {
      const result = await moneroService.convertGbpToXmr(49.99);

      expect(result.xmrAmount).toBe(0.4999); // 49.99 * 0.01
      expect(result.gbpAmount).toBe(49.99);
    });

    it('should fetch fresh rate if cache expired', async () => {
      // Clear cache
      moneroService.exchangeRateCache = null;

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ monero: { gbp: 0.02 } })
      });

      const result = await moneroService.convertGbpToXmr(50);

      expect(fetch).toHaveBeenCalled();
      expect(result.xmrAmount).toBe(1); // 50 * 0.02
    });
  });

  describe('createMoneroPayment', () => {
    const mockOrderData = {
      orderId: 'order-123',
      orderTotal: 199.99,
      customerEmail: 'test@example.com'
    };

    it('should create Monero payment successfully', async () => {
      // Mock exchange rate
      moneroService.exchangeRateCache = {
        rate: 0.01,
        validUntil: new Date(Date.now() + 5 * 60 * 1000),
        source: 'coingecko'
      };

      // Mock GloBee API response
      const mockGloBeeResponse = {
        success: true,
        data: {
          id: 'globee-payment-123',
          payment_address: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
          payment_amount: 1.9999,
          expires_at: '2024-01-01T12:00:00Z',
          status: 'pending'
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGloBeeResponse)
      });

      const result = await moneroService.createMoneroPayment(mockOrderData);

      expect(fetch).toHaveBeenCalledWith(
        'https://globee.com/payment-api/v1/payments',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('"currency":"XMR"')
        })
      );

      expect(result).toEqual({
        paymentId: 'globee-payment-123',
        moneroAddress: '4AdUndXHHZ9pfQj27iMAjAr4xTDXXjLWRh4P4Ym3X3KxG7PvNGdJgxsUc8nq4JJMvCmdMWTJT8kUH7G8K2s9i1vR5CJQo4q',
        xmrAmount: 1.9999,
        orderTotal: 199.99,
        exchangeRate: 0.01,
        expirationTime: '2024-01-01T12:00:00Z',
        validUntil: expect.any(Date),
        requiredConfirmations: 10,
        paymentWindowHours: 24,
        status: 'pending'
      });
    });

    it('should handle GloBee API errors', async () => {
      moneroService.exchangeRateCache = {
        rate: 0.01,
        validUntil: new Date(Date.now() + 5 * 60 * 1000),
        source: 'coingecko'
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid payment data'
        })
      });

      await expect(moneroService.createMoneroPayment(mockOrderData))
        .rejects.toThrow('Failed to create Monero payment: Invalid payment data');
    });

    it('should handle network errors during payment creation', async () => {
      moneroService.exchangeRateCache = {
        rate: 0.01,
        validUntil: new Date(Date.now() + 5 * 60 * 1000),
        source: 'coingecko'
      };

      fetch.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(moneroService.createMoneroPayment(mockOrderData))
        .rejects.toThrow('Failed to create Monero payment: Network timeout');
    });

    it('should include correct payment data in GloBee request', async () => {
      moneroService.exchangeRateCache = {
        rate: 0.005,
        validUntil: new Date(Date.now() + 5 * 60 * 1000),
        source: 'coingecko'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            id: 'test-payment',
            payment_address: 'test-address',
            payment_amount: 1.0,
            expires_at: '2024-01-01T12:00:00Z',
            status: 'pending'
          }
        })
      });

      await moneroService.createMoneroPayment(mockOrderData);

      const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
      
      expect(requestBody).toEqual({
        currency: 'XMR',
        amount: 0.99995, // 199.99 * 0.005
        notification_url: expect.stringContaining('/api/payments/monero/webhook'),
        success_url: expect.stringContaining('/order-confirmation/order-123'),
        cancel_url: expect.stringContaining('/checkout'),
        customer_email: 'test@example.com',
        custom_data: {
          orderId: 'order-123',
          orderTotal: 199.99
        }
      });
    });
  });

  describe('checkPaymentStatus', () => {
    it('should fetch payment status successfully', async () => {
      const mockStatusResponse = {
        success: true,
        data: {
          id: 'payment-123',
          status: 'confirmed',
          confirmations: 15,
          payment_amount: 1.5,
          received_amount: 1.5
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatusResponse)
      });

      const result = await moneroService.checkPaymentStatus('payment-123');

      expect(fetch).toHaveBeenCalledWith(
        'https://globee.com/payment-api/v1/payments/payment-123',
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Accept': 'application/json'
          }
        })
      );

      expect(result).toEqual({
        paymentId: 'payment-123',
        status: 'confirmed',
        confirmations: 15,
        expectedAmount: 1.5,
        receivedAmount: 1.5,
        isConfirmed: true,
        isUnderpaid: false
      });
    });

    it('should handle underpaid status correctly', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            id: 'payment-123',
            status: 'partially_confirmed',
            confirmations: 5,
            payment_amount: 2.0,
            received_amount: 1.8
          }
        })
      });

      const result = await moneroService.checkPaymentStatus('payment-123');

      expect(result.isUnderpaid).toBe(true);
      expect(result.isConfirmed).toBe(false);
    });

    it('should handle API errors when checking status', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          success: false,
          error: 'Payment not found'
        })
      });

      await expect(moneroService.checkPaymentStatus('invalid-payment'))
        .rejects.toThrow('Failed to check payment status: Payment not found');
    });
  });

  describe('verifyWebhookSignature', () => {
    const testPayload = JSON.stringify({ test: 'data' });
    const testSignature = 'sha256=mocked-signature';

    it('should verify webhook signature correctly', () => {
      const crypto = require('crypto');
      const result = moneroService.verifyWebhookSignature(testPayload, testSignature);

      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', 'test-webhook-secret');
      expect(result).toBe(true);
    });

    it('should reject invalid signature format', () => {
      const result = moneroService.verifyWebhookSignature(testPayload, 'invalid-format');

      expect(result).toBe(false);
    });

    it('should reject mismatched signature', () => {
      const crypto = require('crypto');
      crypto.createHmac.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn(() => 'different-signature')
      });

      const result = moneroService.verifyWebhookSignature(testPayload, testSignature);

      expect(result).toBe(false);
    });

    it('should handle missing webhook secret', () => {
      process.env.GLOBEE_WEBHOOK_SECRET = '';

      const result = moneroService.verifyWebhookSignature(testPayload, testSignature);

      expect(result).toBe(false);
    });
  });

  describe('processWebhookPayload', () => {
    const mockWebhookPayload = {
      id: 'payment-123',
      status: 'confirmed',
      confirmations: 12,
      payment_amount: 1.5,
      received_amount: 1.5,
      custom_data: {
        orderId: 'order-456'
      }
    };

    it('should process webhook payload successfully', () => {
      const result = moneroService.processWebhookPayload(mockWebhookPayload);

      expect(result).toEqual({
        paymentId: 'payment-123',
        orderId: 'order-456',
        status: 'confirmed',
        confirmations: 12,
        expectedAmount: 1.5,
        receivedAmount: 1.5,
        isConfirmed: true,
        isUnderpaid: false,
        timestamp: expect.any(Date)
      });
    });

    it('should handle missing custom data', () => {
      const payloadWithoutCustomData = { ...mockWebhookPayload };
      delete payloadWithoutCustomData.custom_data;

      const result = moneroService.processWebhookPayload(payloadWithoutCustomData);

      expect(result.orderId).toBeNull();
    });

    it('should correctly identify underpaid transactions', () => {
      const underpaidPayload = {
        ...mockWebhookPayload,
        received_amount: 1.2,
        status: 'partially_confirmed'
      };

      const result = moneroService.processWebhookPayload(underpaidPayload);

      expect(result.isUnderpaid).toBe(true);
      expect(result.isConfirmed).toBe(false);
    });

    it('should handle various payment statuses', () => {
      const testCases = [
        { status: 'pending', expectedConfirmed: false },
        { status: 'partially_confirmed', expectedConfirmed: false },
        { status: 'confirmed', expectedConfirmed: true },
        { status: 'expired', expectedConfirmed: false },
        { status: 'cancelled', expectedConfirmed: false }
      ];

      testCases.forEach(({ status, expectedConfirmed }) => {
        const payload = { ...mockWebhookPayload, status };
        const result = moneroService.processWebhookPayload(payload);
        
        expect(result.isConfirmed).toBe(expectedConfirmed);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing environment variables', () => {
      delete process.env.GLOBEE_API_KEY;
      
      expect(() => {
        // This should log an error or handle gracefully
        moneroService.createMoneroPayment({ orderId: 'test' });
      }).not.toThrow();
    });

    it('should handle malformed JSON responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new SyntaxError('Unexpected token'))
      });

      await expect(moneroService.getExchangeRate())
        .rejects.toThrow();
    });

    it('should handle extremely large amounts', async () => {
      moneroService.exchangeRateCache = {
        rate: 0.000001,
        validUntil: new Date(Date.now() + 5 * 60 * 1000),
        source: 'coingecko'
      };

      const result = await moneroService.convertGbpToXmr(1000000);

      expect(result.xmrAmount).toBe(1); // 1000000 * 0.000001
      expect(Number.isFinite(result.xmrAmount)).toBe(true);
    });

    it('should handle very small amounts', async () => {
      moneroService.exchangeRateCache = {
        rate: 100,
        validUntil: new Date(Date.now() + 5 * 60 * 1000),
        source: 'coingecko'
      };

      const result = await moneroService.convertGbpToXmr(0.01);

      expect(result.xmrAmount).toBe(1); // 0.01 * 100
      expect(Number.isFinite(result.xmrAmount)).toBe(true);
    });
  });
});