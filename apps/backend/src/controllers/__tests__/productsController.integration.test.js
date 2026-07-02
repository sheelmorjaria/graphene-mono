import { vi, describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { getProducts } from '../productsController.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';

describe('Products Controller - Integration Tests', () => {
  let app;
  let testCategory;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.get('/api/products', getProducts);
  });

  // Helper: build a valid variation-based product matching the real schema.
  // priceMin / priceMax control the single variation's price so price-filter
  // and price-sort tests can be deterministic.
  const buildProduct = (overrides = {}) => {
    const uid = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    return {
      name: 'Test Product',
      slug: `test-product-${uid}`,
      sku: `SKU-${uid}`,
      baseModel: 'Test Model',
      shortDescription: 'Test short description',
      longDescription: 'Test long description',
      images: ['/images/test.jpg'],
      variations: [
        {
          condition: 'new',
          color: 'Black',
          storage: '128GB',
          price: 99.99,
          stockQuantity: 10,
          stockStatus: 'in_stock',
          sku: `VAR-${uid}`,
          images: ['/images/test.jpg']
        }
      ],
      status: 'active',
      isActive: true,
      ...overrides
    };
  };

  beforeEach(async () => {
    // The shared integration harness wipes collections before each test.
    testCategory = await Category.create({
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Privacy-focused smartphones'
    });

    // Create variation-based products. The "price" each test reasons about is
    // the single variation's price (exposed by the controller as priceRange.min).
    await Product.create([
      buildProduct({
        name: 'GrapheneOS Pixel 9 Pro',
        slug: 'grapheneos-pixel-9-pro',
        sku: 'SKU-P9PRO',
        baseModel: 'Pixel 9 Pro',
        shortDescription: 'Premium privacy smartphone',
        longDescription: 'The Pixel 9 Pro with GrapheneOS offers advanced security features.',
        category: testCategory._id,
        variations: [{ condition: 'new', color: 'Obsidian', storage: '256GB', price: 899.99, stockQuantity: 15, stockStatus: 'in_stock', sku: 'VAR-P9PRO' }]
      }),
      buildProduct({
        name: 'GrapheneOS Pixel 9',
        slug: 'grapheneos-pixel-9',
        sku: 'SKU-P9',
        baseModel: 'Pixel 9',
        shortDescription: 'High-performance privacy smartphone',
        longDescription: 'The Pixel 9 with GrapheneOS provides excellent security.',
        category: testCategory._id,
        variations: [{ condition: 'excellent', color: 'Black', storage: '128GB', price: 799.99, stockQuantity: 20, stockStatus: 'in_stock', sku: 'VAR-P9' }]
      }),
      buildProduct({
        name: 'Privacy Case Set',
        slug: 'privacy-case-set',
        sku: 'SKU-CASE',
        baseModel: 'Case Set',
        shortDescription: 'Protection accessories',
        longDescription: 'Complete protection case set with screen protectors.',
        category: testCategory._id,
        variations: [{ condition: 'new', color: 'Clear', storage: 'Universal', price: 49.99, stockQuantity: 50, stockStatus: 'in_stock', sku: 'VAR-CASE' }]
      }),
      buildProduct({
        name: 'Inactive Product',
        slug: 'inactive-product',
        sku: 'SKU-INACTIVE',
        baseModel: 'Inactive',
        shortDescription: 'This should not appear',
        category: testCategory._id,
        isActive: false,
        variations: [{ condition: 'new', color: 'Black', storage: '128GB', price: 999.99, stockQuantity: 0, stockStatus: 'out_of_stock', sku: 'VAR-INACTIVE' }]
      })
    ]);
  });

  describe('GET /api/products', () => {
    it('should return paginated products with default parameters', async () => {
      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3); // Only active products
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 12,
        total: 3,
        pages: 1
      });

      const products = response.body.data;
      expect(products[0].name).not.toBe('Inactive Product');

      // Verify variation-based product structure returned by the controller
      expect(products[0]).toHaveProperty('id');
      expect(products[0]).toHaveProperty('name');
      expect(products[0]).toHaveProperty('slug');
      expect(products[0]).toHaveProperty('shortDescription');
      expect(products[0]).toHaveProperty('priceRange');
      expect(products[0]).toHaveProperty('images');
      expect(products[0]).toHaveProperty('variations');
      expect(products[0]).toHaveProperty('isInStock');
      expect(products[0]).toHaveProperty('availableConditions');
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
      expect(response.body.pagination).toMatchObject({
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

      // priceRange.min reflects the variation price
      expect(products[0].priceRange.min).toBe(49.99);
      expect(products[1].priceRange.min).toBe(799.99);
      expect(products[2].priceRange.min).toBe(899.99);
    });

    it('should handle sorting by price descending', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ sortBy: 'price', sortOrder: 'desc' });

      expect(response.status).toBe(200);

      const products = response.body.data;
      expect(products).toHaveLength(3);

      expect(products[0].priceRange.min).toBe(899.99);
      expect(products[1].priceRange.min).toBe(799.99);
      expect(products[2].priceRange.min).toBe(49.99);
    });

    it('should handle sorting by name', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ sortBy: 'name', sortOrder: 'asc' });

      expect(response.status).toBe(200);

      const products = response.body.data;
      expect(products).toHaveLength(3);

      expect(products[0].name).toBe('GrapheneOS Pixel 9');
      expect(products[1].name).toBe('GrapheneOS Pixel 9 Pro');
      expect(products[2].name).toBe('Privacy Case Set');
    });

    it('should handle category filtering by slug', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: 'smartphones' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);

      response.body.data.forEach(product => {
        expect(product.category.slug).toBe('smartphones');
      });
    });

    it('should return empty results for invalid category', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: 'nonexistent-category' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should handle price range filtering', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ minPrice: 700, maxPrice: 850 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('GrapheneOS Pixel 9');
      expect(response.body.data[0].priceRange.min).toBe(799.99);
    });

    it('should handle minimum price filtering only', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ minPrice: 800 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('GrapheneOS Pixel 9 Pro');
      expect(response.body.data[0].priceRange.min).toBe(899.99);
    });

    it('should handle maximum price filtering only', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ maxPrice: 100 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Privacy Case Set');
      expect(response.body.data[0].priceRange.min).toBe(49.99);
    });

    it('should handle condition filtering', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ condition: 'excellent' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('GrapheneOS Pixel 9');
      expect(response.body.data[0].availableConditions).toEqual(expect.arrayContaining(['excellent']));
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
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('GrapheneOS Pixel 9 Pro');
      expect(response.body.data[0].availableConditions).toEqual(expect.arrayContaining(['new']));
      expect(response.body.data[0].priceRange.min).toBe(899.99);
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
      expect(response.body.data).toHaveLength(3); // filters ignored -> all active
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 12,
        total: 3,
        pages: 1
      });
    });

    it('should handle page numbers beyond available pages', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ page: 999 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination.page).toBe(999);
      expect(response.body.pagination.total).toBe(3);
    });

    it('should limit maximum items per page', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ limit: 500 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(100); // capped at 100
    });

    it('should only return active products', async () => {
      const response = await request(app).get('/api/products');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);

      const productNames = response.body.data.map(p => p.name);
      expect(productNames).not.toContain('Inactive Product');
    });

    it('should return empty results when no products match filters', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ minPrice: 2000 });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 12,
        total: 0,
        pages: 0
      });
    });

    it('should handle database errors gracefully', async () => {
      // Temporarily mock Product.find to throw an error
      const originalFind = Product.find;
      Product.find = vi.fn().mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app).get('/api/products');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');

      Product.find = originalFind;
    });
  });
});
