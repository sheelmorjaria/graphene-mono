import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Mock mongoose properly
vi.mock('mongoose', async () => {
  const actual = await vi.importActual('mongoose');
  return {
    default: {
      ...actual.default,
      Types: {
        ...actual.default.Types,
        ObjectId: {
          ...actual.default.Types.ObjectId,
          isValid: vi.fn((id) => {
            // Return false only for specifically invalid test cases that start with 'invalid'  
            if (id && typeof id === 'string' && id.startsWith('invalid')) {
              return false;
            }
            // Return true for all test IDs including 'product123', proper ObjectIds, etc.
            return true;
          })
        }
      }
    }
  };
});
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-123')
}));

// Mock models
const mockCart = {
  _id: 'cart123',
  userId: null,
  sessionId: null,
  items: [],
  totalItems: 0,
  totalAmount: 0,
  lastModified: new Date(),
  save: vi.fn(),
  addItem: vi.fn(),
  removeItem: vi.fn(),
  clearCart: vi.fn(),
  updateItemQuantity: vi.fn()
};

const mockProduct = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test Product',
  price: 99.99,
  stockQuantity: 10,
  variations: {
    length: 1,
    id: vi.fn().mockImplementation((variationId) => {
      // Accept both product123 variations and proper ObjectId format variations
      if (variationId === '507f1f77bcf86cd799439012' || variationId === 'variation123') {
        return {
          _id: variationId,
          condition: 'new',
          color: 'black',
          sku: 'PROD-NEW-BLK',
          price: 99.99,
          salePrice: 89.99,
          stockQuantity: 10,
          stockStatus: 'in_stock'
        };
      }
      return null;
    }),
    0: {
      _id: '507f1f77bcf86cd799439012',
      condition: 'new',
      color: 'black',
      sku: 'PROD-NEW-BLK',
      price: 99.99,
      salePrice: 89.99,
      stockQuantity: 10,
      stockStatus: 'in_stock'
    }
  }
};

vi.mock('../../models/Cart.js', () => {
  const CartMock = vi.fn();
  CartMock.findByUserId = vi.fn();
  CartMock.findBySessionId = vi.fn();
  CartMock.mergeGuestCart = vi.fn();
  return {
    default: CartMock
  };
});

vi.mock('../../models/Product.js', () => ({
  default: {
    findById: vi.fn()
  }
}));

// Import controller functions after mocks
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../cartController.js';
import Cart from '../../models/Cart.js';
import Product from '../../models/Product.js';

