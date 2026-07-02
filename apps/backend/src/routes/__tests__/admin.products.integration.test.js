import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../server.js';
import User from '../../models/User.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import jwt from 'jsonwebtoken';

// Helper to build a valid product document (baseModel + variations required)
const buildProduct = (overrides = {}) => ({
  baseModel: 'Pixel 7',
  variations: [
    {
      condition: 'new',
      color: 'Obsidian',
      storage: '128GB',
      price: 599,
      stockQuantity: 50,
      stockStatus: 'in_stock',
      sku: 'VAR-DEFAULT-001'
    }
  ],
  ...overrides
});

describe('Admin Products API Integration Tests', () => {
  let adminUser;
  let adminToken;
  let testCategories;

  // The integration harness wipes all collections in its own beforeEach, so we
  // must (re)seed categories + admin user + products before EVERY test.
  beforeEach(async () => {
    // Create test categories first
    const smartphoneCategory = new Category({
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Test smartphone category'
    });
    await smartphoneCategory.save();

    const accessoryCategory = new Category({
      name: 'Accessories',
      slug: 'accessories',
      description: 'Test accessory category'
    });
    await accessoryCategory.save();
    testCategories = [smartphoneCategory, accessoryCategory];

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

    // Create test products (real schema: baseModel + variations)
    const productData = [
      buildProduct({
        name: 'Google Pixel 7',
        slug: 'google-pixel-7-test',
        sku: 'GP7-TEST-001',
        status: 'active',
        category: smartphoneCategory._id,
        images: ['https://example.com/pixel7.jpg'],
        shortDescription: 'Test Pixel 7',
        variations: [
          {
            condition: 'new',
            color: 'Obsidian',
            storage: '128GB',
            price: 599,
            stockQuantity: 50,
            stockStatus: 'in_stock',
            sku: 'GP7-TEST-001-V1'
          }
        ]
      }),
      buildProduct({
        name: 'Google Pixel 7 Pro',
        slug: 'google-pixel-7-pro-test',
        sku: 'GP7P-TEST-001',
        status: 'active',
        category: smartphoneCategory._id,
        images: ['https://example.com/pixel7pro.jpg'],
        shortDescription: 'Test Pixel 7 Pro',
        variations: [
          {
            condition: 'new',
            color: 'Obsidian',
            storage: '128GB',
            price: 899,
            stockQuantity: 0,
            stockStatus: 'out_of_stock',
            sku: 'GP7P-TEST-001-V1'
          }
        ]
      }),
      buildProduct({
        name: 'Pixel Buds Pro',
        slug: 'pixel-buds-pro-test',
        sku: 'PBP-TEST-001',
        status: 'draft',
        category: accessoryCategory._id,
        images: [],
        shortDescription: 'Test Pixel Buds',
        variations: [
          {
            condition: 'new',
            color: 'Charcoal',
            storage: '',
            price: 199,
            stockQuantity: 5,
            stockStatus: 'low_stock',
            sku: 'PBP-TEST-001-V1'
          }
        ]
      })
    ];

    for (const data of productData) {
      await Product.create(data);
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
      expect(response.body.data.products.length).toBeGreaterThanOrEqual(3);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.total).toBeGreaterThanOrEqual(3);
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
    });

    it('should search by product name', async () => {
      const response = await request(app)
        .get('/api/admin/products?search=Pixel%207')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.length).toBeGreaterThanOrEqual(2);
      response.body.data.products.every(p =>
        p.name.toLowerCase().includes('pixel 7') ||
        (p.baseModel && p.baseModel.toLowerCase().includes('pixel 7'))
      );
    });

    it('should search by SKU', async () => {
      const response = await request(app)
        .get('/api/admin/products?search=GP7-TEST')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // GP7-TEST matches only the Pixel 7 SKU prefix (not the Pro)
      expect(response.body.data.products.length).toBe(1);
    });

    it('should filter by category', async () => {
      const smartphoneCategory = testCategories.find(c => c.slug === 'smartphones');
      const response = await request(app)
        .get(`/api/admin/products?category=${smartphoneCategory._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.length).toBeGreaterThanOrEqual(2);
      // category is populated in the response
      expect(response.body.data.products.every(p =>
        (p.category && p.category._id) === smartphoneCategory._id.toString() ||
        (p.category && p.category._id.toString() === smartphoneCategory._id.toString())
      )).toBe(true);
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

    it('should sort products by creation date ascending', async () => {
      const response = await request(app)
        .get('/api/admin/products?sortBy=createdAt&sortOrder=asc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const dates = response.body.data.products.map(p => new Date(p.createdAt).getTime());
      const sortedDates = [...dates].sort((a, b) => a - b);
      expect(dates).toEqual(sortedDates);
    });

    it('should paginate results correctly', async () => {
      const response = await request(app)
        .get('/api/admin/products?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.length).toBeLessThanOrEqual(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.pages).toBeGreaterThanOrEqual(2);
    });

    it('should handle combined filters', async () => {
      const smartphoneCategory = testCategories.find(c => c.slug === 'smartphones');
      const response = await request(app)
        .get(`/api/admin/products?category=${smartphoneCategory._id}&status=active`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products.every(p =>
        p.status === 'active'
      )).toBe(true);
    });
  });
});
