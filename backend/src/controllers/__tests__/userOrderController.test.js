import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../../server.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';

describe('User Order Controller', () => {
  let testUser;
  let authToken;
  let testOrders;

  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/graphene-store-test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear test data
    await User.deleteMany({});
    await Order.deleteMany({});

    // Create test user
    testUser = new User({
      email: 'orders.test@example.com',
      password: 'TestPass123!',
      firstName: 'Order',
      lastName: 'Tester'
    });
    await testUser.save();

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET || 'your-secret-key'
    );

    // Create test orders
    const orderData = {
      userId: testUser._id,
      customerEmail: testUser.email,
      status: 'pending',
      items: [{
        productId: new mongoose.Types.ObjectId(),
        productName: 'GrapheneOS Pixel 9 Pro',
        productSlug: 'grapheneos-pixel-9-pro',
        quantity: 1,
        unitPrice: 999.99,
        totalPrice: 999.99
      }],
      subtotal: 999.99,
      tax: 80.00,
      shipping: 15.00,
      shippingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        stateProvince: 'NY',
        postalCode: '10001',
        country: 'United States',
        phoneNumber: '+1 (555) 123-4567'
      },
      paymentMethod: 'credit_card'
    };

    testOrders = await Promise.all([
      new Order({
        ...orderData,
        orderNumber: 'TEST-ORDER-001',
        orderDate: new Date('2024-01-01'),
        totalAmount: 1000,
        status: 'delivered'
      }).save(),
      new Order({
        ...orderData,
        orderNumber: 'TEST-ORDER-002',
        orderDate: new Date('2024-01-02'),
        totalAmount: 2000,
        status: 'shipped'
      }).save(),
      new Order({
        ...orderData,
        orderNumber: 'TEST-ORDER-003',
        orderDate: new Date('2024-01-03'),
        totalAmount: 3000,
        status: 'pending'
      }).save()
    ]);
  });

  describe('GET /api/user/orders', () => {
    it('should get user orders with default pagination', async () => {
      const response = await request(app)
        .get('/api/user/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(3);
      expect(response.body.data.pagination).toMatchObject({
        currentPage: 1,
        totalPages: 1,
        totalOrders: 3,
        hasNextPage: false,
        hasPrevPage: false,
        limit: 10
      });

      // Should be sorted by date descending (newest first)
      const orders = response.body.data.orders;
      expect(orders[0].totalAmount).toBe(3000);
      expect(orders[1].totalAmount).toBe(2000);
      expect(orders[2].totalAmount).toBe(1000);
    });

    it('should include formatted order data', async () => {
      const response = await request(app)
        .get('/api/user/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const order = response.body.data.orders[0];
      expect(order).toHaveProperty('_id');
      expect(order).toHaveProperty('orderNumber');
      expect(order).toHaveProperty('orderDate');
      expect(order).toHaveProperty('totalAmount');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('statusDisplay');
      expect(order).toHaveProperty('formattedDate');
      expect(order).toHaveProperty('itemCount');
      expect(order.statusDisplay).toBe('Pending');
      expect(order.formattedDate).toMatch(/\w+ \d{1,2}, \d{4}/);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/user/orders?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.orders).toHaveLength(2);
      expect(response.body.data.pagination).toMatchObject({
        currentPage: 1,
        totalPages: 2,
        totalOrders: 3,
        hasNextPage: true,
        hasPrevPage: false,
        limit: 2
      });
    });

    it('should support custom sorting by totalAmount ascending', async () => {
      const response = await request(app)
        .get('/api/user/orders?sortBy=totalAmount&sortOrder=asc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const orders = response.body.data.orders;
      expect(orders[0].totalAmount).toBe(1000);
      expect(orders[1].totalAmount).toBe(2000);
      expect(orders[2].totalAmount).toBe(3000);
    });

    it('should validate sortBy parameter', async () => {
      const response = await request(app)
        .get('/api/user/orders?sortBy=invalidField')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should fall back to default sorting (orderDate desc)
      const orders = response.body.data.orders;
      expect(orders[0].totalAmount).toBe(3000); // Most recent
    });

    it('should limit maximum orders per page', async () => {
      const response = await request(app)
        .get('/api/user/orders?limit=100')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.pagination.limit).toBe(50); // Should be capped at 50
    });

    it('should return empty array for user with no orders', async () => {
      // Create new user with no orders
      const newUser = new User({
        email: 'noorders@example.com',
        password: 'TestPass123!',
        firstName: 'No',
        lastName: 'Orders'
      });
      await newUser.save();

      const newUserToken = jwt.sign(
        { userId: newUser._id },
        process.env.JWT_SECRET || 'your-secret-key'
      );

      const response = await request(app)
        .get('/api/user/orders')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(response.body.data.orders).toHaveLength(0);
      expect(response.body.data.pagination.totalOrders).toBe(0);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/user/orders')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });

    it('should only return orders for authenticated user', async () => {
      // Create another user with orders
      const otherUser = new User({
        email: 'other@example.com',
        password: 'TestPass123!',
        firstName: 'Other',
        lastName: 'User'
      });
      await otherUser.save();

      // Create order for other user
      await new Order({
        orderNumber: 'OTHER-USER-ORDER-001',
        userId: otherUser._id,
        customerEmail: otherUser.email,
        status: 'pending',
        items: [{
          productId: new mongoose.Types.ObjectId(),
          productName: 'Test Product',
          productSlug: 'test-product',
          quantity: 1,
          unitPrice: 100,
          totalPrice: 100
        }],
        subtotal: 100,
        tax: 8,
        shipping: 5,
        shippingAddress: {
          fullName: 'Other User',
          addressLine1: '456 Oak St',
          city: 'Los Angeles',
          stateProvince: 'CA',
          postalCode: '90210',
          country: 'United States'
        },
        paymentMethod: 'credit_card'
      }).save();

      // Request orders with original user's token
      const response = await request(app)
        .get('/api/user/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should only return 3 orders (original user's orders)
      expect(response.body.data.orders).toHaveLength(3);
      expect(response.body.data.pagination.totalOrders).toBe(3);
    });
  });

  describe('GET /api/user/orders/:orderId', () => {
    it('should get detailed order information', async () => {
      const orderId = testOrders[0]._id;

      const response = await request(app)
        .get(`/api/user/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const order = response.body.data.order;
      
      expect(order).toHaveProperty('_id');
      expect(order).toHaveProperty('orderNumber');
      expect(order).toHaveProperty('items');
      expect(order).toHaveProperty('shippingAddress');
      expect(order).toHaveProperty('paymentMethod');
      expect(order).toHaveProperty('paymentStatus');
      expect(order.items).toHaveLength(1);
      expect(order.shippingAddress.fullName).toBe('John Doe');
    });

    it('should fail with invalid order ID format', async () => {
      const response = await request(app)
        .get('/api/user/orders/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid order ID format');
    });

    it('should fail for non-existent order', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/user/orders/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order not found');
    });

    it('should not allow access to other user\'s orders', async () => {
      // Create another user
      const otherUser = new User({
        email: 'other@example.com',
        password: 'TestPass123!',
        firstName: 'Other',
        lastName: 'User'
      });
      await otherUser.save();

      const otherUserToken = jwt.sign(
        { userId: otherUser._id },
        process.env.JWT_SECRET || 'your-secret-key'
      );

      // Try to access original user's order with other user's token
      const orderId = testOrders[0]._id;

      const response = await request(app)
        .get(`/api/user/orders/${orderId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order not found');
    });

    it('should fail without authentication', async () => {
      const orderId = testOrders[0]._id;

      const response = await request(app)
        .get(`/api/user/orders/${orderId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });
  });
});