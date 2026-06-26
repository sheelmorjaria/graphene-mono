import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../../app.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Cart from '../../models/Cart.js';
import DataExportRequest from '../../models/DataExportRequest.js';
import AccountDeletionRequest from '../../models/AccountDeletionRequest.js';

describe('Privacy Controller - Integration Tests', () => {
  let testUser;
  let authToken;
  let testOrder;
  let testCart;

  beforeAll(async () => {
    // Ensure we're using test database
    if (!process.env.MONGODB_URI?.includes('test')) {
      throw new Error('Integration tests must use test database');
    }
  });

  beforeEach(async () => {
    // Clean up test data
    await Promise.all([
      User.deleteMany({ email: { $regex: /test.*@example\.com/ } }),
      Order.deleteMany({}),
      Cart.deleteMany({}),
      DataExportRequest.deleteMany({}),
      AccountDeletionRequest.deleteMany({})
    ]);

    // Create test user
    // Don't hash password manually - User model will do it automatically in pre-save middleware
    testUser = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'test.privacy@example.com',
      password: 'password123', // Raw password - will be hashed by User model
      phone: '+1234567890',
      addresses: [{
        fullName: 'John Doe',
        addressLine1: '123 Test Street',
        city: 'Test City',
        postalCode: 'T3ST 123',
        country: 'GB',
        phoneNumber: '+1234567890',
        isDefault: true
      }]
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create test order
    testOrder = await Order.create({
      userId: testUser._id,
      orderNumber: 'TEST-ORDER-001',
      customerEmail: testUser.email,
      items: [{
        productId: new mongoose.Types.ObjectId(),
        productName: 'Test Phone',
        productSlug: 'test-phone',
        quantity: 1,
        unitPrice: 299.99,
        subtotal: 299.99,
        totalPrice: 299.99
      }],
      subtotal: 299.99,
      total: 299.99,
      currency: 'GBP',
      status: 'delivered',
      shippingMethod: {
        id: new mongoose.Types.ObjectId(),
        name: 'Standard Shipping',
        cost: 5.99
      },
      shippingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Test Street',
        city: 'Test City',
        stateProvince: 'Test State',
        postalCode: 'T3ST 123',
        country: 'GB',
        phoneNumber: '+1234567890'
      },
      billingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Test Street',
        city: 'Test City',
        stateProvince: 'Test State',
        postalCode: 'T3ST 123',
        country: 'GB',
        phoneNumber: '+1234567890'
      },
      paymentMethod: {
        type: 'paypal',
        name: 'PayPal'
      }
    });

    // Create test cart
    testCart = await Cart.create({
      userId: testUser._id,
      items: [{
        productId: new mongoose.Types.ObjectId(),
        productName: 'Test Product',
        productSlug: 'test-product',
        quantity: 2,
        unitPrice: 99.99,
        subtotal: 199.98
      }]
    });
  });

  afterEach(async () => {
    // Clean up test data
    await Promise.all([
      User.deleteMany({ email: { $regex: /test.*@example\.com/ } }),
      Order.deleteMany({}),
      Cart.deleteMany({}),
      DataExportRequest.deleteMany({}),
      AccountDeletionRequest.deleteMany({})
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/user/data/export', () => {
    it('should successfully create a data export request', async () => {
      const response = await request(app)
        .post('/api/user/data/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Data export request received. You will receive an email with a download link when your data is ready.',
        data: {
          requestId: expect.stringMatching(/^export_.*$/),
          estimatedTime: '24 hours'
        }
      });

      // Verify request was created in database
      const exportRequest = await DataExportRequest.findOne({
        requestId: response.body.data.requestId
      });
      expect(exportRequest).toBeTruthy();
      expect(exportRequest.userId.toString()).toBe(testUser._id.toString());
      expect(exportRequest.status).toBe('pending');
    });

    it('should reject duplicate export requests', async () => {
      // Create first request
      await request(app)
        .post('/api/user/data/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to create second request
      const response = await request(app)
        .post('/api/user/data/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('pending data export request');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/user/data/export')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Access denied');
    });

    it('should handle invalid token', async () => {
      const response = await request(app)
        .post('/api/user/data/export')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/user/data/delete-request', () => {
    it('should successfully create account deletion request with valid password', async () => {
      const response = await request(app)
        .post('/api/user/data/delete-request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'password123' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Account deletion request received. You will receive a confirmation email and be logged out.',
        data: {
          requestId: expect.stringMatching(/^deletion_.*$/),
          estimatedTime: '7-30 days'
        }
      });

      // Verify request was created in database
      const deletionRequest = await AccountDeletionRequest.findOne({
        requestId: response.body.data.requestId
      });
      expect(deletionRequest).toBeTruthy();
      expect(deletionRequest.userId.toString()).toBe(testUser._id.toString());
      expect(deletionRequest.status).toBe('pending');
      expect(deletionRequest.userEmail).toBe(testUser.email);
      expect(deletionRequest.userName).toBe('John Doe');
    });

    it('should reject request with missing password', async () => {
      const response = await request(app)
        .post('/api/user/data/delete-request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Password is required to confirm account deletion');
    });

    it('should reject request with invalid password', async () => {
      const response = await request(app)
        .post('/api/user/data/delete-request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'wrongpassword' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid password');
    });

    it('should reject duplicate deletion requests', async () => {
      // Create first request
      await request(app)
        .post('/api/user/data/delete-request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'password123' })
        .expect(200);

      // Try to create second request
      const response = await request(app)
        .post('/api/user/data/delete-request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'password123' })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('pending account deletion request');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/user/data/delete-request')
        .send({ password: 'password123' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Access denied');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rapid successive export requests properly', async () => {
      // Make multiple rapid requests
      const promises = Array(3).fill().map(() =>
        request(app)
          .post('/api/user/data/export')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);

      // First request should succeed
      expect(responses[0].status).toBe(200);
      
      // Subsequent requests should be rate limited
      const failedResponses = responses.slice(1).filter(r => r.status === 429);
      expect(failedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Data Export Processing (Simulated)', () => {
    it('should eventually mark export request as completed', async () => {
      // Create export request
      const response = await request(app)
        .post('/api/user/data/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const requestId = response.body.data.requestId;

      // Wait for background processing to complete (simulated with setTimeout)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check that request was processed
      const updatedRequest = await DataExportRequest.findOne({ requestId });
      expect(updatedRequest.status).toBe('completed');
      expect(updatedRequest.downloadUrl).toBeTruthy();
      expect(updatedRequest.fileSize).toBeGreaterThan(0);
      expect(updatedRequest.expiresAt).toBeTruthy();
    });
  });

  describe('Account Deletion Processing (Simulated)', () => {
    it('should eventually process account deletion', async () => {
      // Create deletion request
      const response = await request(app)
        .post('/api/user/data/delete-request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'password123' })
        .expect(200);

      const requestId = response.body.data.requestId;

      // Wait for background processing to complete (simulated with setTimeout)
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Check that request was processed
      const updatedRequest = await AccountDeletionRequest.findOne({ requestId });
      expect(updatedRequest.status).toBe('completed');

      // Check that user data was anonymized
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.firstName).toBe('Deleted');
      expect(updatedUser.lastName).toBe('User');
      expect(updatedUser.email).toBe(`deleted_${testUser._id}@anonymous.local`);
      expect(updatedUser.isDeleted).toBe(true);
      expect(updatedUser.isActive).toBe(false);

      // Check that orders were anonymized
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.shippingAddress.fullName).toBe('DELETED USER');
      expect(updatedOrder.billingAddress.fullName).toBe('DELETED USER');
      expect(updatedOrder.userEmail).toBe('deleted@anonymous.local');
      expect(updatedOrder.userId).toBeNull();

      // Check that cart was deleted
      const cartExists = await Cart.findById(testCart._id);
      expect(cartExists).toBeNull();
    });
  });
});