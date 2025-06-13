import request from 'supertest';
import express from 'express';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import { getProductBySlug } from '../productDetailsController.js';
import { createValidProductData, createValidCategoryData } from '../../test/helpers/testData.js';

// Create Express app for testing
const app = express();
app.use(express.json());
app.get('/api/products/:slug', getProductBySlug);

describe('Product Details Controller', () => {
  // Using global test setup for MongoDB connection
  
  let categoryId;
  let sampleProduct;

  beforeEach(async () => {
    // Clear database
    await Product.deleteMany({});
    await Category.deleteMany({});

    // Create test category
    const category = new Category(createValidCategoryData({
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Privacy-focused smartphones'
    }));
    const savedCategory = await category.save();
    categoryId = savedCategory._id;

    // Create test product
    sampleProduct = createValidProductData({
      name: 'GrapheneOS Pixel 9 Pro',
      slug: 'grapheneos-pixel-9-pro',
      shortDescription: 'Privacy-focused smartphone with GrapheneOS',
      longDescription: 'The Pixel 9 Pro with GrapheneOS offers the ultimate in mobile privacy and security. Features a 6.3-inch OLED display, advanced camera system, and hardened security protocols.',
      price: 899.99,
      images: [
        'https://example.com/pixel9pro-1.jpg',
        'https://example.com/pixel9pro-2.jpg',
        'https://example.com/pixel9pro-3.jpg'
      ],
      category: categoryId,
      condition: 'new',
      stockStatus: 'in_stock',
      stockQuantity: 15,
      attributes: [
        { name: 'Color', value: 'Obsidian' },
        { name: 'Storage', value: '256GB' },
        { name: 'RAM', value: '12GB' },
        { name: 'Display', value: '6.3" OLED' }
      ],
      isActive: true
    });

    const product = new Product(sampleProduct);
    await product.save();
  });

  describe('GET /api/products/:slug', () => {
    it('should return product details for valid slug', async () => {
      const response = await request(app)
        .get('/api/products/grapheneos-pixel-9-pro')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: 'GrapheneOS Pixel 9 Pro',
        slug: 'grapheneos-pixel-9-pro',
        shortDescription: 'Privacy-focused smartphone with GrapheneOS',
        longDescription: expect.stringContaining('Pixel 9 Pro with GrapheneOS'),
        price: 899.99,
        images: expect.arrayContaining([
          'https://example.com/pixel9pro-1.jpg',
          'https://example.com/pixel9pro-2.jpg',
          'https://example.com/pixel9pro-3.jpg'
        ]),
        condition: 'new',
        stockStatus: 'in_stock',
        stockQuantity: 15,
        attributes: expect.arrayContaining([
          expect.objectContaining({ name: 'Color', value: 'Obsidian' }),
          expect.objectContaining({ name: 'Storage', value: '256GB' })
        ]),
        isActive: true
      });

      // Should include populated category
      expect(response.body.data.category).toMatchObject({
        name: 'Smartphones',
        slug: 'smartphones'
      });

      // Should include timestamps
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should return 404 for non-existent slug', async () => {
      const response = await request(app)
        .get('/api/products/non-existent-product')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });

    it('should return 404 for inactive product', async () => {
      // Create inactive product
      const inactiveProduct = new Product(createValidProductData({
        ...sampleProduct,
        slug: 'inactive-product',
        sku: 'INACTIVE-PRODUCT-001',
        isActive: false
      }));
      await inactiveProduct.save();

      const response = await request(app)
        .get('/api/products/inactive-product')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });

    it('should validate slug parameter format', async () => {
      await request(app)
        .get('/api/products/')
        .expect(404);

      // Express will return 404 for missing slug parameter
    });

    it('should handle invalid slug characters gracefully', async () => {
      const response = await request(app)
        .get('/api/products/invalid-slug-with-@#$-characters')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });

    it('should return product with empty arrays for missing optional fields', async () => {
      // Create product with minimal data
      const minimalProduct = new Product(createValidProductData({
        name: 'Minimal Product',
        slug: 'minimal-product',
        sku: 'MINIMAL-PRODUCT-001',
        price: 99.99,
        category: categoryId,
        shortDescription: undefined,
        longDescription: undefined,
        images: [],
        attributes: []
      }));
      await minimalProduct.save();

      const response = await request(app)
        .get('/api/products/minimal-product')
        .expect(200);

      expect(response.body.data.images).toEqual([]);
      expect(response.body.data.attributes).toEqual([]);
      expect(response.body.data.shortDescription).toBeUndefined();
      expect(response.body.data.longDescription).toBeUndefined();
    });

    it('should handle malformed slug gracefully', async () => {
      // Test with a slug that would cause issues
      const response = await request(app)
        .get('/api/products/malformed-slug-with-invalid-chars-@#$%')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Product not found');
    });

    it('should return all required fields for frontend display', async () => {
      const response = await request(app)
        .get('/api/products/grapheneos-pixel-9-pro')
        .expect(200);

      const product = response.body.data;

      // Required fields for product details page
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('slug');
      expect(product).toHaveProperty('longDescription');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('images');
      expect(product).toHaveProperty('stockStatus');
      expect(product).toHaveProperty('stockQuantity');
      expect(product).toHaveProperty('condition');
      expect(product).toHaveProperty('attributes');
      expect(product).toHaveProperty('category');
    });

    it('should not return internal fields', async () => {
      const response = await request(app)
        .get('/api/products/grapheneos-pixel-9-pro')
        .expect(200);

      const product = response.body.data;

      // Should not include internal MongoDB fields like __v
      expect(product).not.toHaveProperty('__v');
    });
  });
});