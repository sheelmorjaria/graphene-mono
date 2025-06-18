import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import adminRoutes from '../admin.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';

let app;
let adminToken;
let userToken;
let adminUser;
let regularUser;

beforeAll(async () => {
  // Set JWT secret for tests
  process.env.JWT_SECRET = 'test-secret';
  
  app = express();
  app.use(express.json());
  app.use('/api/admin', adminRoutes);

  // Create admin user
  adminUser = await User.create({
    email: 'admin.reports@test.com',
    password: 'AdminPass123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    accountStatus: 'active'
  });

  // Create regular user
  regularUser = await User.create({
    email: 'user.reports@test.com',
    password: 'UserPass123!',
    firstName: 'Regular',
    lastName: 'User',
    role: 'customer',
    accountStatus: 'active'
  });

  adminToken = jwt.sign(
    { userId: adminUser._id, role: 'admin' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '24h' }
  );

  userToken = jwt.sign(
    { userId: regularUser._id, role: 'customer' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '24h' }
  );
});

afterAll(async () => {
  // Clean up users
  await User.deleteMany({ email: { $in: ['admin.reports@test.com', 'user.reports@test.com'] } });
});

describe('Admin Reports Integration Tests', () => {
  beforeEach(async () => {
    await Order.deleteMany({});
    await Product.deleteMany({});
  });

  describe('Report Access Control', () => {
    it('should deny access to reports for non-admin users', async () => {
      const endpoints = [
        '/api/admin/reports/sales-summary',
        '/api/admin/reports/product-performance',
        '/api/admin/reports/customer-acquisition',
        '/api/admin/reports/inventory-summary'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${userToken}`)
          .query({
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString()
          });

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Admin access required');
      }
    });

    it('should deny access to reports without authentication', async () => {
      const endpoints = [
        '/api/admin/reports/sales-summary',
        '/api/admin/reports/product-performance',
        '/api/admin/reports/customer-acquisition',
        '/api/admin/reports/inventory-summary'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .query({
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString()
          });

        expect(response.status).toBe(401);
      }
    });
  });

  describe('Comprehensive Report Data', () => {
    it('should generate accurate reports with complex data', async () => {
      // Create products
      const products = await Product.create([
        { name: 'Pixel 8 Pro', slug: 'pixel-8-pro', sku: 'PIX8P', price: 999, stockQuantity: 25, isActive: true },
        { name: 'Pixel 8', slug: 'pixel-8', sku: 'PIX8', price: 699, stockQuantity: 5, isActive: true },
        { name: 'Pixel 7a', slug: 'pixel-7a', sku: 'PIX7A', price: 499, stockQuantity: 0, isActive: true },
        { name: 'Pixel Fold', slug: 'pixel-fold', sku: 'PIXF', price: 1799, stockQuantity: 3, isActive: true }
      ]);

      // Create orders over different dates
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      await Order.create([
        // Today's orders
        {
          userId: new mongoose.Types.ObjectId(),
          cartItems: [
            { product: products[0]._id, quantity: 2, price: 999 },
            { product: products[1]._id, quantity: 1, price: 699 }
          ],
          grandTotal: 2697,
          orderStatus: 'completed',
          createdAt: today
        },
        {
          userId: new mongoose.Types.ObjectId(),
          cartItems: [
            { product: products[3]._id, quantity: 1, price: 1799 }
          ],
          grandTotal: 1799,
          orderStatus: 'processing',
          createdAt: today
        },
        // Yesterday's order
        {
          userId: new mongoose.Types.ObjectId(),
          cartItems: [
            { product: products[1]._id, quantity: 3, price: 699 }
          ],
          grandTotal: 2097,
          orderStatus: 'completed',
          createdAt: yesterday
        },
        // Last week's order
        {
          userId: new mongoose.Types.ObjectId(),
          cartItems: [
            { product: products[0]._id, quantity: 1, price: 999 }
          ],
          grandTotal: 999,
          orderStatus: 'completed',
          createdAt: lastWeek
        },
        // Cancelled order (should not be included)
        {
          userId: new mongoose.Types.ObjectId(),
          cartItems: [
            { product: products[2]._id, quantity: 2, price: 499 }
          ],
          grandTotal: 998,
          orderStatus: 'cancelled',
          createdAt: today
        }
      ]);

      // Test sales report for today
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const salesResponse = await request(app)
        .get('/api/admin/reports/sales-summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: todayStart.toISOString(),
          endDate: todayEnd.toISOString()
        });

      expect(salesResponse.status).toBe(200);
      expect(salesResponse.body.totalRevenue).toBe(4496); // 2697 + 1799
      expect(salesResponse.body.orderCount).toBe(2);
      expect(salesResponse.body.averageOrderValue).toBe(2248);

      // Test product performance report
      const productResponse = await request(app)
        .get('/api/admin/reports/product-performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: todayStart.toISOString(),
          endDate: todayEnd.toISOString()
        });

      expect(productResponse.status).toBe(200);
      expect(productResponse.body.topProducts).toHaveLength(3); // 3 products sold today
      expect(productResponse.body.topProducts[0].name).toBe('Pixel 8 Pro');
      expect(productResponse.body.topProducts[0].revenue).toBe(1998);
      expect(productResponse.body.lowStockProducts).toHaveLength(2); // Pixel 8 and Pixel Fold

      // Test inventory report
      const inventoryResponse = await request(app)
        .get('/api/admin/reports/inventory-summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(inventoryResponse.status).toBe(200);
      expect(inventoryResponse.body.inStockCount).toBe(1); // Only Pixel 8 Pro > 10
      expect(inventoryResponse.body.outOfStockCount).toBe(1); // Pixel 7a
      expect(inventoryResponse.body.lowStockCount).toBe(2); // Pixel 8 and Pixel Fold
    });
  });

  describe('Date Range Validation', () => {
    it('should handle various date formats correctly', async () => {
      const validDates = [
        {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-31T23:59:59.999Z'
        },
        {
          startDate: new Date('2024-01-01').toISOString(),
          endDate: new Date('2024-01-31').toISOString()
        }
      ];

      for (const dates of validDates) {
        const response = await request(app)
          .get('/api/admin/reports/sales-summary')
          .set('Authorization', `Bearer ${adminToken}`)
          .query(dates);

        expect(response.status).toBe(200);
      }
    });
  });
});