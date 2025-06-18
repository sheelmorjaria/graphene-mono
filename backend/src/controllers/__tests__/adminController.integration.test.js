import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createControllerTestHelper, testDataFactories } from '../../test/helpers/controllerTestHelper.js';
import { createValidOrderData, createValidUserData } from '../../test/helpers/testDataFactory.js';

describe('Admin Controller', () => {
  let adminUser;
  let adminToken;
  let testHelper;

  beforeEach(async () => {
    testHelper = createControllerTestHelper();
    
    // Create admin user using helper
    adminUser = await testHelper.createTestData(User, testDataFactories.adminUser({
      email: 'admin@test.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User'
    }), 'admin');

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
  });

  afterEach(async () => {
    await testHelper.cleanup();
  });

  describe('POST /api/admin/login', () => {
    it('should login admin user successfully', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'admin@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user).toMatchObject({
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      });
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'admin@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject login for non-admin user', async () => {
      // Create regular user
      const regularUser = new User({
        email: 'user@test.com',
        password: 'password123',
        firstName: 'Regular',
        lastName: 'User',
        role: 'customer',
        emailVerified: true
      });
      await regularUser.save();

      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'user@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied. Admin privileges required.');
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'admin@test.com'
          // password missing
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should reject login for non-existent user', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject login for inactive user', async () => {
      adminUser.isActive = false;
      await adminUser.save();

      const response = await request(app)
        .post('/api/admin/login')
        .send({
          email: 'admin@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Account has been deactivated');
    });
  });

  describe('GET /api/admin/dashboard-metrics', () => {
    beforeEach(async () => {
      // Create test orders using factory
      const order1Data = createValidOrderData({
        orderNumber: 'ORD-001',
        customerEmail: 'test1@example.com',
        subtotal: 100,
        tax: 20,
        shipping: 10,
        totalAmount: 130,
        status: 'delivered',
        createdAt: new Date()
      });
      
      const order2Data = createValidOrderData({
        orderNumber: 'ORD-002',
        customerEmail: 'test2@example.com',
        items: [{
          productId: new mongoose.Types.ObjectId(),
          productName: 'Test Product 2',
          productSlug: 'test-product-2',
          productImage: '/images/test-product-2.jpg',
          quantity: 2,
          unitPrice: 200,
          totalPrice: 400
        }],
        subtotal: 400,
        tax: 80,
        shipping: 0,
        totalAmount: 480,
        status: 'pending',
        createdAt: new Date()
      });
      
      await Order.create([order1Data, order2Data]);

      // Create test users using factory
      const user1Data = createValidUserData({
        email: 'customer1@test.com',
        firstName: 'Customer',
        lastName: 'One',
        createdAt: new Date()
      });
      
      const user2Data = createValidUserData({
        email: 'customer2@test.com',
        firstName: 'Customer',
        lastName: 'Two',
        createdAt: new Date()
      });
      
      await User.create([user1Data, user2Data]);
    });

    it('should return dashboard metrics for authenticated admin', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard-metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        orders: {
          total: expect.any(Number),
          today: expect.any(Number),
          week: expect.any(Number),
          month: expect.any(Number),
          pending: expect.any(Number),
          awaitingShipment: expect.any(Number)
        },
        revenue: {
          total: expect.any(Number),
          today: expect.any(Number),
          week: expect.any(Number),
          month: expect.any(Number)
        },
        customers: {
          newToday: expect.any(Number),
          newWeek: expect.any(Number),
          newMonth: expect.any(Number)
        },
        lastUpdated: expect.any(String)
      });
    });

    it('should reject request without authentication token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard-metrics');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard-metrics')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token.');
    });

    it('should reject request from non-admin user', async () => {
      // Create regular user token
      const regularUser = new User({
        email: 'regular@test.com',
        password: 'password123',
        firstName: 'Regular',
        lastName: 'User',
        role: 'customer'
      });
      await regularUser.save();

      const regularToken = jwt.sign(
        { 
          userId: regularUser._id,
          role: regularUser.role,
          email: regularUser.email
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '8h' }
      );

      const response = await request(app)
        .get('/api/admin/dashboard-metrics')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient permissions.');
    });
  });

  describe('GET /api/admin/profile', () => {
    it('should return admin profile for authenticated admin', async () => {
      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      });
    });

    it('should reject request without authentication token', async () => {
      const response = await request(app)
        .get('/api/admin/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });

    it('should reject request from non-admin user', async () => {
      // Create regular user token
      const regularUser = new User({
        email: 'regular@test.com',
        password: 'password123',
        firstName: 'Regular',
        lastName: 'User',
        role: 'customer'
      });
      await regularUser.save();

      const regularToken = jwt.sign(
        { 
          userId: regularUser._id,
          role: regularUser.role,
          email: regularUser.email
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '8h' }
      );

      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient permissions.');
    });
  });

  describe('POST /api/admin/orders/:orderId/refund', () => {
    let testOrder;
    let customerUser;

    beforeEach(async () => {
      // Create customer user using factory
      const customerUserData = createValidUserData({
        email: 'customer@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer',
        emailVerified: true
      });
      customerUser = await User.create(customerUserData);

      // Create test order using factory
      const orderData = createValidOrderData({
        orderNumber: 'TEST-001',
        userId: customerUser._id,
        customerEmail: 'customer@test.com',
        subtotal: 100,
        tax: 10,
        shipping: 0,
        totalAmount: 110,
        paymentStatus: 'completed',
        status: 'processing',
        shippingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Test St',
          city: 'Test City',
          stateProvince: 'Test State',
          postalCode: 'TE1 1ST',
          country: 'United Kingdom'
        },
        billingAddress: {
          fullName: 'John Doe',
          addressLine1: '123 Test St',
          city: 'Test City',
          stateProvince: 'Test State',
          postalCode: 'TE1 1ST',
          country: 'United Kingdom'
        }
      });
      testOrder = await Order.create(orderData);
    });

    it('should issue refund successfully', async () => {
      const refundData = {
        refundAmount: 50,
        refundReason: 'Customer request'
      };

      const response = await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Refund of £50.00 processed successfully');
      expect(response.body.data.refund).toMatchObject({
        amount: 50,
        reason: 'Customer request',
        status: 'succeeded'
      });
    });

    it('should reject refund for non-completed payment', async () => {
      testOrder.paymentStatus = 'pending';
      await testOrder.save();

      const refundData = {
        refundAmount: 50,
        refundReason: 'Customer request'
      };

      const response = await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Cannot refund order with payment status: pending');
    });

    it('should reject refund amount exceeding order total', async () => {
      const refundData = {
        refundAmount: 150, // More than order total of 110
        refundReason: 'Customer request'
      };

      const response = await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('exceeds maximum refundable amount');
    });

    it('should reject refund with missing required fields', async () => {
      const response = await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          refundAmount: 50
          // Missing refundReason
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Refund amount and reason are required');
    });

    it('should handle partial refunds correctly', async () => {
      // First refund
      await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          refundAmount: 30,
          refundReason: 'First partial refund'
        });

      // Second refund
      const response = await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          refundAmount: 40,
          refundReason: 'Second partial refund'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Check order has been updated
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.refundAmount).toBe(70);
      expect(updatedOrder.refundHistory).toHaveLength(2);
    });

    it('should update order status to refunded for full refund', async () => {
      const refundData = {
        refundAmount: 110, // Full order amount
        refundReason: 'Full refund requested'
      };

      const response = await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Check order status updated
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.status).toBe('refunded');
      expect(updatedOrder.paymentStatus).toBe('refunded');
      expect(updatedOrder.refundStatus).toBe('succeeded');
    });

    it('should require admin authentication', async () => {
      const refundData = {
        refundAmount: 50,
        refundReason: 'Customer request'
      };

      const response = await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .send(refundData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });

    it('should handle invalid order ID', async () => {
      const refundData = {
        refundAmount: 50,
        refundReason: 'Customer request'
      };

      const response = await request(app)
        .post('/api/admin/orders/invalid-id/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid order ID format');
    });
  });
});