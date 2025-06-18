import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../server.js';
import User from '../../models/User.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import jwt from 'jsonwebtoken';

describe('Admin Products API Integration Tests', () => {
  let adminUser;
  let adminToken;
  const testProducts = [];
  const testCategories = [];

  beforeAll(async () => {
    // Wait for database connection to be established
    await new Promise(resolve => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('connected', resolve);
      }
    });
    
    // Create test categories first
    const smartphoneCategory = new Category({
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Test smartphone category'
    });
    await smartphoneCategory.save();
    testCategories.push(smartphoneCategory);

    const accessoryCategory = new Category({
      name: 'Accessories', 
      slug: 'accessories',
      description: 'Test accessory category'
    });
    await accessoryCategory.save();
    testCategories.push(accessoryCategory);

    // Create admin user
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'Test',
      email: 'admin.products@test.com',
      password: 'TestPass123!',
      role: 'admin',
      emailVerified: true,
      isActive: true
    });
    await adminUser.save();

    // Generate admin token
    adminToken = jwt.sign(
      { 
        userId: adminUser._id,
        role: adminUser.role,
        email: adminUser.email
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );

    // Create test products
    const productData = [
      {
        name: 'Google Pixel 7',
        slug: 'google-pixel-7-test',
        sku: 'GP7-TEST-001',
        price: 599,
        stockQuantity: 50,
        status: 'active',
        category: smartphoneCategory._id,
        images: ['https://example.com/pixel7.jpg'],
        shortDescription: 'Test Pixel 7',
        condition: 'new'
      },
      {
        name: 'Google Pixel 7 Pro',
        slug: 'google-pixel-7-pro-test',
        sku: 'GP7P-TEST-001',
        price: 899,
        stockQuantity: 0,
        status: 'active',
        category: smartphoneCategory._id,
        images: ['https://example.com/pixel7pro.jpg'],
        shortDescription: 'Test Pixel 7 Pro',
        condition: 'new'
      },
      {
        name: 'Pixel Buds Pro',
        slug: 'pixel-buds-pro-test',
        sku: 'PBP-TEST-001',
        price: 199,
        stockQuantity: 5,
        status: 'draft',
        category: accessoryCategory._id,
        images: [],
        shortDescription: 'Test Pixel Buds',
        condition: 'new'
      }
    ];

    for (const data of productData) {
      const product = new Product(data);
      await product.save();
      testProducts.push(product);
    }
  }, 30000);

  afterAll(async () => {
    // Clean up test data
    if (testProducts.length > 0) {
      await Product.deleteMany({ _id: { $in: testProducts.map(p => p._id) } });
    }
    if (testCategories.length > 0) {
      await Category.deleteMany({ _id: { $in: testCategories.map(c => c._id) } });
    }
    if (adminUser) {
      await User.deleteOne({ _id: adminUser._id });
    }
  });

  describe('GET /api/admin/products', () => {
    it('should fetch all products successfully', async () => {
      const response = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
      expect(response.body.data.products.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.totalItems).toBeGreaterThanOrEqual(3);
    });

    it('should require admin authentication', async () => {
      const response = await request(app)
        .get('/api/admin/products')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject non-admin users', async () => {
      // Create regular user
      const regularUser = new User({
        firstName: 'Regular',
        lastName: 'User',
        email: 'regular.products@test.com',
        password: 'TestPass123!',
        role: 'customer',
        emailVerified: true
      });
      await regularUser.save();

      const userToken = jwt.sign(
        { 
          userId: regularUser._id,
          role: regularUser.role,
          email: regularUser.email
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);

      await User.deleteOne({ _id: regularUser._id });
    });

    it('should search by product name', async () => {
      const response = await request(app)
        .get('/api/admin/products?searchQuery=Pixel%207')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data.products.every(p => 
        p.name.toLowerCase().includes('pixel 7') || 
        p.sku.toLowerCase().includes('pixel 7')
      )).toBe(true);
    });

    it('should search by SKU', async () => {
      const response = await request(app)
        .get('/api/admin/products?searchQuery=GP7-TEST')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.length).toBe(1);
      expect(response.body.data.products[0].sku).toBe('GP7-TEST-001');
    });

    it('should filter by category', async () => {
      const smartphoneCategory = testCategories.find(c => c.slug === 'smartphones');
      const response = await request(app)
        .get(`/api/admin/products?category=${smartphoneCategory._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data.products.every(p => p.category === smartphoneCategory._id.toString())).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/admin/products?status=draft')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.products.every(p => p.status === 'draft')).toBe(true);
    });

    it('should filter by price range', async () => {
      const response = await request(app)
        .get('/api/admin/products?minPrice=500&maxPrice=700')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const prices = response.body.data.products.map(p => p.price);
      expect(prices.every(price => price >= 500 && price <= 700)).toBe(true);
    });

    it('should filter by stock status - out of stock', async () => {
      const response = await request(app)
        .get('/api/admin/products?stockStatus=out_of_stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.products.every(p => p.stockQuantity === 0)).toBe(true);
    });

    it('should filter by stock status - low stock', async () => {
      const response = await request(app)
        .get('/api/admin/products?stockStatus=low_stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.products.every(p => 
        p.stockQuantity > 0 && p.stockQuantity <= 10
      )).toBe(true);
    });

    it('should sort by price ascending', async () => {
      const response = await request(app)
        .get('/api/admin/products?sortBy=price&sortOrder=asc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const prices = response.body.data.products.map(p => p.price);
      const sortedPrices = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sortedPrices);
    });

    it('should paginate results correctly', async () => {
      const response = await request(app)
        .get('/api/admin/products?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.itemsPerPage).toBe(2);
      expect(response.body.data.pagination.totalPages).toBeGreaterThanOrEqual(2);
    });

    it('should handle combined filters', async () => {
      const smartphoneCategory = testCategories.find(c => c.slug === 'smartphones');
      const response = await request(app)
        .get(`/api/admin/products?category=${smartphoneCategory._id}&status=active&minPrice=500`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.every(p => 
        p.category === smartphoneCategory._id.toString() && 
        p.status === 'active' && 
        p.price >= 500
      )).toBe(true);
    });
  });
});