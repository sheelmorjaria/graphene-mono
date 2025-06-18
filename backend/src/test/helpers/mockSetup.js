import { vi } from 'vitest';

// Global mock setup for external APIs and services
export const setupMocks = () => {
  // Mock fetch for external API calls
  global.fetch = vi.fn();

  // Mock console methods to reduce noise in tests
  if (!process.env.SHOW_TEST_LOGS) {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  }

  // Set up test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.PAYPAL_CLIENT_ID = 'test-paypal-client-id';
  process.env.PAYPAL_CLIENT_SECRET = 'test-paypal-client-secret';
  process.env.BITCOIN_API_KEY = 'test-bitcoin-api-key';
  process.env.GLOBEE_API_KEY = 'test-globee-api-key';
  process.env.GLOBEE_WEBHOOK_SECRET = 'test-globee-webhook-secret';
  process.env.EMAIL_SERVICE = 'mock';
};

// Mock external API responses
export const mockApiResponses = {
  // CoinGecko API for exchange rates
  coinGecko: {
    bitcoin: {
      success: {
        bitcoin: { gbp: 0.00003247 }
      },
      error: {
        error: 'coin not found'
      }
    },
    monero: {
      success: {
        monero: { gbp: 0.005432 }
      },
      error: {
        error: 'coin not found'
      }
    }
  },

  // PayPal API
  paypal: {
    auth: {
      success: {
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600
      },
      error: {
        error: 'invalid_client',
        error_description: 'Client authentication failed'
      }
    },
    order: {
      success: {
        id: 'mock-order-id',
        status: 'CREATED',
        links: [
          {
            href: 'https://api.sandbox.paypal.com/v2/checkout/orders/mock-order-id',
            rel: 'self',
            method: 'GET'
          }
        ]
      },
      error: {
        error: 'INVALID_REQUEST',
        error_description: 'Request is not well-formed'
      }
    },
    capture: {
      success: {
        id: 'mock-capture-id',
        status: 'COMPLETED',
        amount: { currency_code: 'GBP', value: '999.99' }
      },
      error: {
        error: 'UNPROCESSABLE_ENTITY',
        error_description: 'The payment could not be processed'
      }
    }
  },

  // Bitcoin API (Blockonomics)
  bitcoin: {
    address: {
      success: {
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
      },
      error: {
        error: 'API key not found'
      }
    },
    balance: {
      success: {
        confirmed: 100000000,
        unconfirmed: 0
      },
      error: {
        error: 'Address not found'
      }
    }
  },

  // Monero API (GloBee)
  monero: {
    payment: {
      success: {
        data: {
          id: 'mock-payment-id',
          payment_url: 'https://globee.com/payment/mock-payment-id',
          total: '0.01',
          currency: 'XMR',
          status: 'unpaid'
        }
      },
      error: {
        error: 'Invalid API key'
      }
    },
    status: {
      success: {
        data: {
          id: 'mock-payment-id',
          status: 'confirmed',
          confirmations: 10
        }
      },
      error: {
        error: 'Payment not found'
      }
    }
  }
};

// Setup mock responses for common API calls
export const setupCommonMocks = () => {
  // Mock successful CoinGecko calls by default
  global.fetch.mockImplementation((url) => {
    if (url.includes('coingecko.com') && url.includes('bitcoin')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.coinGecko.bitcoin.success)
      });
    }
    
    if (url.includes('coingecko.com') && url.includes('monero')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.coinGecko.monero.success)
      });
    }

    if (url.includes('paypal.com') && url.includes('token')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.paypal.auth.success)
      });
    }

    if (url.includes('paypal.com') && url.includes('orders')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.paypal.order.success)
      });
    }

    if (url.includes('blockonomics.co')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.bitcoin.address.success)
      });
    }

    if (url.includes('globee.com')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponses.monero.payment.success)
      });
    }

    // Default fallback
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' })
    });
  });
};

// Rate limiting helpers
export const mockRateLimiting = {
  // Add delays to prevent rate limiting issues
  addDelay: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock rate-limited responses
  rateLimitedResponse: {
    ok: false,
    status: 429,
    json: () => Promise.resolve({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded'
    })
  }
};

// Cleanup mocks
export const cleanupMocks = () => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear();
  }
};

export default {
  setupMocks,
  mockApiResponses,
  setupCommonMocks,
  mockRateLimiting,
  cleanupMocks
};