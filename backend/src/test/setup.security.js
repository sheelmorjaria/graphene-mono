import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;
let mongoUri;

// Setup global test utilities
global.vi = vi;

// Setup in-memory MongoDB for security tests
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
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('Security test database connected successfully');
  } catch (error) {
    console.error('Failed to setup security test database:', error);
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
    
    console.log('Security test database cleanup completed');
  } catch (error) {
    console.error('Error during security test cleanup:', error.message);
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

// Mock external services for security tests with validation focus
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
    verifyWebhookSignature: vi.fn().mockImplementation((signature, payload, secret) => {
      // Security test: validate webhook signature verification
      return signature && payload && secret;
    }),
    validateAddress: vi.fn().mockImplementation((address) => {
      // Security test: validate Bitcoin address format
      return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
    })
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
    verifyWebhookSignature: vi.fn().mockImplementation((signature, payload, secret) => {
      // Security test: validate webhook signature verification
      return signature && payload && secret;
    }),
    validateAddress: vi.fn().mockImplementation((address) => {
      // Security test: validate Monero address format
      return /^4[0-9AB][0-9A-Za-z]{93}$/.test(address);
    })
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
    verifyWebhookSignature: vi.fn().mockImplementation((headers, body, webhookId) => {
      // Security test: validate PayPal webhook signature
      return headers && body && webhookId;
    }),
    validateOrderAmount: vi.fn().mockImplementation((amount) => {
      // Security test: validate order amount is positive and reasonable
      return typeof amount === 'number' && amount > 0 && amount < 1000000;
    })
  }
}));

// Mock email service with security validation
vi.mock('../services/emailService.js', () => ({
  default: {
    sendEmail: vi.fn().mockImplementation(async (to, subject, content) => {
      // Security test: validate email parameters
      if (!to || !subject || !content) {
        throw new Error('Missing required email parameters');
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(to)) {
        throw new Error('Invalid email format');
      }
      return true;
    }),
    sendOrderConfirmation: vi.fn().mockResolvedValue(true),
    sendPaymentNotification: vi.fn().mockResolvedValue(true)
  }
}));

// Mock logger with security event tracking
vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn().mockImplementation((...args) => console.warn('SECURITY WARN:', ...args)),
    error: vi.fn().mockImplementation((...args) => console.error('SECURITY ERROR:', ...args)),
    debug: vi.fn()
  },
  logError: vi.fn(),
  logInfo: vi.fn(),
  logPaymentEvent: vi.fn(),
  logSecurityEvent: vi.fn().mockImplementation((event, details) => {
    console.log('SECURITY EVENT:', event, details);
  })
}));

// Export utilities for security tests
export const getMongoUri = () => mongoUri;
export const getMongoServer = () => mongoServer;

// Security test data factories
export const createMaliciousUser = (overrides = {}) => ({
  email: 'hacker@malicious.com',
  password: 'hashedPassword123',
  firstName: '<script>alert("xss")</script>',
  lastName: 'User',
  isActive: true,
  role: 'customer',
  ...overrides
});

export const createTestUser = (overrides = {}) => ({
  email: 'security.test@example.com',
  password: 'hashedPassword123',
  firstName: 'Security',
  lastName: 'User',
  isActive: true,
  role: 'customer',
  ...overrides
});

export const createAdminUser = (overrides = {}) => ({
  email: 'admin@example.com',
  password: 'hashedAdminPassword456',
  firstName: 'Admin',
  lastName: 'User',
  isActive: true,
  role: 'admin',
  ...overrides
});

export const createTestProduct = (overrides = {}) => ({
  name: 'Security Test Product',
  slug: 'security-test-product-' + Date.now(),
  sku: 'SEC-PROD-' + Date.now(),
  price: 199.99,
  description: 'A security test product',
  shortDescription: 'Security test product',
  category: new mongoose.Types.ObjectId(),
  condition: 'new',
  inStock: true,
  stockStatus: 'in_stock',
  status: 'active',
  isActive: true,
  ...overrides
});

// Security validation utilities
export const validateInput = (input, maxLength = 1000) => {
  if (typeof input !== 'string') return false;
  if (input.length > maxLength) return false;
  
  // Check for common XSS patterns
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /eval\(/i,
    /expression\(/i
  ];
  
  return !xssPatterns.some(pattern => pattern.test(input));
};

export const validateSQLInjection = (input) => {
  if (typeof input !== 'string') return false;
  
  // Check for common SQL injection patterns
  const sqlPatterns = [
    /(\s|^)(union|select|insert|update|delete|drop|create|alter|exec|execute|declare)\s/i,
    /'(\s|;|--|\/\*)/,
    /(\s|^)(or|and)\s+\d+\s*=\s*\d+/i,
    /(\s|^)(or|and)\s+'[^']*'\s*=\s*'[^']*'/i
  ];
  
  return !sqlPatterns.some(pattern => pattern.test(input));
};

export const validateAuthToken = (token) => {
  if (!token || typeof token !== 'string') return false;
  
  // Check token format (JWT)
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Validate base64 encoding
    atob(parts[0].replace(/-/g, '+').replace(/_/g, '/'));
    atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return true;
  } catch (error) {
    return false;
  }
};

export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  
  // Check password strength
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasMinLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};

export const simulateRateLimitAttack = (requests = 100, timeWindow = 1000) => {
  return new Promise((resolve) => {
    const results = [];
    let completed = 0;
    
    for (let i = 0; i < requests; i++) {
      setTimeout(() => {
        results.push({
          request: i + 1,
          timestamp: Date.now(),
          blocked: i > 10 // Simulate rate limiting after 10 requests
        });
        
        completed++;
        if (completed === requests) {
          resolve(results);
        }
      }, Math.floor(Math.random() * timeWindow));
    }
  });
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
    console.error('Error during security test cleanup:', error.message);
  }
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('beforeExit', cleanup);