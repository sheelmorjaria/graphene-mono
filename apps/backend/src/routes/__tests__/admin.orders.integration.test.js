import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../../../server.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';

describe('Admin Orders API Integration Tests', () => {
  let adminToken;
  let adminUser;
  const testOrders = [];
  const testUsers = [];

  beforeAll(async () => {
    // Create admin user
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'adminpass123',
      role: 'admin',
      isActive: true,
      accountStatus: 'active'
    });
    await adminUser.save();

    // Generate admin token with correct payload structure
    adminToken = jwt.sign(
      { 
        userId: adminUser._id.toString()
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );

    // Create test customers
    const customer1 = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      password: 'password123',
      role: 'customer'
    });

    const customer2 = new User({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@test.com',
      password: 'password123',
      role: 'customer'
    });

    await customer1.save();
    await customer2.save();
    testUsers.push(customer1, customer2);

    // Create test orders
    const order1 = new Order({
      orderNumber: 'ORD-001',
      userId: customer1._id,
      customerEmail: customer1.email,
      status: 'pending',
      subtotal: 999.99,
      tax: 0,
      shipping: 0,
      totalAmount: 999.99,
      items: [{
        productId: new mongoose.Types.ObjectId(),
        productName: 'Google Pixel 8',
        productSlug: 'google-pixel-8',
        quantity: 1,
        unitPrice: 999.99,
        totalPrice: 999.99
      }],
      shippingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Test St',
        city: 'London',
        stateProvince: 'London',
        postalCode: 'SW1A 1AA',
        country: 'United Kingdom'
      },
      billingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Test St',
        city: 'London',
        stateProvince: 'London',
        postalCode: 'SW1A 1AA',
        country: 'United Kingdom'
      },
      shippingMethod: {
        id: new mongoose.Types.ObjectId(),
        name: 'Standard Shipping',
        cost: 0
      },
      paymentMethod: {
        type: 'paypal',
        name: 'PayPal'
      },
      createdAt: new Date('2024-01-15')
    });

    const order2 = new Order({
      orderNumber: 'ORD-002',
      userId: customer2._id,
      customerEmail: customer2.email,
      status: 'shipped',
      subtotal: 1299.99,
      tax: 0,
      shipping: 0,
      totalAmount: 1299.99,
      items: [{
        productId: new mongoose.Types.ObjectId(),
        productName: 'Google Pixel 8 Pro',
        productSlug: 'google-pixel-8-pro',
        quantity: 1,
        unitPrice: 1299.99,
        totalPrice: 1299.99
      }],
      shippingAddress: {
        fullName: 'Jane Smith',
        addressLine1: '456 Test Ave',
        city: 'Manchester',
        stateProvince: 'Manchester',
        postalCode: 'M1 1AA',
        country: 'United Kingdom'
      },
      billingAddress: {
        fullName: 'Jane Smith',
        addressLine1: '456 Test Ave',
        city: 'Manchester',
        stateProvince: 'Manchester',
        postalCode: 'M1 1AA',
        country: 'United Kingdom'
      },
      shippingMethod: {
        id: new mongoose.Types.ObjectId(),
        name: 'Standard Shipping',
        cost: 0
      },
      paymentMethod: {
        type: 'bitcoin',
        name: 'Bitcoin'
      },
      createdAt: new Date('2024-01-20')
    });

    const order3 = new Order({
      orderNumber: 'ORD-003',
      userId: customer1._id,
      customerEmail: customer1.email,
      status: 'delivered',
      subtotal: 1599.99,
      tax: 0,
      shipping: 0,
      totalAmount: 1599.99,
      items: [{
        productId: new mongoose.Types.ObjectId(),
        productName: 'Google Pixel 8 Pro Max',
        productSlug: 'google-pixel-8-pro-max',
        quantity: 1,
        unitPrice: 1599.99,
        totalPrice: 1599.99
      }],
      shippingAddress: {
        fullName: 'John Doe',
        addressLine1: '789 Test Rd',
        city: 'Birmingham',
        stateProvince: 'Birmingham',
        postalCode: 'B1 1AA',
        country: 'United Kingdom'
      },
      billingAddress: {
        fullName: 'John Doe',
        addressLine1: '789 Test Rd',
        city: 'Birmingham',
        stateProvince: 'Birmingham',
        postalCode: 'B1 1AA',
        country: 'United Kingdom'
      },
      shippingMethod: {
        id: new mongoose.Types.ObjectId(),
        name: 'Standard Shipping',
        cost: 0
      },
      paymentMethod: {
        type: 'monero',
        name: 'Monero'
      },
      createdAt: new Date('2024-02-01')
    });

    await order1.save();
    await order2.save();
    await order3.save();
    testOrders.push(order1, order2, order3);
  });

  afterAll(async () => {
    // Clean up test data
    await Order.deleteMany({ _id: { $in: testOrders.map(o => o._id) } });
    await User.deleteMany({ _id: { $in: [...testUsers.map(u => u._id), adminUser._id] } });
  });

  describe('GET /api/admin/orders', () => {
    it('should fetch all orders successfully', async () => {
      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(3);
      expect(response.body.data.pagination).toMatchObject({
        currentPage: 1,
        totalOrders: 3,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
        limit: 20
      });

      // Check that customer information is included
      const firstOrder = response.body.data.orders[0];
      expect(firstOrder.customer).toBeDefined();
      expect(firstOrder.customer.firstName).toBeDefined();
      expect(firstOrder.customer.lastName).toBeDefined();
      expect(firstOrder.customer.email).toBeDefined();
    });

    it('should require admin authentication', async () => {
      await request(app)
        .get('/api/admin/orders')
        .expect(401);
    });

    it('should reject non-admin users', async () => {
      const customerToken = jwt.sign(
        { 
          userId: testUsers[0]._id,
          role: 'customer',
          email: testUsers[0].email
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '8h' }
      );

      await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/admin/orders?status=pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].status).toBe('pending');
    });

    it('should filter orders by customer name', async () => {
      const response = await request(app)
        .get('/api/admin/orders?customerQuery=john')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.orders).toHaveLength(2); // John has 2 orders
      response.body.data.orders.forEach(order => {
        expect(order.customer.firstName.toLowerCase()).toContain('john');
      });
    });

    it('should filter orders by customer email', async () => {
      const response = await request(app)
        .get('/api/admin/orders?customerQuery=jane@test.com')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].customer.email).toBe('jane@test.com');
    });

    it('should filter orders by date range', async () => {
      const response = await request(app)
        .get('/api/admin/orders?startDate=2024-01-18&endDate=2024-01-25')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].orderNumber).toBe('ORD-002');
    });

    it('should sort orders by creation date descending by default', async () => {
      const response = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const orders = response.body.data.orders;
      expect(orders).toHaveLength(3);
      
      // Should be sorted by creation date desc (newest first)
      expect(new Date(orders[0].createdAt)).toBeInstanceOf(Date);
      expect(new Date(orders[1].createdAt)).toBeInstanceOf(Date);
      expect(new Date(orders[2].createdAt)).toBeInstanceOf(Date);
      
      // Check that dates are in descending order
      expect(new Date(orders[0].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(orders[1].createdAt).getTime()
      );
      expect(new Date(orders[1].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(orders[2].createdAt).getTime()
      );
    });

    it('should sort orders by total amount ascending', async () => {
      const response = await request(app)
        .get('/api/admin/orders?sortBy=totalAmount&sortOrder=asc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const orders = response.body.data.orders;
      expect(orders).toHaveLength(3);
      
      // Should be sorted by total amount asc
      expect(orders[0].totalAmount).toBeLessThanOrEqual(orders[1].totalAmount);
      expect(orders[1].totalAmount).toBeLessThanOrEqual(orders[2].totalAmount);
    });

    it('should paginate results correctly', async () => {
      const response = await request(app)
        .get('/api/admin/orders?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.orders).toHaveLength(2);
      expect(response.body.data.pagination).toMatchObject({
        currentPage: 1,
        totalOrders: 3,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false,
        limit: 2
      });

      // Test second page
      const response2 = await request(app)
        .get('/api/admin/orders?page=2&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response2.body.data.orders).toHaveLength(1);
      expect(response2.body.data.pagination).toMatchObject({
        currentPage: 2,
        totalOrders: 3,
        totalPages: 2,
        hasNextPage: false,
        hasPrevPage: true,
        limit: 2
      });
    });

    it('should handle combined filters', async () => {
      const response = await request(app)
        .get('/api/admin/orders?status=pending&customerQuery=john&sortBy=totalAmount&sortOrder=desc')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.orders).toHaveLength(1);
      const order = response.body.data.orders[0];
      expect(order.status).toBe('pending');
      expect(order.customer.firstName.toLowerCase()).toContain('john');
    });

    it('should return empty results for non-matching filters', async () => {
      const response = await request(app)
        .get('/api/admin/orders?status=cancelled')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.orders).toHaveLength(0);
      expect(response.body.data.pagination.totalOrders).toBe(0);
    });

    it('should handle invalid date formats gracefully', async () => {
      const response = await request(app)
        .get('/api/admin/orders?startDate=invalid-date')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Should still return results (invalid date is ignored or handled)
      expect(response.body.success).toBe(true);
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/orders?page=0&limit=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Should handle invalid pagination gracefully
      expect(response.body.success).toBe(true);
    });
  });
});