import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import { searchProducts } from '../searchController.js';

// Create Express app for testing
const app = express();
app.use(express.json());
app.get('/api/products/search', searchProducts);

describe('Search Controller', () => {
  let categoryId;
  let sampleProducts;

  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/graphene-store-test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear database
    await Product.deleteMany({});
    await Category.deleteMany({});

    // Create test category
    const category = new Category({
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Privacy-focused smartphones'
    });
    const savedCategory = await category.save();
    categoryId = savedCategory._id;

    // Create test products
    sampleProducts = [
      {
        name: 'GrapheneOS Pixel 9 Pro',
        slug: 'grapheneos-pixel-9-pro',
        shortDescription: 'Premium privacy-focused smartphone with GrapheneOS',
        longDescription: 'The Pixel 9 Pro with GrapheneOS offers advanced security features and privacy protection.',
        price: 899.99,
        images: ['https://example.com/pixel9pro-1.jpg'],
        category: categoryId,
        condition: 'new',
        stockStatus: 'in_stock',
        stockQuantity: 15,
        isActive: true
      },
      {
        name: 'GrapheneOS Pixel 9',
        slug: 'grapheneos-pixel-9',
        shortDescription: 'High-performance privacy smartphone',
        longDescription: 'The Pixel 9 with GrapheneOS provides excellent security for everyday use.',
        price: 799.99,
        images: ['https://example.com/pixel9-1.jpg'],
        category: categoryId,
        condition: 'new',
        stockStatus: 'in_stock',
        stockQuantity: 20,
        isActive: true
      },
      {
        name: 'Privacy Case Set',
        slug: 'privacy-case-set',
        shortDescription: 'Protection accessories for your smartphone',
        longDescription: 'Complete protection case set with screen protectors.',
        price: 49.99,
        images: ['https://example.com/case-1.jpg'],
        category: categoryId,
        condition: 'new',
        stockStatus: 'in_stock',
        stockQuantity: 50,
        isActive: true
      }
    ];

    // Save all products
    for (const productData of sampleProducts) {
      const product = new Product(productData);
      await product.save();
    }
  });

  describe('GET /api/products/search', () => {
    it('should search products by text query successfully', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'pixel' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      expect(response.body.data.totalProducts).toBe(2);
      expect(response.body.data.totalPages).toBe(1);
      expect(response.body.data.currentPage).toBe(1);

      // Should find both Pixel products
      const productNames = response.body.data.products.map(p => p.name);
      expect(productNames).toContain('GrapheneOS Pixel 9 Pro');
      expect(productNames).toContain('GrapheneOS Pixel 9');
    });

    it('should return 400 when search query is missing', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Search query is required');
    });

    it('should return 400 when search query is empty', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Search query is required');
    });

    it('should return 400 when search query is whitespace only', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: '   ' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Search query is required');
    });

    it('should handle case-insensitive search', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'PIXEL' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      
      const productNames = response.body.data.products.map(p => p.name);
      expect(productNames).toContain('GrapheneOS Pixel 9 Pro');
      expect(productNames).toContain('GrapheneOS Pixel 9');
    });

    it('should search in shortDescription field', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'premium' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('GrapheneOS Pixel 9 Pro');
    });

    it('should search in longDescription field', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'everyday' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('GrapheneOS Pixel 9');
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'pixel', page: 1, limit: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.totalProducts).toBe(2);
      expect(response.body.data.totalPages).toBe(2);
      expect(response.body.data.currentPage).toBe(1);
    });

    it('should handle sorting by price ascending', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'pixel', sortBy: 'price', sortOrder: 'asc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      
      // Should be sorted by price ascending (799.99, then 899.99)
      expect(response.body.data.products[0].price).toBe(799.99);
      expect(response.body.data.products[1].price).toBe(899.99);
    });

    it('should handle sorting by price descending', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'pixel', sortBy: 'price', sortOrder: 'desc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      
      // Should be sorted by price descending (899.99, then 799.99)
      expect(response.body.data.products[0].price).toBe(899.99);
      expect(response.body.data.products[1].price).toBe(799.99);
    });

    it('should handle category filtering with search', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'privacy', category: categoryId.toString() })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.length).toBeGreaterThan(0);
      
      // All results should belong to the specified category
      response.body.data.products.forEach(product => {
        expect(product.category._id).toBe(categoryId.toString());
      });
    });

    it('should handle condition filtering with search', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'pixel', condition: 'new' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      
      // All results should have 'new' condition
      response.body.data.products.forEach(product => {
        expect(product.condition).toBe('new');
      });
    });

    it('should handle price range filtering with search', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'pixel', minPrice: 790, maxPrice: 850 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('GrapheneOS Pixel 9');
      expect(response.body.data.products[0].price).toBe(799.99);
    });

    it('should return empty results when no products match', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'nonexistent' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toEqual([]);
      expect(response.body.data.totalPages).toBe(0);
      expect(response.body.data.currentPage).toBe(1);
      expect(response.body.data.totalProducts).toBe(0);
    });

    it('should validate pagination limits', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'pixel', page: -1, limit: 200 })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Page should be clamped to 1, limit should be clamped to 100
      expect(response.body.data.currentPage).toBe(1);
      expect(response.body.data.products).toHaveLength(2); // All results since limit is clamped
    });

    it('should handle search with multiple keywords', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'GrapheneOS' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      
      const productNames = response.body.data.products.map(p => p.name);
      expect(productNames).toContain('GrapheneOS Pixel 9 Pro');
      expect(productNames).toContain('GrapheneOS Pixel 9');
    });

    it('should handle special characters in search query', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'pixel.+*?^${}()|[]\\' })
        .expect(200);

      expect(response.body.success).toBe(true);
      // MongoDB text search may still find "pixel" within the special characters
      // The important thing is that it doesn't crash
      expect(Array.isArray(response.body.data.products)).toBe(true);
    });

    it('should only search active products', async () => {
      // Create an inactive product
      const inactiveProduct = new Product({
        name: 'Inactive Pixel Device',
        slug: 'inactive-pixel-device',
        shortDescription: 'This should not appear in search',
        price: 999.99,
        category: categoryId,
        condition: 'new',
        stockStatus: 'in_stock',
        stockQuantity: 5,
        isActive: false // inactive
      });
      await inactiveProduct.save();

      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'pixel' })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should only return the 2 active products, not the inactive one
      expect(response.body.data.products).toHaveLength(2);
      
      const productNames = response.body.data.products.map(p => p.name);
      expect(productNames).not.toContain('Inactive Pixel Device');
    });

    it('should populate category information in results', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'pixel' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(2);
      
      // Check that category is populated
      response.body.data.products.forEach(product => {
        expect(product.category).toMatchObject({
          _id: categoryId.toString(),
          name: 'Smartphones',
          slug: 'smartphones'
        });
      });
    });
  });
});