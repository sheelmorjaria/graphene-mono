import { vi } from 'vitest';

// Test utility functions for consistent test setup

/**
 * Create a mock Express request object
 */
export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ip: '127.0.0.1',
  method: 'GET',
  url: '/api/test',
  ...overrides
});

/**
 * Create a mock Express response object
 */
export const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
    redirect: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    headersSent: false
  };
  return res;
};

/**
 * Create a mock next function
 */
export const createMockNext = () => vi.fn();

/**
 * Create a complete middleware test context
 */
export const createMiddlewareContext = (reqOverrides = {}, resOverrides = {}) => ({
  req: createMockRequest(reqOverrides),
  res: { ...createMockResponse(), ...resOverrides },
  next: createMockNext()
});

/**
 * Create mock user data for testing
 */
export const createMockUser = (overrides = {}) => ({
  _id: 'user123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  isActive: true,
  role: 'user',
  createdAt: new Date(),
  save: vi.fn().mockResolvedValue(true),
  comparePassword: vi.fn().mockResolvedValue(true),
  generateAuthToken: vi.fn().mockReturnValue('token123'),
  ...overrides
});

/**
 * Create mock order data for testing
 */
export const createMockOrder = (overrides = {}) => ({
  _id: 'order123',
  orderNumber: 'ORD-123456',
  user: 'user123',
  items: [
    { product: 'product1', quantity: 2, price: 100 }
  ],
  totalAmount: 200,
  orderStatus: 'pending',
  paymentStatus: 'pending',
  createdAt: new Date(),
  save: vi.fn().mockResolvedValue(true),
  calculateSubtotal: vi.fn().mockReturnValue(200),
  calculateTotal: vi.fn().mockReturnValue(200),
  addStatusHistory: vi.fn(),
  canBeCancelled: vi.fn().mockReturnValue(true),
  isEligibleForRefund: vi.fn().mockReturnValue(true),
  ...overrides
});

/**
 * Create mock product data for testing
 */
export const createMockProduct = (overrides = {}) => ({
  _id: 'product123',
  name: 'Test Product',
  description: 'A test product',
  price: 99.99,
  category: 'electronics',
  inStock: true,
  inventory: 10,
  createdAt: new Date(),
  save: vi.fn().mockResolvedValue(true),
  updateInventory: vi.fn(),
  isAvailable: vi.fn().mockReturnValue(true),
  ...overrides
});

/**
 * Mock database operations
 */
export const createMockModel = (modelName = 'Model') => ({
  find: vi.fn().mockReturnValue({
    populate: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue([])
  }),
  findById: vi.fn().mockReturnValue({
    populate: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(null)
  }),
  findOne: vi.fn().mockReturnValue({
    populate: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(null)
  }),
  create: vi.fn().mockResolvedValue({}),
  findByIdAndUpdate: vi.fn().mockResolvedValue(null),
  findOneAndUpdate: vi.fn().mockResolvedValue(null),
  updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
  updateMany: vi.fn().mockResolvedValue({ modifiedCount: 0 }),
  deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
  deleteMany: vi.fn().mockResolvedValue({ deletedCount: 0 }),
  countDocuments: vi.fn().mockResolvedValue(0),
  aggregate: vi.fn().mockResolvedValue([]),
  
  // Model constructor for instances
  mockImplementation: function(data) {
    return {
      ...data,
      _id: data._id || 'mock-id',
      save: vi.fn().mockResolvedValue(this),
      remove: vi.fn().mockResolvedValue(this),
      delete: vi.fn().mockResolvedValue(this),
      toObject: vi.fn().mockReturnValue(data),
      toJSON: vi.fn().mockReturnValue(data)
    };
  }
});

/**
 * Async test helper to handle promise-based tests
 */
export const asyncTest = (testFn) => {
  return async (done) => {
    try {
      await testFn();
      done();
    } catch (error) {
      done(error);
    }
  };
};

/**
 * Wait for a specified amount of time (for async testing)
 */
export const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock timer helper for time-dependent tests
 */
export const withMockTimers = (testFn) => {
  return async () => {
    vi.useFakeTimers();
    try {
      await testFn();
    } finally {
      vi.useRealTimers();
    }
  };
};

/**
 * Test data factory for consistent test data generation
 */
export class TestDataFactory {
  static user(overrides = {}) {
    return createMockUser(overrides);
  }

  static order(overrides = {}) {
    return createMockOrder(overrides);
  }

  static product(overrides = {}) {
    return createMockProduct(overrides);
  }

  static adminUser(overrides = {}) {
    return createMockUser({
      role: 'admin',
      permissions: ['read', 'write', 'admin'],
      ...overrides
    });
  }

  static validRegistrationData(overrides = {}) {
    return {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      ...overrides
    };
  }

  static validLoginData(overrides = {}) {
    return {
      email: 'john@example.com',
      password: 'SecurePass123!',
      ...overrides
    };
  }

  static validOrderData(overrides = {}) {
    return {
      items: [
        { product: 'product1', quantity: 2, price: 100 }
      ],
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        postalCode: 'T3ST 1NG',
        country: 'GB'
      },
      paymentMethod: 'paypal',
      ...overrides
    };
  }
}

/**
 * Error testing helpers
 */
export const expectError = (errorClass, message) => {
  return expect.objectContaining({
    name: errorClass.name,
    message: expect.stringContaining(message)
  });
};

export const expectValidationError = (field, message) => {
  return expect.objectContaining({
    errors: expect.objectContaining({
      [field]: expect.stringContaining(message)
    })
  });
};

/**
 * Response testing helpers
 */
export const expectSuccessResponse = (data = {}) => {
  return expect.objectContaining({
    success: true,
    ...data
  });
};

export const expectErrorResponse = (statusCode, message) => {
  return {
    status: statusCode,
    response: expect.objectContaining({
      success: false,
      message: expect.stringContaining(message)
    })
  };
};

/**
 * Database testing helpers
 */
export const mockDatabaseError = (operation, error = new Error('Database error')) => {
  return vi.fn().mockRejectedValue(error);
};

export const mockDatabaseSuccess = (operation, result) => {
  return vi.fn().mockResolvedValue(result);
};

/**
 * Performance testing helpers
 */
export const measureExecutionTime = async (fn) => {
  const start = process.hrtime.bigint();
  await fn();
  const end = process.hrtime.bigint();
  return Number(end - start) / 1000000; // Convert to milliseconds
};

export const expectFastExecution = async (fn, maxMs = 100) => {
  const time = await measureExecutionTime(fn);
  expect(time).toBeLessThan(maxMs);
};

/**
 * Mock environment helpers
 */
export const withEnvironment = (envVars, testFn) => {
  return async () => {
    const originalEnv = { ...process.env };
    Object.assign(process.env, envVars);
    
    try {
      await testFn();
    } finally {
      process.env = originalEnv;
    }
  };
};

/**
 * Mock console helpers for testing logs
 */
export const mockConsole = () => {
  const originalConsole = { ...console };
  const mocks = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {})
  };
  
  return {
    mocks,
    restore: () => {
      Object.assign(console, originalConsole);
    }
  };
};

/**
 * Test suite helpers
 */
export const describeUnit = (name, tests) => describe(`${name} - Unit Tests`, tests);
export const describeIntegration = (name, tests) => describe(`${name} - Integration Tests`, tests);
export const describeE2E = (name, tests) => describe(`${name} - E2E Tests`, tests);

/**
 * Skip tests conditionally
 */
export const skipIf = (condition, reason) => condition ? describe.skip : describe;
export const skipUnless = (condition, reason) => condition ? describe : describe.skip;