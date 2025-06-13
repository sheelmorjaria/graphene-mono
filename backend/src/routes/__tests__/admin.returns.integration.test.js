import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import adminRoutes from '../admin.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import ReturnRequest from '../../models/ReturnRequest.js';
import emailService from '../../services/emailService.js';
import jwt from 'jsonwebtoken';

// Mock email service
jest.mock('../../services/emailService.js', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  sendReturnRequestEmail: jest.fn().mockResolvedValue(true),
  sendReturnUpdateEmail: jest.fn().mockResolvedValue(true)
}));

describe('Admin Returns Integration Tests', () => {
  let app;
  let mongoServer;
  let adminUser;
  let customerUser;
  let order;
  let returnRequest;
  let adminToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Order.deleteMany({});
    await ReturnRequest.deleteMany({});

    // Reset mocks
    jest.clearAllMocks();

    // Create admin user
    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      isActive: true
    });

    // Create customer user
    customerUser = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      password: 'password123',
      role: 'customer',
      isActive: true
    });

    // Generate admin token
    adminToken = jwt.sign(
      {
        userId: adminUser._id,
        role: adminUser.role,
        email: adminUser.email
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '8h' }
    );

    // Create order
    order = await Order.create({
      userId: customerUser._id,
      orderNumber: 'ORD-2024010001',
      items: [{
        productId: new mongoose.Types.ObjectId(),
        name: 'Google Pixel 8',
        slug: 'google-pixel-8',
        price: 699.99,
        quantity: 1,
        image: 'pixel8.jpg',
        lineTotal: 699.99
      }],
      totalAmount: 699.99,
      subtotalAmount: 699.99,
      shippingCost: 0,
      taxAmount: 0,
      status: 'delivered',
      paymentMethod: 'paypal',
      paymentStatus: 'completed',
      shippingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Test St',
        city: 'Test City',
        postalCode: 'T3ST 1NG',
        country: 'GB'
      },
      billingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Test St',
        city: 'Test City',
        postalCode: 'T3ST 1NG',
        country: 'GB'
      }
    });

    // Create return request
    returnRequest = await ReturnRequest.create({
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId: customerUser._id,
      customerEmail: customerUser.email,
      returnRequestNumber: '2024010001',
      status: 'pending_review',
      items: [{
        productId: order.items[0].productId,
        productName: 'Google Pixel 8',
        productSlug: 'google-pixel-8',
        quantity: 1,
        unitPrice: 699.99,
        totalRefundAmount: 699.99,
        reason: 'defective_item',
        reasonDescription: 'Screen has dead pixels'
      }],
      totalRefundAmount: 699.99
    });
  });

  describe('GET /api/admin/returns', () => {
    it('should get all return requests with authentication', async () => {
      const response = await request(app)
        .get('/api/admin/returns')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.returnRequests).toHaveLength(1);
      expect(response.body.data.returnRequests[0]).toMatchObject({
        returnRequestNumber: returnRequest.returnRequestNumber,
        status: 'pending_review',
        customer: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com'
        },
        order: {
          orderNumber: order.orderNumber
        }
      });
      expect(response.body.data.pagination).toMatchObject({
        currentPage: 1,
        totalReturnRequests: 1,
        hasNextPage: false,
        hasPrevPage: false
      });
    });

    it('should filter return requests by status', async () => {
      const response = await request(app)
        .get('/api/admin/returns?status=approved')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.returnRequests).toHaveLength(0);
      expect(response.body.data.pagination.totalReturnRequests).toBe(0);
    });

    it('should filter return requests by customer query', async () => {
      const response = await request(app)
        .get('/api/admin/returns?customerQuery=john')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.returnRequests).toHaveLength(1);
      expect(response.body.data.returnRequests[0].customer.firstName).toBe('John');
    });

    it('should paginate return requests', async () => {
      // Create another return request
      await ReturnRequest.create({
        orderId: order._id,
        orderNumber: order.orderNumber,
        userId: customerUser._id,
        customerEmail: customerUser.email,
        returnRequestNumber: '2024010002',
        status: 'approved',
        items: [{
          productId: order.items[0].productId,
          productName: 'Google Pixel 8',
          productSlug: 'google-pixel-8',
          quantity: 1,
          unitPrice: 699.99,
          totalRefundAmount: 699.99,
          reason: 'changed_mind'
        }],
        totalRefundAmount: 699.99
      });

      const response = await request(app)
        .get('/api/admin/returns?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.returnRequests).toHaveLength(1);
      expect(response.body.data.pagination).toMatchObject({
        currentPage: 1,
        totalReturnRequests: 2,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false
      });
    });

    it('should require admin authentication', async () => {
      const response = await request(app)
        .get('/api/admin/returns');

      expect(response.status).toBe(401);
    });

    it('should reject non-admin users', async () => {
      const customerToken = jwt.sign(
        {
          userId: customerUser._id,
          role: customerUser.role,
          email: customerUser.email
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '8h' }
      );

      const response = await request(app)
        .get('/api/admin/returns')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/returns/:returnRequestId', () => {
    it('should get return request details by ID', async () => {
      const response = await request(app)
        .get(`/api/admin/returns/${returnRequest._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.returnRequest).toMatchObject({
        returnRequestNumber: returnRequest.returnRequestNumber,
        status: 'pending_review',
        customer: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com'
        },
        order: {
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount
        },
        items: [{
          productName: 'Google Pixel 8',
          quantity: 1,
          reason: 'defective_item',
          reasonDescription: 'Screen has dead pixels'
        }]
      });
    });

    it('should return 404 for non-existent return request', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/admin/returns/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Return request not found');
    });

    it('should return 400 for invalid return request ID format', async () => {
      const response = await request(app)
        .get('/api/admin/returns/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid return request ID format');
    });

    it('should require admin authentication', async () => {
      const response = await request(app)
        .get(`/api/admin/returns/${returnRequest._id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/admin/returns/:returnRequestId/status', () => {
    it('should approve a return request', async () => {
      emailService.sendReturnApprovedEmail.mockResolvedValueOnce({ success: true });

      const response = await request(app)
        .put(`/api/admin/returns/${returnRequest._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'approved',
          adminNotes: 'Return approved for defective item'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Return request status updated to approved');
      expect(response.body.data.returnRequest.status).toBe('approved');
      expect(response.body.data.returnRequest.approvedDate).toBeDefined();

      expect(emailService.sendReturnApprovedEmail).toHaveBeenCalledTimes(1);

      // Verify database update
      const updatedReturnRequest = await ReturnRequest.findById(returnRequest._id);
      expect(updatedReturnRequest.status).toBe('approved');
      expect(updatedReturnRequest.processedBy.toString()).toBe(adminUser._id.toString());
    });

    it('should reject a return request with reason', async () => {
      emailService.sendReturnRejectedEmail.mockResolvedValueOnce({ success: true });

      const response = await request(app)
        .put(`/api/admin/returns/${returnRequest._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'rejected',
          rejectionReason: 'Item shows signs of misuse',
          adminNotes: 'Customer appears to have damaged the item'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Return request status updated to rejected');
      expect(response.body.data.returnRequest.status).toBe('rejected');

      expect(emailService.sendReturnRejectedEmail).toHaveBeenCalledWith(
        expect.any(Object),
        'Item shows signs of misuse'
      );

      // Verify database update
      const updatedReturnRequest = await ReturnRequest.findById(returnRequest._id);
      expect(updatedReturnRequest.status).toBe('rejected');
      expect(updatedReturnRequest.adminNotes).toContain('Item shows signs of misuse');
    });

    it('should mark return as refunded', async () => {
      emailService.sendReturnRefundedEmail.mockResolvedValueOnce({ success: true });

      const response = await request(app)
        .put(`/api/admin/returns/${returnRequest._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'refunded'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.returnRequest.status).toBe('refunded');
      expect(response.body.data.returnRequest.refundProcessedDate).toBeDefined();

      expect(emailService.sendReturnRefundedEmail).toHaveBeenCalledTimes(1);
    });

    it('should require rejection reason when rejecting', async () => {
      const response = await request(app)
        .put(`/api/admin/returns/${returnRequest._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'rejected'
          // Missing rejectionReason
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Rejection reason is required when rejecting a return request');
    });

    it('should validate status values', async () => {
      const response = await request(app)
        .put(`/api/admin/returns/${returnRequest._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'invalid_status'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid status value');
    });

    it('should require new status', async () => {
      const response = await request(app)
        .put(`/api/admin/returns/${returnRequest._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('New status is required');
    });

    it('should handle email service failures gracefully', async () => {
      emailService.sendReturnApprovedEmail.mockRejectedValueOnce(new Error('Email service error'));

      const response = await request(app)
        .put(`/api/admin/returns/${returnRequest._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'approved'
        });

      // Should still succeed even if email fails
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.returnRequest.status).toBe('approved');
    });

    it('should return 404 for non-existent return request', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`/api/admin/returns/${nonExistentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'approved'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Return request not found');
    });

    it('should require admin authentication', async () => {
      const response = await request(app)
        .put(`/api/admin/returns/${returnRequest._id}/status`)
        .send({
          newStatus: 'approved'
        });

      expect(response.status).toBe(401);
    });

    it('should reject non-admin users', async () => {
      const customerToken = jwt.sign(
        {
          userId: customerUser._id,
          role: customerUser.role,
          email: customerUser.email
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '8h' }
      );

      const response = await request(app)
        .put(`/api/admin/returns/${returnRequest._id}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          newStatus: 'approved'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('Admin Returns Workflow Integration', () => {
    it('should complete full return approval workflow', async () => {
      emailService.sendReturnApprovedEmail.mockResolvedValueOnce({ success: true });

      // Step 1: Get all return requests
      const listResponse = await request(app)
        .get('/api/admin/returns')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data.returnRequests).toHaveLength(1);
      const returnReq = listResponse.body.data.returnRequests[0];

      // Step 2: Get return request details
      const detailsResponse = await request(app)
        .get(`/api/admin/returns/${returnReq._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(detailsResponse.status).toBe(200);
      expect(detailsResponse.body.data.returnRequest.status).toBe('pending_review');

      // Step 3: Approve the return request
      const approveResponse = await request(app)
        .put(`/api/admin/returns/${returnReq._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'approved',
          adminNotes: 'Return approved after review'
        });

      expect(approveResponse.status).toBe(200);
      expect(approveResponse.body.data.returnRequest.status).toBe('approved');

      // Step 4: Verify the status was updated
      const updatedDetailsResponse = await request(app)
        .get(`/api/admin/returns/${returnReq._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(updatedDetailsResponse.status).toBe(200);
      expect(updatedDetailsResponse.body.data.returnRequest.status).toBe('approved');
      expect(updatedDetailsResponse.body.data.returnRequest.approvedDate).toBeDefined();
      expect(updatedDetailsResponse.body.data.returnRequest.processedBy).toBeDefined();

      expect(emailService.sendReturnApprovedEmail).toHaveBeenCalledTimes(1);
    });

    it('should complete full return rejection workflow', async () => {
      emailService.sendReturnRejectedEmail.mockResolvedValueOnce({ success: true });

      // Step 1: Get return request
      const listResponse = await request(app)
        .get('/api/admin/returns')
        .set('Authorization', `Bearer ${adminToken}`);

      const returnReq = listResponse.body.data.returnRequests[0];

      // Step 2: Reject the return request
      const rejectResponse = await request(app)
        .put(`/api/admin/returns/${returnReq._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'rejected',
          rejectionReason: 'Outside return window',
          adminNotes: 'Return request submitted after 30-day window'
        });

      expect(rejectResponse.status).toBe(200);
      expect(rejectResponse.body.data.returnRequest.status).toBe('rejected');

      // Step 3: Verify the status and notes were updated
      const updatedDetailsResponse = await request(app)
        .get(`/api/admin/returns/${returnReq._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(updatedDetailsResponse.body.data.returnRequest.status).toBe('rejected');
      expect(updatedDetailsResponse.body.data.returnRequest.adminNotes).toContain('Outside return window');

      expect(emailService.sendReturnRejectedEmail).toHaveBeenCalledWith(
        expect.any(Object),
        'Outside return window'
      );
    });
  });
});