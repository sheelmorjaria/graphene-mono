import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Set PayPal environment variables early for proper client initialization
process.env.PAYPAL_CLIENT_ID = 'test-paypal-client-id';
process.env.PAYPAL_CLIENT_SECRET = 'test-paypal-client-secret';
process.env.PAYPAL_ENVIRONMENT = 'sandbox';

// Handle Mongoose model recompilation issues in tests
const originalModel = mongoose.model;
mongoose.model = function(name, schema, collection, options) {
  try {
    // Try to get existing model first
    return originalModel.call(this, name);
  } catch (error) {
    // Model doesn't exist, create it with original function
    return originalModel.call(this, name, schema, collection, options);
  }
};

let mongoServer;
let mongoUri;

// Setup global test utilities
global.vi = vi;

// Setup in-memory MongoDB for integration tests
beforeAll(async () => {
  try {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create({
      instance: {
        // Use a simple configuration for reliability
        storageEngine: 'wiredTiger'
      }
    });
    mongoUri = mongoServer.getUri();
    
    // Disconnect from any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    console.log('Integration test database connected successfully');
  } catch (error) {
    console.error('Failed to setup integration test database:', error);
    throw error;
  }
}, 60000);

afterAll(async () => {
  try {
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    // Stop mongo server
    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null;
    }
    
    console.log('Integration test database cleanup completed');
  } catch (error) {
    console.error('Error during integration test cleanup:', error.message);
  }
}, 30000);

beforeEach(async () => {
  // Clean up test data before each test
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    
    for (const collection of Object.values(collections)) {
      try {
        await collection.deleteMany({});
      } catch (error) {
        console.warn(`Failed to clean collection ${collection.collectionName}:`, error.message);
      }
    }
  }
});

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks();
});

// Mock external services for integration tests
vi.mock('../services/bitcoinService.js', () => ({
  default: {
    generateAddress: vi.fn().mockResolvedValue({
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      qrCode: 'data:image/png;base64,mock-qr-code'
    }),
    getExchangeRate: vi.fn().mockResolvedValue({
      rate: 0.000025,
      validUntil: new Date(Date.now() + 300000)
    }),
    getAddressInfo: vi.fn().mockResolvedValue({
      balance: 0,
      transactions: []
    })
  }
}));

vi.mock('../services/moneroService.js', () => ({
  default: {
    getExchangeRate: vi.fn().mockResolvedValue({
      rate: 0.008,
      validUntil: new Date(Date.now() + 300000)
    }),
    convertGbpToXmr: vi.fn().mockResolvedValue({
      xmrAmount: 1.234567890123,
      exchangeRate: 0.008,
      validUntil: new Date(Date.now() + 300000)
    }),
    createPayment: vi.fn().mockResolvedValue({
      address: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F',
      amount: 1.234567890123,
      paymentId: 'globee-payment-id'
    }),
    createPaymentRequest: vi.fn().mockResolvedValue({
      paymentId: 'globee-payment-id',
      address: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F',
      paymentUrl: 'https://globee.com/payment/mock-payment-id',
      expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      requiredConfirmations: 10,
      paymentWindow: 24
    }),
    verifyWebhookSignature: vi.fn().mockReturnValue(true),
    getPaymentStatus: vi.fn().mockResolvedValue({
      status: 'pending',
      confirmations: 0,
      paid_amount: 0,
      transaction_hash: null
    }),
    isPaymentExpired: vi.fn().mockImplementation((createdAt) => {
      // Check if payment is older than 24 hours (default expiration)
      const expirationTime = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
      return new Date() > expirationTime;
    }),
    getRequiredConfirmations: vi.fn().mockReturnValue(10),
    processWebhookNotification: vi.fn().mockImplementation((payload) => ({
      orderId: payload.order_id || 'test-order-id',
      status: payload.status === 'paid' ? 'confirmed' : payload.status,
      confirmations: payload.confirmations || 0,
      paidAmount: payload.paid_amount || 0,
      transactionHash: payload.transaction_hash || null
    }))
  }
}));

vi.mock('../services/paypalService.js', () => ({
  default: {
    createOrder: vi.fn().mockResolvedValue({
      id: 'paypal-order-id',
      status: 'CREATED',
      links: [
        {
          rel: 'approve',
          href: 'https://www.sandbox.paypal.com/checkoutnow?token=mock-token'
        }
      ]
    }),
    captureOrder: vi.fn().mockResolvedValue({
      id: 'paypal-capture-id',
      status: 'COMPLETED'
    }),
    refundPayment: vi.fn().mockResolvedValue({
      id: 'paypal-refund-id',
      status: 'COMPLETED'
    })
  }
}));

