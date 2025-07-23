import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the dependencies before any imports
vi.mock('../../models/Order.js', () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn()
  }
}));

vi.mock('mongoose', () => ({
  default: {
    Types: {
      ObjectId: {
        isValid: vi.fn()
      }
    }
  }
}));

import { updateOrderStatus, getOrderDetails, getAllOrders } from '../internalOrderController.js';
import Order from '../../models/Order.js';
import mongoose from 'mongoose';

describe('Internal Order Controller - Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      params: {},
      query: {},
      body: {}
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      req.params.orderId = '111111111111111111111111';
      req.body = {
        status: 'shipped',
        trackingNumber: 'TRACK123',
        trackingUrl: 'https://tracking.com/TRACK123',
        note: 'Package shipped'
      };

      const mockOrder = {
        _id: '111111111111111111111111',
        orderNumber: 'ORD001',
        status: 'processing',
        trackingNumber: null,
        trackingUrl: null,
        statusHistory: [],
        save: vi.fn().mockImplementation(function() {
          this.statusHistory = [{ status: 'shipped', date: new Date(), note: 'Package shipped' }];
          this.getStatusDisplay = vi.fn().mockReturnValue('Shipped');
          return Promise.resolve(this);
        }),
        getStatusDisplay: vi.fn().mockReturnValue('Processing')
      };

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Order.findById.mockResolvedValue(mockOrder);

      await updateOrderStatus(req, res);

      expect(mongoose.Types.ObjectId.isValid).toHaveBeenCalledWith('111111111111111111111111');
      expect(Order.findById).toHaveBeenCalledWith('111111111111111111111111');
      expect(mockOrder.save).toHaveBeenCalled();
      expect(mockOrder.status).toBe('shipped');
      expect(mockOrder.trackingNumber).toBe('TRACK123');

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Order status updated successfully',
        data: {
          order: expect.objectContaining({
            _id: '111111111111111111111111',
            orderNumber: 'ORD001',
            status: 'shipped',
            statusDisplay: 'Shipped'
          })
        }
      });
    });

    it('should return 400 for invalid order ID', async () => {
      req.params.orderId = 'invalid-id';
      req.body = { status: 'shipped' };

      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid order ID format'
      });
    });

    it('should return 400 when status is missing', async () => {
      req.params.orderId = '111111111111111111111111';
      req.body = {};

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);

      await updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Status is required'
      });
    });

    it('should return 404 for non-existent order', async () => {
      req.params.orderId = '111111111111111111111111';
      req.body = { status: 'shipped' };

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Order.findById.mockResolvedValue(null);

      await updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order not found'
      });
    });
  });

  describe('getOrderDetails', () => {
    it('should return order details successfully', async () => {
      req.params.orderId = '111111111111111111111111';

      const mockOrder = {
        _id: '111111111111111111111111',
        orderNumber: 'ORD001',
        status: 'processing',
        customerEmail: 'test@example.com',
        items: [{ productName: 'Test Product', quantity: 1 }],
        totalAmount: 100,
        getStatusDisplay: vi.fn().mockReturnValue('Processing'),
        statusHistory: [],
        subtotal: 90,
        tax: 10,
        shipping: 0,
        shippingAddress: {},
        billingAddress: {},
        shippingMethod: {},
        paymentMethod: {},
        paymentDetails: {},
        paymentStatus: 'completed',
        orderDate: new Date(),
        trackingNumber: null,
        trackingUrl: null,
        userId: '123456789012345678901234',
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: 'Test notes'
      };

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Order.findById.mockResolvedValue(mockOrder);

      await getOrderDetails(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          order: expect.objectContaining({
            _id: '111111111111111111111111',
            orderNumber: 'ORD001',
            status: 'processing',
            statusDisplay: 'Processing',
            customerEmail: 'test@example.com'
          })
        }
      });
    });

    it('should return 400 for invalid order ID', async () => {
      req.params.orderId = 'invalid-id';

      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await getOrderDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid order ID format'
      });
    });
  });

  describe('getAllOrders', () => {
    it('should return paginated orders', async () => {
      req.query = { page: '1', limit: '10' };

      const mockOrders = [
        {
          _id: '111111111111111111111111',
          orderNumber: 'ORD001',
          status: 'pending',
          getStatusDisplay: vi.fn().mockReturnValue('Pending'),
          orderDate: new Date(),
          totalAmount: 100,
          trackingNumber: null,
          userId: '123456789012345678901234',
          customerEmail: 'test@example.com'
        }
      ];

      const mockFind = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue(mockOrders)
      };

      Order.find.mockReturnValue(mockFind);
      Order.countDocuments.mockResolvedValue(1);

      await getAllOrders(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          orders: expect.arrayContaining([
            expect.objectContaining({
              _id: '111111111111111111111111',
              orderNumber: 'ORD001',
              status: 'pending',
              statusDisplay: 'Pending'
            })
          ]),
          pagination: expect.objectContaining({
            currentPage: 1,
            totalPages: 1,
            totalOrders: 1,
            hasNextPage: false,
            hasPrevPage: false,
            limit: 10
          })
        }
      });
    });

    it('should handle database errors', async () => {
      req.query = {};

      const mockFind = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockRejectedValue(new Error('Database error'))
      };

      Order.find.mockReturnValue(mockFind);

      await getAllOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });
  });
});