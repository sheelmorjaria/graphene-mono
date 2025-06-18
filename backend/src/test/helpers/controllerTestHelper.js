import { vi } from 'vitest';
import request from 'supertest';
import app from '../../app.js';

/**
 * Enhanced test helper for controller tests with transaction support
 */
export class ControllerTestHelper {
  constructor() {
    this.testData = new Map();
    this.mockServices = new Map();
  }

  /**
   * Create test data with automatic cleanup
   */
  async createTestData(Model, data, key = 'default') {
    try {
      const document = new Model(data);
      const saved = await document.save();
      this.testData.set(`${Model.modelName}_${key}`, saved);
      return saved;
    } catch (error) {
      console.error(`Error creating test data for ${Model.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Get test data by model and key
   */
  getTestData(Model, key = 'default') {
    return this.testData.get(`${Model.modelName}_${key}`);
  }

  /**
   * Mock a service method with automatic cleanup
   */
  mockService(service, method, implementation) {
    if (!this.mockServices.has(service)) {
      this.mockServices.set(service, new Map());
    }
    
    const originalMethod = service[method];
    const mockImplementation = vi.fn(implementation);
    service[method] = mockImplementation;
    
    this.mockServices.get(service).set(method, {
      original: originalMethod,
      mock: mockImplementation
    });
    
    return mockImplementation;
  }

  /**
   * Create authenticated request helper
   */
  createAuthenticatedRequest(user) {
    const token = this.generateTestToken(user);
    return {
      get: (url) => request(app).get(url).set('Authorization', `Bearer ${token}`),
      post: (url) => request(app).post(url).set('Authorization', `Bearer ${token}`),
      put: (url) => request(app).put(url).set('Authorization', `Bearer ${token}`),
      patch: (url) => request(app).patch(url).set('Authorization', `Bearer ${token}`),
      delete: (url) => request(app).delete(url).set('Authorization', `Bearer ${token}`)
    };
  }

  /**
   * Generate test JWT token
   */
  generateTestToken(user) {
    // Simple mock token for testing - not using actual JWT
    return `test-token-${user._id || user.id || 'anonymous'}`;
  }

  /**
   * Wait for async operations to complete
   */
  async waitForAsyncOperations(ms = 100) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clean up all test data and mocks
   */
  async cleanup() {
    // Clear test data
    this.testData.clear();
    
    // Restore mocked services
    for (const [service, methods] of this.mockServices) {
      for (const [methodName, { original }] of methods) {
        if (original) {
          service[methodName] = original;
        }
      }
    }
    this.mockServices.clear();
    
    // Clear all vitest mocks
    vi.clearAllMocks();
  }

  /**
   * Assert successful response with data
   */
  assertSuccessResponse(response, expectedStatus = 200) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success', true);
    return response.body;
  }

  /**
   * Assert error response
   */
  assertErrorResponse(response, expectedStatus, expectedMessage = null) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('success', false);
    if (expectedMessage) {
      expect(response.body.message).toContain(expectedMessage);
    }
    return response.body;
  }

  /**
   * Create mock session for transaction testing
   */
  createMockSession() {
    return {
      startTransaction: vi.fn().mockResolvedValue(undefined),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      abortTransaction: vi.fn().mockResolvedValue(undefined),
      endSession: vi.fn().mockResolvedValue(undefined),
      withTransaction: vi.fn(async (fn) => await fn()),
      inTransaction: vi.fn().mockReturnValue(false),
      id: `mock-session-${Date.now()}`,
      transaction: { state: 'NO_TRANSACTION' }
    };
  }
}

/**
 * Factory function to create test helper instance
 */
export const createControllerTestHelper = () => new ControllerTestHelper();

/**
 * Common test data factories
 */
export const testDataFactories = {
  user: (overrides = {}) => ({
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'customer',
    isActive: true,
    emailVerified: true,
    ...overrides
  }),

  adminUser: (overrides = {}) => ({
    ...testDataFactories.user(),
    role: 'admin',
    permissions: ['manage_users', 'manage_products', 'manage_orders', 'view_reports'],
    ...overrides
  }),

  product: (overrides = {}) => ({
    name: `Test Product ${Date.now()}`,
    slug: `test-product-${Date.now()}`,
    sku: `TEST-${Date.now()}`,
    shortDescription: 'Test product description',
    price: 299.99,
    condition: 'new',
    stockStatus: 'in_stock',
    stockQuantity: 10,
    status: 'active',
    isActive: true,
    ...overrides
  }),

  order: (userId, overrides = {}) => ({
    orderNumber: `ORD-${Date.now()}`,
    userId,
    customerEmail: 'customer@example.com',
    status: 'pending',
    subtotal: 299.99,
    totalAmount: 305.98,
    items: [{
      productId: '507f1f77bcf86cd799439011', // Mock ObjectId
      productName: 'Test Product',
      productSlug: 'test-product',
      unitPrice: 299.99,
      totalPrice: 299.99,
      quantity: 1
    }],
    shippingAddress: {
      fullName: 'Test User',
      addressLine1: '123 Test St',
      city: 'Test City',
      stateProvince: 'Test State',
      postalCode: '12345',
      country: 'GB'
    },
    billingAddress: {
      fullName: 'Test User',
      addressLine1: '123 Test St',
      city: 'Test City',
      stateProvince: 'Test State',
      postalCode: '12345',
      country: 'GB'
    },
    paymentMethod: {
      id: '507f1f77bcf86cd799439012',
      name: 'Test Payment',
      type: 'paypal'
    },
    shippingMethod: {
      id: '507f1f77bcf86cd799439013',
      name: 'Standard Shipping',
      cost: 5.99
    },
    ...overrides
  })
};