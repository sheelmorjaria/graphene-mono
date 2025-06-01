import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../../server.js';
import User from '../../models/User.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import Cart from '../../models/Cart.js';

describe('Cart Controller', () => {
  let testUser;
  let authToken;
  let testProduct;
  let testCategory;

  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/graphene-store-test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear test data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Cart.deleteMany({});

    // Create test category
    testCategory = new Category({
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Latest smartphones'
    });
    await testCategory.save();

    // Create test product
    testProduct = new Product({
      name: 'GrapheneOS Pixel 9 Pro',
      slug: 'grapheneos-pixel-9-pro',
      description: 'Privacy-focused smartphone',
      price: 999.99,
      stockQuantity: 10,
      category: testCategory._id,
      images: ['https://example.com/image1.jpg']
    });
    await testProduct.save();

    // Create test user
    testUser = new User({
      email: 'cart.test@example.com',
      password: 'TestPass123!',
      firstName: 'Cart',
      lastName: 'Tester'
    });
    await testUser.save();

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET || 'your-secret-key'
    );
  });

  describe('GET /api/cart', () => {
    it('should get empty cart for authenticated user', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(0);
      expect(response.body.data.cart.totalItems).toBe(0);
      expect(response.body.data.cart.totalAmount).toBe(0);
    });

    it('should get empty cart for guest user', async () => {
      const response = await request(app)
        .get('/api/cart')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(0);
      expect(response.body.data.cart.totalItems).toBe(0);
      expect(response.body.data.cart.totalAmount).toBe(0);
      
      // Should set session cookie
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should get cart with items for authenticated user', async () => {
      // Add item to cart first
      const cart = new Cart({ userId: testUser._id });
      cart.addItem(testProduct, 2);
      await cart.save();

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.items).toHaveLength(1);
      expect(response.body.data.cart.items[0].productName).toBe(testProduct.name);
      expect(response.body.data.cart.items[0].quantity).toBe(2);
      expect(response.body.data.cart.totalItems).toBe(2);
      expect(response.body.data.cart.totalAmount).toBe(testProduct.price * 2);
    });
  });

  describe('POST /api/cart/add', () => {
    it('should add product to cart for authenticated user', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 2
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Product added to cart successfully');
      expect(response.body.data.cart.totalItems).toBe(2);
      expect(response.body.data.addedItem.productName).toBe(testProduct.name);
    });

    it('should add product to cart for guest user', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .send({
          productId: testProduct._id,
          quantity: 1
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.totalItems).toBe(1);
      
      // Should set session cookie
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should increment quantity for existing product', async () => {
      // Add product first time
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 2
        });

      // Add same product again
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 3
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cart.totalItems).toBe(5); // 2 + 3
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Product ID is required');
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
      expect(response.body.error).toContain('Invalid product ID format');
    });

    it('should validate quantity range', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 150
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Quantity must be a number between 1 and 99');
    });

    it('should fail for non-existent product', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: nonExistentId,
          quantity: 1
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found');
    });

    it('should fail when quantity exceeds stock', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 15 // Product has stockQuantity of 10
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only 10 items available in stock');
    });

    it('should fail when total quantity in cart would exceed stock', async () => {
      // Add 8 items first
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 8
        });

      // Try to add 5 more (total would be 13, but stock is 10)
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 5
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('You already have 8 in cart');
    });
  });

  describe('PUT /api/cart/item/:productId', () => {
    beforeEach(async () => {
      // Add item to cart for update tests
      const cart = new Cart({ userId: testUser._id });
      cart.addItem(testProduct, 3);
      await cart.save();
    });

    it('should update item quantity', async () => {
      const response = await request(app)
        .put(`/api/cart/item/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cart updated successfully');
      expect(response.body.data.cart.totalItems).toBe(5);
    });

    it('should remove item when quantity is 0', async () => {
      const response = await request(app)
        .put(`/api/cart/item/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 0 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Item removed from cart');
      expect(response.body.data.cart.totalItems).toBe(0);
    });

    it('should fail for item not in cart', async () => {
      const otherProduct = new Product({
        name: 'Other Product',
        slug: 'other-product',
        description: 'Another product',
        price: 199.99,
        stockQuantity: 5,
        category: testCategory._id
      });
      await otherProduct.save();

      const response = await request(app)
        .put(`/api/cart/item/${otherProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 2 })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Item not found in cart');
    });

    it('should fail when quantity exceeds stock', async () => {
      const response = await request(app)
        .put(`/api/cart/item/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 15 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only 10 items available in stock');
    });
  });

  describe('DELETE /api/cart/item/:productId', () => {
    beforeEach(async () => {
      // Add item to cart for delete tests
      const cart = new Cart({ userId: testUser._id });
      cart.addItem(testProduct, 2);
      await cart.save();
    });

    it('should remove item from cart', async () => {
      const response = await request(app)
        .delete(`/api/cart/item/${testProduct._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Item removed from cart successfully');
      expect(response.body.data.cart.totalItems).toBe(0);
    });

    it('should fail for item not in cart', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/cart/item/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Item not found in cart');
    });
  });

  describe('DELETE /api/cart/clear', () => {
    beforeEach(async () => {
      // Add items to cart for clear tests
      const cart = new Cart({ userId: testUser._id });
      cart.addItem(testProduct, 2);
      await cart.save();
    });

    it('should clear entire cart', async () => {
      const response = await request(app)
        .delete('/api/cart/clear')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cart cleared successfully');
      expect(response.body.data.cart.totalItems).toBe(0);
      expect(response.body.data.cart.itemCount).toBe(0);
    });
  });

  describe('Guest Cart Session Management', () => {
    it('should persist cart across requests using session cookie', async () => {
      // First request - add item and get session cookie
      const addResponse = await request(app)
        .post('/api/cart/add')
        .send({
          productId: testProduct._id,
          quantity: 2
        })
        .expect(200);

      const cookies = addResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // Second request - get cart using session cookie
      const getResponse = await request(app)
        .get('/api/cart')
        .set('Cookie', cookies)
        .expect(200);

      expect(getResponse.body.data.cart.totalItems).toBe(2);
      expect(getResponse.body.data.cart.items).toHaveLength(1);
    });
  });
});