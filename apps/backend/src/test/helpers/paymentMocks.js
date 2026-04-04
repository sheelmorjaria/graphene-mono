import { vi } from 'vitest';

// Comprehensive payment service mocking utilities

// PayPal Service Mock
export const createPayPalServiceMock = () => {
  const paypalMock = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    baseURL: 'https://api-m.sandbox.paypal.com',
    accessToken: 'mock-access-token',
    tokenExpiry: Date.now() + 3600000,

    // Authentication
    getAccessToken: vi.fn().mockResolvedValue('mock-access-token'),

    // Order operations
    createOrder: vi.fn().mockImplementation(async (orderData) => {
      if (!orderData.amount) {
        throw new Error('Amount is required');
      }
      return {
        id: `paypal-order-${Date.now()}`,
        status: 'CREATED',
        links: [
          { rel: 'approve', href: 'https://www.sandbox.paypal.com/checkoutnow?token=mock-token' },
          { rel: 'self', href: `https://api-m.sandbox.paypal.com/v2/checkout/orders/paypal-order-${Date.now()}` }
        ],
        create_time: new Date().toISOString(),
        purchase_units: [{
          reference_id: orderData.orderId,
          amount: {
            currency_code: orderData.currency || 'GBP',
            value: orderData.amount.toFixed(2)
          }
        }]
      };
    }),

    captureOrder: vi.fn().mockImplementation(async (orderId) => {
      return {
        id: orderId,
        status: 'COMPLETED',
        purchase_units: [{
          payments: {
            captures: [{
              id: `capture-${Date.now()}`,
              status: 'COMPLETED',
              amount: { value: '299.99', currency_code: 'GBP' },
              final_capture: true,
              create_time: new Date().toISOString()
            }]
          }
        }],
        payer: {
          email_address: 'test@example.com',
          payer_id: 'TEST123'
        }
      };
    }),

    getOrderDetails: vi.fn().mockImplementation(async (orderId) => {
      return {
        id: orderId,
        status: 'APPROVED',
        purchase_units: [{
          amount: { value: '299.99', currency_code: 'GBP' }
        }],
        payer: {
          email_address: 'test@example.com'
        }
      };
    }),

    refundPayment: vi.fn().mockImplementation(async (captureId, amount) => {
      return {
        id: `refund-${Date.now()}`,
        status: 'COMPLETED',
        amount: { value: amount.toFixed(2), currency_code: 'GBP' },
        create_time: new Date().toISOString()
      };
    }),

    // Helper methods
    formatAmount: vi.fn().mockImplementation((amount) => amount.toFixed(2)),
    isSupportedCurrency: vi.fn().mockImplementation((currency) => 
      ['GBP', 'USD', 'EUR'].includes(currency.toUpperCase())
    ),

    // Error simulation methods
    simulateError: (method, error) => {
      paypalMock[method].mockRejectedValueOnce(error);
    },

    simulateNetworkError: (method) => {
      paypalMock[method].mockRejectedValueOnce(new Error('Network error'));
    },

    reset: () => {
      Object.values(paypalMock).forEach(mock => {
        if (vi.isMockFunction(mock)) {
          mock.mockClear();
        }
      });
    }
  };

  return paypalMock;
};

// Bitcoin Service Mock
export const createBitcoinServiceMock = () => {
  const bitcoinMock = {
    apiKey: 'test-bitcoin-api-key',
    baseURL: 'https://www.blockonomics.co/api',

    generateAddress: vi.fn().mockImplementation(async (orderId) => {
      return {
        address: `bc1qtest${orderId.slice(-8)}`,
        orderId,
        createdAt: new Date(),
        used: false
      };
    }),

    getAddressBalance: vi.fn().mockImplementation(async (address) => {
      return {
        address,
        confirmed: 0.001,
        unconfirmed: 0,
        txs: []
      };
    }),

    getTransactionDetails: vi.fn().mockImplementation(async (txHash) => {
      return {
        txid: txHash,
        confirmations: 6,
        value: 100000, // satoshis
        time: Date.now(),
        status: 'confirmed'
      };
    }),

    createPaymentRequest: vi.fn().mockImplementation(async (orderData) => {
      return {
        address: `bc1qtest${orderData.orderId.slice(-8)}`,
        amount: orderData.amount,
        currency: 'BTC',
        orderId: orderData.orderId,
        expirationTime: new Date(Date.now() + 3600000),
        qrCode: `bitcoin:bc1qtest${orderData.orderId.slice(-8)}?amount=${orderData.amount}`
      };
    }),

    verifyPayment: vi.fn().mockImplementation(async (address, expectedAmount) => {
      return {
        verified: true,
        amount: expectedAmount,
        confirmations: 6,
        txHash: `tx${Date.now()}`
      };
    }),

    // Exchange rate methods
    getBTCToFiatRate: vi.fn().mockResolvedValue(50000), // $50k per BTC
    convertFiatToBTC: vi.fn().mockImplementation((fiatAmount, currency = 'GBP') => {
      const rate = currency === 'GBP' ? 40000 : 50000;
      return fiatAmount / rate;
    }),

    reset: () => {
      Object.values(bitcoinMock).forEach(mock => {
        if (vi.isMockFunction(mock)) {
          mock.mockClear();
        }
      });
    }
  };

  return bitcoinMock;
};

// Unified Payment Service Mock Factory
export const createPaymentServiceMocks = () => {
  const paypalMock = createPayPalServiceMock();
  const bitcoinMock = createBitcoinServiceMock();

  return {
    paypal: paypalMock,
    bitcoin: bitcoinMock,

    // Utility methods
    resetAll: () => {
      paypalMock.reset();
      bitcoinMock.reset();
    },

    // Simulate various payment scenarios
    simulateSuccessfulPayment: (service) => {
      // Implementation depends on service type
    },

    simulateFailedPayment: (service, errorType = 'network') => {
      const error = errorType === 'network' 
        ? new Error('Network connection failed')
        : new Error('Payment declined');
      
      if (service === 'paypal') {
        paypalMock.simulateError('createOrder', error);
      } else if (service === 'bitcoin') {
        bitcoinMock.verifyPayment.mockRejectedValueOnce(error);
      }
    }
  };
};

// Mock setup function for use in tests
export const setupPaymentMocks = () => {
  const mocks = createPaymentServiceMocks();

  // Mock the actual service modules
  vi.mock('../../services/paypalService.js', () => ({
    default: mocks.paypal
  }));

  vi.mock('../../services/bitcoinService.js', () => ({
    default: mocks.bitcoin
  }));

  // Mock external HTTP libraries
  vi.mock('node-fetch', () => vi.fn());
  vi.mock('axios', () => ({
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    }
  }));

  return mocks;
};