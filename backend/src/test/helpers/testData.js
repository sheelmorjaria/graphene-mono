import mongoose from 'mongoose';

// Helper to generate unique SKU
let skuCounter = 1;
export const generateSKU = (prefix = 'TEST') => {
  return `${prefix}-${Date.now()}-${skuCounter++}`;
};

// Valid product data factory
export const createValidProductData = (overrides = {}) => ({
  name: 'Test Product',
  slug: `test-product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  sku: generateSKU(),
  shortDescription: 'Test short description',
  longDescription: 'Test long description',
  price: 999.99,
  condition: 'new',
  stockStatus: 'in_stock',
  stockQuantity: 10,
  weight: 500,
  dimensions: {
    length: 20,
    width: 15,
    height: 10
  },
  status: 'active',
  isActive: true,
  ...overrides
});

// Valid user data factory
export const createValidUserData = (overrides = {}) => ({
  name: 'Test User',
  email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
  password: 'TestPassword123!',
  isAdmin: false,
  isActive: true,
  ...overrides
});

// Valid order data factory
export const createValidOrderData = (overrides = {}) => {
  const timestamp = Date.now();
  return {
    userId: new mongoose.Types.ObjectId(),
    customerEmail: `test-${timestamp}@example.com`,
    orderNumber: `ORD-${timestamp}-001`,
    status: 'pending',
    items: [{
      productId: new mongoose.Types.ObjectId(),
      productName: 'Test Product',
      productSlug: 'test-product',
      quantity: 1,
      unitPrice: 999.99,
      totalPrice: 999.99
    }],
    subtotal: 999.99,
    tax: 80.00,
    shipping: 15.00,
    totalAmount: 1094.99,
    shippingAddress: {
      fullName: 'Test User',
      addressLine1: '123 Test St',
      city: 'Test City',
      stateProvince: 'Test State',
      postalCode: '12345',
      country: 'GB',
      phoneNumber: '+44 20 7946 0958'
    },
    billingAddress: {
      fullName: 'Test User',
      addressLine1: '123 Test St',
      city: 'Test City',
      stateProvince: 'Test State',
      postalCode: '12345',
      country: 'GB',
      phoneNumber: '+44 20 7946 0958'
    },
    shippingMethod: {
      id: new mongoose.Types.ObjectId(),
      name: 'Standard Shipping',
      cost: 15.00,
      estimatedDelivery: '3-5 business days'
    },
    paymentMethod: {
      type: 'paypal',
      name: 'PayPal'
    },
    paymentStatus: 'pending',
    ...overrides
  };
};

// Valid cart data factory
export const createValidCartData = (userId, overrides = {}) => ({
  user: userId,
  items: [{
    product: new mongoose.Types.ObjectId(),
    quantity: 1,
    price: 999.99
  }],
  ...overrides
});

// Valid category data factory
export const createValidCategoryData = (overrides = {}) => ({
  name: `Test Category ${Date.now()}`,
  slug: `test-category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  description: 'Test category description',
  isActive: true,
  ...overrides
});

// Export all factories
export default {
  generateSKU,
  createValidProductData,
  createValidUserData,
  createValidOrderData,
  createValidCartData,
  createValidCategoryData
};