describe('Cart Controller - Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    
    req = {
      user: null,
      body: {},
      params: {},
      cookies: {}
    };
    
    res = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis()
    };
    
    next = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getCart', () => {
    it('should get cart for authenticated user', async () => {
      req.user = { _id: 'user123' };
      const mockCartInstance = { ...mockCart, userId: 'user123' };
      
      Cart.findByUserId.mockResolvedValue(mockCartInstance);

      await getCart(req, res);

      expect(Cart.findByUserId).toHaveBeenCalledWith('user123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          cart: expect.objectContaining({
            _id: 'cart123',
            items: [],
            totalItems: 0,
            totalAmount: 0
          })
        }
      });
    });

    it('should create new cart for authenticated user if none exists', async () => {
      req.user = { _id: 'user123' };
      
      Cart.findByUserId.mockResolvedValue(null);
      const newCart = { ...mockCart, userId: 'user123', save: vi.fn().mockResolvedValue(true) };
      
      // Mock Cart constructor
      Cart.mockImplementation(function () { return newCart; });

      await getCart(req, res);

      expect(Cart.findByUserId).toHaveBeenCalledWith('user123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          cart: expect.objectContaining({
            totalItems: 0,
            totalAmount: 0
          })
        }
      });
    });

    it('should get cart for guest user with existing session', async () => {
      req.cookies.cartSessionId = 'guest-session-123';
      const mockGuestCart = { ...mockCart, sessionId: 'guest-session-123' };
      
      Cart.findBySessionId.mockResolvedValue(mockGuestCart);

      await getCart(req, res);

      expect(Cart.findBySessionId).toHaveBeenCalledWith('guest-session-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          cart: expect.objectContaining({
            totalItems: 0,
            totalAmount: 0
          })
        }
      });
    });

    it('should create session and cart for new guest user', async () => {
      Cart.findBySessionId.mockResolvedValue(null);
      const newGuestCart = { ...mockCart, sessionId: 'guest-mock-uuid-123', save: vi.fn().mockResolvedValue(true) };
      
      // Mock Cart constructor for guest
      Cart.mockImplementation(function () { return newGuestCart; });

      await getCart(req, res);

      expect(res.cookie).toHaveBeenCalledWith('cartSessionId', 'guest-mock-uuid-123', {
        httpOnly: true,
        secure: false, // NODE_ENV !== 'production'
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
      });
      expect(res.json).toHaveBeenCalled();
    });

    it('should handle server errors', async () => {
      req.user = { _id: 'user123' };
      Cart.findByUserId.mockRejectedValue(new Error('Database error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await getCart(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Get cart error:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while fetching cart'
      });

      consoleSpy.mockRestore();
    });
  });

  describe('addToCart', () => {

    it('should add product to cart for authenticated user', async () => {
      // Test setup
      req.user = { _id: 'user123' };
      req.body = { productId: 'product123', quantity: 2, variationId: 'variation123' };
      
      // Create a fresh mock product for this specific test
      const testProduct = {
        ...mockProduct,
        variations: {
          length: 1,
          id: vi.fn().mockImplementation((variationId) => {
            if (variationId === 'variation123') {
              return {
                _id: 'variation123',
                condition: 'new',
                color: 'black',
                sku: 'PROD-NEW-BLK',
                price: 99.99,
                salePrice: 89.99,
                stockQuantity: 10,
                stockStatus: 'in_stock'
              };
            }
            return null;
          })
        }
      };
      Product.findById.mockResolvedValue(testProduct);
      
      const cartWithAddItem = {
        ...mockCart,
        items: [],
        totalItems: 2,
        totalAmount: 199.98,
        save: vi.fn().mockResolvedValue(true),
        addItem: vi.fn()
      };
      Cart.findByUserId.mockResolvedValue(cartWithAddItem);

      await addToCart(req, res);

      expect(Product.findById).toHaveBeenCalledWith('product123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product added to cart successfully',
        data: {
          cart: {
            totalItems: 2,
            totalAmount: 199.98,
            itemCount: 0
          },
          addedItem: {
            productId: '507f1f77bcf86cd799439011', // This should match the mock product's _id
            variationId: 'variation123',
            productName: 'Test Product',
            quantity: 2,
            unitPrice: 89.99,
            sku: 'PROD-NEW-BLK',
            variationDetails: {
              condition: 'new',
              color: 'black'
            }
          }
        }
      });
    });

    it('should validate required productId', async () => {
      req.body = { quantity: 2 };

      await addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Product ID is required'
      });
    });

    it('should validate productId format', async () => {
      req.body = { productId: 'invalid-id', quantity: 2 };

      await addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid product ID format'
      });
    });

    it('should validate quantity range', async () => {
      // Complete test setup like the working test
      req.body = { productId: '507f1f77bcf86cd799439011', quantity: 100, variationId: '507f1f77bcf86cd799439012' };
      Product.findById.mockResolvedValue(mockProduct);
      
      const cartWithAddItem = {
        ...mockCart,
        items: [],
        totalItems: 2,
        totalAmount: 199.98,
        save: vi.fn().mockResolvedValue(true),
        addItem: vi.fn()
      };
      Cart.findByUserId.mockResolvedValue(cartWithAddItem);

      await addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Quantity must be a number between 1 and 99'
      });
    });

    it('should validate quantity is integer', async () => {
      req.body = { productId: 'product123', quantity: 2.5 };
      Product.findById.mockResolvedValue(mockProduct);

      await addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Quantity must be a number between 1 and 99'
      });
    });

    it('should require variationId for products with variations', async () => {
      req.body = { productId: 'product123', quantity: 2 }; // Missing variationId
      Product.findById.mockResolvedValue(mockProduct);

      await addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Please select a product variation'
      });
    });

    it('should handle product not found', async () => {
      req.body = { productId: 'product123', quantity: 2 };
      Product.findById.mockResolvedValue(null);

      await addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Product not found'
      });
    });

    it('should check stock availability', async () => {
      req.body = { productId: 'product123', quantity: 15, variationId: 'variation123' };
      const productWithLowStock = {
        ...mockProduct,
        variations: {
          ...mockProduct.variations,
          id: vi.fn().mockImplementation((variationId) => {
            if (variationId === 'variation123') {
              return {
                _id: 'variation123',
                condition: 'new',
                color: 'black',
                sku: 'PROD-NEW-BLK',
                price: 99.99,
                salePrice: 89.99,
                stockQuantity: 10,
                stockStatus: 'in_stock'
              };
            }
            return null;
          })
        }
      };
      Product.findById.mockResolvedValue(productWithLowStock);

      await addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Only 10 items available in stock'
      });
    });

    it('should check total quantity including existing cart items', async () => {
      req.body = { productId: 'product123', quantity: 5, variationId: 'variation123' };
      
      // Create a test-specific product mock
      const testProduct = {
        ...mockProduct,
        variations: {
          length: 1,
          id: vi.fn().mockImplementation((variationId) => {
            if (variationId === 'variation123') {
              return {
                _id: 'variation123',
                condition: 'new',
                color: 'black',
                sku: 'PROD-NEW-BLK',
                price: 99.99,
                salePrice: 89.99,
                stockQuantity: 10,
                stockStatus: 'in_stock'
              };
            }
            return null;
          })
        }
      };
      Product.findById.mockResolvedValue(testProduct);
      
      const cartWithExistingItem = {
        ...mockCart,
        items: [{
          productId: { toString: () => 'product123' },
          variationId: 'variation123',
          quantity: 8
        }],
        save: vi.fn().mockResolvedValue(true),
        addItem: vi.fn()
      };
      Cart.mockImplementation(function () { return cartWithExistingItem; });
      Cart.findByUserId.mockResolvedValue(cartWithExistingItem);

      await addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot add 5 items. You already have 8 in cart. Only 10 available.'
      });
    });

    it('should handle server errors', async () => {
      req.body = { productId: 'product123', quantity: 2, variationId: 'variation123' };
      Product.findById.mockRejectedValue(new Error('Database error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await addToCart(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Add to cart error:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while adding to cart'
      });

      consoleSpy.mockRestore();
    });
  });

  describe('updateCartItem', () => {
    beforeEach(() => {
      req.params = { itemId: 'product123_variation123' };
      req.body = { quantity: 3 };
      
      const cartWithItem = {
        ...mockCart,
        items: [{
          productId: { toString: () => 'product123' },
          variationId: 'variation123',
          quantity: 2
        }],
        save: vi.fn().mockResolvedValue(true),
        updateItemQuantity: vi.fn()
      };
      Cart.findByUserId.mockResolvedValue(cartWithItem);
    });

    it('should update item quantity successfully', async () => {
      req.user = { _id: 'user123' };
      
      // Create a test-specific product mock
      const testProduct = {
        ...mockProduct,
        variations: {
          length: 1,
          id: vi.fn().mockImplementation((variationId) => {
            if (variationId === 'variation123') {
              return {
                _id: 'variation123',
                condition: 'new',
                color: 'black',
                sku: 'PROD-NEW-BLK',
                price: 99.99,
                salePrice: 89.99,
                stockQuantity: 10,
                stockStatus: 'in_stock'
              };
            }
            return null;
          })
        }
      };
      Product.findById.mockResolvedValue(testProduct);

      await updateCartItem(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cart updated successfully',
        data: {
          cart: {
            totalItems: 0,
            totalAmount: 0,
            itemCount: 1
          }
        }
      });
    });

    it('should validate productId format', async () => {
      req.params.itemId = 'invalid-id_variation123';

      await updateCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid product ID format'
      });
    });

    it('should validate quantity range', async () => {
      req.body.quantity = 100;

      await updateCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Quantity must be a number between 0 and 99'
      });
    });

    it('should handle item not found in cart', async () => {
      const emptyCart = {
        ...mockCart,
        items: [],
        save: vi.fn().mockResolvedValue(true)
      };
      Cart.mockImplementation(function () { return emptyCart; });
      Cart.findByUserId.mockResolvedValue(emptyCart);

      await updateCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Item not found in cart'
      });
    });

    it('should remove item when quantity is 0', async () => {
      req.body.quantity = 0;
      req.user = { _id: 'user123' };

      await updateCartItem(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Item removed from cart',
        data: {
          cart: {
            totalItems: 0,
            totalAmount: 0,
            itemCount: 1
          }
        }
      });
    });

    it('should check stock when updating to positive quantity', async () => {
      req.body.quantity = 15;
      req.user = { _id: 'user123' };
      
      // Create a test-specific product mock
      const testProduct = {
        ...mockProduct,
        variations: {
          length: 1,
          id: vi.fn().mockImplementation((variationId) => {
            if (variationId === 'variation123') {
              return {
                _id: 'variation123',
                condition: 'new',
                color: 'black',
                sku: 'PROD-NEW-BLK',
                price: 99.99,
                salePrice: 89.99,
                stockQuantity: 10,
                stockStatus: 'in_stock'
              };
            }
            return null;
          })
        }
      };
      Product.findById.mockResolvedValue(testProduct);

      await updateCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Only 10 items available in stock'
      });
    });

    it('should handle product not found when checking stock', async () => {
      req.body.quantity = 5;
      req.user = { _id: 'user123' };
      Product.findById.mockResolvedValue(null);

      await updateCartItem(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Product not found'
      });
    });

    it('should handle server errors', async () => {
      Cart.findByUserId.mockRejectedValue(new Error('Database error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await updateCartItem(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Update cart item error:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while updating cart'
      });

      consoleSpy.mockRestore();
    });
  });

  describe('removeFromCart', () => {
    beforeEach(() => {
      req.params = { itemId: 'product123_variation123' };
      
      const cartWithItem = {
        ...mockCart,
        items: [{
          productId: { toString: () => 'product123' },
          variationId: 'variation123',
          quantity: 2
        }],
        save: vi.fn().mockResolvedValue(true),
        removeItem: vi.fn()
      };
      Cart.findByUserId.mockResolvedValue(cartWithItem);
    });

    it('should remove item from cart successfully', async () => {
      req.user = { _id: 'user123' };

      await removeFromCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Item removed from cart successfully',
        data: {
          cart: {
            totalItems: 0,
            totalAmount: 0,
            itemCount: 1
          }
        }
      });
    });

    it('should validate productId format', async () => {
      req.params.itemId = 'invalid-id_variation123';

      await removeFromCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid product ID format'
      });
    });

    it('should handle item not found in cart', async () => {
      const emptyCart = {
        ...mockCart,
        items: [],
        save: vi.fn().mockResolvedValue(true)
      };
      Cart.mockImplementation(function () { return emptyCart; });
      Cart.findByUserId.mockResolvedValue(emptyCart);

      await removeFromCart(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Item not found in cart'
      });
    });

    it('should handle server errors', async () => {
      Cart.findByUserId.mockRejectedValue(new Error('Database error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await removeFromCart(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Remove from cart error:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while removing from cart'
      });

      consoleSpy.mockRestore();
    });
  });

  describe('clearCart', () => {
    beforeEach(() => {
      const cartWithItems = {
        ...mockCart,
        items: [{ productId: 'product123', quantity: 2 }],
        totalItems: 2,
        totalAmount: 199.98,
        save: vi.fn().mockResolvedValue(true),
        clearCart: vi.fn()
      };
      Cart.findByUserId.mockResolvedValue(cartWithItems);
    });

    it('should clear cart successfully', async () => {
      req.user = { _id: 'user123' };

      await clearCart(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cart cleared successfully',
        data: {
          cart: {
            totalItems: 0,
            totalAmount: 0,
            itemCount: 0
          }
        }
      });
    });

    it('should handle server errors', async () => {
      Cart.findByUserId.mockRejectedValue(new Error('Database error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await clearCart(req, res);

      expect(consoleSpy).toHaveBeenCalledWith('Clear cart error:', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while clearing cart'
      });

      consoleSpy.mockRestore();
    });
  });


  describe('Helper Functions Coverage', () => {
    it('should handle guest user without existing session cookie', async () => {
      // Test the getOrCreateSessionId helper indirectly through getCart
      req.cookies = {}; // No existing session
      Cart.findBySessionId.mockResolvedValue(null);
      
      const newGuestCart = { ...mockCart, sessionId: 'guest-mock-uuid-123', save: vi.fn().mockResolvedValue(true) };
      Cart.mockImplementation(function () { return newGuestCart; });

      await getCart(req, res);

      expect(uuidv4).toHaveBeenCalled();
      expect(res.cookie).toHaveBeenCalledWith(
        'cartSessionId', 
        'guest-mock-uuid-123',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60 * 1000
        })
      );
    });

    it('should use secure cookies in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      req.cookies = {};
      Cart.findBySessionId.mockResolvedValue(null);
      
      const newGuestCart = { ...mockCart, sessionId: 'guest-mock-uuid-123', save: vi.fn().mockResolvedValue(true) };
      Cart.mockImplementation(function () { return newGuestCart; });

      await getCart(req, res);

      expect(res.cookie).toHaveBeenCalledWith(
        'cartSessionId', 
        'guest-mock-uuid-123',
        expect.objectContaining({
          secure: true
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });
});