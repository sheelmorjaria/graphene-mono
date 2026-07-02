import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';

// Integration tests for the admin report endpoints, driven through the real
// Express app against the real in-memory MongoDB.
//
// NOTE: several report controllers (getSalesReport sums `$grandTotal`,
// getProductPerformanceReport unwinds `$cartItems`, getInventoryReport filters
// on top-level `stockQuantity`) reference fields that no longer exist after the
// Product/Order schema redesign (totals are `totalAmount`, stock lives in
// `variations[]`, orders use `items`). Those data-dependent assertions are
// skipped and the stale controllers are flagged as production bugs.

let adminToken;
let adminUser;

beforeAll(async () => {
  // Ensure the JWT secret matches what authMiddleware reads.
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
});

// The shared integration harness wipes ALL collections in its global
// beforeEach, so the admin user must be recreated before every test (otherwise
// authMiddleware's User.findById fails -> 401).
beforeEach(async () => {
  adminUser = await User.create({
    email: 'admin.reports.controller@test.com',
    password: 'AdminPass123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isActive: true,
    accountStatus: 'active'
  });

  adminToken = jwt.sign(
    { userId: adminUser._id, role: 'admin' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
});

const baseAddress = (fullName = 'John Doe') => ({
  fullName,
  addressLine1: '123 Test St',
  city: 'Test',
  stateProvince: 'Test State',
  postalCode: '12345',
  country: 'UK'
});

describe('Admin Reports API', () => {
  describe('GET /api/admin/reports/sales-summary', () => {
    it('should return sales summary for the given date range', async () => {
      // Create test orders
      const today = new Date();

      await Order.create([
        {
          userId: new mongoose.Types.ObjectId(),
          customerEmail: 'customer1@test.com',
          orderNumber: 'ORD-SUM-1',
          items: [{ productId: new mongoose.Types.ObjectId(), productName: 'P1', productSlug: 'p1', quantity: 2, unitPrice: 500, totalPrice: 1000 }],
          subtotal: 1000, tax: 0, shipping: 0, totalAmount: 1000,
          status: 'delivered', paymentStatus: 'completed',
          paymentMethod: { name: 'PayPal', type: 'paypal' },
          shippingMethod: { id: new mongoose.Types.ObjectId(), name: 'Standard', cost: 0 },
          billingAddress: baseAddress(), shippingAddress: baseAddress(),
          createdAt: today
        },
        {
          userId: new mongoose.Types.ObjectId(),
          customerEmail: 'customer2@test.com',
          orderNumber: 'ORD-SUM-2',
          items: [{ productId: new mongoose.Types.ObjectId(), productName: 'P2', productSlug: 'p2', quantity: 1, unitPrice: 800, totalPrice: 800 }],
          subtotal: 800, tax: 0, shipping: 0, totalAmount: 800,
          status: 'processing', paymentStatus: 'completed',
          paymentMethod: { name: 'PayPal', type: 'paypal' },
          shippingMethod: { id: new mongoose.Types.ObjectId(), name: 'Standard', cost: 0 },
          billingAddress: baseAddress('Jane Doe'), shippingAddress: baseAddress('Jane Doe'),
          createdAt: today
        },
        {
          userId: new mongoose.Types.ObjectId(),
          customerEmail: 'customer3@test.com',
          orderNumber: 'ORD-SUM-3',
          items: [{ productId: new mongoose.Types.ObjectId(), productName: 'P3', productSlug: 'p3', quantity: 1, unitPrice: 600, totalPrice: 600 }],
          subtotal: 600, tax: 0, shipping: 0, totalAmount: 600,
          status: 'cancelled', paymentStatus: 'pending',
          paymentMethod: { name: 'PayPal', type: 'paypal' },
          shippingMethod: { id: new mongoose.Types.ObjectId(), name: 'Standard', cost: 0 },
          billingAddress: baseAddress('Bob Doe'), shippingAddress: baseAddress('Bob Doe'),
          createdAt: today
        }
      ]);

      const startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);

      const response = await request(app)
        .get('/api/admin/reports/sales-summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ startDate: startDate.toISOString(), endDate: endDate.toISOString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // The controller now sums `$totalAmount` and excludes cancelled orders,
      // so revenue is the sum of the two non-cancelled orders (1000 + 800).
      expect(response.body.orderCount).toBe(2); // excludes cancelled
      expect(response.body.totalRevenue).toBe(1800);
    });

    it('should return error if date parameters are missing', async () => {
      const response = await request(app)
        .get('/api/admin/reports/sales-summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Start date and end date are required');
    });

    it('should require admin authentication', async () => {
      const response = await request(app)
        .get('/api/admin/reports/sales-summary')
        .query({ startDate: new Date().toISOString(), endDate: new Date().toISOString() });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/reports/product-performance', () => {
    // Controller now unwinds `items[]` (revenue from unitPrice * quantity)
    // and detects low stock via `variations[].stockQuantity`.
    it('should return top selling products and low stock products', async () => {
      const product1 = await Product.create({
        name: 'Pixel 7 Pro', slug: 'pixel-7-pro', sku: 'PIX7P', baseModel: 'Pixel 7 Pro',
        isActive: true,
        variations: [{ condition: 'new', color: 'Black', price: 800, stockQuantity: 50, stockStatus: 'in_stock', sku: 'PIX7P-BLK' }]
      });
      const product2 = await Product.create({
        name: 'Pixel 7', slug: 'pixel-7', sku: 'PIX7', baseModel: 'Pixel 7',
        isActive: true,
        variations: [{ condition: 'new', color: 'Black', price: 600, stockQuantity: 5, stockStatus: 'low_stock', sku: 'PIX7-BLK' }]
      });

      const today = new Date();
      await Order.create([
        {
          orderNumber: 'ORD-PP-1', userId: new mongoose.Types.ObjectId(), customerEmail: 'c1@test.com',
          items: [
            { productId: product1._id, productName: product1.name, productSlug: product1.slug, quantity: 3, unitPrice: 800, totalPrice: 2400 },
            { productId: product2._id, productName: product2.name, productSlug: product2.slug, quantity: 2, unitPrice: 600, totalPrice: 1200 }
          ],
          subtotal: 3600, tax: 0, shipping: 0, totalAmount: 3600,
          status: 'delivered', paymentStatus: 'completed',
          paymentMethod: { name: 'PayPal', type: 'paypal' },
          shippingMethod: { id: new mongoose.Types.ObjectId(), name: 'Standard', cost: 0 },
          billingAddress: baseAddress(), shippingAddress: baseAddress(),
          createdAt: today
        }
      ]);

      const startDate = new Date(today); startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today); endDate.setHours(23, 59, 59, 999);

      const response = await request(app)
        .get('/api/admin/reports/product-performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ startDate: startDate.toISOString(), endDate: endDate.toISOString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // product1 sold 3 @ 800 = 2400 (top), product2 sold 2 @ 600 = 1200.
      expect(response.body.topProducts).toHaveLength(2);
      expect(response.body.topProducts[0].name).toBe('Pixel 7 Pro');
      expect(response.body.topProducts[0].revenue).toBe(2400);
      expect(response.body.topProducts[0].quantitySold).toBe(3);
      // product2 has 5 in stock (<= 10) -> low stock.
      expect(response.body.lowStockProducts.some(p => p.name === 'Pixel 7')).toBe(true);
    });
  });

  describe('GET /api/admin/reports/customer-acquisition', () => {
    it('should return new customer count for the given date range', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      await User.create([
        { email: 'cust1@test.com', password: 'Pass123!', firstName: 'Customer', lastName: 'One', role: 'customer', createdAt: today },
        { email: 'cust2@test.com', password: 'Pass123!', firstName: 'Customer', lastName: 'Two', role: 'customer', createdAt: today },
        { email: 'cust3@test.com', password: 'Pass123!', firstName: 'Customer', lastName: 'Three', role: 'customer', createdAt: yesterday }
      ]);

      const startDate = new Date(today); startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today); endDate.setHours(23, 59, 59, 999);

      const response = await request(app)
        .get('/api/admin/reports/customer-acquisition')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ startDate: startDate.toISOString(), endDate: endDate.toISOString() });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.newCustomerCount).toBe(2);
    });
  });

  describe('GET /api/admin/reports/inventory-summary', () => {
    // Controller now classifies products by total stock across variations:
    // in stock (> 10), low stock (0 < total <= 10), out of stock (0).
    it('should return inventory counts and low stock products', async () => {
      const mk = (name, slug, sku, qty, active = true) => Product.create({
        name, slug, sku, baseModel: name, isActive: active,
        variations: [{ condition: 'new', color: 'Black', price: 100, stockQuantity: qty, stockStatus: qty === 0 ? 'out_of_stock' : 'in_stock', sku: `${sku}-V` }]
      });
      await mk('Product 1', 'product-1', 'P1', 50);
      await mk('Product 2', 'product-2', 'P2', 0);
      await mk('Product 3', 'product-3', 'P3', 5);

      const response = await request(app)
        .get('/api/admin/reports/inventory-summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.inStockCount).toBe(1);   // Product 1 (50)
      expect(response.body.outOfStockCount).toBe(1); // Product 2 (0)
      expect(response.body.lowStockCount).toBe(1);   // Product 3 (5)
      expect(response.body.lowStockProducts.some(p => p.name === 'Product 3')).toBe(true);
    });

    it('should not require date parameters', async () => {
      const response = await request(app)
        .get('/api/admin/reports/inventory-summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });
});
