import mongoose from 'mongoose';

/**
 * Factory functions for creating valid test data that conforms to model schemas
 */

export const createValidOrderData = (overrides = {}) => {
  const defaultProductId = new mongoose.Types.ObjectId();
  
  const defaultOrder = {
    userId: new mongoose.Types.ObjectId(),
    customerEmail: 'test@example.com',
    orderNumber: `ORD-${Date.now()}`,
    status: 'pending',
    items: [{
      productId: defaultProductId,
      productName: 'Test Product',
      productSlug: 'test-product',
      productImage: '/images/test-product.jpg',
      quantity: 1,
      unitPrice: 99.99,
      totalPrice: 99.99
    }],
    subtotal: 99.99,
    tax: 0,
    shipping: 10,
    totalAmount: 109.99,
    shippingAddress: {
      fullName: 'Test User',
      addressLine1: '123 Test Street',
      addressLine2: '',
      city: 'Test City',
      stateProvince: 'Test State',
      postalCode: '12345',
      country: 'US',
      phoneNumber: '+1234567890'
    },
    billingAddress: {
      fullName: 'Test User',
      addressLine1: '123 Test Street',
      addressLine2: '',
      city: 'Test City',
      stateProvince: 'Test State',
      postalCode: '12345',
      country: 'US',
      phoneNumber: '+1234567890'
    },
    shippingMethod: {
      id: new mongoose.Types.ObjectId(),
      name: 'Standard Shipping',
      cost: 10,
      estimatedDelivery: '3-5 business days'
    },
    paymentMethod: {
      type: 'paypal',
      name: 'PayPal'
    },
    paymentDetails: {
      transactionId: `PAYPAL-${Date.now()}`,
      status: 'pending'
    },
    paymentStatus: 'pending'
  };

  // Simple object spread to avoid ObjectId issues
  return { 
    ...defaultOrder,
    ...overrides,
    // Merge nested objects carefully
    shippingAddress: overrides.shippingAddress ? { ...defaultOrder.shippingAddress, ...overrides.shippingAddress } : defaultOrder.shippingAddress,
    billingAddress: overrides.billingAddress ? { ...defaultOrder.billingAddress, ...overrides.billingAddress } : defaultOrder.billingAddress,
    shippingMethod: overrides.shippingMethod ? { ...defaultOrder.shippingMethod, ...overrides.shippingMethod } : defaultOrder.shippingMethod,
    paymentMethod: overrides.paymentMethod ? { ...defaultOrder.paymentMethod, ...overrides.paymentMethod } : defaultOrder.paymentMethod,
    paymentDetails: overrides.paymentDetails ? { ...defaultOrder.paymentDetails, ...overrides.paymentDetails } : defaultOrder.paymentDetails,
    items: overrides.items || defaultOrder.items
  };
};

export const createValidUserData = (overrides = {}) => {
  const defaultUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `test-${Date.now()}@example.com`,
    password: 'Password123!',
    role: 'customer',
    isActive: true,
    emailVerified: true
  };

  return { ...defaultUser, ...overrides };
};

export const createValidProductData = (overrides = {}) => {
  const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const defaultProduct = {
    name: 'Test Product',
    slug: `test-product-${uniqueId}`,
    description: 'Test product description',
    shortDescription: 'Test short description',
    price: 99.99,
    images: ['/images/test-product.jpg'],
    category: new mongoose.Types.ObjectId(),
    brand: 'Test Brand',
    sku: `SKU-${uniqueId}`,
    stockQuantity: 100,
    stockStatus: 'in_stock',
    condition: 'new',
    isActive: true
  };

  return { ...defaultProduct, ...overrides };
};

export const createValidCategoryData = (overrides = {}) => {
  const defaultCategory = {
    name: 'Test Category',
    slug: `test-category-${Date.now()}`,
    description: 'Test category description',
    isActive: true,
    parentCategory: null,
    sortOrder: 0
  };

  return { ...defaultCategory, ...overrides };
};

export const createValidShippingMethodData = (overrides = {}) => {
  const defaultShippingMethod = {
    name: 'Test Shipping Method',
    code: `TEST_SHIPPING_${Date.now()}`,
    description: 'Test shipping method description',
    baseCost: 10.00,
    estimatedDeliveryDays: {
      min: 3,
      max: 5
    },
    isActive: true,
    criteria: {
      minOrderValue: 0,
      maxOrderValue: 10000,
      maxWeight: 10000,
      supportedCountries: ['GB', 'US']
    }
  };

  return { ...defaultShippingMethod, ...overrides };
};

export const createValidReturnRequestData = (order, overrides = {}) => {
  const defaultReturn = {
    orderId: order._id,
    orderNumber: order.orderNumber,
    userId: order.userId,
    customerEmail: order.customerEmail,
    returnRequestNumber: `RET-${Date.now()}`,
    status: 'pending_review',
    items: order.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      productSlug: item.productSlug,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalRefundAmount: item.totalPrice,
      reason: 'defective_item',
      reasonDescription: 'Product defect'
    })),
    totalRefundAmount: order.totalAmount,
    totalItemsCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    returnWindow: 30,
    isWithinReturnWindow: true
  };

  return deepMerge(defaultReturn, overrides);
};

// Helper function for deep merging objects
function deepMerge(target, source) {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}