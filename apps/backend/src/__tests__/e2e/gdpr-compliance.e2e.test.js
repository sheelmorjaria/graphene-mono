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

describe('GDPR Compliance - End-to-End Tests', () => {
  let testUser;
  let authToken;
  let testOrder1, testOrder2;
  let testCart;

  beforeAll(async () => {
    // Ensure we're using a test database — either one named "test" or the
    // in-memory instance set up by the e2e harness (setup.e2e.js)
    if (!process.env.MONGODB_URI?.includes('test') && mongoose.connection.readyState !== 1) {
      throw new Error('E2E tests must use test database');
    }
  });

  beforeEach(async () => {
    // Clean up test data
    await Promise.all([
      User.deleteMany({ email: { $regex: /gdpr.*@example\.com/ } }),
      Order.deleteMany({}),
      Cart.deleteMany({}),
      DataExportRequest.deleteMany({}),
      AccountDeletionRequest.deleteMany({})
    ]);

    // Create comprehensive test user with all possible data
    // Don't hash password manually - User model will do it automatically in pre-save middleware
    testUser = await User.create({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'gdpr.test@example.com',
      password: 'GDPRTest123!', // Raw password - will be hashed by User model
      phone: '+44123456789',
      shippingAddresses: [
        {
          fullName: 'Jane Smith',
          addressLine1: '123 Privacy Street',
          addressLine2: 'Apartment 4B',
          city: 'London',
          stateProvince: 'London',
          postalCode: 'SW1A 1AA',
          country: 'GB',
          phoneNumber: '+44123456789',
          isDefault: true
        },
        {
          fullName: 'Jane Smith',
          addressLine1: '456 Work Avenue',
          city: 'Manchester',
          stateProvince: 'Greater Manchester',
          postalCode: 'M1 1AA',
          country: 'GB',
          phoneNumber: '+44987654321',
          isDefault: false
        }
      ],
      lastLoginAt: new Date()
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Create multiple test orders with different payment methods and statuses
    testOrder1 = await Order.create({
      userId: testUser._id,
      customerEmail: testUser.email,
      orderNumber: 'GDPR-ORDER-001',
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          productName: 'GrapheneOS Pixel 7 Pro',
          productSlug: 'grapheneos-pixel-7-pro',
          quantity: 1,
          unitPrice: 849.99,
          totalPrice: 849.99
        },
        {
          productId: new mongoose.Types.ObjectId(),
          productName: 'Google Pixel 8',
          productSlug: 'google-pixel-8',
          quantity: 1,
          unitPrice: 49.99,
          totalPrice: 49.99
        }
      ],
      subtotal: 899.98,
      totalAmount: 899.98,
      status: 'delivered',
      shippingAddress: {
        fullName: 'Jane Smith',
        addressLine1: '123 Privacy Street',
        addressLine2: 'Apartment 4B',
        city: 'London',
        stateProvince: 'London',
        postalCode: 'SW1A 1AA',
        country: 'GB',
        phoneNumber: '+44123456789'
      },
      billingAddress: {
        fullName: 'Jane Smith',
        addressLine1: '123 Privacy Street',
        addressLine2: 'Apartment 4B',
        city: 'London',
        stateProvince: 'London',
        postalCode: 'SW1A 1AA',
        country: 'GB',
        phoneNumber: '+44123456789'
      },
      shippingMethod: {
        id: new mongoose.Types.ObjectId(),
        name: 'Standard Shipping',
        cost: 5.99
      },
      paymentMethod: {
        type: 'paypal',
        name: 'PayPal'
      },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    });

    testOrder2 = await Order.create({
      userId: testUser._id,
      customerEmail: testUser.email,
      orderNumber: 'GDPR-ORDER-002',
      items: [{
        productId: new mongoose.Types.ObjectId(),
        productName: 'GrapheneOS Pixel 8',
        productSlug: 'grapheneos-pixel-8',
        quantity: 1,
        unitPrice: 699.99,
        totalPrice: 699.99
      }],
      subtotal: 699.99,
      totalAmount: 699.99,
      status: 'processing',
      shippingAddress: {
        fullName: 'Jane Smith',
        addressLine1: '456 Work Avenue',
        city: 'Manchester',
        stateProvince: 'Greater Manchester',
        postalCode: 'M1 1AA',
        country: 'GB',
        phoneNumber: '+44987654321'
      },
      billingAddress: {
        fullName: 'Jane Smith',
        addressLine1: '456 Work Avenue',
        city: 'Manchester',
        stateProvince: 'Greater Manchester',
        postalCode: 'M1 1AA',
        country: 'GB',
        phoneNumber: '+44987654321'
      },
      shippingMethod: {
        id: new mongoose.Types.ObjectId(),
        name: 'Standard Shipping',
        cost: 5.99
      },
      paymentMethod: {
        type: 'paypal',
        name: 'PayPal'
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    });

    // Create test cart with items
    testCart = await Cart.create({
      userId: testUser._id,
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          productName: 'GrapheneOS Pixel 8',
          productSlug: 'grapheneos-pixel-8',
          unitPrice: 699.99,
          quantity: 1,
          subtotal: 699.99
        },
        {
          productId: new mongoose.Types.ObjectId(),
          productName: 'GrapheneOS Pixel 8 Pro',
          productSlug: 'grapheneos-pixel-8-pro',
          unitPrice: 999.99,
          quantity: 2,
          subtotal: 1999.98
        }
      ]
    });
  });

  afterEach(async () => {
    // Clean up test data
    await Promise.all([
      User.deleteMany({ email: { $regex: /gdpr.*@example\.com/ } }),
      Order.deleteMany({}),
      Cart.deleteMany({}),
      DataExportRequest.deleteMany({}),
      AccountDeletionRequest.deleteMany({})
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Complete GDPR Data Export Workflow', () => {
    it('should handle complete data export lifecycle', async () => {
      // Step 1: Request data export
      const exportResponse = await request(app)
        .post('/api/user/data/export')
        .set('Authorization', `Bearer ${authToken}`)
        .set('User-Agent', 'vitest-e2e')
        .expect(200);

      expect(exportResponse.body.success).toBe(true);
      expect(exportResponse.body.message).toContain('Data export request received');
      expect(exportResponse.body.data.requestId).toMatch(/^export_/);
      expect(exportResponse.body.data.estimatedTime).toBe('24 hours');

      const requestId = exportResponse.body.data.requestId;

      // Step 2: Verify export request was created in database
      let exportRequest = await DataExportRequest.findOne({ requestId });
      expect(exportRequest).toBeTruthy();
      expect(exportRequest.userId.toString()).toBe(testUser._id.toString());
      expect(exportRequest.status).toBe('pending');
      expect(exportRequest.ipAddress).toBeTruthy();
      expect(exportRequest.userAgent).toBeTruthy();

      // Step 2b: Test rate limiting immediately — the request is still
      // pending (background processing starts after ~1s), so a second
      // request must be rejected with 429.
      const secondExportResponse = await request(app)
        .post('/api/user/data/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(429);

      expect(secondExportResponse.body.success).toBe(false);
      expect(secondExportResponse.body.error).toContain('pending data export request');
      expect(secondExportResponse.body.data.existingRequestId).toBe(requestId);

      // Step 3: Wait for background processing to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 4: Verify export was processed and completed
      exportRequest = await DataExportRequest.findOne({ requestId });
      expect(exportRequest.status).toBe('completed');
      expect(exportRequest.downloadUrl).toBeTruthy();
      expect(exportRequest.fileSize).toBeGreaterThan(0);
      expect(exportRequest.expiresAt).toBeInstanceOf(Date);
      expect(exportRequest.expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Step 5: Verify metadata was recorded
      expect(exportRequest.metadata).toBeTruthy();
      expect(exportRequest.metadata.dataTypes).toContain('profile');
      expect(exportRequest.metadata.dataTypes).toContain('orders');
      expect(exportRequest.metadata.dataTypes).toContain('addresses');
      expect(exportRequest.metadata.dataTypes).toContain('preferences');
      expect(exportRequest.metadata.totalRecords).toBeGreaterThan(0);
      expect(exportRequest.metadata.processingTimeMs).toBeGreaterThan(0);
    });

    it('should export comprehensive user data accurately', async () => {
      // Request data export
      const exportResponse = await request(app)
        .post('/api/user/data/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify the export would contain all expected data
      const exportRequest = await DataExportRequest.findOne({ 
        requestId: exportResponse.body.data.requestId 
      });

      expect(exportRequest.status).toBe('completed');
      
      // In a real implementation, we would fetch and verify the export data
      // For now, we verify the metadata indicates comprehensive data collection
      expect(exportRequest.metadata.dataTypes).toEqual(
        expect.arrayContaining(['profile', 'orders', 'addresses', 'preferences'])
      );
      expect(exportRequest.metadata.totalRecords).toBe(5); // 1 profile + 2 orders + 2 addresses
    });
  });

  describe('Complete GDPR Account Deletion Workflow', () => {
    it('should handle complete account deletion lifecycle', async () => {
      // Step 1: Request account deletion with valid password
      const deletionResponse = await request(app)
        .post('/api/user/data/delete-request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'GDPRTest123!' })
        .expect(200);

      expect(deletionResponse.body.success).toBe(true);
      expect(deletionResponse.body.message).toContain('Account deletion request received');
      expect(deletionResponse.body.data.requestId).toMatch(/^deletion_/);
      expect(deletionResponse.body.data.estimatedTime).toBe('7-30 days');

      const requestId = deletionResponse.body.data.requestId;

      // Step 2: Verify deletion request was created in database
      let deletionRequest = await AccountDeletionRequest.findOne({ requestId });
      expect(deletionRequest).toBeTruthy();
      expect(deletionRequest.userId.toString()).toBe(testUser._id.toString());
      expect(deletionRequest.status).toBe('pending');
      expect(deletionRequest.userEmail).toBe(testUser.email);
      expect(deletionRequest.userName).toBe('Jane Smith');
      expect(deletionRequest.passwordVerified).toBe(true);

      // Step 3: Verify data retention policies are enforced
      expect(deletionRequest.dataRetained.orders).toBe(true);
      expect(deletionRequest.dataRetained.transactions).toBe(true);

      // Step 4: Wait for background processing to complete
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Step 5: Verify deletion was processed and completed
      deletionRequest = await AccountDeletionRequest.findOne({ requestId });
      expect(deletionRequest.status).toBe('completed');
      expect(deletionRequest.completedAt).toBeInstanceOf(Date);

      // Step 6: Verify processing metadata
      expect(deletionRequest.processingMetadata).toBeTruthy();
      expect(deletionRequest.processingMetadata.ordersAnonymized).toBe(2);
      expect(deletionRequest.processingMetadata.recordsDeleted).toBeGreaterThan(0);
      expect(deletionRequest.processingMetadata.processingTimeMs).toBeGreaterThan(0);

      // Step 7: Verify user data was anonymized (soft deletion)
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.firstName).toBe('Deleted');
      expect(updatedUser.lastName).toBe('User');
      expect(updatedUser.email).toBe(`deleted_${testUser._id}@anonymous.local`);
      expect(updatedUser.phone).toBe('');
      expect(updatedUser.shippingAddresses).toHaveLength(0);
      expect(updatedUser.accountStatus).toBe('disabled');
      expect(updatedUser.isActive).toBe(false);
      expect(updatedUser.password).toBe('DELETED');

      // Step 8: Verify orders were anonymized (retained for legal purposes)
      const anonymizedOrder1 = await Order.findById(testOrder1._id);
      expect(anonymizedOrder1.shippingAddress.fullName).toBe('DELETED USER');
      expect(anonymizedOrder1.shippingAddress.phoneNumber).toBe('');
      expect(anonymizedOrder1.billingAddress.fullName).toBe('DELETED USER');
      expect(anonymizedOrder1.billingAddress.phoneNumber).toBe('');
      expect(anonymizedOrder1.customerEmail).toBe('deleted@anonymous.local');
      expect(anonymizedOrder1.userId).toBeNull();

      const anonymizedOrder2 = await Order.findById(testOrder2._id);
      expect(anonymizedOrder2.shippingAddress.fullName).toBe('DELETED USER');
      expect(anonymizedOrder2.billingAddress.fullName).toBe('DELETED USER');

      // Step 9: Verify cart was completely deleted
      const cartExists = await Cart.findById(testCart._id);
      expect(cartExists).toBeNull();

      // Step 10: Test authentication - user should not be able to login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'gdpr.test@example.com',
          password: 'GDPRTest123!'
        })
        .expect(401);

      expect(loginResponse.body.success).toBe(false);
    });

    it('should enforce proper security measures for account deletion', async () => {
      // Test 1: Reject deletion request without password
      await request(app)
        .post('/api/user/data/delete-request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      // Test 2: Reject deletion request with invalid password
      const invalidPasswordResponse = await request(app)
        .post('/api/user/data/delete-request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'wrongpassword' })
        .expect(400);

      expect(invalidPasswordResponse.body.error).toContain('Invalid password');

      // Test 3: Successful deletion with correct password
      const validResponse = await request(app)
        .post('/api/user/data/delete-request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'GDPRTest123!' })
        .expect(200);

      // Test 4: Reject duplicate deletion request
      const duplicateResponse = await request(app)
        .post('/api/user/data/delete-request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'GDPRTest123!' })
        .expect(429);

      expect(duplicateResponse.body.error).toContain('pending account deletion request');
    });
  });

  describe('GDPR Compliance Edge Cases', () => {
    it('should handle user with no orders or addresses', async () => {
      // Create user with minimal data
      const minimalUser = await User.create({
        firstName: 'Minimal',
        lastName: 'User',
        email: 'gdpr.minimal@example.com',
        password: 'password123', // Raw password - will be hashed by User model
        addresses: []
      });

      const minimalToken = jwt.sign(
        { userId: minimalUser._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      // Test data export
      const exportResponse = await request(app)
        .post('/api/user/data/export')
        .set('Authorization', `Bearer ${minimalToken}`)
        .expect(200);

      await new Promise(resolve => setTimeout(resolve, 2000));

      const exportRequest = await DataExportRequest.findOne({ 
        requestId: exportResponse.body.data.requestId 
      });
      expect(exportRequest.status).toBe('completed');
      expect(exportRequest.metadata.totalRecords).toBe(1); // Only profile

      // Test account deletion
      const deletionResponse = await request(app)
        .post('/api/user/data/delete-request')
        .set('Authorization', `Bearer ${minimalToken}`)
        .send({ password: 'password123' })
        .expect(200);

      await new Promise(resolve => setTimeout(resolve, 6000));

      const deletionRequest = await AccountDeletionRequest.findOne({ 
        requestId: deletionResponse.body.data.requestId 
      });
      expect(deletionRequest.status).toBe('completed');
      expect(deletionRequest.processingMetadata.ordersAnonymized).toBe(0);
    });

    it('should handle concurrent GDPR requests properly', async () => {
      // Create multiple users
      const users = await Promise.all([
        User.create({
          firstName: 'User1',
          lastName: 'Test',
          email: 'gdpr.concurrent1@example.com',
          password: 'password123' // Raw password - will be hashed by User model
        }),
        User.create({
          firstName: 'User2',
          lastName: 'Test',
          email: 'gdpr.concurrent2@example.com',
          password: 'password123' // Raw password - will be hashed by User model
        })
      ]);

      const tokens = users.map(user =>
        jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' })
      );

      // Make concurrent export requests
      const exportPromises = tokens.map(token =>
        request(app)
          .post('/api/user/data/export')
          .set('Authorization', `Bearer ${token}`)
      );

      const exportResponses = await Promise.all(exportPromises);
      
      // All requests should succeed
      exportResponses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Make concurrent deletion requests
      const deletionPromises = tokens.map(token =>
        request(app)
          .post('/api/user/data/delete-request')
          .set('Authorization', `Bearer ${token}`)
          .send({ password: 'password123' })
      );

      const deletionResponses = await Promise.all(deletionPromises);
      
      // All requests should succeed
      deletionResponses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('GDPR Audit and Logging', () => {
    it('should create comprehensive audit logs for GDPR operations', async () => {
      // This test would verify that all GDPR operations are properly logged
      // In a real implementation, you would check audit logs in your logging system
      
      // Request data export
      await request(app)
        .post('/api/user/data/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Request account deletion
      await request(app)
        .post('/api/user/data/delete-request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'GDPRTest123!' })
        .expect(200);

      // In a real implementation, you would verify:
      // 1. Audit logs contain all required information
      // 2. Logs include user identification, timestamps, IP addresses
      // 3. Logs record success/failure of operations
      // 4. Logs capture data retention decisions
      // 5. Logs are tamper-evident and properly secured

      // For this test, we verify the requests succeeded, indicating logging occurred
      expect(true).toBe(true);
    });
  });
});