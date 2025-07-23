import { vi, describe, it, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getAllReturnRequests, getReturnRequestById, updateReturnRequestStatus } from '../adminController.js';
import ReturnRequest from '../../models/ReturnRequest.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';

// Mock email service
const emailService = {
  sendEmail: vi.fn().mockResolvedValue(true),
  sendReturnStatusUpdateEmail: vi.fn().mockResolvedValue(true),
  sendReturnApprovalEmail: vi.fn().mockResolvedValue(true),
  sendReturnRejectionEmail: vi.fn().mockResolvedValue(true)
};

describe('Admin Controller - Return Management', () => {
  let mongoServer;
  let req, res;
  let mockAdminUser, mockCustomerUser, mockOrder, mockReturnRequest;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Disconnect if already connected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await ReturnRequest.deleteMany({});
    await User.deleteMany({});
    await Order.deleteMany({});

    // Reset mocks
    vi.clearAllMocks();

    // Create mock admin user
    mockAdminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      isActive: true
    });

    // Create mock customer user
    mockCustomerUser = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      password: 'password123',
      role: 'customer',
      isActive: true
    });

    // Create mock order
    mockOrder = await Order.create({
      userId: mockCustomerUser._id,
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

    // Create mock return request
    mockReturnRequest = await ReturnRequest.create({
      orderId: mockOrder._id,
      orderNumber: mockOrder.orderNumber,
      userId: mockCustomerUser._id,
      customerEmail: mockCustomerUser.email,
      returnRequestNumber: '2024010001',
      status: 'pending_review',
      items: [{
        productId: mockOrder.items[0].productId,
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

    // Setup request and response mocks
    req = {
      user: mockAdminUser,
      query: {},
      params: {},
      body: {}
    };

    res = {
      json: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis()
    };
  });

  describe('getAllReturnRequests', () => {
    it('should get all return requests with default pagination', async () => {
      await getAllReturnRequests(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          returnRequests: expect.arrayContaining([
            expect.objectContaining({
              _id: expect.any(Object),
              returnRequestNumber: mockReturnRequest.returnRequestNumber,
              status: 'pending_review',
              customer: expect.objectContaining({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@test.com'
              }),
              order: expect.objectContaining({
                orderNumber: mockOrder.orderNumber
              })
            })
          ]),
          pagination: expect.objectContaining({
            currentPage: 1,
            totalReturnRequests: 1,
            hasNextPage: false,
            hasPrevPage: false
          })
        }
      });
    });

    it('should filter return requests by status', async () => {
      req.query.status = 'approved';

      await getAllReturnRequests(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          returnRequests: [],
          pagination: expect.objectContaining({
            totalReturnRequests: 0
          })
        }
      });
    });

    it('should filter return requests by customer query', async () => {
      req.query.customerQuery = 'john';

      await getAllReturnRequests(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          returnRequests: expect.arrayContaining([
            expect.objectContaining({
              customer: expect.objectContaining({
                firstName: 'John'
              })
            })
          ]),
          pagination: expect.objectContaining({
            totalReturnRequests: 1
          })
        }
      });
    });

    it('should handle errors gracefully', async () => {
      // Force an error by using invalid aggregation
      vi.spyOn(ReturnRequest, 'aggregate').mockRejectedValueOnce(new Error('Database error'));

      await getAllReturnRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error while fetching return requests'
      });
    });
  });

  describe('getReturnRequestById', () => {
    it('should get a return request by ID', async () => {
      req.params.returnRequestId = mockReturnRequest._id.toString();

      await getReturnRequestById(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          returnRequest: expect.objectContaining({
            _id: expect.any(Object),
            returnRequestNumber: mockReturnRequest.returnRequestNumber,
            status: 'pending_review',
            customer: expect.objectContaining({
              firstName: 'John',
              lastName: 'Doe'
            }),
            order: expect.objectContaining({
              orderNumber: mockOrder.orderNumber
            }),
            items: expect.arrayContaining([
              expect.objectContaining({
                productName: 'Google Pixel 8',
                reason: 'defective_item'
              })
            ])
          })
        }
      });
    });

    it('should return 400 for invalid return request ID format', async () => {
      req.params.returnRequestId = 'invalid-id';

      await getReturnRequestById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid return request ID format'
      });
    });

    it('should return 404 for non-existent return request', async () => {
      req.params.returnRequestId = new mongoose.Types.ObjectId().toString();

      await getReturnRequestById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Return request not found'
      });
    });

    it('should return 400 for missing return request ID', async () => {
      req.params.returnRequestId = '';

      await getReturnRequestById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Return request ID is required'
      });
    });
  });

  describe('updateReturnRequestStatus', () => {
    it('should approve a return request', async () => {
      req.params.returnRequestId = mockReturnRequest._id.toString();
      req.body = {
        newStatus: 'approved',
        adminNotes: 'Return approved for defective item'
      };

      emailService.sendReturnApprovedEmail.mockResolvedValueOnce({ success: true });

      await updateReturnRequestStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Return request status updated to approved',
        data: {
          returnRequest: expect.objectContaining({
            status: 'approved',
            approvedDate: expect.any(Date),
            processedBy: mockAdminUser._id
          })
        }
      });

      expect(emailService.sendReturnApprovedEmail).toHaveBeenCalledTimes(1);
    });

    it('should reject a return request with reason', async () => {
      req.params.returnRequestId = mockReturnRequest._id.toString();
      req.body = {
        newStatus: 'rejected',
        rejectionReason: 'Item shows signs of misuse',
        adminNotes: 'Rejection due to customer misuse'
      };

      emailService.sendReturnRejectedEmail.mockResolvedValueOnce({ success: true });

      await updateReturnRequestStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Return request status updated to rejected',
        data: {
          returnRequest: expect.objectContaining({
            status: 'rejected',
            processedBy: mockAdminUser._id
          })
        }
      });

      expect(emailService.sendReturnRejectedEmail).toHaveBeenCalledWith(
        expect.any(Object),
        'Item shows signs of misuse'
      );
    });

    it('should require rejection reason when rejecting', async () => {
      req.params.returnRequestId = mockReturnRequest._id.toString();
      req.body = {
        newStatus: 'rejected'
        // Missing rejectionReason
      };

      await updateReturnRequestStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Rejection reason is required when rejecting a return request'
      });
    });

    it('should return 400 for invalid status', async () => {
      req.params.returnRequestId = mockReturnRequest._id.toString();
      req.body = {
        newStatus: 'invalid_status'
      };

      await updateReturnRequestStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid status value'
      });
    });

    it('should return 400 for missing new status', async () => {
      req.params.returnRequestId = mockReturnRequest._id.toString();
      req.body = {};

      await updateReturnRequestStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'New status is required'
      });
    });

    it('should handle email service failures gracefully', async () => {
      req.params.returnRequestId = mockReturnRequest._id.toString();
      req.body = {
        newStatus: 'approved'
      };

      emailService.sendReturnApprovedEmail.mockRejectedValueOnce(new Error('Email service error'));

      await updateReturnRequestStatus(req, res);

      // Should still succeed even if email fails
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Return request status updated to approved',
        data: {
          returnRequest: expect.objectContaining({
            status: 'approved'
          })
        }
      });
    });

    it('should set refund processed date when status is refunded', async () => {
      req.params.returnRequestId = mockReturnRequest._id.toString();
      req.body = {
        newStatus: 'refunded'
      };

      emailService.sendReturnRefundedEmail.mockResolvedValueOnce({ success: true });

      await updateReturnRequestStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Return request status updated to refunded',
        data: {
          returnRequest: expect.objectContaining({
            status: 'refunded',
            refundProcessedDate: expect.any(Date)
          })
        }
      });

      expect(emailService.sendReturnRefundedEmail).toHaveBeenCalledTimes(1);
    });
  });
});