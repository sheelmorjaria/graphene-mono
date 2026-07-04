import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

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

// Signal to src/test/setup.js (imported by some integration test files) that the
// integration harness owns the DB connection — so setup.js must NOT run its own
// destructive standalone-server / session-mock setup (which corrupts this one).
global.__integrationSetupActive = true;

// Setup in-memory MongoDB replica set for integration tests.
// Each file creates + connects its own server and tears it down in afterAll.
// This guarantees cleanup (no leaked temp directories or mongod processes).
beforeAll(async () => {
  try {
    // A replica set is required: controllers use transactions (startSession +
    // commitTransaction), which only work on a replica-set member, not standalone.
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' }
    });
    mongoUri = mongoServer.getUri();

    // Disconnect any existing connection, then connect to the fresh server.
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
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
    // Close the connection and stop the server to prevent temp-dir leaks.
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
      mongoServer = null;
    }
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

// Mock email service — stub EVERY method so no real email is sent and each
// call resolves successfully. (emailService is a class instance; methods listed
// explicitly since they live on the prototype.)
const emailStub = () => vi.fn().mockResolvedValue(true);
vi.mock('../services/emailService.js', () => ({
  default: {
    isEnabled: true,
    sesClient: {},
    verifyConnection: emailStub(),
    validateEmail: vi.fn().mockReturnValue(true),
    canSendEmail: emailStub(),
    generateEmailTemplate: vi.fn().mockReturnValue('<html><body></body></html>'),
    addUnsubscribeLink: vi.fn().mockReturnValue(''),
    sendEmail: emailStub(),
    sendOrderConfirmationEmail: emailStub(),
    sendOrderCancellationEmail: emailStub(),
    sendOrderShippedEmail: emailStub(),
    sendOrderDeliveredEmail: emailStub(),
    sendOrderStatusUpdateEmail: emailStub(),
    sendSupportRequestEmail: emailStub(),
    sendContactAcknowledgmentEmail: emailStub(),
    sendReturnRequestConfirmationEmail: emailStub(),
    sendReturnApprovedEmail: emailStub(),
    sendReturnRejectedEmail: emailStub(),
    sendReturnRefundedEmail: emailStub(),
    sendRefundConfirmationEmail: emailStub(),
    sendAccountDisabledEmail: emailStub(),
    sendAccountReEnabledEmail: emailStub(),
    sendAccountDeletionConfirmationEmail: emailStub(),
    sendAccountDeletionCompletedEmail: emailStub(),
    sendAdminWelcomeEmail: emailStub(),
    sendWelcomeEmail: emailStub(),
    sendDataExportEmail: emailStub(),
    sendPaymentConfirmationEmail: emailStub(),
    sendPasswordResetEmail: emailStub()
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