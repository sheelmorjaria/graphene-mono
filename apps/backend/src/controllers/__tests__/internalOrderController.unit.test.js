import { vi, describe, it, expect, beforeEach } from 'vitest';
import { updateOrderStatus, getOrderDetails, getAllOrders } from '../internalOrderController.js';
import Order from '../../models/Order.js';
import mongoose from 'mongoose';

// Mock dependencies
vi.mock('../../models/Order.js');
vi.mock('mongoose');

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

    // Mock mongoose.Types.ObjectId.isValid
    mongoose.Types = {
      ObjectId: {
        isValid: vi.fn()
      }
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
        statusHistory: [{
          status: 'shipped',
          date: new Date(),
          note: ''
        }],
        save: vi.fn().mockResolvedValue({
          _id: '111111111111111111111111',
          orderNumber: 'ORD001',
          status: 'shipped',
          trackingNumber: 'TRACK123',
          trackingUrl: 'https://tracking.com/TRACK123',
          statusHistory: [{
            status: 'shipped',
            date: new Date(),
            note: 'Package shipped'
          }],
          updatedAt: new Date(),
          getStatusDisplay: vi.fn().mockReturnValue('Shipped')
        }),
        getStatusDisplay: vi.fn().mockReturnValue('Shipped')
      };

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Order.findById = vi.fn().mockResolvedValue(mockOrder);

      await updateOrderStatus(req, res);

      expect(Order.findById).toHaveBeenCalledWith('111111111111111111111111');
      expect(mockOrder.status).toBe('shipped');
      expect(mockOrder.trackingNumber).toBe('TRACK123');
      expect(mockOrder.trackingUrl).toBe('https://tracking.com/TRACK123');
      expect(mockOrder.save).toHaveBeenCalledTimes(2); // Once for status update, once for note update

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Order status updated successfully',
        data: {
          order: expect.objectContaining({
            _id: '111111111111111111111111',
            orderNumber: 'ORD001',
            status: 'shipped',
            statusDisplay: 'Shipped',
            trackingNumber: 'TRACK123',
            trackingUrl: 'https://tracking.com/TRACK123'
          })
        }
      });
    });

    it('should validate order ID format', async () => {
      req.params.orderId = 'invalid-id';
      req.body = { status: 'shipped' };

      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid order ID format'
      });
      expect(Order.findById).not.toHaveBeenCalled();
    });

    it('should require status field', async () => {
      req.params.orderId = '111111111111111111111111';
      req.body = {}; // No status

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);

      await updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Status is required'
      });
      expect(Order.findById).not.toHaveBeenCalled();
    });

    it('should validate status against enum values', async () => {
      req.params.orderId = '111111111111111111111111';
      req.body = { status: 'invalid-status' };

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);

      await updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid status. Must be one of: pending, processing, shipped, out_for_delivery, delivered, cancelled, returned'
      });
      expect(Order.findById).not.toHaveBeenCalled();
    });

    it('should handle non-existent order', async () => {
      req.params.orderId = '111111111111111111111111';
      req.body = { status: 'shipped' };

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Order.findById = vi.fn().mockResolvedValue(null);

      await updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order not found'
      });
    });

    it('should handle validation errors', async () => {
      req.params.orderId = '111111111111111111111111';
      req.body = { status: 'shipped' };

      const mockOrder = {
        status: 'processing',
        save: vi.fn().mockRejectedValue(new Error('Validation error'))
      };

      mockOrder.save.mockRejectedValue({
        name: 'ValidationError',
        errors: {
          field1: { message: 'Field1 error' },
          field2: { message: 'Field2 error' }
        }
      });

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Order.findById = vi.fn().mockResolvedValue(mockOrder);

      await updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation error: Field1 error, Field2 error'
      });
    });

    it('should handle database errors', async () => {
      req.params.orderId = '111111111111111111111111';
      req.body = { status: 'shipped' };

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Order.findById = vi.fn().mockRejectedValue(new Error('Database error'));

      await updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });

    it('should update without tracking information', async () => {
      req.params.orderId = '111111111111111111111111';
      req.body = { status: 'processing' };

      const mockOrder = {
        _id: '111111111111111111111111',
        orderNumber: 'ORD001',
        status: 'pending',
        statusHistory: [],
        save: vi.fn().mockResolvedValue({
          _id: '111111111111111111111111',
          orderNumber: 'ORD001',
          status: 'processing',
          statusHistory: [],
          updatedAt: new Date(),
          getStatusDisplay: vi.fn().mockReturnValue('Processing')
        }),
        getStatusDisplay: vi.fn().mockReturnValue('Processing')
      };

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Order.findById = vi.fn().mockResolvedValue(mockOrder);

      await updateOrderStatus(req, res);

      expect(mockOrder.save).toHaveBeenCalledTimes(1); // Only once since no note provided
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle undefined tracking fields', async () => {
      req.params.orderId = '111111111111111111111111';
      req.body = {
        status: 'shipped',
        trackingNumber: undefined,
        trackingUrl: undefined
      };

      const mockOrder = {
        _id: '111111111111111111111111',
        orderNumber: 'ORD001',
        status: 'processing',
        trackingNumber: 'OLD123',
        trackingUrl: 'https://old.com',
        statusHistory: [],
        save: vi.fn().mockResolvedValue({
          _id: '111111111111111111111111',
          orderNumber: 'ORD001',
          status: 'shipped',
          trackingNumber: undefined,
          trackingUrl: undefined,
          statusHistory: [],
          updatedAt: new Date(),
          getStatusDisplay: vi.fn().mockReturnValue('Shipped')
        }),
        getStatusDisplay: vi.fn().mockReturnValue('Shipped')
      };

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Order.findById = vi.fn().mockResolvedValue(mockOrder);

      await updateOrderStatus(req, res);

      expect(mockOrder.trackingNumber).toBe(undefined);
      expect(mockOrder.trackingUrl).toBe(undefined);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should not update note if status unchanged', async () => {
      req.params.orderId = '111111111111111111111111';
      req.body = {
        status: 'shipped',
        note: 'This note should not be added'
      };

      const mockOrder = {
        _id: '111111111111111111111111',
        orderNumber: 'ORD001',
        status: 'shipped', // Same status
        statusHistory: [],
        save: vi.fn().mockResolvedValue({
          _id: '111111111111111111111111',
          orderNumber: 'ORD001',
          status: 'shipped',
          statusHistory: [],
          updatedAt: new Date(),
          getStatusDisplay: vi.fn().mockReturnValue('Shipped')
        }),
        getStatusDisplay: vi.fn().mockReturnValue('Shipped')
      };

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Order.findById = vi.fn().mockResolvedValue(mockOrder);

      await updateOrderStatus(req, res);

      expect(mockOrder.save).toHaveBeenCalledTimes(1); // Only once since status didn't change
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getOrderDetails', () => {
    it('should return order details successfully', async () => {
      req.params.orderId = '111111111111111111111111';

      const mockOrder = {
        _id: '111111111111111111111111',
        orderNumber: 'ORD001',
        userId: '222222222222222222222222',
        customerEmail: 'test@example.com',
        status: 'delivered',
        statusHistory: [{ status: 'pending', date: new Date() }],
        items: [{ productId: '333333333333333333333333', quantity: 2 }],
        subtotal: 100,
        tax: 10,
        shipping: 15,
        totalAmount: 125,
        shippingAddress: { street: '123 Main St' },
        billingAddress: { street: '123 Main St' },
        shippingMethod: 'standard',
        paymentMethod: 'card',
        paymentDetails: { last4: '1234' },
        paymentStatus: 'paid',
        trackingNumber: 'TRACK123',
        trackingUrl: 'https://tracking.com/TRACK123',
        notes: 'Test order',
        orderDate: new Date('2023-01-01'),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        getStatusDisplay: vi.fn().mockReturnValue('Delivered')
      };

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Order.findById = vi.fn().mockResolvedValue(mockOrder);

      await getOrderDetails(req, res);

      expect(Order.findById).toHaveBeenCalledWith('111111111111111111111111');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          order: expect.objectContaining({
            _id: '111111111111111111111111',
            orderNumber: 'ORD001',
            userId: '222222222222222222222222',
            customerEmail: 'test@example.com',
            status: 'delivered',
            statusDisplay: 'Delivered',
            trackingNumber: 'TRACK123',
            trackingUrl: 'https://tracking.com/TRACK123'
          })
        }
      });
    });

    it('should validate order ID format', async () => {
      req.params.orderId = 'invalid-id';

      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await getOrderDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid order ID format'
      });
      expect(Order.findById).not.toHaveBeenCalled();
    });

    it('should handle non-existent order', async () => {
      req.params.orderId = '111111111111111111111111';

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Order.findById = vi.fn().mockResolvedValue(null);

      await getOrderDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order not found'
      });
    });

    it('should handle database errors', async () => {
      req.params.orderId = '111111111111111111111111';

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Order.findById = vi.fn().mockRejectedValue(new Error('Database error'));

      await getOrderDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });

    it('should handle orders without tracking information', async () => {
      req.params.orderId = '111111111111111111111111';

      const mockOrder = {
        _id: '111111111111111111111111',
        orderNumber: 'ORD001',
        userId: '222222222222222222222222',
        customerEmail: 'test@example.com',
        status: 'pending',
        statusHistory: [],
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        totalAmount: 0,
        shippingAddress: {},
        billingAddress: {},
        shippingMethod: 'standard',
        paymentMethod: 'card',
        paymentDetails: {},
        paymentStatus: 'pending',
        trackingNumber: null,
        trackingUrl: null,
        notes: '',
        orderDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        getStatusDisplay: vi.fn().mockReturnValue('Pending')
      };

      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Order.findById = vi.fn().mockResolvedValue(mockOrder);

      await getOrderDetails(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.data.order.trackingNumber).toBeNull();
      expect(response.data.order.trackingUrl).toBeNull();
    });
  });

  describe('getAllOrders', () => {
    it('should return all orders with default pagination', async () => {
      const mockOrders = [
        {
          _id: '111111111111111111111111',
          orderNumber: 'ORD001',
          userId: '222222222222222222222222',
          customerEmail: 'test1@example.com',
          status: 'delivered',
          orderDate: new Date('2023-01-01'),
          totalAmount: 100,
          trackingNumber: 'TRACK123',
          getStatusDisplay: vi.fn().mockReturnValue('Delivered')
        },
        {
          _id: '333333333333333333333333',
          orderNumber: 'ORD002',
          userId: '444444444444444444444444',
          customerEmail: 'test2@example.com',
          status: 'pending',
          orderDate: new Date('2023-01-02'),
          totalAmount: 200,
          trackingNumber: null,
          getStatusDisplay: vi.fn().mockReturnValue('Pending')
        }
      ];

      const mockFind = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue(mockOrders)
      };

      Order.find = vi.fn().mockReturnValue(mockFind);
      Order.countDocuments = vi.fn().mockResolvedValue(2);

      await getAllOrders(req, res);

      expect(Order.find).toHaveBeenCalledWith({});
      expect(mockFind.sort).toHaveBeenCalledWith({ orderDate: -1 });
      expect(mockFind.skip).toHaveBeenCalledWith(0);
      expect(mockFind.limit).toHaveBeenCalledWith(20);
      expect(mockFind.select).toHaveBeenCalledWith('orderNumber userId customerEmail status orderDate totalAmount trackingNumber');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          orders: [
            expect.objectContaining({
              _id: '111111111111111111111111',
              orderNumber: 'ORD001',
              status: 'delivered',
              statusDisplay: 'Delivered',
              hasTracking: true
            }),
            expect.objectContaining({
              _id: '333333333333333333333333',
              orderNumber: 'ORD002',
              status: 'pending',
              statusDisplay: 'Pending',
              hasTracking: false
            })
          ],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalOrders: 2,
            hasNextPage: false,
            hasPrevPage: false,
            limit: 20
          }
        }
      });
    });

    it('should handle custom pagination and filtering', async () => {
      req.query = {
        page: '2',
        limit: '10',
        status: 'shipped',
        userId: '222222222222222222222222',
        orderNumber: 'ORD001',
        sortBy: 'totalAmount',
        sortOrder: 'asc'
      };

      const mockFind = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue([])
      };

      Order.find = vi.fn().mockReturnValue(mockFind);
      Order.countDocuments = vi.fn().mockResolvedValue(0);
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);

      await getAllOrders(req, res);

      expect(Order.find).toHaveBeenCalledWith({
        status: 'shipped',
        userId: '222222222222222222222222',
        orderNumber: { $regex: 'ORD001', $options: 'i' }
      });
      expect(mockFind.sort).toHaveBeenCalledWith({ totalAmount: 1 });
      expect(mockFind.skip).toHaveBeenCalledWith(10);
      expect(mockFind.limit).toHaveBeenCalledWith(10);
    });

    it('should cap limit at 100', async () => {
      req.query = { limit: '200' };

      const mockFind = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue([])
      };

      Order.find = vi.fn().mockReturnValue(mockFind);
      Order.countDocuments = vi.fn().mockResolvedValue(0);

      await getAllOrders(req, res);

      expect(mockFind.limit).toHaveBeenCalledWith(100);
    });

    it('should handle invalid userId in filter', async () => {
      req.query = { userId: 'invalid-id' };

      const mockFind = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue([])
      };

      Order.find = vi.fn().mockReturnValue(mockFind);
      Order.countDocuments = vi.fn().mockResolvedValue(0);
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      await getAllOrders(req, res);

      // Should not include userId in filter if invalid
      expect(Order.find).toHaveBeenCalledWith({});
    });

    it('should handle database errors', async () => {
      Order.find = vi.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      await getAllOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });

    it('should handle Promise.all rejection', async () => {
      const mockFind = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue([])
      };

      Order.find = vi.fn().mockReturnValue(mockFind);
      Order.countDocuments = vi.fn().mockRejectedValue(new Error('Count error'));

      await getAllOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });

    it('should calculate pagination correctly', async () => {
      req.query = { page: '3', limit: '5' };

      const mockFind = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue([])
      };

      Order.find = vi.fn().mockReturnValue(mockFind);
      Order.countDocuments = vi.fn().mockResolvedValue(20);

      await getAllOrders(req, res);

      expect(mockFind.skip).toHaveBeenCalledWith(10); // (3-1) * 5
      expect(mockFind.limit).toHaveBeenCalledWith(5);

      const response = res.json.mock.calls[0][0];
      expect(response.data.pagination).toEqual({
        currentPage: 3,
        totalPages: 4, // Math.ceil(20/5)
        totalOrders: 20,
        hasNextPage: true, // 3 < 4
        hasPrevPage: true, // 3 > 1
        limit: 5
      });
    });

    it('should handle empty results', async () => {
      const mockFind = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue([])
      };

      Order.find = vi.fn().mockReturnValue(mockFind);
      Order.countDocuments = vi.fn().mockResolvedValue(0);

      await getAllOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          orders: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalOrders: 0,
            hasNextPage: false,
            hasPrevPage: false,
            limit: 20
          }
        }
      });
    });
  });
});