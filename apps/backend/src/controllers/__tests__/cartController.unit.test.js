import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
vi.mock('mongoose');
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
  _id: 'product123',
  name: 'Test Product',
  price: 99.99,
  stockQuantity: 10
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
  clearCart,
  mergeGuestCart
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

    // Setup mongoose mock
    mongoose.Types = {
      ObjectId: {
        isValid: vi.fn()
      }
    };
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
      Cart.mockImplementation(() => newCart);

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
      Cart.mockImplementation(() => newGuestCart);

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
    beforeEach(() => {
      req.body = { productId: 'product123', quantity: 2 };
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
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
    });

    it('should add product to cart for authenticated user', async () => {
      req.user = { _id: 'user123' };

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
            productId: 'product123',
            productName: 'Test Product',
            quantity: 2,
            unitPrice: 99.99
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
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid product ID format'
      });
    });

    it('should validate quantity range', async () => {
      req.body = { productId: 'product123', quantity: 100 };

      await addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Quantity must be a number between 1 and 99'
      });
    });

    it('should validate quantity is integer', async () => {
      req.body = { productId: 'product123', quantity: 2.5 };

      await addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Quantity must be a number between 1 and 99'
      });
    });

    it('should handle product not found', async () => {
      Product.findById.mockResolvedValue(null);

      await addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Product not found'
      });
    });

    it('should check stock availability', async () => {
      req.body = { productId: 'product123', quantity: 15 };
      Product.findById.mockResolvedValue({ ...mockProduct, stockQuantity: 10 });

      await addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Only 10 items available in stock'
      });
    });

    it('should check total quantity including existing cart items', async () => {
      req.body = { productId: 'product123', quantity: 5 };
      
      const cartWithExistingItem = {
        ...mockCart,
        items: [{
          productId: { toString: () => 'product123' },
          quantity: 8
        }],
        save: vi.fn().mockResolvedValue(true),
        addItem: vi.fn()
      };
      Cart.mockImplementation(() => cartWithExistingItem);
      Cart.findByUserId.mockResolvedValue(cartWithExistingItem);

      await addToCart(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot add 5 items. You already have 8 in cart. Only 10 available.'
      });
    });

    it('should handle server errors', async () => {
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
      req.params = { productId: 'product123' };
      req.body = { quantity: 3 };
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      
      const cartWithItem = {
        ...mockCart,
        items: [{
          productId: { toString: () => 'product123' },
          quantity: 2
        }],
        save: vi.fn().mockResolvedValue(true),
        updateItemQuantity: vi.fn()
      };
      Cart.findByUserId.mockResolvedValue(cartWithItem);
    });

    it('should update item quantity successfully', async () => {
      req.user = { _id: 'user123' };
      Product.findById.mockResolvedValue(mockProduct);

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
      req.params.productId = 'invalid-id';
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

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
      Cart.mockImplementation(() => emptyCart);
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
      Product.findById.mockResolvedValue({ ...mockProduct, stockQuantity: 10 });

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
      req.params = { productId: 'product123' };
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      
      const cartWithItem = {
        ...mockCart,
        items: [{
          productId: { toString: () => 'product123' },
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
      req.params.productId = 'invalid-id';
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

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
      Cart.mockImplementation(() => emptyCart);
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

  describe('mergeGuestCart', () => {
    it('should merge guest cart successfully', async () => {
      const userId = 'user123';
      const sessionId = 'guest-session-123';
      const mergedCart = { ...mockCart, userId };
      
      Cart.mergeGuestCart.mockResolvedValue(mergedCart);

      const result = await mergeGuestCart(userId, sessionId);

      expect(Cart.mergeGuestCart).toHaveBeenCalledWith(userId, sessionId);
      expect(result).toEqual(mergedCart);
    });

    it('should return null when no sessionId provided', async () => {
      const result = await mergeGuestCart('user123', null);

      expect(result).toBeNull();
      expect(Cart.mergeGuestCart).not.toHaveBeenCalled();
    });

    it('should handle merge errors', async () => {
      const userId = 'user123';
      const sessionId = 'guest-session-123';
      const error = new Error('Merge failed');
      
      Cart.mergeGuestCart.mockRejectedValue(error);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(mergeGuestCart(userId, sessionId)).rejects.toThrow('Merge failed');

      expect(consoleSpy).toHaveBeenCalledWith('Merge guest cart error:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('Helper Functions Coverage', () => {
    it('should handle guest user without existing session cookie', async () => {
      // Test the getOrCreateSessionId helper indirectly through getCart
      req.cookies = {}; // No existing session
      Cart.findBySessionId.mockResolvedValue(null);
      
      const newGuestCart = { ...mockCart, sessionId: 'guest-mock-uuid-123', save: vi.fn().mockResolvedValue(true) };
      Cart.mockImplementation(() => newGuestCart);

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
      Cart.mockImplementation(() => newGuestCart);

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