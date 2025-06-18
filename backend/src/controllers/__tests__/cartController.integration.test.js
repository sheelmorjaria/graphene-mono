import { vi, describe, it, test, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart 
} from '../cartController.js';
import { authenticate, optionalAuth } from '../../middleware/auth.js';

// Mock models
vi.mock('../../models/User.js');
vi.mock('../../models/Product.js');
vi.mock('../../models/Cart.js');

// Mock auth middleware
vi.mock('../../middleware/auth.js', () => ({
  authenticate: vi.fn((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Access token required' });
    }
    
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
  }),
  optionalAuth: vi.fn((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
      } catch (error) {
        // Continue without user
      }
    }
    next();
  })
}));

// Import mocked modules
const User = (await import('../../models/User.js')).default;
const Product = (await import('../../models/Product.js')).default;
const Cart = (await import('../../models/Cart.js')).default;

// Setup Express app
const app = express();
app.use(express.json());

// Mock session middleware
app.use((req, res, next) => {
  req.session = {
    cartSessionId: 'test-session-id',
    save: vi.fn((callback) => callback && callback())
  };
  next();
});

// Setup routes
app.get('/api/cart', optionalAuth, getCart);
app.post('/api/cart/add', optionalAuth, addToCart);
app.put('/api/cart/item/:productId', optionalAuth, updateCartItem);
app.delete('/api/cart/item/:productId', optionalAuth, removeFromCart);
app.delete('/api/cart/clear', optionalAuth, clearCart);

