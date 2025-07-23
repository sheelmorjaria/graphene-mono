import { vi, describe, it, test, expect, beforeEach, afterEach } from 'vitest';
import {
  calculateShippingRates,
  getShippingMethods,
  validateShippingMethod
} from '../shippingController.js';

// Mock the models before importing them
vi.mock('../../models/ShippingMethod.js', () => ({
  default: {
    calculateRatesForCart: vi.fn(),
    getActiveShippingMethods: vi.fn(),
    findOne: vi.fn()
  }
}));

vi.mock('../../models/Product.js', () => ({
  default: {
    find: vi.fn()
  }
}));

// Use global mongoose mock from setup.vitest.js

// Import mocked modules
const ShippingMethod = (await import('../../models/ShippingMethod.js')).default;
const Product = (await import('../../models/Product.js')).default;
const mongoose = (await import('mongoose')).default;

describe('Shipping Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {}
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    vi.clearAllMocks();
  });

  describe('calculateShippingRates', () => {
    const mockProduct = {
      _id: mongoose.Types.ObjectId(),
      name: 'Google Pixel 7',
      price: 599.99,
      weight: 194,
      dimensions: { length: 15.5, width: 7.3, height: 0.9 },
      stockQuantity: 10,
      isActive: true
    };

    const mockCartItems = [
      {
        productId: mockProduct._id.toString(),
        quantity: 1
      }
    ];

    const mockShippingAddress = {
      country: 'GB',
      stateProvince: 'England',
      city: 'London',
      postalCode: 'SW1A 1AA'
    };

    const mockShippingRates = [
      {
        id: mongoose.Types.ObjectId(),
        code: 'standard',
        name: 'Standard Delivery',
        description: '3-5 business days',
        cost: 4.99,
        estimatedDelivery: '3-5 business days'
      },
      {
        id: mongoose.Types.ObjectId(),
        code: 'express',
        name: 'Express Delivery',
        description: '1-2 business days',
        cost: 9.99,
        estimatedDelivery: '1-2 business days'
      }
    ];

    beforeEach(() => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Product.find.mockResolvedValue([mockProduct]);
      ShippingMethod.calculateRatesForCart.mockResolvedValue(mockShippingRates);
    });

    it('should calculate shipping rates successfully', async () => {
      mockReq.body = {
        cartItems: mockCartItems,
        shippingAddress: mockShippingAddress
      };

      await calculateShippingRates(mockReq, mockRes);

      expect(Product.find).toHaveBeenCalledWith({
        _id: { $in: [mockProduct._id.toString()] },
        isActive: true
      });
      expect(ShippingMethod.calculateRatesForCart).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          shippingRates: mockShippingRates,
          cartSummary: {
            totalItems: 1,
            totalWeight: 194,
            totalValue: 599.99,
            itemCount: 1
          },
          shippingAddress: mockShippingAddress
        }
      });
    });

    it('should return 400 if cart items are missing', async () => {
      mockReq.body = {
        shippingAddress: mockShippingAddress
      };

      await calculateShippingRates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cart items are required and must be a non-empty array'
      });
    });

    it('should return 400 if cart items is empty array', async () => {
      mockReq.body = {
        cartItems: [],
        shippingAddress: mockShippingAddress
      };

      await calculateShippingRates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cart items are required and must be a non-empty array'
      });
    });

    it('should return 400 if shipping address is missing', async () => {
      mockReq.body = {
        cartItems: mockCartItems
      };

      await calculateShippingRates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Shipping address with country is required'
      });
    });

    it('should return 400 if country is missing from shipping address', async () => {
      mockReq.body = {
        cartItems: mockCartItems,
        shippingAddress: { city: 'London' }
      };

      await calculateShippingRates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Shipping address with country is required'
      });
    });

    it('should return 400 if cart item is missing productId', async () => {
      mockReq.body = {
        cartItems: [{ quantity: 1 }],
        shippingAddress: mockShippingAddress
      };

      await calculateShippingRates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Each cart item must have productId and quantity >= 1'
      });
    });

    it('should return 400 if cart item quantity is less than 1', async () => {
      mockReq.body = {
        cartItems: [{ productId: mockProduct._id.toString(), quantity: 0 }],
        shippingAddress: mockShippingAddress
      };

      await calculateShippingRates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Each cart item must have productId and quantity >= 1'
      });
    });

    it('should return 400 if product ID is invalid format', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      mockReq.body = {
        cartItems: [{ productId: 'invalid-id', quantity: 1 }],
        shippingAddress: mockShippingAddress
      };

      await calculateShippingRates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid product ID format'
      });
    });

    it('should return 400 if country code is invalid format', async () => {
      mockReq.body = {
        cartItems: mockCartItems,
        shippingAddress: {
          ...mockShippingAddress,
          country: 'USA' // Should be 2-letter code
        }
      };

      await calculateShippingRates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Country must be a valid ISO 3166-1 alpha-2 code (e.g., GB, IE)'
      });
    });

    it('should return 400 if product not found', async () => {
      Product.find.mockResolvedValue([]); // No products found

      mockReq.body = {
        cartItems: mockCartItems,
        shippingAddress: mockShippingAddress
      };

      await calculateShippingRates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'One or more products not found or inactive'
      });
    });

    it('should return 400 if insufficient stock', async () => {
      const lowStockProduct = { ...mockProduct, stockQuantity: 0 };
      Product.find.mockResolvedValue([lowStockProduct]);

      mockReq.body = {
        cartItems: mockCartItems,
        shippingAddress: mockShippingAddress
      };

      await calculateShippingRates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient stock for product Google Pixel 7. Available: 0, Requested: 1'
      });
    });

    it('should return 400 if no shipping methods available', async () => {
      ShippingMethod.calculateRatesForCart.mockResolvedValue([]);

      mockReq.body = {
        cartItems: mockCartItems,
        shippingAddress: mockShippingAddress
      };

      await calculateShippingRates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'No shipping methods available for the selected address and cart contents'
      });
    });

    it('should handle multiple cart items correctly', async () => {
      const mockProduct2 = {
        ...mockProduct,
        _id: mongoose.Types.ObjectId(),
        name: 'Google Pixel 8',
        price: 699.99,
        weight: 197
      };

      const multipleCartItems = [
        { productId: mockProduct._id.toString(), quantity: 2 },
        { productId: mockProduct2._id.toString(), quantity: 1 }
      ];

      Product.find.mockResolvedValue([mockProduct, mockProduct2]);

      mockReq.body = {
        cartItems: multipleCartItems,
        shippingAddress: mockShippingAddress
      };

      await calculateShippingRates(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          shippingRates: mockShippingRates,
          cartSummary: {
            totalItems: 3, // 2 + 1
            totalWeight: 585, // (194 * 2) + 197
            totalValue: 1899.97, // (599.99 * 2) + 699.99
            itemCount: 2
          },
          shippingAddress: mockShippingAddress
        }
      });
    });

    it('should handle products with default weight and dimensions', async () => {
      const productWithoutWeight = {
        ...mockProduct,
        weight: undefined,
        dimensions: undefined
      };
      Product.find.mockResolvedValue([productWithoutWeight]);

      mockReq.body = {
        cartItems: mockCartItems,
        shippingAddress: mockShippingAddress
      };

      await calculateShippingRates(mockReq, mockRes);

      expect(ShippingMethod.calculateRatesForCart).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              weight: 100,
              dimensions: { length: 10, width: 10, height: 5 }
            })
          ])
        }),
        mockShippingAddress
      );
    });

    it('should handle server errors', async () => {
      Product.find.mockRejectedValue(new Error('Database error'));

      mockReq.body = {
        cartItems: mockCartItems,
        shippingAddress: mockShippingAddress
      };

      await calculateShippingRates(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while calculating shipping rates'
      });
    });
  });

  describe('getShippingMethods', () => {
    const mockShippingMethods = [
      {
        _id: mongoose.Types.ObjectId(),
        code: 'standard',
        name: 'Standard Delivery',
        description: '3-5 business days',
        formattedDelivery: '3-5 business days',
        baseCost: 4.99,
        criteria: { minValue: 0, maxValue: 1000 },
        isActive: true
      }
    ];

    it('should get shipping methods successfully', async () => {
      ShippingMethod.getActiveShippingMethods.mockResolvedValue(mockShippingMethods);

      await getShippingMethods(mockReq, mockRes);

      expect(ShippingMethod.getActiveShippingMethods).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          shippingMethods: [{
            id: mockShippingMethods[0]._id,
            code: 'standard',
            name: 'Standard Delivery',
            description: '3-5 business days',
            estimatedDelivery: '3-5 business days',
            baseCost: 4.99,
            criteria: { minValue: 0, maxValue: 1000 },
            isActive: true
          }]
        }
      });
    });

    it('should handle server errors', async () => {
      ShippingMethod.getActiveShippingMethods.mockRejectedValue(new Error('Database error'));

      await getShippingMethods(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while fetching shipping methods'
      });
    });
  });

  describe('validateShippingMethod', () => {
    const mockMethodId = mongoose.Types.ObjectId();
    const mockShippingMethod = {
      _id: mockMethodId,
      code: 'standard',
      name: 'Standard Delivery',
      isActive: true
    };
    const mockCartItems = [{ productId: 'prod123', quantity: 1 }];
    const mockShippingAddress = { country: 'GB' };
    const mockValidationRate = {
      id: mockMethodId,
      code: 'standard',
      name: 'Standard Delivery',
      cost: 4.99
    };

    beforeEach(() => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      ShippingMethod.findOne.mockResolvedValue(mockShippingMethod);
      ShippingMethod.calculateRatesForCart.mockResolvedValue([mockValidationRate]);
    });

    it('should validate shipping method successfully', async () => {
      mockReq.body = {
        methodId: mockMethodId.toString(),
        cartItems: mockCartItems,
        shippingAddress: mockShippingAddress
      };

      await validateShippingMethod(mockReq, mockRes);

      expect(ShippingMethod.findOne).toHaveBeenCalledWith({
        _id: mockMethodId.toString(),
        isActive: true
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          shippingMethod: mockValidationRate,
          isValid: true
        }
      });
    });

    it('should return 400 if method ID is missing', async () => {
      mockReq.body = {
        cartItems: mockCartItems,
        shippingAddress: mockShippingAddress
      };

      await validateShippingMethod(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Valid shipping method ID is required'
      });
    });

    it('should return 400 if method ID is invalid format', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      mockReq.body = {
        methodId: 'invalid-id',
        cartItems: mockCartItems,
        shippingAddress: mockShippingAddress
      };

      await validateShippingMethod(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Valid shipping method ID is required'
      });
    });

    it('should return 400 if cart items are missing', async () => {
      mockReq.body = {
        methodId: mockMethodId.toString(),
        shippingAddress: mockShippingAddress
      };

      await validateShippingMethod(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cart items are required'
      });
    });

    it('should return 400 if shipping address is missing', async () => {
      mockReq.body = {
        methodId: mockMethodId.toString(),
        cartItems: mockCartItems
      };

      await validateShippingMethod(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Shipping address is required'
      });
    });

    it('should return 404 if shipping method not found', async () => {
      ShippingMethod.findOne.mockResolvedValue(null);

      mockReq.body = {
        methodId: mockMethodId.toString(),
        cartItems: mockCartItems,
        shippingAddress: mockShippingAddress
      };

      await validateShippingMethod(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Shipping method not found or inactive'
      });
    });

    it('should return 400 if shipping method not available for cart', async () => {
      ShippingMethod.calculateRatesForCart.mockResolvedValue([]); // No available rates

      mockReq.body = {
        methodId: mockMethodId.toString(),
        cartItems: mockCartItems,
        shippingAddress: mockShippingAddress
      };

      await validateShippingMethod(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Selected shipping method is not available for this cart and address'
      });
    });

    it('should handle server errors', async () => {
      ShippingMethod.findOne.mockRejectedValue(new Error('Database error'));

      mockReq.body = {
        methodId: mockMethodId.toString(),
        cartItems: mockCartItems,
        shippingAddress: mockShippingAddress
      };

      await validateShippingMethod(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while validating shipping method'
      });
    });
  });
});