import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { getProducts } from '../productsController.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import { createValidProductData, createValidCategoryData } from '../../test/helpers/testData.js';

describe('Products Controller - Integration Tests', () => {
  // Using global test setup for MongoDB connection
  
  let app;
  let testCategory;
  // let testProducts; // For future use in complex test scenarios

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.get('/api/products', getProducts);
  });

  beforeEach(async () => {
    // Clear test data
    await Product.deleteMany({});
    await Category.deleteMany({});

    // Create test category
    testCategory = new Category(createValidCategoryData({
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Privacy-focused smartphones'
    }));
    await testCategory.save();

    // Create test products
    testProducts = await Product.create([
      createValidProductData({
        name: 'GrapheneOS Pixel 9 Pro',
        slug: 'grapheneos-pixel-9-pro',
        shortDescription: 'Premium privacy smartphone',
        longDescription: 'The Pixel 9 Pro with GrapheneOS offers advanced security features.',
        price: 899.99,
        images: ['pixel9pro-1.jpg', 'pixel9pro-2.jpg'],
        category: testCategory._id,
        condition: 'new',
        stockStatus: 'in_stock',
        stockQuantity: 15,
        isActive: true
      }),
      createValidProductData({
        name: 'GrapheneOS Pixel 9',
        slug: 'grapheneos-pixel-9',
        shortDescription: 'High-performance privacy smartphone',
        longDescription: 'The Pixel 9 with GrapheneOS provides excellent security.',
        price: 799.99,
        images: ['pixel9-1.jpg'],
        category: testCategory._id,
        condition: 'excellent',
        stockStatus: 'in_stock',
        stockQuantity: 20,
        isActive: true
      }),
      createValidProductData({
        name: 'Privacy Case Set',
        slug: 'privacy-case-set',
        shortDescription: 'Protection accessories',
        longDescription: 'Complete protection case set with screen protectors.',
        price: 49.99,
        images: ['case-1.jpg'],
        category: testCategory._id,
        condition: 'new',
        stockStatus: 'in_stock',
        stockQuantity: 50,
        isActive: true
      }),
      createValidProductData({
        name: 'Inactive Product',
        slug: 'inactive-product',
        shortDescription: 'This should not appear',
        price: 999.99,
        category: testCategory._id,
        condition: 'new',
        stockStatus: 'out_of_stock',
        stockQuantity: 0,
        isActive: false // Inactive product
      })
    ]);
  });

  afterAll(async () => {
    await Product.deleteMany({});
    await Category.deleteMany({});
  });

  describe('GET /api/products', () => {
    it('should return paginated products with default parameters', async () => {
      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3); // Only active products
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 12,
        total: 3,
        pages: 1
      });

      // Check that products are sorted by createdAt desc (default)
      const products = response.body.data;
      expect(products[0].name).not.toBe('Inactive Product'); // Should not include inactive
      
      // Verify product structure
      expect(products[0]).toHaveProperty('id');
      expect(products[0]).toHaveProperty('name');
      expect(products[0]).toHaveProperty('slug');
      expect(products[0]).toHaveProperty('shortDescription');
      expect(products[0]).toHaveProperty('price');
      expect(products[0]).toHaveProperty('images');
      expect(products[0]).toHaveProperty('condition');
      expect(products[0]).toHaveProperty('stockStatus');
      expect(products[0]).toHaveProperty('category');
      expect(products[0]).toHaveProperty('createdAt');

      // Verify category is populated
      expect(products[0].category).toHaveProperty('name', 'Smartphones');
      expect(products[0].category).toHaveProperty('slug', 'smartphones');
    });

    it('should handle pagination parameters correctly', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 2, limit: 2 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1); // 3rd product on page 2
      expect(response.body.pagination).toEqual({
        page: 2,
        limit: 2,
        total: 3,
        pages: 2
      });
    });

    it('should handle sorting by price ascending', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ sortBy: 'price', sortOrder: 'asc' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const products = response.body.data;
      expect(products).toHaveLength(3);
      
      // Should be sorted by price ascending
      expect(products[0].price).toBe(49.99);   // Privacy Case Set
      expect(products[1].price).toBe(799.99);  // Pixel 9
      expect(products[2].price).toBe(899.99);  // Pixel 9 Pro
    });

    it('should handle sorting by price descending', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ sortBy: 'price', sortOrder: 'desc' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const products = response.body.data;
      expect(products).toHaveLength(3);
      
      // Should be sorted by price descending
      expect(products[0].price).toBe(899.99);  // Pixel 9 Pro
      expect(products[1].price).toBe(799.99);  // Pixel 9
      expect(products[2].price).toBe(49.99);   // Privacy Case Set
    });

    it('should handle sorting by name', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ sortBy: 'name', sortOrder: 'asc' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const products = response.body.data;
      expect(products).toHaveLength(3);
      
      // Should be sorted alphabetically
      expect(products[0].name).toBe('GrapheneOS Pixel 9');
      expect(products[1].name).toBe('GrapheneOS Pixel 9 Pro');
      expect(products[2].name).toBe('Privacy Case Set');
    });

    it('should handle category filtering by slug', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: 'smartphones' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3); // All test products belong to smartphones category
      
      // Verify all products belong to the correct category
      response.body.data.forEach(product => {
        expect(product.category.slug).toBe('smartphones');
      });
    });

    it('should return empty results for invalid category', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: 'nonexistent-category' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should handle price range filtering', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ minPrice: 700, maxPrice: 850 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('GrapheneOS Pixel 9');
      expect(response.body.data[0].price).toBe(799.99);
    });

    it('should handle minimum price filtering only', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ minPrice: 800 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('GrapheneOS Pixel 9 Pro');
      expect(response.body.data[0].price).toBe(899.99);
    });

    it('should handle maximum price filtering only', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ maxPrice: 100 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Privacy Case Set');
      expect(response.body.data[0].price).toBe(49.99);
    });

    it('should handle condition filtering', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ condition: 'excellent' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('GrapheneOS Pixel 9');
      expect(response.body.data[0].condition).toBe('excellent');
    });

    it('should handle multiple filters combined', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ 
          category: 'smartphones',
          condition: 'new',
          minPrice: 800,
          sortBy: 'price',
          sortOrder: 'desc'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('GrapheneOS Pixel 9 Pro');
      expect(response.body.data[0].condition).toBe('new');
      expect(response.body.data[0].price).toBe(899.99);
      expect(response.body.data[0].category.slug).toBe('smartphones');
    });

    it('should validate and sanitize invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ 
          page: 'invalid', 
          limit: 'invalid',
          minPrice: 'not-a-number',
          maxPrice: 'also-not-a-number',
          sortBy: 'invalid-field',
          condition: 'invalid-condition'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3); // All products since filters are ignored
      expect(response.body.pagination).toEqual({
        page: 1,    // Defaults to 1
        limit: 12,  // Defaults to 12
        total: 3,
        pages: 1
      });
    });

    it('should handle page numbers beyond available pages', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 999 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0); // No products on page 999
      expect(response.body.pagination.page).toBe(999);
      expect(response.body.pagination.total).toBe(3);
    });

    it('should limit maximum items per page', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ limit: 500 }); // Try to request more than the 100 limit

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.pagination.limit).toBe(100); // Should be capped at 100
    });

    it('should only return active products', async () => {
      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3); // Should not include the inactive product
      
      // Verify no inactive products are returned
      const productNames = response.body.data.map(p => p.name);
      expect(productNames).not.toContain('Inactive Product');
    });

    it('should return empty results when no products match filters', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ minPrice: 2000 }); // No products cost this much

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 12,
        total: 0,
        pages: 0
      });
    });

    it('should handle database errors gracefully', async () => {
      // Temporarily mock Product.find to throw an error
      const originalFind = Product.find;
      Product.find = jest.fn().mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app).get('/api/products');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');

      // Restore original method
      Product.find = originalFind;
    });
  });
});