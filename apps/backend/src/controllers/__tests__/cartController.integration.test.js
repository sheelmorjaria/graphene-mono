import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../cartController.js';
import { authenticate, optionalAuth } from '../../middleware/auth.js';
import User from '../../models/User.js';
import Product from '../../models/Product.js';
import Cart from '../../models/Cart.js';
import { mergeGuestCartOnLogin } from '../../controllers/cartController.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Setup Express app using the REAL auth middleware and REAL models.
const app = express();
app.use(express.json());
app.use(cookieParser());

app.get('/api/cart', optionalAuth, getCart);
app.post('/api/cart/add', optionalAuth, addToCart);
app.put('/api/cart/item/:itemId', optionalAuth, updateCartItem);
app.delete('/api/cart/item/:itemId', optionalAuth, removeFromCart);
app.delete('/api/cart/clear', optionalAuth, clearCart);
app.post('/api/cart/merge', optionalAuth, mergeGuestCartOnLogin);

// Build a valid variation-based product in the real DB.
const createProduct = async (overrides = {}) => {
  const product = await Product.create({
    name: 'GrapheneOS Pixel 9 Pro',
    slug: `grapheneos-pixel-9-pro-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    baseModel: 'Pixel 9 Pro',
    shortDescription: 'Privacy-focused smartphone',
    longDescription: 'A long description.',
    images: ['https://example.com/image1.jpg'],
    variations: [
      {
        condition: 'new',
        color: 'Obsidian',
        storage: '256GB',
        price: 999.99,
        stockQuantity: 10,
        stockStatus: 'in_stock',
        sku: `VAR-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        images: ['https://example.com/image1.jpg']
      }
    ],
    status: 'active',
    isActive: true,
    ...overrides
  });
  return product;
};

const createUser = async (overrides = {}) => {
  const user = await User.create({
    email: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Cart',
    lastName: 'Tester',
    isActive: true,
    role: 'customer',
    ...overrides
  });
  return user;
};

const signToken = (user) =>
  jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

