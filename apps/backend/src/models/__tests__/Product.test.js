import { describe, it, expect, afterEach } from 'vitest';
import mongoose from 'mongoose';
import Product from '../Product.js';

describe('Product Model', () => {
  // Using global test setup for MongoDB connection

  afterEach(async () => {
    await Product.deleteMany({});
  });

  // Build a variations-schema product. A unique slug/sku per call avoids
  // duplicate-key collisions across tests.
  const createValidProductData = (overrides = {}) => {
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    return {
      name: 'GrapheneOS Pixel 9 Pro',
      slug: `grapheneos-pixel-9-pro-${stamp}`,
      sku: `GP-P9P-${stamp}`.toUpperCase(),
      baseModel: 'Pixel 9 Pro',
      shortDescription: 'Privacy-focused Google Pixel 9 Pro with GrapheneOS',
      longDescription: 'Fully configured Google Pixel 9 Pro running GrapheneOS for maximum privacy and security.',
      images: ['https://example.com/pixel9pro.jpg'],
      variations: [
        {
          condition: 'new',
          color: 'Black',
          price: 899.99,
          stockQuantity: 10,
          stockStatus: 'in_stock',
          sku: `P9P-NEW-BLK-${stamp}`.toUpperCase()
        }
      ],
      ...overrides
    };
  };

  describe('Product Schema Validation', () => {
    it('should create a valid product with required fields', async () => {
      const productData = createValidProductData({
        category: new mongoose.Types.ObjectId()
      });

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct._id).toBeDefined();
      expect(savedProduct.name).toBe(productData.name);
      expect(savedProduct.slug).toBe(productData.slug);
      expect(savedProduct.sku).toBe(productData.sku);
      expect(savedProduct.baseModel).toBe('Pixel 9 Pro');
      expect(savedProduct.variations).toHaveLength(1);
      expect(savedProduct.variations[0].price).toBe(899.99);
      expect(savedProduct.variations[0].stockStatus).toBe('in_stock');
      expect(savedProduct.isActive).toBe(true);
      expect(savedProduct.createdAt).toBeDefined();
    });

    it('should require name field', async () => {
      const productData = createValidProductData();
      delete productData.name;

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow('Product validation failed: name: Path `name` is required');
    });

    it('should require slug field', async () => {
      const productData = createValidProductData();
      delete productData.slug;

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow('Product validation failed: slug: Path `slug` is required');
    });

    it('should require top-level sku field', async () => {
      const productData = createValidProductData();
      delete productData.sku;

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow('Product validation failed: sku: Path `sku` is required');
    });

    it('should require baseModel field', async () => {
      const productData = createValidProductData();
      delete productData.baseModel;

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow('Product validation failed: baseModel: Path `baseModel` is required');
    });

    it('should ensure slug is unique', async () => {
      const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const sharedSlug = `unique-slug-${stamp}`;
      const productData1 = createValidProductData({
        name: 'Product 1',
        slug: sharedSlug,
        sku: `UNIQUE-SKU-1-${stamp}`.toUpperCase()
      });

      const productData2 = createValidProductData({
        name: 'Product 2',
        slug: sharedSlug,
        sku: `UNIQUE-SKU-2-${stamp}`.toUpperCase()
      });

      await new Product(productData1).save();

      await expect(new Product(productData2).save()).rejects.toThrow();
    });

    it('should require price on each variation', async () => {
      const productData = createValidProductData({
        variations: [{ stockQuantity: 10, sku: 'NO-PRICE-SKU' }]
      });

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow();
    });

    it('should require sku on each variation', async () => {
      const productData = createValidProductData({
        variations: [{ condition: 'new', color: 'Black', price: 100, stockQuantity: 10 }]
      });

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow();
    });

    it('should default variation stockQuantity to 0 when omitted', async () => {
      // stockQuantity is required but has a default of 0, so omitting it
      // does NOT reject — it applies the default.
      const productData = createValidProductData({
        variations: [{ condition: 'new', color: 'Black', price: 100, sku: 'NO-STOCK-SKU' }]
      });

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct.variations[0].stockQuantity).toBe(0);
    });

    it('should validate variation condition enum values', async () => {
      const productData = createValidProductData({
        variations: [{
          condition: 'invalid_condition',
          color: 'Black',
          price: 100,
          stockQuantity: 10,
          sku: 'BAD-COND-SKU'
        }]
      });

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow();
    });

    it('should validate variation stockStatus enum values', async () => {
      const productData = createValidProductData({
        variations: [{
          condition: 'new',
          color: 'Black',
          price: 100,
          stockQuantity: 10,
          stockStatus: 'invalid_status',
          sku: 'BAD-STATUS-SKU'
        }]
      });

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow();
    });

    it('should default isActive to true', async () => {
      const productData = createValidProductData();
      delete productData.isActive;

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct.isActive).toBe(true);
    });

    it('should default variation stockStatus to in_stock', async () => {
      const productData = createValidProductData({
        variations: [{
          condition: 'new',
          color: 'Black',
          price: 100,
          stockQuantity: 10,
          sku: 'DEFAULT-STATUS-SKU'
        }]
      });

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct.variations[0].stockStatus).toBe('in_stock');
    });

    it('should reject negative variation price', async () => {
      const productData = createValidProductData({
        variations: [{
          condition: 'new',
          color: 'Black',
          price: -5,
          stockQuantity: 10,
          sku: 'NEG-PRICE-SKU'
        }]
      });

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow();
    });

    it('should reject negative variation stockQuantity', async () => {
      const productData = createValidProductData({
        variations: [{
          condition: 'new',
          color: 'Black',
          price: 100,
          stockQuantity: -5,
          sku: 'NEG-STOCK-SKU'
        }]
      });

      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow();
    });

    it('should allow variation stockQuantity of 0', async () => {
      const productData = createValidProductData({
        variations: [{
          condition: 'new',
          color: 'Black',
          price: 100,
          stockQuantity: 0,
          sku: 'ZERO-STOCK-SKU'
        }]
      });

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct.variations[0].stockQuantity).toBe(0);
    });

    it('should accept valid variation condition values', async () => {
      const conditions = ['new', 'excellent', 'good', 'fair'];

      for (const condition of conditions) {
        const productData = createValidProductData({
          slug: `test-product-${condition}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sku: `TEST-${condition}-${Date.now()}`.toUpperCase(),
          variations: [{
            condition,
            color: 'Black',
            price: 100,
            stockQuantity: 10,
            sku: `TEST-VAR-${condition}-${Date.now()}`.toUpperCase()
          }]
        });

        const product = new Product(productData);
        const savedProduct = await product.save();

        expect(savedProduct.variations[0].condition).toBe(condition);
      }
    });
  });

  describe('Product Methods', () => {
    it('should have a method to generate SEO-friendly URL', async () => {
      const productData = createValidProductData({
        slug: 'grapheneos-pixel-9-pro'
      });

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct.getUrl()).toBe('/products/grapheneos-pixel-9-pro');
    });

    it('should have a method to check if product is in stock', async () => {
      const productData = createValidProductData({
        variations: [{
          condition: 'new',
          color: 'Black',
          price: 100,
          stockQuantity: 10,
          stockStatus: 'in_stock',
          sku: 'INSTOCK-SKU'
        }]
      });

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct.isInStock()).toBe(true);
    });

    it('should return false for isInStock when all variations are out of stock', async () => {
      const productData = createValidProductData({
        variations: [{
          condition: 'new',
          color: 'Black',
          price: 100,
          stockQuantity: 0,
          stockStatus: 'out_of_stock',
          sku: 'OUTSTOCK-SKU'
        }]
      });

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct.isInStock()).toBe(false);
    });

    it('should compute total stock across variations', async () => {
      const productData = createValidProductData({
        variations: [
          { condition: 'new', color: 'Black', price: 100, stockQuantity: 10, sku: 'TS-1' },
          { condition: 'new', color: 'Blue', price: 100, stockQuantity: 5, sku: 'TS-2' },
          { condition: 'excellent', color: 'Black', price: 90, stockQuantity: 0, sku: 'TS-3' }
        ]
      });

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct.getTotalStock()).toBe(15);
    });

    it('should compute a price range across variations (using salePrice when present)', async () => {
      const productData = createValidProductData({
        variations: [
          { condition: 'new', color: 'Black', price: 699, salePrice: 649, stockQuantity: 10, sku: 'PR-1' },
          { condition: 'new', color: 'Blue', price: 799, stockQuantity: 5, sku: 'PR-2' },
          { condition: 'excellent', color: 'Black', price: 599, stockQuantity: 0, sku: 'PR-3' }
        ]
      });

      const product = new Product(productData);
      const savedProduct = await product.save();

      const range = savedProduct.getPriceRange();
      expect(range.min).toBe(599);
      expect(range.max).toBe(799);
    });

    it('should expose available colors and conditions (excluding out of stock)', async () => {
      const productData = createValidProductData({
        variations: [
          { condition: 'new', color: 'Black', price: 100, stockQuantity: 10, stockStatus: 'in_stock', sku: 'AC-1' },
          { condition: 'new', color: 'Blue', price: 100, stockQuantity: 5, stockStatus: 'low_stock', sku: 'AC-2' },
          { condition: 'excellent', color: 'Black', price: 90, stockQuantity: 0, stockStatus: 'out_of_stock', sku: 'AC-3' }
        ]
      });

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct.getAvailableColors().sort()).toEqual(['Black', 'Blue']);
      expect(savedProduct.getAvailableConditions()).toEqual(['new']);
    });
  });
});
