import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  getUserReturnRequests, 
  getReturnRequestDetails, 
  submitReturnRequest
} from '../userReturnController.js';
import ReturnRequest from '../../models/ReturnRequest.js';
import Order from '../../models/Order.js';
import emailService from '../../services/emailService.js';
import mongoose from 'mongoose';

// Mock all dependencies
vi.mock('../../models/ReturnRequest.js');
vi.mock('../../models/Order.js');
vi.mock('../../services/emailService.js');

describe('User Return Controller - Unit Tests', () => {
  let req, res, next;
  let mockUser;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUser = {
      _id: '123456789012345678901234',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe'
    };

    req = {
      user: mockUser,
      params: {},
      query: {},
      body: {}
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
      setHeader: vi.fn()
    };

    next = vi.fn();
  });

  describe('getUserReturnRequests', () => {
    it('should return user return requests with default pagination', async () => {
      const mockReturnRequests = [
        {
          _id: '111111111111111111111111',
          returnRequestNumber: 'RET001',
          orderNumber: 'ORD001',
          status: 'pending',
          totalRefundAmount: 100,
          totalItemsCount: 2,
          requestDate: new Date('2023-01-01'),
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
          formattedRequestNumber: 'RET-001',
          getFormattedStatus: vi.fn().mockReturnValue('Pending'),
          orderId: { _id: '222222222222222222222222' }
        }
      ];

      const mockFind = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue(mockReturnRequests)
      };

      ReturnRequest.find = vi.fn().mockReturnValue(mockFind);
      ReturnRequest.countDocuments = vi.fn().mockResolvedValue(1);

      await getUserReturnRequests(req, res);

      expect(ReturnRequest.find).toHaveBeenCalledWith({ userId: mockUser._id });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: '111111111111111111111111',
            returnRequestNumber: 'RET001',
            status: 'pending',
            formattedStatus: 'Pending'
          })
        ]),
        pagination: expect.objectContaining({
          page: 1,
          limit: 10,
          total: 1
        })
      });
    });

    it('should handle database errors', async () => {
      ReturnRequest.find = vi.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      await getUserReturnRequests(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while fetching return requests'
      });
    });
  });

  describe('getReturnRequestDetails', () => {
    it('should return return request details for valid ID', async () => {
      req.params.returnRequestId = '111111111111111111111111';

      const mockReturnRequest = {
        _id: '111111111111111111111111',
        returnRequestNumber: 'RET001',
        orderNumber: 'ORD001',
        orderId: {
          _id: '222222222222222222222222',
          orderNumber: 'ORD001',
          orderDate: new Date('2023-01-01')
        },
        status: 'approved',
        reason: 'Defective item',
        description: 'Product not working',
        getFormattedStatus: vi.fn().mockReturnValue('Approved'),
        canBeCancelled: vi.fn().mockReturnValue(false)
      };

      const mockFindOne = {
        populate: vi.fn().mockResolvedValue(mockReturnRequest)
      };

      ReturnRequest.findOne = vi.fn().mockReturnValue(mockFindOne);

      await getReturnRequestDetails(req, res);

      expect(ReturnRequest.findOne).toHaveBeenCalledWith({
        _id: '111111111111111111111111',
        userId: mockUser._id
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: '111111111111111111111111',
          returnRequestNumber: 'RET001',
          status: 'approved',
          formattedStatus: 'Approved'
        })
      });
    });

    it('should return 400 for invalid return request ID', async () => {
      req.params.returnRequestId = 'invalid-id';

      await getReturnRequestDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid return request ID'
      });
    });

    it('should return 404 for non-existent return request', async () => {
      req.params.returnRequestId = '111111111111111111111111';
      
      const mockFindOne = {
        populate: vi.fn().mockResolvedValue(null)
      };

      ReturnRequest.findOne = vi.fn().mockReturnValue(mockFindOne);

      await getReturnRequestDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Return request not found'
      });
    });
  });

  describe('submitReturnRequest', () => {
    it('should create return request successfully', async () => {
      req.body = {
        orderId: '222222222222222222222222',
        reason: 'defective',
        description: 'Product not working',
        items: [
          { productId: '333333333333333333333333', quantity: 1 }
        ]
      };

      const mockOrder = {
        _id: '222222222222222222222222',
        orderNumber: 'ORD001',
        userId: mockUser._id,
        status: 'delivered',
        items: [{
          productId: '333333333333333333333333',
          name: 'Test Product',
          quantity: 2,
          price: 100
        }],
        canReturn: vi.fn().mockReturnValue(true)
      };

      const mockReturnRequest = {
        _id: '111111111111111111111111',
        returnRequestNumber: 'RET001',
        save: vi.fn().mockResolvedValue(true)
      };

      Order.findOne = vi.fn().mockResolvedValue(mockOrder);
      ReturnRequest.prototype.save = vi.fn().mockResolvedValue(mockReturnRequest);
      emailService.sendReturnRequestConfirmation = vi.fn().mockResolvedValue();

      await submitReturnRequest(req, res);

      expect(Order.findOne).toHaveBeenCalledWith({
        _id: '222222222222222222222222',
        userId: mockUser._id
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Return request submitted successfully',
        data: expect.objectContaining({
          returnRequestId: '111111111111111111111111',
          returnRequestNumber: 'RET001'
        })
      });
    });

    it('should validate required fields', async () => {
      req.body = {
        orderId: '222222222222222222222222',
        // Missing reason
        items: []
      };

      await submitReturnRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Reason and at least one item are required'
      });
    });

    it('should validate orderId format', async () => {
      req.body = {
        orderId: 'invalid-id',
        reason: 'defective',
        items: [{ productId: '123' }]
      };

      await submitReturnRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid order ID'
      });
    });

    it('should handle non-existent order', async () => {
      req.body = {
        orderId: '222222222222222222222222',
        reason: 'defective',
        items: [{ productId: '333333333333333333333333' }]
      };

      Order.findOne = vi.fn().mockResolvedValue(null);

      await submitReturnRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order not found'
      });
    });

    it('should handle database errors', async () => {
      req.body = {
        orderId: '222222222222222222222222',
        reason: 'defective',
        items: [{ productId: '333333333333333333333333' }]
      };

      Order.findOne = vi.fn().mockRejectedValue(new Error('Database error'));

      await submitReturnRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while submitting return request'
      });
    });
  });
});