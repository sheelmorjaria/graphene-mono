import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    defaults: {
      headers: {}
    }
  }
}));

// Mock logger
vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn()
  },
  logError: vi.fn()
}));

import axios from 'axios';
import paypalService from '../paypalService.js';

const mockAxios = vi.mocked(axios);

describe('PayPal Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset environment variables
    process.env.PAYPAL_CLIENT_ID = 'test-client-id';
    process.env.PAYPAL_CLIENT_SECRET = 'test-client-secret';
    process.env.PAYPAL_ENVIRONMENT = 'sandbox';
    
    // Clear the token cache
    paypalService.accessToken = null;
    paypalService.tokenExpiry = null;
  });

  describe('Service Configuration', () => {
    it('should have environment variables set', () => {
      expect(process.env.PAYPAL_CLIENT_ID).toBe('test-client-id');
      expect(process.env.PAYPAL_CLIENT_SECRET).toBe('test-client-secret');
      expect(process.env.NODE_ENV).not.toBe('production');
    });

    it('should be instantiated', () => {
      expect(paypalService).toBeDefined();
      expect(typeof paypalService.createOrder).toBe('function');
      expect(typeof paypalService.captureOrder).toBe('function');
      expect(typeof paypalService.getOrderDetails).toBe('function');
    });
  });

  describe('Create Order', () => {
    beforeEach(() => {
      // Mock successful auth token response
      mockAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-access-token',
          expires_in: 3600
        }
      });
    });

    const mockOrderData = {
      orderNumber: 'ORD-12345',
      totalAmount: 299.99,
      currency: 'GBP',
      items: [{
        name: 'Test Product',
        quantity: 1,
        unitPrice: 299.99
      }],
      returnUrl: 'https://example.com/return',
      cancelUrl: 'https://example.com/cancel'
    };

    it('should create PayPal order successfully', async () => {
      // Mock successful order creation (auth token already mocked in beforeEach)
      const mockOrderResponse = {
        id: 'paypal-order-id-123',
        status: 'CREATED',
        links: [
          { rel: 'approve', href: 'https://paypal.com/approve' }
        ]
      };
      
      mockAxios.post.mockResolvedValueOnce({
        data: mockOrderResponse
      });

      const result = await paypalService.createOrder(299.99, 'GBP', 'ORD-12345');

      expect(result.id).toBe('paypal-order-id-123');
      expect(result.status).toBe('CREATED');
      expect(mockAxios.post).toHaveBeenCalledTimes(2);
      
      // Check auth call
      expect(mockAxios.post).toHaveBeenNthCalledWith(1, 
        expect.stringContaining('/v1/oauth2/token'),
        'grant_type=client_credentials',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic')
          })
        })
      );
      
      // Check order creation call
      expect(mockAxios.post).toHaveBeenNthCalledWith(2,
        expect.stringContaining('/v2/checkout/orders'),
        expect.objectContaining({
          intent: 'CAPTURE',
          purchase_units: expect.arrayContaining([
            expect.objectContaining({
              reference_id: 'ORD-12345',
              amount: {
                currency_code: 'GBP',
                value: '299.99'
              }
            })
          ])
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token'
          })
        })
      );
    });

    it('should handle PayPal API errors during order creation', async () => {
      // Mock failed order creation (auth token already mocked in beforeEach)
      const mockError = new Error('Bad Request: Invalid order data');
      mockAxios.post.mockRejectedValueOnce(mockError);

      await expect(paypalService.createOrder(299.99, 'GBP', 'ORD-12345')).rejects.toThrow('Failed to create PayPal order');
    });

    it('should validate required order data', async () => {
      // The service will try to call toFixed on undefined amount
      await expect(paypalService.createOrder(undefined, 'GBP', 'ORD-12345')).rejects.toThrow();
    });
  });

  describe('Capture Order', () => {
    it('should capture PayPal order successfully', async () => {
      // Mock successful auth token response
      mockAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-access-token',
          expires_in: 3600
        }
      });
      const mockResponse = {
        id: 'payment-id-123',
        status: 'COMPLETED',
        purchase_units: [{
          payments: {
            captures: [{
              id: 'capture-id-123',
              status: 'COMPLETED',
              amount: {
                currency_code: 'GBP',
                value: '299.99'
              }
            }]
          }
        }]
      };

      mockAxios.post.mockResolvedValueOnce({
        data: mockResponse
      });

      const result = await paypalService.captureOrder('paypal-order-id-123');

      expect(result.id).toBe('payment-id-123');
      expect(result.status).toBe('COMPLETED');
      expect(mockAxios.post).toHaveBeenCalledTimes(2);
      
      // Check capture call
      expect(mockAxios.post).toHaveBeenNthCalledWith(2,
        expect.stringContaining('/v2/checkout/orders/paypal-order-id-123/capture'),
        {},
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token'
          })
        })
      );
    });

    it('should handle capture failures', async () => {
      // Mock successful auth token response
      mockAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-access-token',
          expires_in: 3600
        }
      });
      
      const mockError = new Error('Capture failed');
      mockAxios.post.mockRejectedValueOnce(mockError);

      await expect(paypalService.captureOrder('invalid-order-id')).rejects.toThrow('Failed to capture PayPal order');
    });
  });

  describe('Get Order Details', () => {
    it('should get order details successfully', async () => {
      // Mock successful auth token response
      mockAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-access-token',
          expires_in: 3600
        }
      });
      const mockResponse = {
        id: 'paypal-order-id-123',
        status: 'APPROVED',
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'GBP',
            value: '299.99'
          }
        }]
      };

      mockAxios.get.mockResolvedValueOnce({
        data: mockResponse
      });

      const result = await paypalService.getOrderDetails('paypal-order-id-123');

      expect(result.id).toBe('paypal-order-id-123');
      expect(result.status).toBe('APPROVED');
      expect(mockAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/v2/checkout/orders/paypal-order-id-123'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token'
          })
        })
      );
    });

    it('should handle order not found', async () => {
      // Mock successful auth token response
      mockAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-access-token',
          expires_in: 3600
        }
      });
      
      const mockError = new Error('Order not found');
      mockError.statusCode = 404;
      
      mockAxios.get.mockRejectedValueOnce(mockError);

      await expect(paypalService.getOrderDetails('non-existent-order')).rejects.toThrow('Failed to get PayPal order details');
    });
  });

  describe('Webhook Verification', () => {
    const mockWebhookPayload = {
      id: 'webhook-event-id',
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: {
        id: 'capture-id-123',
        status: 'COMPLETED'
      }
    };

    const mockHeaders = {
      'paypal-auth-algo': 'SHA256withRSA',
      'paypal-cert-url': 'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-360caa42-fca2a594-1d93a270',
      'paypal-transmission-id': 'transmission-id-123',
      'paypal-transmission-sig': 'signature-123',
      'paypal-transmission-time': new Date().toISOString()
    };

    it('should verify webhook signature successfully', async () => {
      // Mock successful auth token response
      mockAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-access-token',
          expires_in: 3600
        }
      });
      mockAxios.post.mockResolvedValueOnce({
        data: {
          verification_status: 'SUCCESS'
        }
      });

      const result = await paypalService.verifyWebhookSignature(
        mockHeaders,
        mockWebhookPayload,
        'webhook-id-123'
      );

      expect(result).toBe(true);
      expect(mockAxios.post).toHaveBeenCalledTimes(2);
      expect(mockAxios.post).toHaveBeenNthCalledWith(2,
        expect.stringContaining('/v1/notifications/verify-webhook-signature'),
        expect.objectContaining({
          auth_algo: mockHeaders['paypal-auth-algo'],
          cert_url: mockHeaders['paypal-cert-url'],
          transmission_id: mockHeaders['paypal-transmission-id'],
          transmission_sig: mockHeaders['paypal-transmission-sig'],
          transmission_time: mockHeaders['paypal-transmission-time'],
          webhook_id: 'webhook-id-123',
          webhook_event: mockWebhookPayload
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token'
          })
        })
      );
    });

    it('should handle invalid webhook signature', async () => {
      // Mock successful auth token response
      mockAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-access-token',
          expires_in: 3600
        }
      });
      
      mockAxios.post.mockResolvedValueOnce({
        data: {
          verification_status: 'FAILURE'
        }
      });

      const result = await paypalService.verifyWebhookSignature(
        { ...mockHeaders, 'paypal-transmission-sig': 'invalid-signature' },
        mockWebhookPayload,
        'webhook-id-123'
      );

      expect(result).toBe(false);
    });

    it('should handle webhook verification errors', async () => {
      // Mock successful auth token response
      mockAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-access-token',
          expires_in: 3600
        }
      });
      
      const mockError = new Error('Verification failed');
      mockAxios.post.mockRejectedValueOnce(mockError);

      const result = await paypalService.verifyWebhookSignature(
        mockHeaders,
        mockWebhookPayload,
        'webhook-id-123'
      );

      expect(result).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network timeout');
      networkError.code = 'ECONNRESET';
      
      mockAxios.post.mockRejectedValueOnce(networkError);

      await expect(paypalService.createOrder(299.99, 'GBP', 'ORD-12345')).rejects.toThrow('Failed to create PayPal order');
    });

    it('should handle PayPal service unavailable', async () => {
      // Mock successful auth
      mockAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-access-token',
          expires_in: 3600
        }
      });
      
      const serviceError = new Error('Service unavailable');
      serviceError.statusCode = 503;
      
      mockAxios.post.mockRejectedValueOnce(serviceError);

      await expect(paypalService.createOrder(299.99, 'GBP', 'ORD-12345')).rejects.toThrow('Failed to create PayPal order');
    });
  });

  describe('Refund Payment', () => {
    it('should process full refund successfully', async () => {
      // Mock successful auth token response
      mockAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-access-token',
          expires_in: 3600
        }
      });
      const mockResponse = {
        id: 'refund-id-123',
        status: 'COMPLETED',
        amount: {
          currency_code: 'GBP',
          value: '299.99'
        }
      };

      mockAxios.post.mockResolvedValueOnce({
        data: mockResponse
      });

      const result = await paypalService.refundPayment('capture-id-123');

      expect(result.id).toBe('refund-id-123');
      expect(result.status).toBe('COMPLETED');
      expect(mockAxios.post).toHaveBeenCalledTimes(2);
      
      // Check refund call
      expect(mockAxios.post).toHaveBeenNthCalledWith(2,
        expect.stringContaining('/v2/payments/captures/capture-id-123/refund'),
        {},
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token'
          })
        })
      );
    });

    it('should process partial refund successfully', async () => {
      // Mock successful auth token response
      mockAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-access-token',
          expires_in: 3600
        }
      });
      
      const mockResponse = {
        id: 'refund-id-123',
        status: 'COMPLETED',
        amount: {
          currency_code: 'GBP',
          value: '100.00'
        }
      };

      mockAxios.post.mockResolvedValueOnce({
        data: mockResponse
      });

      const result = await paypalService.refundPayment('capture-id-123', 100.00, 'GBP');

      expect(result.id).toBe('refund-id-123');
      expect(result.status).toBe('COMPLETED');
      
      // Check refund call with amount
      expect(mockAxios.post).toHaveBeenNthCalledWith(2,
        expect.stringContaining('/v2/payments/captures/capture-id-123/refund'),
        {
          amount: {
            currency_code: 'GBP',
            value: '100.00'
          }
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token'
          })
        })
      );
    });

    it('should handle refund failures', async () => {
      // Mock successful auth token response
      mockAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'mock-access-token',
          expires_in: 3600
        }
      });
      
      const mockError = new Error('Refund failed');
      mockAxios.post.mockRejectedValueOnce(mockError);

      await expect(paypalService.refundPayment('invalid-capture-id')).rejects.toThrow('Failed to process PayPal refund');
    });
  });
});