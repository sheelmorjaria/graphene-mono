import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';

describe('Admin Product Controller - Variations', () => {
  let adminToken;
  let testAdmin;
  let testCategory;

  beforeAll(async () => {
    // Create admin user
    testAdmin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });
    await testAdmin.save();

    // Generate admin token
    adminToken = jwt.sign(
      { userId: testAdmin._id, role: testAdmin.role },
      process.env.JWT_SECRET || 'test-secret'
    );

    // Create test category
    testCategory = new Category({
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Privacy-focused smartphones'
    });
    await testCategory.save();
  });

  beforeEach(async () => {
    await Product.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/admin/products', () => {
    const validProductData = {
      name: 'Google Pixel 8',
      baseModel: 'Pixel 8',
      shortDescription: 'Latest Google Pixel phone',
      longDescription: 'Detailed description...',
      status: 'active',
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
          stockQuantity: 5,
          stockStatus: 'low_stock',
          sku: 'PIX8-NEW-BLU'
        }
      ]
    };

    it('should create product with variations successfully', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProductData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Google Pixel 8');
      expect(response.body.data.variations).toHaveLength(2);
      expect(response.body.data.variations[0].sku).toBe('PIX8-NEW-BLK');
    });

    it('should auto-generate slug if not provided', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProductData);

      expect(response.body.data.slug).toBe('google-pixel-8');
    });

    it('should ensure unique slugs', async () => {
      // Create first product
      await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProductData);

      // Create second product with same name
      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validProductData,
          variations: [{
            condition: 'new',
            color: 'White',
            price: 699,
            sku: 'PIX8-NEW-WHT'
          }]
        });

      expect(response.status).toBe(201);
      expect(response.body.data.slug).toBe('google-pixel-8-1');
    });

    it('should require name and baseModel', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          shortDescription: 'Test product',
          variations: validProductData.variations
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Name, base model');
    });

    it('should require at least one variation', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          baseModel: 'Test',
          variations: []
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('at least one variation');
    });

    it('should validate variation required fields', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          baseModel: 'Test',
          variations: [{
            condition: 'new',
            // Missing color, price, sku
            stockQuantity: 10
          }]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('condition, color, price, and SKU');
    });

    it('should ensure unique SKUs across all products', async () => {
      // Create first product
      await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validProductData);

      // Try to create another product with duplicate SKU
      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Another Product',
          baseModel: 'Another',
          variations: [{
            condition: 'new',
            color: 'Red',
            price: 599,
            sku: 'PIX8-NEW-BLK' // Duplicate SKU
          }]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('PIX8-NEW-BLK already exists');
    });

    it('should validate category if provided', async () => {
      const invalidCategoryId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validProductData,
          category: invalidCategoryId
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid category');
    });

    it('should handle valid category', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validProductData,
          category: testCategory._id
        });

      expect(response.status).toBe(201);
      expect(response.body.data.category._id).toBe(testCategory._id.toString());
    });

    it('should process tags correctly', async () => {
      const response = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...validProductData,
          tags: 'smartphone, privacy, secure'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.tags).toEqual(['smartphone', 'privacy', 'secure']);
    });
  });

  describe('PUT /api/admin/products/:productId', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = new Product({
        name: 'Test Product',
        slug: 'test-product',
        baseModel: 'Test',
        variations: [{
          condition: 'new',
          color: 'Black',
          price: 299,
          sku: 'TEST-NEW-BLK'
        }]
      });
      await testProduct.save();
    });

    it('should update product with new variations', async () => {
      const updateData = {
        name: 'Updated Product',
        baseModel: 'Updated',
        variations: [
          {
            condition: 'new',
            color: 'White',
            price: 399,
            sku: 'UPD-NEW-WHT'
          },
          {
            condition: 'excellent',
            color: 'Black',
            price: 299,
            sku: 'UPD-EXC-BLK'
          }
        ]
      };

      const response = await request(app)
        .put(`/api/admin/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Product');
      expect(response.body.data.variations).toHaveLength(2);
      expect(response.body.data.variations[0].sku).toBe('UPD-NEW-WHT');
    });

    it('should validate SKU uniqueness when updating', async () => {
      // Create another product with a specific SKU
      const anotherProduct = new Product({
        name: 'Another Product',
        slug: 'another-product',
        baseModel: 'Another',
        variations: [{
          condition: 'new',
          color: 'Red',
          price: 199,
          sku: 'OTHER-NEW-RED'
        }]
      });
      await anotherProduct.save();

      // Try to update testProduct with the other product's SKU
      const response = await request(app)
        .put(`/api/admin/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          baseModel: 'Test',
          variations: [{
            condition: 'new',
            color: 'Black',
            price: 299,
            sku: 'OTHER-NEW-RED' // Duplicate SKU
          }]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('OTHER-NEW-RED already exists');
    });

    it('should handle invalid product ID', async () => {
      const invalidId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/admin/products/${invalidId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test',
          baseModel: 'Test',
          variations: [{
            condition: 'new',
            color: 'Black',
            price: 100,
            sku: 'TEST-001'
          }]
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('GET /api/admin/products/:productId', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = new Product({
        name: 'Test Product',
        slug: 'test-product',
        baseModel: 'Test',
        variations: [
          {
            condition: 'new',
            color: 'Black',
            price: 299,
            stockQuantity: 10,
            sku: 'TEST-NEW-BLK'
          },
          {
            condition: 'excellent',
            color: 'Blue',
            price: 249,
            stockQuantity: 5,
            sku: 'TEST-EXC-BLU'
          }
        ]
      });
      await testProduct.save();
    });

    it('should return product with computed fields', async () => {
      const response = await request(app)
        .get(`/api/admin/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.priceRange).toEqual({ min: 249, max: 299 });
      expect(response.body.data.totalStock).toBe(15);
      expect(response.body.data.availableColors).toEqual(['Black', 'Blue']);
      expect(response.body.data.availableConditions).toEqual(['new', 'excellent']);
    });
  });

  describe('GET /api/admin/products', () => {
    beforeEach(async () => {
      // Create test products
      const products = [
        {
          name: 'Product A',
          slug: 'product-a',
          baseModel: 'A',
          variations: [{
            condition: 'new',
            color: 'Black',
            price: 100,
            sku: 'A-NEW-BLK'
          }]
        },
        {
          name: 'Product B',
          slug: 'product-b',
          baseModel: 'B',
          variations: [{
            condition: 'new',
            color: 'White',
            price: 200,
            sku: 'B-NEW-WHT'
          }]
        }
      ];

      await Product.insertMany(products);
    });

    it('should return products with computed fields', async () => {
      const response = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.products[0]).toHaveProperty('priceRange');
      expect(response.body.data.products[0]).toHaveProperty('totalStock');
      expect(response.body.data.products[0]).toHaveProperty('variationCount');
    });

    it('should support search by SKU', async () => {
      const response = await request(app)
        .get('/api/admin/products?search=A-NEW-BLK')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('Product A');
    });

    it('should support search by base model', async () => {
      const response = await request(app)
        .get('/api/admin/products?search=B')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].baseModel).toBe('B');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/admin/products?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.pagination.pages).toBe(2);
    });
  });

  describe('PATCH /api/admin/products/:productId/variations/:variationId/stock', () => {
    let testProduct;
    let variationId;

    beforeEach(async () => {
      testProduct = new Product({
        name: 'Test Product',
        slug: 'test-product',
        baseModel: 'Test',
        variations: [{
          condition: 'new',
          color: 'Black',
          price: 299,
          stockQuantity: 10,
          stockStatus: 'in_stock',
          sku: 'TEST-NEW-BLK'
        }]
      });
      await testProduct.save();
      variationId = testProduct.variations[0]._id;
    });

    it('should update variation stock successfully', async () => {
      const response = await request(app)
        .patch(`/api/admin/products/${testProduct._id}/variations/${variationId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stockQuantity: 5,
          stockStatus: 'low_stock'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.stockQuantity).toBe(5);
      expect(response.body.data.stockStatus).toBe('low_stock');
    });

    it('should handle invalid variation ID', async () => {
      const invalidVariationId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/admin/products/${testProduct._id}/variations/${invalidVariationId}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          stockQuantity: 5
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Variation not found');
    });
  });

  describe('DELETE /api/admin/products/:productId', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = new Product({
        name: 'Test Product',
        slug: 'test-product',
        baseModel: 'Test',
        variations: [{
          condition: 'new',
          color: 'Black',
          price: 299,
          sku: 'TEST-NEW-BLK'
        }]
      });
      await testProduct.save();
    });

    it('should soft delete product', async () => {
      const response = await request(app)
        .delete(`/api/admin/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');

      // Verify product is archived
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.status).toBe('archived');
      expect(updatedProduct.isActive).toBe(false);
    });
  });
});