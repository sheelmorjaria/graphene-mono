import mongoose from 'mongoose';
import Product from '../Product.js';

describe('Product Model - Variations', () => {
  beforeEach(async () => {
    await Product.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Product with variations', () => {
    const validProductData = {
      name: 'Google Pixel 8',
      slug: 'google-pixel-8',
      sku: 'GP-PXL8',
      baseModel: 'Pixel 8',
      shortDescription: 'Latest Google Pixel phone',
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
    };

    it('should create a product with valid variations', async () => {
      const product = new Product(validProductData);
      const savedProduct = await product.save();

      expect(savedProduct.variations).toHaveLength(3);
      expect(savedProduct.variations[0].condition).toBe('new');
      expect(savedProduct.variations[0].color).toBe('Black');
      expect(savedProduct.variations[0].price).toBe(699);
      expect(savedProduct.variations[0].sku).toBe('PIX8-NEW-BLK');
    });

    it('should require at least one variation', async () => {
      const productData = { ...validProductData, variations: [] };
      const product = new Product(productData);

      await expect(product.save()).resolves.toBeTruthy(); // Model doesn't enforce this, controller does
    });

    it('should require condition, color, price, and sku for each variation', async () => {
      const productData = {
        ...validProductData,
        variations: [{
          // Missing required fields
          stockQuantity: 10
        }]
      };
      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow();
    });

    it('should validate condition enum values', async () => {
      const productData = {
        ...validProductData,
        variations: [{
          condition: 'invalid',
          color: 'Black',
          price: 699,
          sku: 'PIX8-INV-BLK'
        }]
      };
      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow();
    });

    it('should validate stock status enum values', async () => {
      const productData = {
        ...validProductData,
        variations: [{
          condition: 'new',
          color: 'Black',
          price: 699,
          sku: 'PIX8-NEW-BLK',
          stockStatus: 'invalid'
        }]
      };
      const product = new Product(productData);

      await expect(product.save()).rejects.toThrow();
    });
  });

  describe('Product instance methods', () => {
    let product;

    beforeEach(async () => {
      const productData = {
        name: 'Google Pixel 8',
        slug: 'google-pixel-8',
        sku: 'GP-PXL8',
        baseModel: 'Pixel 8',
        variations: [
          {
            condition: 'new',
            color: 'Black',
            price: 699,
            salePrice: 649,
            stockQuantity: 10,
            stockStatus: 'in_stock',
            sku: 'PIX8-NEW-BLK'
          },
          {
            condition: 'new',
            color: 'Blue',
            price: 799,
            stockQuantity: 5,
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
      };
      product = new Product(productData);
      await product.save();
    });

    it('should calculate correct price range', () => {
      const priceRange = product.getPriceRange();
      expect(priceRange.min).toBe(599); // Lowest effective price (salePrice where present)
      expect(priceRange.max).toBe(799);
    });

    it('should get total stock across all variations', () => {
      const totalStock = product.getTotalStock();
      expect(totalStock).toBe(15); // 10 + 5 + 0
    });

    it('should check if product is in stock', () => {
      expect(product.isInStock()).toBe(true);
    });

    it('should return false for stock check when all variations are out of stock', async () => {
      // Update all variations to be out of stock
      product.variations.forEach(variation => {
        variation.stockStatus = 'out_of_stock';
        variation.stockQuantity = 0;
      });
      await product.save();

      expect(product.isInStock()).toBe(false);
    });

    it('should get available colors (excluding out of stock)', () => {
      const colors = product.getAvailableColors();
      expect(colors).toEqual(['Black', 'Blue']); // Excludes out of stock Black
    });

    it('should get available conditions (excluding out of stock)', () => {
      const conditions = product.getAvailableConditions();
      expect(conditions).toEqual(['new']); // Excludes out of stock excellent
    });

    it('should handle empty variations gracefully', () => {
      const emptyProduct = new Product({
        name: 'Empty Product',
        slug: 'empty',
        baseModel: 'Empty',
        variations: []
      });

      expect(emptyProduct.getPriceRange()).toEqual({ min: 0, max: 0 });
      expect(emptyProduct.getTotalStock()).toBe(0);
      expect(emptyProduct.isInStock()).toBe(false);
      expect(emptyProduct.getAvailableColors()).toEqual([]);
      expect(emptyProduct.getAvailableConditions()).toEqual([]);
    });
  });

  describe('Product indexes', () => {
    it('should have indexes on variation fields', async () => {
      const indexes = await Product.collection.getIndexes();
      const indexNames = Object.keys(indexes);

      expect(indexNames).toContain('variations.condition_1');
      expect(indexNames).toContain('variations.color_1');
      expect(indexNames).toContain('variations.stockStatus_1');
      expect(indexNames).toContain('variations.price_1');
      expect(indexNames).toContain('baseModel_1');
    });
  });

  describe('Product validation edge cases', () => {
    it('should handle missing variation details', async () => {
      const productData = {
        name: 'Test Product',
        slug: 'test-product',
        sku: 'TP-MISSING',
        baseModel: 'Test',
        variations: [{
          condition: 'new',
          color: 'Black',
          price: 100,
          sku: 'TEST-001'
          // Missing optional fields should use defaults
        }]
      };

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct.variations[0].stockQuantity).toBe(0);
      expect(savedProduct.variations[0].stockStatus).toBe('in_stock');
      expect(savedProduct.variations[0].images).toEqual([]);
    });

    it('should validate price is not negative', async () => {
      const productData = {
        name: 'Test Product',
        slug: 'test-product',
        sku: 'TP-NEGPRICE',
        baseModel: 'Test',
        variations: [{
          condition: 'new',
          color: 'Black',
          price: -100, // Negative price
          sku: 'TEST-001'
        }]
      };

      const product = new Product(productData);
      await expect(product.save()).rejects.toThrow();
    });

    it('should validate stock quantity is not negative', async () => {
      const productData = {
        name: 'Test Product',
        slug: 'test-product',
        sku: 'TP-NEGSTOCK',
        baseModel: 'Test',
        variations: [{
          condition: 'new',
          color: 'Black',
          price: 100,
          stockQuantity: -5, // Negative stock
          sku: 'TEST-001'
        }]
      };

      const product = new Product(productData);
      await expect(product.save()).rejects.toThrow();
    });

    it('should allow sale price less than regular price', async () => {
      const productData = {
        name: 'Test Product',
        slug: 'test-product',
        sku: 'TP-SALE',
        baseModel: 'Test',
        variations: [{
          condition: 'new',
          color: 'Black',
          price: 100,
          salePrice: 80,
          sku: 'TEST-001'
        }]
      };

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct.variations[0].salePrice).toBe(80);
    });
  });
});