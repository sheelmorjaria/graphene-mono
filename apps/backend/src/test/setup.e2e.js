import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;
let mongoUri;

// Setup global test utilities
global.vi = vi;

// Set PayPal environment variables for E2E tests
process.env.PAYPAL_CLIENT_ID = 'test-paypal-client-id';
process.env.PAYPAL_CLIENT_SECRET = 'test-paypal-client-secret';
process.env.PAYPAL_ENVIRONMENT = 'sandbox';

// Setup in-memory MongoDB for E2E tests
beforeAll(async () => {
  try {
    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create({
      instance: {
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
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    
    console.log('E2E test database connected successfully');
  } catch (error) {
    console.error('Failed to setup E2E test database:', error);
    throw error;
  }
}, 120000);

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
    
    console.log('E2E test database cleanup completed');
  } catch (error) {
    console.error('Error during E2E test cleanup:', error.message);
  }
}, 60000);

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

// Mock external services for E2E tests
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
    }),
    verifyWebhookSignature: vi.fn().mockReturnValue(true)
  }
}));

vi.mock('../services/moneroService.js', () => ({
  default: {
    getExchangeRate: vi.fn().mockResolvedValue({
      rate: 0.008,
      validUntil: new Date(Date.now() + 300000)
    }),
    createPayment: vi.fn().mockResolvedValue({
      address: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F',
      amount: 1.234567890123,
      paymentId: 'globee-payment-id'
    }),
    verifyWebhookSignature: vi.fn().mockReturnValue(true)
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
    sendPaymentNotification: vi.fn().mockResolvedValue(true),
    sendAccountStatusUpdate: vi.fn().mockResolvedValue(true),
    sendRefundNotification: vi.fn().mockResolvedValue(true)
  }
}));

// Mock logger but allow some output for debugging E2E tests
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

// Export utilities for E2E tests
export const getMongoUri = () => mongoUri;
export const getMongoServer = () => mongoServer;

// E2E Test data factories
export const createTestUser = (overrides = {}) => ({
  email: 'e2e.test@example.com',
  password: 'hashedPassword123',
  firstName: 'E2E',
  lastName: 'User',
  isActive: true,
  role: 'customer',
  ...overrides
});

export const createTestProduct = (overrides = {}) => ({
  name: 'E2E Test Product',
  slug: 'e2e-test-product-' + Date.now(),
  sku: 'E2E-PROD-' + Date.now(),
  price: 299.99,
  description: 'An E2E test product',
  shortDescription: 'A test product for E2E testing',
  category: new mongoose.Types.ObjectId(),
  condition: 'new',
  inStock: true,
  stockStatus: 'in_stock',
  status: 'active',
  isActive: true,
  ...overrides
});

export const createTestOrder = (overrides = {}) => ({
  userId: new mongoose.Types.ObjectId(),
  customerEmail: 'e2e.test@example.com',
  status: 'pending',
  paymentStatus: 'pending',
  items: [
    {
      productId: new mongoose.Types.ObjectId(),
      productName: 'E2E Test Product',
      productSlug: 'e2e-test-product',
      quantity: 1,
      unitPrice: 299.99,
      totalPrice: 299.99
    }
  ],
  subtotal: 299.99,
  tax: 0,
  shipping: 9.99,
  totalAmount: 309.98,
  shippingAddress: {
    fullName: 'E2E Test User',
    addressLine1: '123 E2E Test St',
    city: 'E2E City',
    stateProvince: 'E2E State',
    postalCode: 'E2E 1NG',
    country: 'GB'
  },
  billingAddress: {
    fullName: 'E2E Test User',
    addressLine1: '123 E2E Test St',
    city: 'E2E City',
    stateProvince: 'E2E State',
    postalCode: 'E2E 1NG',
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
      productName: 'E2E Test Product',
      productSlug: 'e2e-test-product',
      unitPrice: 299.99,
      quantity: 1,
      subtotal: 299.99
    }
  ],
  totalItems: 1,
  totalAmount: 299.99,
  ...overrides
});

// Process cleanup handlers for E2E tests
const cleanup = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error('Error during E2E process cleanup:', error.message);
  }
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('beforeExit', cleanup);