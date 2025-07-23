import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;
let mongoUri;

// Setup global test utilities
global.vi = vi;

// Setup in-memory MongoDB for performance tests
beforeAll(async () => {
  try {
    // Create in-memory MongoDB instance optimized for performance testing
    mongoServer = await MongoMemoryServer.create({
      instance: {
        storageEngine: 'wiredTiger',
        args: ['--nojournal', '--noprealloc', '--smallfiles'] // Performance optimizations
      }
    });
    mongoUri = mongoServer.getUri();
    
    // Disconnect from any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Connect to the in-memory database with performance optimizations
    await mongoose.connect(mongoUri, {
      maxPoolSize: 20, // Higher pool size for performance tests
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000,
      bufferCommands: false,
      bufferMaxEntries: 0
    });
    
    console.log('Performance test database connected successfully');
  } catch (error) {
    console.error('Failed to setup performance test database:', error);
    throw error;
  }
}, 180000); // Longer timeout for performance test setup

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
    
    console.log('Performance test database cleanup completed');
  } catch (error) {
    console.error('Error during performance test cleanup:', error.message);
  }
}, 60000);

beforeEach(async () => {
  // Selective cleanup for performance tests - only clean what's needed
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    
    // Only clean specific collections to avoid performance overhead
    const collectionsToClean = ['orders', 'payments', 'carts'];
    
    for (const collectionName of collectionsToClean) {
      if (collections[collectionName]) {
        try {
          await collections[collectionName].deleteMany({});
        } catch (error) {
          console.warn(`Failed to clean collection ${collectionName}:`, error.message);
        }
      }
    }
  }
});

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks();
});

// Mock external services with realistic delays for performance testing
vi.mock('../services/bitcoinService.js', () => ({
  default: {
    generateAddress: vi.fn().mockImplementation(async () => {
      // Simulate realistic API delay
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      return {
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        qrCode: 'data:image/png;base64,mock-qr-code'
      };
    }),
    getExchangeRate: vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
      return {
        rate: 0.000025,
        validUntil: new Date(Date.now() + 300000)
      };
    }),
    getAddressInfo: vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 75));
      return {
        balance: 0,
        transactions: []
      };
    })
  }
}));

vi.mock('../services/moneroService.js', () => ({
  default: {
    getExchangeRate: vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
      return {
        rate: 0.008,
        validUntil: new Date(Date.now() + 300000)
      };
    }),
    createPayment: vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));
      return {
        address: '4AdUndXHHZ6cfufTMvppY6JwXNouMBzSkbLYfpAV5Usx3skxNgYeYTRJ5AmD5H3F',
        amount: 1.234567890123,
        paymentId: 'globee-payment-id'
      };
    })
  }
}));

vi.mock('../services/paypalService.js', () => ({
  default: {
    createOrder: vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 250 + 150));
      return {
        id: 'paypal-order-id',
        status: 'CREATED',
        links: [
          {
            rel: 'approve',
            href: 'https://www.sandbox.paypal.com/checkoutnow?token=mock-token'
          }
        ]
      };
    }),
    captureOrder: vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
      return {
        id: 'paypal-capture-id',
        status: 'COMPLETED'
      };
    })
  }
}));

// Mock email service with delays
vi.mock('../services/emailService.js', () => ({
  default: {
    sendEmail: vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      return true;
    }),
    sendOrderConfirmation: vi.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      return true;
    })
  }
}));

// Mock logger with minimal overhead
vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  },
  logError: vi.fn(),
  logInfo: vi.fn(),
  logPaymentEvent: vi.fn()
}));

// Export utilities for performance tests
export const getMongoUri = () => mongoUri;
export const getMongoServer = () => mongoServer;

// Performance test data factories - optimized for bulk creation
export const createTestUsers = (count = 100) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      email: `perf.user${i}@example.com`,
      password: 'hashedPassword123',
      firstName: `Perf${i}`,
      lastName: 'User',
      isActive: true,
      role: 'customer'
    });
  }
  return users;
};

export const createTestProducts = (count = 50) => {
  const products = [];
  for (let i = 0; i < count; i++) {
    products.push({
      name: `Performance Test Product ${i}`,
      slug: `perf-test-product-${i}-${Date.now()}`,
      sku: `PERF-PROD-${i}`,
      price: Math.floor(Math.random() * 1000) + 100,
      description: `Performance test product ${i}`,
      shortDescription: `Perf test product ${i}`,
      category: new mongoose.Types.ObjectId(),
      condition: 'new',
      inStock: true,
      stockStatus: 'in_stock',
      status: 'active',
      isActive: true
    });
  }
  return products;
};

export const createTestOrders = (count = 25, userIds = [], productIds = []) => {
  const orders = [];
  for (let i = 0; i < count; i++) {
    const userId = userIds[i % userIds.length] || new mongoose.Types.ObjectId();
    const productId = productIds[i % productIds.length] || new mongoose.Types.ObjectId();
    
    orders.push({
      userId,
      customerEmail: `perf.user${i}@example.com`,
      status: 'pending',
      paymentStatus: 'pending',
      items: [
        {
          productId,
          productName: `Performance Test Product ${i}`,
          productSlug: `perf-test-product-${i}`,
          quantity: Math.floor(Math.random() * 3) + 1,
          unitPrice: Math.floor(Math.random() * 500) + 50,
          totalPrice: Math.floor(Math.random() * 1500) + 150
        }
      ],
      subtotal: Math.floor(Math.random() * 1500) + 150,
      tax: 0,
      shipping: 9.99,
      totalAmount: Math.floor(Math.random() * 1500) + 159.99,
      shippingAddress: {
        fullName: `Perf User ${i}`,
        addressLine1: `${i} Performance St`,
        city: 'Perf City',
        stateProvince: 'Perf State',
        postalCode: `P${i.toString().padStart(3, '0')} 1NG`,
        country: 'GB'
      },
      billingAddress: {
        fullName: `Perf User ${i}`,
        addressLine1: `${i} Performance St`,
        city: 'Perf City',
        stateProvince: 'Perf State',
        postalCode: `P${i.toString().padStart(3, '0')} 1NG`,
        country: 'GB'
      },
      shippingMethod: {
        id: new mongoose.Types.ObjectId(),
        name: 'Standard Shipping',
        cost: 9.99
      },
      paymentMethod: {
        type: ['paypal', 'bitcoin', 'monero'][i % 3],
        name: ['PayPal', 'Bitcoin', 'Monero'][i % 3]
      }
    });
  }
  return orders;
};

// Performance measurement utilities
export const measureExecutionTime = async (fn, label = 'Operation') => {
  const start = process.hrtime.bigint();
  const result = await fn();
  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1000000; // Convert to milliseconds
  
  console.log(`${label} took ${duration.toFixed(2)}ms`);
  return { result, duration };
};

export const measureMemoryUsage = (label = 'Memory') => {
  const usage = process.memoryUsage();
  console.log(`${label}:`, {
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`
  });
  return usage;
};

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
    console.error('Error during performance test cleanup:', error.message);
  }
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('beforeExit', cleanup);