import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import Product from '../../models/Product.js';
import Cart from '../../models/Cart.js';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';

describe('Cart Controller - Variations', () => {
  let authToken;
  let testUser;
  let testProduct;

  beforeEach(async () => {
    // The shared integration harness wipes all collections before each test,
    // so create fresh user + product here.
    testUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      role: 'customer'
    });
    await testUser.save();

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser._id, role: testUser.role },
      process.env.JWT_SECRET || 'your-secret-key'
    );

    // Create test product with variations
    testProduct = new Product({
      name: 'Google Pixel 8',
      slug: 'google-pixel-8',
      baseModel: 'Pixel 8',
      shortDescription: 'Latest Google Pixel phone',
      price: 699,
      sku: 'PIX8-BASE',
      variations: [
        {
          condition: 'new',
          color: 'Black',
          price: 699,
          stockQuantity: 10,
          stockStatus: 'in_stock',
          sku: 'PIX8-NEW-BLK'
        },
        {
          condition: 'new',
          color: 'Blue',
          price: 699,
          salePrice: 649,
          stockQuantity: 2,
          stockStatus: 'low_stock',
          sku: 'PIX8-NEW-BLU'
        },
        {
          condition: 'excellent',
          color: 'Black',
          price: 599,
          stockQuantity: 0,
          stockStatus: 'out_of_stock',
          sku: 'PIX8-EXC-BLK'
        }
      ]
    });
    await testProduct.save();
  });

  describe('POST /api/cart/add', () => {
    it('should add product variation to cart successfully', async () => {
      const variationId = testProduct.variations[0]._id;

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          variationId: variationId,
          quantity: 2
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.addedItem.variationId).toBe(variationId.toString());
      expect(response.body.data.addedItem.quantity).toBe(2);
      expect(response.body.data.addedItem.unitPrice).toBe(699);
    });

    it('should add variation with sale price correctly', async () => {
      const variationId = testProduct.variations[1]._id; // Blue with sale price

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          variationId: variationId,
          quantity: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.data.addedItem.unitPrice).toBe(649); // Sale price
    });

    it('should require variationId for products with variations', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 1
          // Missing variationId
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('select a product variation');
    });

    it('should reject invalid variationId', async () => {
      const invalidVariationId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          variationId: invalidVariationId,
          quantity: 1
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('variation not found');
    });

    it('should reject out of stock variation', async () => {
      const outOfStockVariationId = testProduct.variations[2]._id;

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          variationId: outOfStockVariationId,
          quantity: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('0 items available');
    });

    it('should respect stock limits', async () => {
      const lowStockVariationId = testProduct.variations[1]._id; // Only 2 in stock

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          variationId: lowStockVariationId,
          quantity: 5 // More than available
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Only 2 items available');
    });

    it('should handle multiple variations in cart', async () => {
      const variation1Id = testProduct.variations[0]._id;
      const variation2Id = testProduct.variations[1]._id;

      // Add first variation
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          variationId: variation1Id,
          quantity: 1
        });

      // Add second variation
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          variationId: variation2Id,
          quantity: 1
        });

      expect(response.status).toBe(200);

      // Check cart contents
      const cartResponse = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(cartResponse.body.data.cart.items).toHaveLength(2);
    });

    it('should increment quantity for same variation', async () => {
      const variationId = testProduct.variations[0]._id;

      // Add first time
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          variationId: variationId,
          quantity: 2
        });

      // Add again
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          variationId: variationId,
          quantity: 1
        });

      expect(response.status).toBe(200);

      // Check cart has combined quantity
      const cartResponse = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(cartResponse.body.data.cart.items).toHaveLength(1);
      expect(cartResponse.body.data.cart.items[0].quantity).toBe(3);
    });
  });

  describe('GET /api/cart', () => {
    it('should return cart with variation details', async () => {
      const variationId = testProduct.variations[0]._id;

      // Add item to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          variationId: variationId,
          quantity: 1
        });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.cart.items[0]).toMatchObject({
        productId: testProduct._id.toString(),
        variationId: variationId.toString(),
        variationDetails: {
          condition: 'new',
          color: 'Black',
          sku: 'PIX8-NEW-BLK'
        }
      });
    });
  });

  describe('PUT /api/cart/item/:itemId', () => {
    it('should update variation quantity using itemId format', async () => {
      const variationId = testProduct.variations[0]._id;
      const itemId = `${testProduct._id}_${variationId}`;

      // Add item to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          variationId: variationId,
          quantity: 1
        });

      // Update quantity
      const response = await request(app)
        .put(`/api/cart/item/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 3 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should remove item when quantity is 0', async () => {
      const variationId = testProduct.variations[0]._id;
      const itemId = `${testProduct._id}_${variationId}`;

      // Add item to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          variationId: variationId,
          quantity: 1
        });

      // Set quantity to 0
      const response = await request(app)
        .put(`/api/cart/item/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 0 });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('removed from cart');
    });

    it('should validate stock when updating quantity', async () => {
      const lowStockVariationId = testProduct.variations[1]._id; // Only 2 in stock
      const itemId = `${testProduct._id}_${lowStockVariationId}`;

      // Add item to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          variationId: lowStockVariationId,
          quantity: 1
        });

      // Try to update to more than available
      const response = await request(app)
        .put(`/api/cart/item/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 5 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Only 2 items available');
    });
  });

  describe('DELETE /api/cart/item/:itemId', () => {
    it('should remove specific variation from cart', async () => {
      const variationId = testProduct.variations[0]._id;
      const itemId = `${testProduct._id}_${variationId}`;

      // Add item to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          variationId: variationId,
          quantity: 1
        });

      // Remove item
      const response = await request(app)
        .delete(`/api/cart/item/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('removed from cart');

      // Verify cart is empty
      const cartResponse = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(cartResponse.body.data.cart.items).toHaveLength(0);
    });

    it('should handle invalid itemId format', async () => {
      const response = await request(app)
        .delete('/api/cart/item/invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid product ID');
    });
  });

  describe('Guest cart functionality', () => {
    it('should handle variations for guest users', async () => {
      const variationId = testProduct.variations[0]._id;

      const response = await request(app)
        .post('/api/cart/add')
        .send({
          productId: testProduct._id,
          variationId: variationId,
          quantity: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.data.addedItem.variationId).toBe(variationId.toString());
    });
  });
});