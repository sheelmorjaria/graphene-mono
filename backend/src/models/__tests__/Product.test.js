import mongoose from 'mongoose';
import Product from '../Product.js';

describe('Product Model', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/graphene-store-test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await Product.deleteMany({});
  });

  describe('Product Schema Validation', () => {
    it('should create a valid product with required fields', async () => {
      const productData = {
        name: 'GrapheneOS Pixel 9 Pro',
        slug: 'grapheneos-pixel-9-pro',
        shortDescription: 'Privacy-focused Google Pixel 9 Pro with GrapheneOS',
        longDescription: 'Fully configured Google Pixel 9 Pro running GrapheneOS for maximum privacy and security.',
        price: 899.99,
        images: ['https://example.com/pixel9pro.jpg'],
        category: new mongoose.Types.ObjectId(),
        condition: 'new',
        stockStatus: 'in_stock',
        isActive: true
      };

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct._id).toBeDefined();
      expect(savedProduct.name).toBe(productData.name);
      expect(savedProduct.slug).toBe(productData.slug);
      expect(savedProduct.price).toBe(productData.price);
      expect(savedProduct.stockStatus).toBe('in_stock');
      expect(savedProduct.isActive).toBe(true);
      expect(savedProduct.createdAt).toBeDefined();
    });

    it('should require name field', async () => {
      const productData = {
        slug: 'test-product',
        price: 100
      };

      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('Product validation failed: name: Path `name` is required');
    });

    it('should require slug field', async () => {
      const productData = {
        name: 'Test Product',
        price: 100
      };

      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('Product validation failed: slug: Path `slug` is required');
    });

    it('should require price field', async () => {
      const productData = {
        name: 'Test Product',
        slug: 'test-product'
      };

      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow('Product validation failed: price: Path `price` is required');
    });

    it('should ensure slug is unique', async () => {
      const productData1 = {
        name: 'Product 1',
        slug: 'unique-slug',
        price: 100
      };
      
      const productData2 = {
        name: 'Product 2',
        slug: 'unique-slug',
        price: 200
      };

      await new Product(productData1).save();
      
      await expect(new Product(productData2).save()).rejects.toThrow();
    });

    it('should validate stock status enum values', async () => {
      const productData = {
        name: 'Test Product',
        slug: 'test-product',
        price: 100,
        stockStatus: 'invalid_status'
      };

      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow();
    });

    it('should default isActive to true', async () => {
      const productData = {
        name: 'Test Product',
        slug: 'test-product',
        price: 100
      };

      const product = new Product(productData);
      const savedProduct = await product.save();
      
      expect(savedProduct.isActive).toBe(true);
    });

    it('should default stockStatus to in_stock', async () => {
      const productData = {
        name: 'Test Product',
        slug: 'test-product',
        price: 100
      };

      const product = new Product(productData);
      const savedProduct = await product.save();
      
      expect(savedProduct.stockStatus).toBe('in_stock');
    });

    it('should default condition to new', async () => {
      const productData = {
        name: 'Test Product',
        slug: 'test-product',
        price: 100
      };

      const product = new Product(productData);
      const savedProduct = await product.save();
      
      expect(savedProduct.condition).toBe('new');
    });

    it('should validate condition enum values', async () => {
      const productData = {
        name: 'Test Product',
        slug: 'test-product',
        price: 100,
        condition: 'invalid_condition'
      };

      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow();
    });

    it('should default stockQuantity to 10', async () => {
      const productData = {
        name: 'Test Product',
        slug: 'test-product',
        price: 100
      };

      const product = new Product(productData);
      const savedProduct = await product.save();
      
      expect(savedProduct.stockQuantity).toBe(10);
    });

    it('should validate stockQuantity is not negative', async () => {
      const productData = {
        name: 'Test Product',
        slug: 'test-product',
        price: 100,
        stockQuantity: -5
      };

      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow();
    });

    it('should allow stockQuantity of 0', async () => {
      const productData = {
        name: 'Test Product',
        slug: 'test-product',
        price: 100,
        stockQuantity: 0
      };

      const product = new Product(productData);
      const savedProduct = await product.save();
      
      expect(savedProduct.stockQuantity).toBe(0);
    });

    it('should accept valid condition values', async () => {
      const conditions = ['new', 'excellent', 'good', 'fair'];
      
      for (const condition of conditions) {
        const productData = {
          name: `Test Product ${condition}`,
          slug: `test-product-${condition}`,
          price: 100,
          condition: condition
        };

        const product = new Product(productData);
        const savedProduct = await product.save();
        
        expect(savedProduct.condition).toBe(condition);
      }
    });
  });

  describe('Product Methods', () => {
    it('should have a method to generate SEO-friendly URL', async () => {
      const productData = {
        name: 'GrapheneOS Pixel 9 Pro',
        slug: 'grapheneos-pixel-9-pro',
        price: 899.99
      };

      const product = new Product(productData);
      const savedProduct = await product.save();
      
      expect(savedProduct.getUrl()).toBe('/products/grapheneos-pixel-9-pro');
    });

    it('should have a method to check if product is in stock', async () => {
      const productData = {
        name: 'Test Product',
        slug: 'test-product',
        price: 100,
        stockStatus: 'in_stock'
      };

      const product = new Product(productData);
      const savedProduct = await product.save();
      
      expect(savedProduct.isInStock()).toBe(true);
    });

    it('should return false for isInStock when out of stock', async () => {
      const productData = {
        name: 'Test Product',
        slug: 'test-product',
        price: 100,
        stockStatus: 'out_of_stock'
      };

      const product = new Product(productData);
      const savedProduct = await product.save();
      
      expect(savedProduct.isInStock()).toBe(false);
    });
  });
});