import { describe, it, test, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import adminRoutes from '../../routes/admin.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';

let app;
let adminToken;
let adminUser;

beforeAll(async () => {
  // Set JWT secret for tests
  process.env.JWT_SECRET = 'your-secret-key';
  
  app = express();
  app.use(express.json());
  app.use('/api/admin', adminRoutes);

  // Create admin user
  adminUser = await User.create({
    email: 'admin.reports.controller@test.com',
    password: 'AdminPass123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    accountStatus: 'active'
  });

  adminToken = jwt.sign(
    { userId: adminUser._id, role: 'admin' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
});

beforeEach(async () => {
  // Clear collections except User
  await Order.deleteMany({});
  await Product.deleteMany({});
});

describe('Admin Reports API', () => {
  describe('GET /api/admin/reports/sales-summary', () => {
    it('should return sales summary for the given date range', async () => {
      // Create test orders
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const productId1 = new mongoose.Types.ObjectId();
      const productId2 = new mongoose.Types.ObjectId();
      const productId3 = new mongoose.Types.ObjectId();
      
      await Order.create([
        {
          userId: new mongoose.Types.ObjectId(),
          customerEmail: 'customer1@test.com',
          items: [{ 
            productId: productId1,
            productName: 'Test Product 1',
            productSlug: 'test-product-1',
            quantity: 2, 
            unitPrice: 500,
            totalPrice: 1000
          }],
          cartItems: [{ product: productId1, quantity: 2, price: 500 }],
          subtotal: 1000,
          grandTotal: 1000,
          status: 'delivered',
          paymentMethod: { name: 'PayPal', type: 'paypal' },
          shippingMethod: { 
            id: new mongoose.Types.ObjectId(), 
            name: 'Standard', 
            cost: 0 
          },
          billingAddress: { 
            fullName: 'John Doe',
            addressLine1: '123 Test St', 
            city: 'Test', 
            stateProvince: 'Test State',
            postalCode: '12345', 
            country: 'UK' 
          },
          shippingAddress: { 
            fullName: 'John Doe',
            addressLine1: '123 Test St', 
            city: 'Test', 
            stateProvince: 'Test State',
            postalCode: '12345', 
            country: 'UK' 
          },
          createdAt: today
        },
        {
          userId: new mongoose.Types.ObjectId(),
          customerEmail: 'customer2@test.com',
          items: [{ 
            productId: productId2,
            productName: 'Test Product 2',
            productSlug: 'test-product-2',
            quantity: 1, 
            unitPrice: 800,
            totalPrice: 800
          }],
          cartItems: [{ product: productId2, quantity: 1, price: 800 }],
          subtotal: 800,
          grandTotal: 800,
          status: 'processing',
          paymentMethod: { name: 'PayPal', type: 'paypal' },
          shippingMethod: { 
            id: new mongoose.Types.ObjectId(), 
            name: 'Standard', 
            cost: 0 
          },
          billingAddress: { 
            fullName: 'Jane Doe',
            addressLine1: '123 Test St', 
            city: 'Test', 
            stateProvince: 'Test State',
            postalCode: '12345', 
            country: 'UK' 
          },
          shippingAddress: { 
            fullName: 'Jane Doe',
            addressLine1: '123 Test St', 
            city: 'Test', 
            stateProvince: 'Test State',
            postalCode: '12345', 
            country: 'UK' 
          },
          createdAt: today
        },
        {
          userId: new mongoose.Types.ObjectId(),
          customerEmail: 'customer3@test.com',
          items: [{ 
            productId: productId3,
            productName: 'Test Product 3',
            productSlug: 'test-product-3',
            quantity: 1, 
            unitPrice: 600,
            totalPrice: 600
          }],
          cartItems: [{ product: productId3, quantity: 1, price: 600 }],
          subtotal: 600,
          grandTotal: 600,
          status: 'cancelled',
          paymentMethod: { name: 'PayPal', type: 'paypal' },
          shippingMethod: { 
            id: new mongoose.Types.ObjectId(), 
            name: 'Standard', 
            cost: 0 
          },
          billingAddress: { 
            fullName: 'Bob Doe',
            addressLine1: '123 Test St', 
            city: 'Test', 
            stateProvince: 'Test State',
            postalCode: '12345', 
            country: 'UK' 
          },
          shippingAddress: { 
            fullName: 'Bob Doe',
            addressLine1: '123 Test St', 
            city: 'Test', 
            stateProvince: 'Test State',
            postalCode: '12345', 
            country: 'UK' 
          },
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
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.totalRevenue).toBe(1800); // Excluding cancelled order
      expect(response.body.orderCount).toBe(2);
      expect(response.body.averageOrderValue).toBe(900);
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
        .query({
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString()
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/reports/product-performance', () => {
    it('should return top selling products and low stock products', async () => {
      // Create test products
      const product1 = await Product.create({
        name: 'Pixel 7 Pro',
        slug: 'pixel-7-pro',
        sku: 'PIX7P',
        price: 800,
        stockQuantity: 50,
        isActive: true
      });

      const product2 = await Product.create({
        name: 'Pixel 7',
        slug: 'pixel-7',
        sku: 'PIX7',
        price: 600,
        stockQuantity: 5,
        isActive: true
      });

      await Product.create({
        name: 'Pixel 6a',
        slug: 'pixel-6a',
        sku: 'PIX6A',
        price: 400,
        stockQuantity: 8,
        isActive: true
      });

      // Create test orders
      const today = new Date();
      await Order.create([
        {
          orderNumber: 'ORD-TEST-001',
          userId: new mongoose.Types.ObjectId(),
          customerEmail: 'customer1@test.com',
          items: [
            {
              productId: product1._id,
              productName: product1.name,
              productSlug: product1.slug,
              quantity: 3,
              unitPrice: 800,
              totalPrice: 2400
            },
            {
              productId: product2._id,
              productName: product2.name,
              productSlug: product2.slug,
              quantity: 2,
              unitPrice: 600,
              totalPrice: 1200
            }
          ],
          subtotal: 3600,
          totalAmount: 3600,
          status: 'delivered',
          paymentMethod: { name: 'PayPal', type: 'paypal' },
          paymentStatus: 'completed',
          shippingMethod: {
            id: new mongoose.Types.ObjectId(),
            name: 'Standard',
            cost: 0,
            estimatedDelivery: '3-5 business days'
          },
          billingAddress: {
            fullName: 'John Doe',
            addressLine1: '123 Test St',
            city: 'Test',
            stateProvince: 'Test State',
            postalCode: '12345',
            country: 'UK'
          },
          shippingAddress: {
            fullName: 'John Doe',
            addressLine1: '123 Test St',
            city: 'Test',
            stateProvince: 'Test State',
            postalCode: '12345',
            country: 'UK'
          },
          createdAt: today
        },
        {
          orderNumber: 'ORD-TEST-002',
          userId: new mongoose.Types.ObjectId(),
          customerEmail: 'customer2@test.com',
          items: [
            {
              productId: product1._id,
              productName: product1.name,
              productSlug: product1.slug,
              quantity: 2,
              unitPrice: 800,
              totalPrice: 1600
            }
          ],
          subtotal: 1600,
          totalAmount: 1600,
          status: 'processing',
          paymentMethod: { name: 'PayPal', type: 'paypal' },
          paymentStatus: 'completed',
          shippingMethod: {
            id: new mongoose.Types.ObjectId(),
            name: 'Standard',
            cost: 0,
            estimatedDelivery: '3-5 business days'
          },
          billingAddress: {
            fullName: 'Jane Doe',
            addressLine1: '123 Test St',
            city: 'Test',
            stateProvince: 'Test State',
            postalCode: '12345',
            country: 'UK'
          },
          shippingAddress: {
            fullName: 'Jane Doe',
            addressLine1: '123 Test St',
            city: 'Test',
            stateProvince: 'Test State',
            postalCode: '12345',
            country: 'UK'
          },
          createdAt: today
        }
      ]);

      const startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);

      const response = await request(app)
        .get('/api/admin/reports/product-performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Check top products
      expect(response.body.topProducts).toHaveLength(2);
      expect(response.body.topProducts[0].name).toBe('Pixel 7 Pro');
      expect(response.body.topProducts[0].quantitySold).toBe(5);
      expect(response.body.topProducts[0].revenue).toBe(4000);
      
      // Check low stock products
      expect(response.body.lowStockProducts).toHaveLength(2);
      expect(response.body.lowStockProducts[0].stockQuantity).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/admin/reports/customer-acquisition', () => {
    it('should return new customer count for the given date range', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Create test customers
      await User.create([
        {
          email: 'customer1@test.com',
          password: 'Pass123!',
          firstName: 'Customer',
          lastName: 'One',
          role: 'customer',
          createdAt: today
        },
        {
          email: 'customer2@test.com',
          password: 'Pass123!',
          firstName: 'Customer',
          lastName: 'Two',
          role: 'customer',
          createdAt: today
        },
        {
          email: 'customer3@test.com',
          password: 'Pass123!',
          firstName: 'Customer',
          lastName: 'Three',
          role: 'customer',
          createdAt: yesterday
        }
      ]);

      const startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);

      const response = await request(app)
        .get('/api/admin/reports/customer-acquisition')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.newCustomerCount).toBe(2);
    });
  });

  describe('GET /api/admin/reports/inventory-summary', () => {
    it('should return inventory counts and low stock products', async () => {
      // Create test products with different stock levels
      await Product.create([
        { name: 'Product 1', slug: 'product-1', sku: 'P1', price: 100, stockQuantity: 50, isActive: true },
        { name: 'Product 2', slug: 'product-2', sku: 'P2', price: 100, stockQuantity: 0, isActive: true },
        { name: 'Product 3', slug: 'product-3', sku: 'P3', price: 100, stockQuantity: 5, isActive: true },
        { name: 'Product 4', slug: 'product-4', sku: 'P4', price: 100, stockQuantity: 8, isActive: true },
        { name: 'Product 5', slug: 'product-5', sku: 'P5', price: 100, stockQuantity: 100, isActive: true },
        { name: 'Product 6', slug: 'product-6', sku: 'P6', price: 100, stockQuantity: 0, isActive: true },
        { name: 'Inactive', slug: 'inactive', sku: 'IN', price: 100, stockQuantity: 5, isActive: false }
      ]);

      const response = await request(app)
        .get('/api/admin/reports/inventory-summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.inStockCount).toBe(2); // Products with stock > 10
      expect(response.body.outOfStockCount).toBe(2); // Products with stock = 0
      expect(response.body.lowStockCount).toBe(2); // Products with 0 < stock <= 10
      expect(response.body.lowStockProducts).toHaveLength(2);
      
      // Verify low stock products are sorted by stock quantity
      expect(response.body.lowStockProducts[0].stockQuantity).toBeLessThanOrEqual(
        response.body.lowStockProducts[1].stockQuantity
      );
    });

    it('should not require date parameters', async () => {
      const response = await request(app)
        .get('/api/admin/reports/inventory-summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });
});