describe('Cart Controller', () => {
  let mockUser;
  let authToken;
  let mockProduct;
  let mockCart;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock data
    mockUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'cart.test@example.com',
      firstName: 'Cart',
      lastName: 'Tester'
    };

    mockProduct = {
      _id: new mongoose.Types.ObjectId(),
      name: 'GrapheneOS Pixel 9 Pro',
      slug: 'grapheneos-pixel-9-pro',
      price: 999.99,
      stockQuantity: 10,
      images: ['https://example.com/image1.jpg'],
      isActive: true
    };

    mockCart = {
      _id: new mongoose.Types.ObjectId(),
      userId: mockUser._id,
      items: [],
      totalItems: 0,
      totalAmount: 0,
      save: vi.fn().mockResolvedValue(true),
      addItem: vi.fn(),
      updateItemQuantity: vi.fn(),
      removeItem: vi.fn(),
      clearItems: vi.fn(),
      calculateTotals: vi.fn()
    };

    // Generate auth token
    authToken = jwt.sign(
      { userId: mockUser._id },
      process.env.JWT_SECRET || 'your-secret-key'
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/cart', () => {
    it('should get empty cart for authenticated user', async () => {
      Cart.findOne.mockResolvedValue(null);
      Cart.create.mockResolvedValue(mockCart);

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart).toBeDefined();
      expect(response.body.data.cart.items).toEqual([]);
      expect(response.body.data.cart.totalItems).toBe(0);
      expect(response.body.data.cart.totalAmount).toBe(0);
    });

    it('should get empty cart for guest user', async () => {
      Cart.findOne.mockResolvedValue(null);
      Cart.create.mockResolvedValue({
        ...mockCart,
        userId: undefined,
        sessionId: 'test-session-id'
      });

      const response = await request(app)
        .get('/api/cart')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart).toBeDefined();
      expect(response.body.data.cart.items).toEqual([]);
    });

    it('should get cart with items for authenticated user', async () => {
      const cartWithItems = {
        ...mockCart,
        items: [{
          productId: mockProduct._id,
          productName: mockProduct.name,
          productSlug: mockProduct.slug,
          quantity: 2,
          unitPrice: mockProduct.price,
          totalPrice: mockProduct.price * 2,
          image: mockProduct.images[0]
        }],
        totalItems: 2,
        totalAmount: mockProduct.price * 2
      };

      Cart.findOne.mockResolvedValue(cartWithItems);

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.totalItems).toBe(2);
      expect(response.body.data.cart.totalAmount).toBe(1999.98);
    });
  });

  describe('POST /api/cart/add', () => {
    it('should add product to cart for authenticated user', async () => {
      Product.findById.mockResolvedValue(mockProduct);
      Cart.findOne.mockResolvedValue(null);
      Cart.create.mockResolvedValue(mockCart);

      // Mock the cart methods
      mockCart.addItem = vi.fn();
      mockCart.save = vi.fn().mockResolvedValue({
        ...mockCart,
        items: [{
          productId: mockProduct._id,
          productName: mockProduct.name,
          quantity: 1,
          unitPrice: mockProduct.price,
          totalPrice: mockProduct.price
        }],
        totalItems: 1,
        totalAmount: mockProduct.price
      });

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: mockProduct._id.toString(),
          quantity: 1
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product added to cart');
      expect(Product.findById).toHaveBeenCalledWith(mockProduct._id.toString());
      expect(mockCart.addItem).toHaveBeenCalledWith(mockProduct, 1);
      expect(mockCart.save).toHaveBeenCalled();
    });

    it('should add product to cart for guest user', async () => {
      Product.findById.mockResolvedValue(mockProduct);
      Cart.findOne.mockResolvedValue(null);
      
      const guestCart = {
        ...mockCart,
        userId: undefined,
        sessionId: 'test-session-id'
      };
      Cart.create.mockResolvedValue(guestCart);

      const response = await request(app)
        .post('/api/cart/add')
        .send({
          productId: mockProduct._id.toString(),
          quantity: 1
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product added to cart');
    });

    it('should increment quantity for existing product', async () => {
      Product.findById.mockResolvedValue(mockProduct);
      
      const existingCart = {
        ...mockCart,
        items: [{
          productId: mockProduct._id,
          quantity: 1,
          unitPrice: mockProduct.price,
          totalPrice: mockProduct.price
        }]
      };
      Cart.findOne.mockResolvedValue(existingCart);

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: mockProduct._id.toString(),
          quantity: 1
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(existingCart.addItem).toHaveBeenCalledWith(mockProduct, 1);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product ID and quantity are required');
    });

    it('should validate product ID format', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'invalid-id',
          quantity: 1
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid product ID');
    });

    it('should validate quantity range', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: mockProduct._id.toString(),
          quantity: 0
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Quantity must be between 1 and 99');
    });

    it('should fail for non-existent product', async () => {
      Product.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: new mongoose.Types.ObjectId().toString(),
          quantity: 1
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found or inactive');
    });

    it('should fail when quantity exceeds stock', async () => {
      Product.findById.mockResolvedValue({
        ...mockProduct,
        stockQuantity: 5
      });
      Cart.findOne.mockResolvedValue(mockCart);

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: mockProduct._id.toString(),
          quantity: 10
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only 5 items available in stock');
    });

    it('should fail when total quantity in cart would exceed stock', async () => {
      Product.findById.mockResolvedValue({
        ...mockProduct,
        stockQuantity: 5
      });
      
      const cartWithItems = {
        ...mockCart,
        items: [{
          productId: mockProduct._id,
          quantity: 3
        }]
      };
      Cart.findOne.mockResolvedValue(cartWithItems);

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: mockProduct._id.toString(),
          quantity: 3
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Would exceed available stock');
    });
  });

  describe('PUT /api/cart/item/:productId', () => {
    it('should update item quantity', async () => {
      const cartWithItem = {
        ...mockCart,
        items: [{
          productId: mockProduct._id,
          quantity: 2
        }],
        updateItemQuantity: vi.fn().mockReturnValue(true),
        save: vi.fn().mockResolvedValue(true)
      };

      Cart.findOne.mockResolvedValue(cartWithItem);
      Product.findById.mockResolvedValue(mockProduct);

      const response = await request(app)
        .put(`/api/cart/item/${mockProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 3 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cart item updated');
      expect(cartWithItem.updateItemQuantity).toHaveBeenCalledWith(mockProduct._id.toString(), 3);
    });

    it('should remove item when quantity is 0', async () => {
      const cartWithItem = {
        ...mockCart,
        items: [{
          productId: mockProduct._id,
          quantity: 2
        }],
        removeItem: vi.fn().mockReturnValue(true),
        save: vi.fn().mockResolvedValue(true)
      };

      Cart.findOne.mockResolvedValue(cartWithItem);

      const response = await request(app)
        .put(`/api/cart/item/${mockProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Item removed from cart');
      expect(cartWithItem.removeItem).toHaveBeenCalledWith(mockProduct._id.toString());
    });

    it('should fail for item not in cart', async () => {
      Cart.findOne.mockResolvedValue(mockCart);

      const response = await request(app)
        .put(`/api/cart/item/${mockProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 1 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Item not found in cart');
    });

    it('should fail when quantity exceeds stock', async () => {
      const cartWithItem = {
        ...mockCart,
        items: [{
          productId: mockProduct._id,
          quantity: 2
        }]
      };

      Cart.findOne.mockResolvedValue(cartWithItem);
      Product.findById.mockResolvedValue({
        ...mockProduct,
        stockQuantity: 5
      });

      const response = await request(app)
        .put(`/api/cart/item/${mockProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 10 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only 5 items available in stock');
    });
  });

  describe('DELETE /api/cart/item/:productId', () => {
    it('should remove item from cart', async () => {
      const cartWithItem = {
        ...mockCart,
        items: [{
          productId: mockProduct._id,
          quantity: 2
        }],
        removeItem: vi.fn().mockReturnValue(true),
        save: vi.fn().mockResolvedValue(true)
      };

      Cart.findOne.mockResolvedValue(cartWithItem);

      const response = await request(app)
        .delete(`/api/cart/item/${mockProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Item removed from cart');
      expect(cartWithItem.removeItem).toHaveBeenCalledWith(mockProduct._id.toString());
    });

    it('should fail for item not in cart', async () => {
      Cart.findOne.mockResolvedValue(mockCart);

      const response = await request(app)
        .delete(`/api/cart/item/${mockProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Item not found in cart');
    });
  });

  describe('DELETE /api/cart/clear', () => {
    it('should clear entire cart', async () => {
      const cartWithItems = {
        ...mockCart,
        items: [{
          productId: mockProduct._id,
          quantity: 2
        }],
        clearItems: vi.fn(),
        save: vi.fn().mockResolvedValue(true)
      };

      Cart.findOne.mockResolvedValue(cartWithItems);

      const response = await request(app)
        .delete('/api/cart/clear')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cart cleared');
      expect(cartWithItems.clearItems).toHaveBeenCalled();
    });
  });

  describe('Guest Cart Session Management', () => {
    it('should persist cart across requests using session cookie', async () => {
      // First request - create cart
      Cart.findOne.mockResolvedValue(null);
      const guestCart = {
        ...mockCart,
        userId: undefined,
        sessionId: 'test-session-id'
      };
      Cart.create.mockResolvedValue(guestCart);

      const response1 = await request(app)
        .get('/api/cart')
        .expect(200);

      expect(response1.body.success).toBe(true);

      // Second request - should find existing cart by session
      Cart.findOne.mockResolvedValue(guestCart);

      const response2 = await request(app)
        .get('/api/cart')
        .set('Cookie', response1.headers['set-cookie'])
        .expect(200);

      expect(response2.body.success).toBe(true);
      expect(response2.body.data.cart.sessionId).toBe('test-session-id');
    });
  });
});