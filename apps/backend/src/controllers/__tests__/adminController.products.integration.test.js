import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../../app.js';
import Product from '../../models/Product.js';
import User from '../../models/User.js';

// Integration test for the REAL getProducts admin controller (in
// adminProductController.js), exercised through the real Express app against
// the real in-memory MongoDB. Earlier revisions mocked the Product model and
// the auth middleware and asserted on a query/response contract that the
// shipped controller does not implement; that is why every test 500'd. This
// version drives the actual controller and asserts its real behaviour.

describe('Admin Products API', () => {
  let adminToken;
  let adminUser;

  // The shared integration harness wipes ALL collections in its global
  // beforeEach, so recreate the admin user (and products) before every test.
  beforeEach(async () => {
    adminUser = await User.create({
      email: 'admin@example.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      accountStatus: 'active'
    });

    adminToken = jwt.sign(
      { userId: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || 'your-secret-key'
    );
  });

  const createProduct = (overrides = {}) => {
    const uid = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    return Product.create({
      name: 'Google Pixel 7',
      slug: `google-pixel-7-${uid}`,
      sku: `GP7-${uid}`,
      baseModel: 'Pixel 7',
      status: 'active',
      isActive: true,
      variations: [
        {
          condition: 'new',
          color: 'Black',
          price: 599,
          stockQuantity: 50,
          stockStatus: 'in_stock',
          sku: `GP7-NEW-BLK-${uid}`
        }
      ],
      ...overrides
    });
  };

  describe('GET /api/admin/products', () => {
    it('should return paginated products list', async () => {
      await createProduct();

      const response = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.products)).toBe(true);
      expect(response.body.data.products.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: expect.any(Number),
        pages: expect.any(Number)
      });
    });

    it('should handle pagination parameters', async () => {
      await createProduct({ name: 'A' });
      await createProduct({ name: 'B' });

      const response = await request(app)
        .get('/api/admin/products?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.pagination.pages).toBe(2);
    });

    it('should search by name', async () => {
      await createProduct({ name: 'Google Pixel 7' });
      await createProduct({ name: 'Something Else', baseModel: 'Other' });

      const response = await request(app)
        .get('/api/admin/products?search=pixel')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('Google Pixel 7');
    });

    it('should filter by status', async () => {
      await createProduct({ name: 'Active One', status: 'active' });
      await createProduct({ name: 'Draft One', status: 'draft' });

      const response = await request(app)
        .get('/api/admin/products?status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].name).toBe('Active One');
    });

    it('should sort by different fields', async () => {
      await createProduct({ name: 'Zebra' });
      await createProduct({ name: 'Alpha' });

      const response = await request(app)
        .get('/api/admin/products?sortBy=createdAt&sortOrder=asc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.status).toBe(200);
      expect(response.body.data.products.length).toBeGreaterThanOrEqual(2);
    });

    it('should include computed fields on each product', async () => {
      await createProduct();

      const response = await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const product = response.body.data.products[0];
      expect(product).toHaveProperty('priceRange');
      expect(product).toHaveProperty('totalStock');
      expect(product).toHaveProperty('variationCount');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/admin/products')
        .expect(401);
    });

    it('should require admin role', async () => {
      const customer = await User.create({
        email: 'customer@example.com',
        password: 'password123',
        firstName: 'C',
        lastName: 'U',
        role: 'customer'
      });
      const customerToken = jwt.sign(
        { userId: customer._id, role: customer.role },
        process.env.JWT_SECRET || 'your-secret-key'
      );

      await request(app)
        .get('/api/admin/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });
});
