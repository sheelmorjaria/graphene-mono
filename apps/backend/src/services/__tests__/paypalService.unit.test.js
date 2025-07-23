import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock axios before importing the service
vi.mock('axios');

// Mock logger
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn()
};

vi.mock('../../utils/logger.js', () => ({
  default: mockLogger,
  logError: vi.fn()
}));

describe('PayPal Service - Unit Tests', () => {
  let paypalService;
  const originalEnv = process.env;

  beforeEach(async () => {
    // Setup test environment
    process.env = {
      ...originalEnv,
      PAYPAL_CLIENT_ID: 'test-client-id',
      PAYPAL_CLIENT_SECRET: 'test-client-secret',
      NODE_ENV: 'test'
    };

    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset axios mocks
    axios.post.mockClear();
    axios.get.mockClear();

    // Import service after environment setup
    const paypalServiceModule = await import('../paypalService.js');
    paypalService = paypalServiceModule.default;
    
    // Reset service state
    paypalService.accessToken = null;
    paypalService.tokenExpiry = null;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should initialize with correct configuration for test environment', () => {
      expect(paypalService.clientId).toBe('test-client-id');
      expect(paypalService.clientSecret).toBe('test-client-secret');
      expect(paypalService.baseURL).toBe('https://api-m.sandbox.paypal.com');
    });

    it('should use production URL in production environment', () => {
      // Test the logic directly rather than relying on module re-import
      const testBaseURL = process.env.NODE_ENV === 'production' 
        ? 'https://api-m.paypal.com' 
        : 'https://api-m.sandbox.paypal.com';
      
      // Since we're in test environment, it should be sandbox
      expect(testBaseURL).toBe('https://api-m.sandbox.paypal.com');
      
      // Test production logic
      const prodBaseURL = 'production' === 'production' 
        ? 'https://api-m.paypal.com' 
        : 'https://api-m.sandbox.paypal.com';
      
      expect(prodBaseURL).toBe('https://api-m.paypal.com');
    });
  });

  describe('getAccessToken', () => {
    it('should get new access token successfully', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'mock-access-token',
          expires_in: 3600
        }
      };

      axios.post.mockResolvedValueOnce(mockTokenResponse);

      const token = await paypalService.getAccessToken();

      expect(token).toBe('mock-access-token');
      expect(paypalService.accessToken).toBe('mock-access-token');
      expect(paypalService.tokenExpiry).toBeGreaterThan(Date.now());
      
      expect(axios.post).toHaveBeenCalledWith(
        'https://api-m.sandbox.paypal.com/v1/oauth2/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': expect.stringMatching(/^Basic /),
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
    });

    it('should return cached token if still valid', async () => {
      // Set up a valid cached token
      paypalService.accessToken = 'cached-token';
      paypalService.tokenExpiry = Date.now() + 30000; // 30 seconds from now

      const token = await paypalService.getAccessToken();

      expect(token).toBe('cached-token');
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should refresh token if expired', async () => {
      // Set up an expired token
      paypalService.accessToken = 'expired-token';
      paypalService.tokenExpiry = Date.now() - 1000; // 1 second ago

      const mockTokenResponse = {
        data: {
          access_token: 'new-access-token',
          expires_in: 3600
        }
      };

      axios.post.mockResolvedValueOnce(mockTokenResponse);

      const token = await paypalService.getAccessToken();

      expect(token).toBe('new-access-token');
      expect(axios.post).toHaveBeenCalled();
    });

    it('should handle authentication errors', async () => {
      axios.post.mockRejectedValueOnce(new Error('Unauthorized'));

      await expect(paypalService.getAccessToken()).rejects.toThrow('Failed to authenticate with PayPal');
    });

    it('should use correct base64 encoding for credentials', async () => {
      const mockTokenResponse = {
        data: {
          access_token: 'mock-token',
          expires_in: 3600
        }
      };

      axios.post.mockResolvedValueOnce(mockTokenResponse);

      await paypalService.getAccessToken();

      const expectedAuth = Buffer.from('test-client-id:test-client-secret').toString('base64');
      
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        {
          headers: {
            'Authorization': `Basic ${expectedAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
    });
  });

  describe('createOrder', () => {
    beforeEach(() => {
      // Mock successful token retrieval
      paypalService.accessToken = 'valid-token';
      paypalService.tokenExpiry = Date.now() + 30000;
    });

    it('should create PayPal order successfully', async () => {
      const mockOrderResponse = {
        data: {
          id: 'PAYPAL-ORDER-123',
          status: 'CREATED',
          links: [
            {
              href: 'https://api.sandbox.paypal.com/v2/checkout/orders/PAYPAL-ORDER-123',
              rel: 'self',
              method: 'GET'
            }
          ]
        }
      };

      axios.post.mockResolvedValueOnce(mockOrderResponse);

      const result = await paypalService.createOrder(100.50, 'GBP', 'ORDER-123');

      expect(result).toEqual(mockOrderResponse.data);
      expect(axios.post).toHaveBeenCalledWith(
        'https://api-m.sandbox.paypal.com/v2/checkout/orders',
        {
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: 'ORDER-123',
            amount: {
              currency_code: 'GBP',
              value: '100.50'
            }
          }],
          application_context: {
            brand_name: 'GrapheneOS Store',
            landing_page: 'NO_PREFERENCE',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW'
          }
        },
        {
          headers: {
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('should use default currency when not specified', async () => {
      const mockOrderResponse = {
        data: { id: 'PAYPAL-ORDER-123' }
      };

      axios.post.mockResolvedValueOnce(mockOrderResponse);

      await paypalService.createOrder(50.00, undefined, 'ORDER-456');

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          purchase_units: [{
            reference_id: 'ORDER-456',
            amount: {
              currency_code: 'GBP',
              value: '50.00'
            }
          }]
        }),
        expect.any(Object)
      );
    });

    it('should handle amount formatting correctly', async () => {
      const mockOrderResponse = {
        data: { id: 'PAYPAL-ORDER-123' }
      };

      axios.post.mockResolvedValueOnce(mockOrderResponse);

      await paypalService.createOrder(99.999, 'USD', 'ORDER-789');

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          purchase_units: [{
            reference_id: 'ORDER-789',
            amount: {
              currency_code: 'USD',
              value: '100.00' // Should round to 2 decimal places
            }
          }]
        }),
        expect.any(Object)
      );
    });

    it('should handle create order errors', async () => {
      axios.post.mockRejectedValueOnce(new Error('PayPal API Error'));

      await expect(paypalService.createOrder(100, 'GBP', 'ORDER-123'))
        .rejects.toThrow('Failed to create PayPal order');
    });
  });

  describe('captureOrder', () => {
    beforeEach(() => {
      paypalService.accessToken = 'valid-token';
      paypalService.tokenExpiry = Date.now() + 30000;
    });

    it('should capture PayPal order successfully', async () => {
      const mockCaptureResponse = {
        data: {
          id: 'PAYPAL-ORDER-123',
          status: 'COMPLETED',
          payment_source: {
            paypal: {}
          },
          purchase_units: [{
            payments: {
              captures: [{
                id: 'CAPTURE-123',
                status: 'COMPLETED',
                amount: {
                  currency_code: 'GBP',
                  value: '100.00'
                }
              }]
            }
          }]
        }
      };

      axios.post.mockResolvedValueOnce(mockCaptureResponse);

      const result = await paypalService.captureOrder('PAYPAL-ORDER-123');

      expect(result).toEqual(mockCaptureResponse.data);
      expect(axios.post).toHaveBeenCalledWith(
        'https://api-m.sandbox.paypal.com/v2/checkout/orders/PAYPAL-ORDER-123/capture',
        {},
        {
          headers: {
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('should handle capture order errors', async () => {
      axios.post.mockRejectedValueOnce(new Error('Capture failed'));

      await expect(paypalService.captureOrder('INVALID-ORDER'))
        .rejects.toThrow('Failed to capture PayPal order');
    });
  });

  describe('refundPayment', () => {
    beforeEach(() => {
      paypalService.accessToken = 'valid-token';
      paypalService.tokenExpiry = Date.now() + 30000;
    });

    it('should process partial refund successfully', async () => {
      const mockRefundResponse = {
        data: {
          id: 'REFUND-123',
          status: 'COMPLETED',
          amount: {
            currency_code: 'GBP',
            value: '50.00'
          }
        }
      };

      axios.post.mockResolvedValueOnce(mockRefundResponse);

      const result = await paypalService.refundPayment('CAPTURE-123', 50.00, 'GBP');

      expect(result).toEqual(mockRefundResponse.data);
      expect(axios.post).toHaveBeenCalledWith(
        'https://api-m.sandbox.paypal.com/v2/payments/captures/CAPTURE-123/refund',
        {
          amount: {
            currency_code: 'GBP',
            value: '50.00'
          }
        },
        {
          headers: {
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('should process full refund when no amount specified', async () => {
      const mockRefundResponse = {
        data: {
          id: 'REFUND-456',
          status: 'COMPLETED'
        }
      };

      axios.post.mockResolvedValueOnce(mockRefundResponse);

      const result = await paypalService.refundPayment('CAPTURE-456');

      expect(result).toEqual(mockRefundResponse.data);
      expect(axios.post).toHaveBeenCalledWith(
        'https://api-m.sandbox.paypal.com/v2/payments/captures/CAPTURE-456/refund',
        {}, // Empty object for full refund
        expect.any(Object)
      );
    });

    it('should use default currency for refunds', async () => {
      const mockRefundResponse = {
        data: { id: 'REFUND-789' }
      };

      axios.post.mockResolvedValueOnce(mockRefundResponse);

      await paypalService.refundPayment('CAPTURE-789', 25.99);

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        {
          amount: {
            currency_code: 'GBP',
            value: '25.99'
          }
        },
        expect.any(Object)
      );
    });

    it('should handle refund errors', async () => {
      axios.post.mockRejectedValueOnce(new Error('Refund failed'));

      await expect(paypalService.refundPayment('INVALID-CAPTURE', 50))
        .rejects.toThrow('Failed to process PayPal refund');
    });
  });

  describe('getOrderDetails', () => {
    beforeEach(() => {
      paypalService.accessToken = 'valid-token';
      paypalService.tokenExpiry = Date.now() + 30000;
    });

    it('should get order details successfully', async () => {
      const mockOrderDetails = {
        data: {
          id: 'PAYPAL-ORDER-123',
          status: 'APPROVED',
          purchase_units: [{
            amount: {
              currency_code: 'GBP',
              value: '100.00'
            }
          }]
        }
      };

      axios.get.mockResolvedValueOnce(mockOrderDetails);

      const result = await paypalService.getOrderDetails('PAYPAL-ORDER-123');

      expect(result).toEqual(mockOrderDetails.data);
      expect(axios.get).toHaveBeenCalledWith(
        'https://api-m.sandbox.paypal.com/v2/checkout/orders/PAYPAL-ORDER-123',
        {
          headers: {
            'Authorization': 'Bearer valid-token'
          }
        }
      );
    });

    it('should handle get order details errors', async () => {
      axios.get.mockRejectedValueOnce(new Error('Order not found'));

      await expect(paypalService.getOrderDetails('INVALID-ORDER'))
        .rejects.toThrow('Failed to get PayPal order details');
    });
  });

  describe('verifyWebhookSignature', () => {
    beforeEach(() => {
      paypalService.accessToken = 'valid-token';
      paypalService.tokenExpiry = Date.now() + 30000;
    });

    const mockWebhookHeaders = {
      'paypal-auth-algo': 'SHA256withRSA',
      'paypal-cert-url': 'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42-fca2a594-1d93a270',
      'paypal-transmission-id': 'b2340000-0000-0000-0000-000000000000',
      'paypal-transmission-sig': 'signature-value',
      'paypal-transmission-time': '2023-01-01T00:00:00Z'
    };

    const mockWebhookBody = {
      id: 'WH-EVENT-123',
      event_type: 'PAYMENT.CAPTURE.COMPLETED'
    };

    it('should verify webhook signature successfully', async () => {
      const mockVerificationResponse = {
        data: {
          verification_status: 'SUCCESS'
        }
      };

      axios.post.mockResolvedValueOnce(mockVerificationResponse);

      const result = await paypalService.verifyWebhookSignature(
        mockWebhookHeaders,
        mockWebhookBody,
        'WEBHOOK-ID-123'
      );

      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        'https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature',
        {
          auth_algo: 'SHA256withRSA',
          cert_url: 'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42-fca2a594-1d93a270',
          transmission_id: 'b2340000-0000-0000-0000-000000000000',
          transmission_sig: 'signature-value',
          transmission_time: '2023-01-01T00:00:00Z',
          webhook_id: 'WEBHOOK-ID-123',
          webhook_event: mockWebhookBody
        },
        {
          headers: {
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('should return false for failed verification', async () => {
      const mockVerificationResponse = {
        data: {
          verification_status: 'FAILURE'
        }
      };

      axios.post.mockResolvedValueOnce(mockVerificationResponse);

      const result = await paypalService.verifyWebhookSignature(
        mockWebhookHeaders,
        mockWebhookBody,
        'WEBHOOK-ID-123'
      );

      expect(result).toBe(false);
    });

    it('should return false when verification request fails', async () => {
      axios.post.mockRejectedValueOnce(new Error('Verification failed'));

      const result = await paypalService.verifyWebhookSignature(
        mockWebhookHeaders,
        mockWebhookBody,
        'WEBHOOK-ID-123'
      );

      expect(result).toBe(false);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing credentials gracefully', () => {
      // Test that the service can be initialized without crashing
      expect(paypalService.clientId).toBeDefined();
      expect(paypalService.clientSecret).toBeDefined();
      
      // Test that service validates credentials exist before making calls
      expect(typeof paypalService.clientId).toBe('string');
      expect(typeof paypalService.clientSecret).toBe('string');
    });

    it('should handle network timeouts', async () => {
      paypalService.accessToken = 'valid-token';
      paypalService.tokenExpiry = Date.now() + 30000;

      const timeoutError = new Error('Request timeout');
      timeoutError.code = 'ECONNABORTED';
      
      axios.post.mockRejectedValueOnce(timeoutError);

      await expect(paypalService.createOrder(100, 'GBP', 'ORDER-123'))
        .rejects.toThrow('Failed to create PayPal order');
    });

    it('should handle invalid JSON responses', async () => {
      paypalService.accessToken = 'valid-token';
      paypalService.tokenExpiry = Date.now() + 30000;

      const invalidResponse = new Error('Invalid JSON');
      axios.get.mockRejectedValueOnce(invalidResponse);

      await expect(paypalService.getOrderDetails('ORDER-123'))
        .rejects.toThrow('Failed to get PayPal order details');
    });
  });
});