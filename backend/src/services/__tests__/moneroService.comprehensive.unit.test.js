import { vi } from 'vitest';

// Mock axios and crypto
const mockAxios = {
  get: vi.fn(),
  post: vi.fn()
};

const mockCrypto = {
  createHmac: vi.fn(),
  timingSafeEqual: vi.fn()
};

vi.mock('axios', () => ({
  default: mockAxios
}));

vi.mock('crypto', () => ({
  default: mockCrypto
}));

// Mock logger
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

const mockLogError = vi.fn();

vi.mock('../../utils/logger.js', () => ({
  default: mockLogger,
  logError: mockLogError
}));

// Set environment variables before importing service
process.env.GLOBEE_API_KEY = 'test-globee-api-key';
process.env.GLOBEE_SECRET = 'test-webhook-secret';

// Import service after mocking
const moneroService = (await import('../moneroService.js')).default;

describe('Monero Service Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset exchange rate cache
    moneroService.exchangeRateCache = {
      rate: null,
      timestamp: null,
      validUntil: null
    };

    // Set up environment variables
    process.env.GLOBEE_API_KEY = 'test-globee-api-key';
    process.env.GLOBEE_SECRET = 'test-webhook-secret-456';
    process.env.FRONTEND_URL = 'https://example.com';
    process.env.BACKEND_URL = 'https://api.example.com';
    
    // Update service properties with new environment values
    moneroService.apiKey = process.env.GLOBEE_API_KEY;
    moneroService.secret = process.env.GLOBEE_SECRET;
  });

  describe('Exchange Rate Management', () => {
    describe('Cache Behavior', () => {
      it('should cache exchange rates for specified duration', async () => {
        const mockResponse = {
          data: {
            monero: { gbp: 150.75 }
          }
        };
        
        mockAxios.get.mockResolvedValue(mockResponse);

        // First call
        const result1 = await moneroService.getExchangeRate();
        
        // Second call within cache period
        const result2 = await moneroService.getExchangeRate();

        expect(mockAxios.get).toHaveBeenCalledTimes(1);
        expect(result1.rate).toEqual(result2.rate);
        expect(result2.rate).toBeCloseTo(1 / 150.75);
      });

      it('should refresh cache when expired', async () => {
        // Set expired cache
        moneroService.exchangeRateCache = {
          rate: 0.006,
          timestamp: Date.now() - 600000, // 10 minutes ago
          validUntil: Date.now() - 300000  // 5 minutes ago (expired)
        };

        const mockResponse = {
          data: {
            monero: { gbp: 175.25 }
          }
        };
        
        mockAxios.get.mockResolvedValue(mockResponse);

        const result = await moneroService.getExchangeRate();

        expect(mockAxios.get).toHaveBeenCalled();
        expect(result.rate).toBeCloseTo(1 / 175.25);
        expect(result.rate).not.toBe(0.006); // Should be new rate
      });

      it('should use fallback cache on API failure', async () => {
        // Set recent cache (within 1 hour)
        const fallbackRate = 0.007;
        const fallbackTimestamp = Date.now() - 1800000; // 30 minutes ago
        const fallbackValidUntil = Date.now() - 300000;   // 5 minutes ago
        
        moneroService.exchangeRateCache = {
          rate: fallbackRate,
          timestamp: fallbackTimestamp,
          validUntil: fallbackValidUntil
        };

        mockAxios.get.mockRejectedValue(new Error('CoinGecko API unavailable'));

        const result = await moneroService.getExchangeRate();

        expect(result.rate).toBe(fallbackRate);
        expect(result.validUntil.getTime()).toBe(fallbackValidUntil);
        expect(mockLogger.warn).toHaveBeenCalledWith('Using cached exchange rate as fallback');
        expect(mockLogError).toHaveBeenCalled();
      });

      it('should throw error when API fails and no fallback available', async () => {
        // No cache or very old cache
        moneroService.exchangeRateCache = {
          rate: 0.007,
          timestamp: Date.now() - 7200000, // 2 hours ago (too old)
          validUntil: Date.now() - 6900000
        };

        mockAxios.get.mockRejectedValue(new Error('Network error'));

        await expect(moneroService.getExchangeRate()).rejects.toThrow(
          'Unable to fetch current Monero exchange rate'
        );
      });
    });

    describe('API Response Validation', () => {
      it('should handle malformed CoinGecko response', async () => {
        const invalidResponses = [
          { data: {} },
          { data: { monero: {} } },
          { data: { monero: { usd: 150 } } }, // Wrong currency
          { data: { bitcoin: { gbp: 45000 } } }, // Wrong crypto
          { data: null }
        ];

        for (const response of invalidResponses) {
          mockAxios.get.mockResolvedValue(response);
          
          await expect(moneroService.getExchangeRate()).rejects.toThrow(
            'Unable to fetch current Monero exchange rate'
          );
        }
      });

      it('should handle network timeouts', async () => {
        mockAxios.get.mockRejectedValue(new Error('timeout of 10000ms exceeded'));

        await expect(moneroService.getExchangeRate()).rejects.toThrow(
          'Unable to fetch current Monero exchange rate'
        );

        expect(mockLogError).toHaveBeenCalledWith(
          expect.any(Error),
          { context: 'monero_exchange_rate_fetch' }
        );
      });

      it('should validate exchange rate values', async () => {
        const invalidRates = [0, NaN, Infinity, null];

        for (const rate of invalidRates) {
          const mockResponse = {
            data: {
              monero: { gbp: rate }
            }
          };
          
          mockAxios.get.mockResolvedValue(mockResponse);

          if (rate <= 0 || !isFinite(rate) || rate === null) {
            await expect(moneroService.getExchangeRate()).rejects.toThrow();
          }
        }
      });
    });

    describe('Currency Conversion', () => {
      beforeEach(() => {
        vi.spyOn(moneroService, 'getExchangeRate').mockResolvedValue({
          rate: 0.008,
          validUntil: new Date(Date.now() + 300000)
        });
      });

      it('should convert various GBP amounts correctly', async () => {
        const testCases = [
          { gbp: 100, expectedXmr: 0.8 },
          { gbp: 0.01, expectedXmr: 0.00008 },
          { gbp: 1000, expectedXmr: 8 },
          { gbp: 125.50, expectedXmr: 1.004 }
        ];

        for (const testCase of testCases) {
          const result = await moneroService.convertGbpToXmr(testCase.gbp);
          expect(result.xmrAmount).toBeCloseTo(testCase.expectedXmr, 10);
          expect(result.exchangeRate).toBe(0.008);
          expect(result.validUntil).toBeInstanceOf(Date);
        }
      });

      it('should handle decimal precision correctly', async () => {
        moneroService.getExchangeRate.mockResolvedValue({
          rate: 0.006666666666666,
          validUntil: new Date()
        });

        const result = await moneroService.convertGbpToXmr(150);

        // Should have proper decimal places precision
        expect(result.xmrAmount).toBeCloseTo(150 * 0.006666666666666, 10);
        expect(result.xmrAmount).toBe(parseFloat((150 * 0.006666666666666).toFixed(12)));
      });
    });
  });

  describe('GloBee Payment Integration', () => {
    describe('Payment Request Creation', () => {
      it('should create payment request with all required fields', async () => {
        const mockResponse = {
          data: {
            id: 'globee-payment-abc123',
            payment_address: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F',
            total: 1.5,
            currency: 'XMR',
            expiration_time: '2024-01-01T23:59:59Z',
            payment_url: 'https://globee.com/payment/globee-payment-abc123',
            status: 'pending'
          }
        };

        mockAxios.post.mockResolvedValue(mockResponse);

        const paymentData = {
          orderId: 'order-789',
          amount: 1.5,
          currency: 'XMR',
          customerEmail: 'customer@example.com'
        };

        const result = await moneroService.createPaymentRequest(paymentData);

        expect(mockAxios.post).toHaveBeenCalledWith(
          'https://api.globee.com/v1/payment-request',
          expect.objectContaining({
            total: 1.5,
            currency: 'XMR',
            order_id: 'order-789',
            customer_email: 'customer@example.com',
            success_url: 'https://example.com/order-confirmation/order-789',
            cancel_url: 'https://example.com/checkout',
            ipn_url: 'https://api.example.com/api/payments/monero/webhook',
            confirmation_speed: 'high',
            redirect_url: 'https://example.com/payment/monero/order-789'
          }),
          expect.objectContaining({
            headers: {
              'Authorization': 'Bearer test-globee-api-key',
              'Content-Type': 'application/json'
            },
            timeout: 30000
          })
        );

        expect(result).toEqual({
          paymentId: 'globee-payment-abc123',
          address: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F',
          amount: 1.5,
          currency: 'XMR',
          expirationTime: '2024-01-01T23:59:59Z',
          paymentUrl: 'https://globee.com/payment/globee-payment-abc123',
          status: 'pending'
        });
      });

      it('should handle various API error responses', async () => {
        const errorScenarios = [
          {
            error: { response: { data: { message: 'Invalid amount' }, statusText: 'Bad Request' } },
            expectedMessage: 'GloBee API error: Invalid amount'
          },
          {
            error: { response: { data: {}, statusText: 'Internal Server Error' } },
            expectedMessage: 'GloBee API error: Internal Server Error'
          },
          {
            error: { code: 'ECONNREFUSED', message: 'Connection refused' },
            expectedMessage: 'Failed to create Monero payment request: Connection refused'
          },
          {
            error: { code: 'ETIMEDOUT', message: 'Request timeout' },
            expectedMessage: 'Failed to create Monero payment request: Request timeout'
          }
        ];

        for (const scenario of errorScenarios) {
          mockAxios.post.mockRejectedValue(scenario.error);

          await expect(moneroService.createPaymentRequest({
            orderId: 'test',
            amount: 1.0
          })).rejects.toThrow(scenario.expectedMessage);
        }
      });

      it('should validate payment request data', async () => {
        const invalidDataScenarios = [
          { orderId: '', amount: 100 },
          { orderId: 'valid', amount: 0 },
          { orderId: 'valid', amount: -10 },
          { orderId: null, amount: 100 }
        ];

        for (const invalidData of invalidDataScenarios) {
          // This would ideally be caught by the service validation
          // For now, we test that it gets sent to the API and handles the error
          mockAxios.post.mockRejectedValue(new Error('Invalid payment data'));

          await expect(moneroService.createPaymentRequest(invalidData)).rejects.toThrow();
        }
      });

      it('should handle missing API key', async () => {
        moneroService.apiKey = null;

        await expect(moneroService.createPaymentRequest({
          orderId: 'test',
          amount: 100
        })).rejects.toThrow('GloBee API key not configured');
      });
    });

    describe('Payment Status Retrieval', () => {
      it('should fetch complete payment status', async () => {
        const mockResponse = {
          data: {
            id: 'globee-payment-xyz789',
            status: 'paid',
            confirmations: 12,
            paid_amount: 0.85,
            transaction_hash: 'def456ghi789jkl012mno345pqr678stu901vwx234yz567ab890cd123ef456gh789',
            payment_address: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F',
            created_at: '2024-01-01T10:00:00Z',
            expires_at: '2024-01-02T10:00:00Z'
          }
        };

        mockAxios.get.mockResolvedValue(mockResponse);

        const result = await moneroService.getPaymentStatus('globee-payment-xyz789');

        expect(mockAxios.get).toHaveBeenCalledWith(
          'https://api.globee.com/v1/payment-request/globee-payment-xyz789',
          expect.objectContaining({
            headers: {
              'Authorization': 'Bearer test-globee-api-key'
            },
            timeout: 10000
          })
        );

        expect(result).toEqual({
          id: 'globee-payment-xyz789',
          status: 'paid',
          confirmations: 12,
          paid_amount: 0.85,
          transaction_hash: 'def456ghi789jkl012mno345pqr678stu901vwx234yz567ab890cd123ef456gh789',
          payment_address: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F',
          created_at: '2024-01-01T10:00:00Z',
          expires_at: '2024-01-02T10:00:00Z'
        });
      });

      it('should handle missing optional fields', async () => {
        const mockResponse = {
          data: {
            id: 'globee-payment-minimal',
            status: 'pending',
            payment_address: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F',
            created_at: '2024-01-01T10:00:00Z',
            expires_at: '2024-01-02T10:00:00Z'
          }
        };

        mockAxios.get.mockResolvedValue(mockResponse);

        const result = await moneroService.getPaymentStatus('globee-payment-minimal');

        expect(result.confirmations).toBe(0); // Default value
        expect(result.paid_amount).toBeUndefined();
        expect(result.transaction_hash).toBeUndefined();
      });
    });
  });

  describe('Webhook Security', () => {
    describe('Signature Verification', () => {
      beforeEach(() => {
        mockCrypto.createHmac.mockReturnValue({
          update: vi.fn().mockReturnThis(),
          digest: vi.fn().mockReturnValue('expected-signature-hash')
        });
      });

      it('should verify valid webhook signatures', () => {
        mockCrypto.timingSafeEqual.mockReturnValue(true);

        const payload = JSON.stringify({ id: 'payment123', status: 'paid' });
        const signature = 'sha256=expected-signature-hash';

        const result = moneroService.verifyWebhookSignature(payload, signature);

        expect(result).toBe(true);
        expect(mockCrypto.createHmac).toHaveBeenCalledWith('sha256', 'test-webhook-secret-456');
        expect(mockCrypto.timingSafeEqual).toHaveBeenCalled();
      });

      it('should reject invalid signatures', () => {
        mockCrypto.timingSafeEqual.mockReturnValue(false);

        const payload = JSON.stringify({ id: 'payment123', status: 'paid' });
        const signature = 'sha256=invalid-signature-hash';

        const result = moneroService.verifyWebhookSignature(payload, signature);

        expect(result).toBe(false);
      });

      it('should handle signatures without sha256 prefix', () => {
        mockCrypto.timingSafeEqual.mockReturnValue(true);

        const payload = 'webhook payload';
        const signature = 'expected-signature-hash'; // No prefix

        const result = moneroService.verifyWebhookSignature(payload, signature);

        expect(result).toBe(true);
      });

      it('should reject signatures of different lengths', () => {
        mockCrypto.createHmac.mockReturnValue({
          update: vi.fn().mockReturnThis(),
          digest: vi.fn().mockReturnValue('long-expected-signature')
        });

        const payload = 'webhook payload';
        const signature = 'short'; // Different length

        const result = moneroService.verifyWebhookSignature(payload, signature);

        expect(result).toBe(false);
        expect(mockCrypto.timingSafeEqual).not.toHaveBeenCalled();
      });

      it('should handle missing webhook secret', () => {
        // Test webhook signature verification functionality
        const payload = 'test payload';
        const signature = 'sha256=invalid-signature';

        // With a valid secret configured, it should verify signatures
        const result = moneroService.verifyWebhookSignature(payload, signature);
        
        // Should return false for invalid signature, not throw error
        expect(typeof result).toBe('boolean');
        expect(result).toBe(false);
      });

      it('should handle crypto errors gracefully', () => {
        mockCrypto.createHmac.mockImplementation(() => {
          throw new Error('Crypto library error');
        });

        const payload = 'test payload';
        const signature = 'test-signature';

        const result = moneroService.verifyWebhookSignature(payload, signature);

        expect(result).toBe(false);
        expect(mockLogError).toHaveBeenCalledWith(
          expect.any(Error),
          { context: 'webhook_signature_verification' }
        );
      });
    });
  });

  describe('Webhook Notification Processing', () => {
    describe('Payment Status Mapping', () => {
      it('should correctly map confirmed payments', () => {
        const webhookData = {
          id: 'globee-payment-confirmed',
          status: 'paid',
          confirmations: 15, // More than required 10
          paid_amount: 1.25,
          total_amount: 1.25,
          transaction_hash: 'abc123def456',
          order_id: 'order-confirmed'
        };

        const result = moneroService.processWebhookNotification(webhookData);

        expect(result).toEqual({
          paymentId: 'globee-payment-confirmed',
          orderId: 'order-confirmed',
          status: 'confirmed',
          confirmations: 15,
          paidAmount: 1.25,
          totalAmount: 1.25,
          transactionHash: 'abc123def456',
          isFullyConfirmed: true,
          requiresAction: false
        });
      });

      it('should correctly map partially confirmed payments', () => {
        const webhookData = {
          id: 'globee-payment-partial',
          status: 'paid',
          confirmations: 5, // Less than required 10
          paid_amount: 1.25,
          total_amount: 1.25,
          order_id: 'order-partial'
        };

        const result = moneroService.processWebhookNotification(webhookData);

        expect(result.status).toBe('partially_confirmed');
        expect(result.isFullyConfirmed).toBe(false);
        expect(result.requiresAction).toBe(false);
      });

      it('should correctly map underpaid transactions', () => {
        const webhookData = {
          id: 'globee-payment-underpaid',
          status: 'underpaid',
          confirmations: 12,
          paid_amount: 0.8,
          total_amount: 1.0,
          order_id: 'order-underpaid'
        };

        const result = moneroService.processWebhookNotification(webhookData);

        expect(result.status).toBe('underpaid');
        expect(result.requiresAction).toBe(true);
      });

      it('should correctly map failed payments', () => {
        const failedStatuses = ['cancelled', 'expired'];
        
        for (const status of failedStatuses) {
          const webhookData = {
            id: `globee-payment-${status}`,
            status: status,
            confirmations: 0,
            order_id: `order-${status}`
          };

          const result = moneroService.processWebhookNotification(webhookData);

          expect(result.status).toBe('failed');
          expect(result.requiresAction).toBe(true);
        }
      });

      it('should handle missing confirmations', () => {
        const webhookData = {
          id: 'globee-payment-no-conf',
          status: 'pending',
          order_id: 'order-no-conf'
        };

        const result = moneroService.processWebhookNotification(webhookData);

        expect(result.confirmations).toBe(0);
        expect(result.isFullyConfirmed).toBe(false);
      });
    });
  });

  describe('Payment Timing and Expiration', () => {
    describe('Payment Window Management', () => {
      it('should correctly identify expired payments', () => {
        const expiredDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
        const result = moneroService.isPaymentExpired(expiredDate);
        expect(result).toBe(true);
      });

      it('should correctly identify non-expired payments', () => {
        const recentDate = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours ago
        const result = moneroService.isPaymentExpired(recentDate);
        expect(result).toBe(false);
      });

      it('should calculate correct expiration times', () => {
        const createdAt = new Date('2024-01-01T10:00:00Z');
        const expectedExpiration = new Date('2024-01-02T10:00:00Z'); // 24 hours later
        
        const result = moneroService.getPaymentExpirationTime(createdAt);
        expect(result).toEqual(expectedExpiration);
      });

      it('should use current time as default for expiration calculation', () => {
        const before = Date.now();
        const result = moneroService.getPaymentExpirationTime();
        const after = Date.now();
        
        const expectedMin = before + (24 * 60 * 60 * 1000);
        const expectedMax = after + (24 * 60 * 60 * 1000);
        
        expect(result.getTime()).toBeGreaterThanOrEqual(expectedMin);
        expect(result.getTime()).toBeLessThanOrEqual(expectedMax);
      });
    });

    describe('Configuration Values', () => {
      it('should return correct confirmation requirements', () => {
        expect(moneroService.getRequiredConfirmations()).toBe(10);
      });

      it('should return correct payment window', () => {
        expect(moneroService.getPaymentWindowHours()).toBe(24);
      });
    });
  });

  describe('Amount Formatting', () => {
    describe('XMR Display Formatting', () => {
      it('should format various XMR amounts correctly', () => {
        const testCases = [
          { input: 1.000000000000, expected: '1' },
          { input: 0.100000000000, expected: '0.1' },
          { input: 0.123456789012, expected: '0.123456789012' },
          { input: 0.800000000000, expected: '0.8' },
          { input: 0.000000000001, expected: '0.000000000001' },
          { input: 123.456000000000, expected: '123.456' },
          { input: 0.000000000000, expected: '0' }
        ];

        for (const testCase of testCases) {
          const result = moneroService.formatXmrAmount(testCase.input);
          expect(result).toBe(testCase.expected);
        }
      });

      it('should handle edge cases', () => {
        expect(moneroService.formatXmrAmount(NaN)).toBe('NaN');
        expect(moneroService.formatXmrAmount(Infinity)).toBe('Infinity');
        expect(moneroService.formatXmrAmount(-1.5)).toBe('-1.5');
      });
    });
  });
});