describe('Cart Controller', () => {
  let user;
  let authToken;
  let product;

  beforeEach(async () => {
    await Cart.deleteMany({});
    user = await createUser();
    authToken = signToken(user);
    product = await createProduct();
  });

  describe('GET /api/cart', () => {
    it('should get empty cart for authenticated user', async () => {
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
      const response = await request(app)
        .get('/api/cart')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart).toBeDefined();
      expect(response.body.data.cart.items).toEqual([]);
    });

    it('should get cart with items for authenticated user', async () => {
      const variationId = product.variations[0]._id.toString();
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: product._id.toString(), variationId, quantity: 2 })
        .expect(200);

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.totalItems).toBe(2);
      expect(response.body.data.cart.totalAmount).toBe(999.99 * 2);
    });
  });

  describe('POST /api/cart/add', () => {
    it('should add product to cart for authenticated user', async () => {
      const variationId = product.variations[0]._id.toString();
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: product._id.toString(), variationId, quantity: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product added to cart successfully');
      expect(response.body.data.addedItem.productName).toBe(product.name);
      expect(response.body.data.cart.totalItems).toBe(1);
    });

    it('should add product to cart for guest user', async () => {
      const variationId = product.variations[0]._id.toString();
      const response = await request(app)
        .post('/api/cart/add')
        .send({ productId: product._id.toString(), variationId, quantity: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product added to cart successfully');
    });

    it('should increment quantity for existing product', async () => {
      const variationId = product.variations[0]._id.toString();
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: product._id.toString(), variationId, quantity: 1 })
        .expect(200);

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: product._id.toString(), variationId, quantity: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.totalItems).toBe(2);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product ID is required');
    });

    it('should validate product ID format', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: 'invalid-id', quantity: 1 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid product ID format');
    });

    it('should validate quantity range', async () => {
      const variationId = product.variations[0]._id.toString();
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: product._id.toString(), variationId, quantity: 0 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Quantity must be a number between 1 and 99');
    });

    it('should fail for non-existent product', async () => {
      const variationId = product.variations[0]._id.toString();
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: new mongoose.Types.ObjectId().toString(),
          variationId,
          quantity: 1
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found');
    });

    it('should fail when quantity exceeds stock', async () => {
      const lowStockProduct = await createProduct({
        slug: `low-stock-${Date.now()}`,
        variations: [{
          condition: 'new',
          color: 'Black',
          storage: '128GB',
          price: 499.99,
          stockQuantity: 5,
          stockStatus: 'in_stock',
          sku: `LOW-${Date.now()}-${Math.floor(Math.random() * 10000)}`
        }]
      });
      const variationId = lowStockProduct.variations[0]._id.toString();

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: lowStockProduct._id.toString(),
          variationId,
          quantity: 10
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only 5 items available in stock');
    });

    it('should fail when total quantity in cart would exceed stock', async () => {
      const lowStockProduct = await createProduct({
        slug: `low-stock2-${Date.now()}`,
        variations: [{
          condition: 'new',
          color: 'Black',
          storage: '128GB',
          price: 499.99,
          stockQuantity: 5,
          stockStatus: 'in_stock',
          sku: `LOW2-${Date.now()}-${Math.floor(Math.random() * 10000)}`
        }]
      });
      const variationId = lowStockProduct.variations[0]._id.toString();

      // Add 3 first
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: lowStockProduct._id.toString(), variationId, quantity: 3 })
        .expect(200);

      // Adding 3 more would exceed 5
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: lowStockProduct._id.toString(), variationId, quantity: 3 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only 5');
    });
  });

  describe('PUT /api/cart/item/:itemId', () => {
    it('should update item quantity', async () => {
      const variationId = product.variations[0]._id.toString();
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: product._id.toString(), variationId, quantity: 1 })
        .expect(200);

      const itemId = `${product._id}_${variationId}`;
      const response = await request(app)
        .put(`/api/cart/item/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 3 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cart updated successfully');
      expect(response.body.data.cart.totalItems).toBe(3);
    });

    it('should remove item when quantity is 0', async () => {
      const variationId = product.variations[0]._id.toString();
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: product._id.toString(), variationId, quantity: 2 })
        .expect(200);

      const itemId = `${product._id}_${variationId}`;
      const response = await request(app)
        .put(`/api/cart/item/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Item removed from cart');
      expect(response.body.data.cart.itemCount).toBe(0);
    });

    it('should fail for item not in cart', async () => {
      const itemId = `${product._id}_${product.variations[0]._id}`;
      const response = await request(app)
        .put(`/api/cart/item/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 1 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Item not found in cart');
    });

    it('should fail when quantity exceeds stock', async () => {
      const variationId = product.variations[0]._id.toString();
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: product._id.toString(), variationId, quantity: 1 })
        .expect(200);

      const itemId = `${product._id}_${variationId}`;
      const response = await request(app)
        .put(`/api/cart/item/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 50 }) // stock is 10
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only 10 items available in stock');
    });
  });

  describe('DELETE /api/cart/item/:itemId', () => {
    it('should remove item from cart', async () => {
      const variationId = product.variations[0]._id.toString();
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: product._id.toString(), variationId, quantity: 2 })
        .expect(200);

      const itemId = `${product._id}_${variationId}`;
      const response = await request(app)
        .delete(`/api/cart/item/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Item removed from cart successfully');
      expect(response.body.data.cart.itemCount).toBe(0);
    });

    it('should fail for item not in cart', async () => {
      const itemId = `${product._id}_${product.variations[0]._id}`;
      const response = await request(app)
        .delete(`/api/cart/item/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Item not found in cart');
    });
  });

  describe('DELETE /api/cart/clear', () => {
    it('should clear entire cart', async () => {
      const variationId = product.variations[0]._id.toString();
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: product._id.toString(), variationId, quantity: 2 })
        .expect(200);

      const response = await request(app)
        .delete('/api/cart/clear')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cart cleared successfully');
      expect(response.body.data.cart.totalItems).toBe(0);
    });
  });

  describe('Guest Cart Session Management', () => {
    it('should persist cart across requests using session cookie', async () => {
      const variationId = product.variations[0]._id.toString();
      // First request as guest - adds an item; server sets a cartSessionId cookie
      const response1 = await request(app)
        .post('/api/cart/add')
        .send({ productId: product._id.toString(), variationId, quantity: 1 })
        .expect(200);

      expect(response1.body.success).toBe(true);

      const cookies = response1.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // Second request - reuse the cookie so the same guest cart is found
      const response2 = await request(app)
        .get('/api/cart')
        .set('Cookie', cookies)
        .expect(200);

      expect(response2.body.success).toBe(true);
      expect(response2.body.data.cart.items).toHaveLength(1);
    });
  });

  describe('POST /api/cart/merge (guest cart merge on login)', () => {
    const buildItem = (prod, qty = 1) => ({
      productId: prod._id,
      variationId: prod.variations[0]._id.toString(),
      productName: prod.name,
      productSlug: prod.slug,
      productImage: '',
      quantity: qty,
      unitPrice: prod.variations[0].price,
      subtotal: prod.variations[0].price * qty
    });

    it('merges the guest cart into the user cart and clears the session cookie', async () => {
      const guestProduct = await createProduct();
      await Cart.create({
        sessionId: 'guest-merge-1',
        items: [buildItem(guestProduct, 2)],
        totalItems: 2,
        totalAmount: guestProduct.variations[0].price * 2
      });
      await Cart.create({
        userId: user._id,
        items: [buildItem(product, 1)],
        totalItems: 1,
        totalAmount: product.variations[0].price
      });

      const response = await request(app)
        .post('/api/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', ['cartSessionId=guest-merge-1']);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.merged).toBe(true);

      // Guest cart consumed, user cart has both items
      expect(await Cart.findOne({ sessionId: 'guest-merge-1' })).toBeNull();
      const merged = await Cart.findOne({ userId: user._id });
      expect(merged.items).toHaveLength(2);
      expect(merged.totalItems).toBe(3);

      // Session cookie cleared
      const setCookie = response.headers['set-cookie'] || [];
      expect(setCookie.some(c => c.startsWith('cartSessionId=;'))).toBe(true);
    });

    it('transfers a guest cart when the user has no cart yet', async () => {
      await Cart.create({
        sessionId: 'guest-merge-2',
        items: [buildItem(product, 1)],
        totalItems: 1,
        totalAmount: product.variations[0].price
      });

      const response = await request(app)
        .post('/api/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', ['cartSessionId=guest-merge-2']);

      expect(response.status).toBe(200);
      const cart = await Cart.findOne({ userId: user._id });
      expect(cart).toBeTruthy();
      expect(cart.items).toHaveLength(1);
      expect(await Cart.findOne({ sessionId: 'guest-merge-2' })).toBeNull();
    });

    it('is a no-op when there is no guest session cookie', async () => {
      const response = await request(app)
        .post('/api/cart/merge')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.merged).toBe(false);
    });

    it('rejects unauthenticated callers', async () => {
      const response = await request(app)
        .post('/api/cart/merge')
        .set('Cookie', ['cartSessionId=guest-merge-3']);

      expect(response.status).toBe(401);
    });
  });
});