// Mock email service
vi.mock('../services/emailService.js', () => ({
  default: {
    sendEmail: vi.fn().mockResolvedValue(true),
    sendOrderConfirmation: vi.fn().mockResolvedValue(true),
    sendPaymentNotification: vi.fn().mockResolvedValue(true)
  }
}));

// Mock PayPal SDK to prevent client initialization issues
vi.mock('@paypal/paypal-server-sdk', () => ({
  Client: vi.fn().mockImplementation(() => ({
    ordersController: {
      ordersCreate: vi.fn().mockResolvedValue({
        result: {
          id: 'mock-paypal-order-id',
          status: 'CREATED',
          links: [{ rel: 'approve', href: 'https://sandbox.paypal.com/mock-approval-url' }]
        }
      }),
      ordersCapture: vi.fn().mockResolvedValue({
        result: {
          id: 'mock-capture-id',
          status: 'COMPLETED'
        }
      })
    },
    paymentsController: {
      capturesRefund: vi.fn().mockResolvedValue({
        result: {
          id: 'mock-refund-id',
          status: 'COMPLETED'
        }
      })
    }
  })),
  Environment: {
    Sandbox: 'sandbox',
    Production: 'production'
  }
}));

// Mock logger but allow some output for debugging
vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn().mockImplementation((...args) => console.log('INFO:', ...args)),
    warn: vi.fn().mockImplementation((...args) => console.warn('WARN:', ...args)),
    error: vi.fn().mockImplementation((...args) => console.error('ERROR:', ...args)),
    debug: vi.fn()
  },
  logError: vi.fn(),
  logInfo: vi.fn(),
  logPaymentEvent: vi.fn()
}));

// No session mocking needed - the controller handles missing sessions gracefully

// Export utilities for integration tests
export const getMongoUri = () => mongoUri;
export const getMongoServer = () => mongoServer;

// Test data factories
export const createTestUser = (overrides = {}) => ({
  email: 'test@example.com',
  password: 'hashedPassword123',
  firstName: 'Test',
  lastName: 'User',
  isActive: true,
  role: 'customer',
  ...overrides
});

export const createTestProduct = (overrides = {}) => ({
  name: 'Test Product',
  slug: 'test-product',
  sku: 'TEST-PROD-001',
  price: 199.99,
  description: 'A test product',
  shortDescription: 'A test product for testing',
  category: new mongoose.Types.ObjectId(), // Valid ObjectId for category
  condition: 'new',
  inStock: true,
  stockStatus: 'in_stock',
  status: 'active',
  isActive: true,
  ...overrides
});

export const createTestOrder = (overrides = {}) => ({
  userId: new mongoose.Types.ObjectId(),
  customerEmail: 'test@example.com',
  status: 'pending',
  paymentStatus: 'pending',
  items: [
    {
      productId: new mongoose.Types.ObjectId(),
      productName: 'Test Product',
      productSlug: 'test-product',
      quantity: 1,
      unitPrice: 199.99,
      totalPrice: 199.99
    }
  ],
  subtotal: 199.99,
  tax: 0,
  shipping: 9.99,
  totalAmount: 209.98,
  shippingAddress: {
    fullName: 'Test User',
    addressLine1: '123 Test St',
    city: 'Test City',
    stateProvince: 'Test State',
    postalCode: 'TE5T 1NG',
    country: 'GB'
  },
  billingAddress: {
    fullName: 'Test User',
    addressLine1: '123 Test St',
    city: 'Test City',
    stateProvince: 'Test State',
    postalCode: 'TE5T 1NG',
    country: 'GB'
  },
  shippingMethod: {
    id: new mongoose.Types.ObjectId(),
    name: 'Standard Shipping',
    cost: 9.99
  },
  paymentMethod: {
    type: 'paypal',
    name: 'PayPal'
  },
  ...overrides
});

export const createTestCart = (overrides = {}) => ({
  userId: new mongoose.Types.ObjectId(),
  items: [
    {
      productId: new mongoose.Types.ObjectId(),
      productName: 'Test Product',
      productSlug: 'test-product',
      unitPrice: 199.99,
      quantity: 1,
      subtotal: 199.99
    }
  ],
  totalItems: 1,
  totalAmount: 199.99,
  ...overrides
});

// Process cleanup handlers
const cleanup = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error('Error during process cleanup:', error.message);
  }
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('beforeExit', cleanup);