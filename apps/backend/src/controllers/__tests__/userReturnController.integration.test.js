import { vi, describe, it, test, expect, beforeEach, afterEach } from 'vitest';
import {
  getEligibleReturns,
  initiateReturn,
  getUserReturns,
  getReturnDetails,
  uploadReturnLabel
} from '../userReturnController.js';
import Order from '../../models/Order.js';
import Return from '../../models/Return.js';
import Product from '../../models/Product.js';
import mongoose from 'mongoose';

// Mock the models
vi.mock('../../models/Order.js');
vi.mock('../../models/Return.js');
vi.mock('../../models/Product.js');
// Use global mongoose mock from setup.vitest.js

describe('User Return Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      user: { userId: mongoose.Types.ObjectId() },
      body: {},
      params: {}
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    vi.clearAllMocks();
  });

  describe('getEligibleReturns', () => {
    const mockOrder = {
      _id: mongoose.Types.ObjectId(),
      orderNumber: 'ORD-001',
      status: 'delivered',
      deliveredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      items: [{
        _id: mongoose.Types.ObjectId(),
        productId: mongoose.Types.ObjectId(),
        productName: 'Google Pixel 7',
        quantity: 1,
        price: 599.99,
        returnEligible: true
      }]
    };

    it('should get eligible returns successfully', async () => {
      Order.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue([mockOrder])
      });

      await getEligibleReturns(mockReq, mockRes);

      expect(Order.find).toHaveBeenCalledWith({
        userId: mongoose.Types.ObjectId(),
        status: { $in: ['delivered', 'completed'] },
        deliveredAt: { $gte: expect.any(Date) }
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          eligibleOrders: [{
            orderId: mockOrder._id,
            orderNumber: mockOrder.orderNumber,
            deliveredAt: mockOrder.deliveredAt,
            eligibleItems: mockOrder.items
          }]
        }
      });
    });

    it('should handle no eligible returns', async () => {
      Order.find.mockReturnValue({
        populate: vi.fn().mockResolvedValue([])
      });

      await getEligibleReturns(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          eligibleOrders: []
        }
      });
    });

    it('should handle server errors', async () => {
      Order.find.mockReturnValue({
        populate: vi.fn().mockRejectedValue(new Error('Database error'))
      });

      await getEligibleReturns(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while fetching eligible returns'
      });
    });
  });

  describe('initiateReturn', () => {
    const mockOrderId = mongoose.Types.ObjectId();
    const mockItemId = mongoose.Types.ObjectId();
    const mockProductId = mongoose.Types.ObjectId();

    const mockOrder = {
      _id: mockOrderId,
      userId: mongoose.Types.ObjectId(), // Will be set properly in tests
      orderNumber: 'ORD-001',
      status: 'delivered',
      deliveredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      items: [{
        _id: mockItemId,
        productId: mockProductId,
        productName: 'Google Pixel 7',
        quantity: 1,
        price: 599.99,
        returnEligible: true
      }]
    };

    const mockProduct = {
      _id: mockProductId,
      name: 'Google Pixel 7',
      returnPolicy: {
        eligible: true,
        periodDays: 30
      }
    };

    beforeEach(() => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Order.findById.mockResolvedValue(mockOrder);
      Product.findById.mockResolvedValue(mockProduct);
      Return.findOne.mockResolvedValue(null); // No existing return
      Return.prototype.save = vi.fn().mockResolvedValue({
        _id: mongoose.Types.ObjectId(),
        returnNumber: 'RET-001'
      });
    });

    it('should initiate return successfully', async () => {
      mockReq.body = {
        orderId: mockOrderId.toString(),
        itemId: mockItemId.toString(),
        reason: 'defective',
        description: 'Screen is cracked'
      };

      await initiateReturn(mockReq, mockRes);

      expect(Order.findById).toHaveBeenCalledWith(mockOrderId.toString());
      expect(Product.findById).toHaveBeenCalledWith(mockProductId);
      expect(Return.findOne).toHaveBeenCalledWith({
        orderId: mockOrderId.toString(),
        'items.itemId': mockItemId.toString(),
        status: { $nin: ['cancelled', 'rejected'] }
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Return request initiated successfully',
        data: expect.objectContaining({
          returnNumber: 'RET-001'
        })
      });
    });

    it('should return 400 if required fields are missing', async () => {
      mockReq.body = {
        orderId: mockOrderId.toString()
        // Missing itemId, reason
      };

      await initiateReturn(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order ID, Item ID, and reason are required'
      });
    });

    it('should return 400 if order ID is invalid format', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      mockReq.body = {
        orderId: 'invalid-id',
        itemId: mockItemId.toString(),
        reason: 'defective'
      };

      await initiateReturn(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid order ID or item ID format'
      });
    });

    it('should return 404 if order not found', async () => {
      Order.findById.mockResolvedValue(null);

      mockReq.body = {
        orderId: mockOrderId.toString(),
        itemId: mockItemId.toString(),
        reason: 'defective'
      };

      await initiateReturn(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order not found'
      });
    });

    it('should return 403 if order belongs to different user', async () => {
      const differentOrder = {
        ...mockOrder,
        userId: mongoose.Types.ObjectId() // Different user
      };
      Order.findById.mockResolvedValue(differentOrder);

      mockReq.body = {
        orderId: mockOrderId.toString(),
        itemId: mockItemId.toString(),
        reason: 'defective'
      };

      await initiateReturn(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized to return items from this order'
      });
    });

    it('should return 400 if order is not delivered', async () => {
      const undeliveredOrder = {
        ...mockOrder,
        status: 'processing'
      };
      Order.findById.mockResolvedValue(undeliveredOrder);

      mockReq.body = {
        orderId: mockOrderId.toString(),
        itemId: mockItemId.toString(),
        reason: 'defective'
      };

      await initiateReturn(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order must be delivered to initiate return'
      });
    });

    it('should return 400 if item not found in order', async () => {
      const orderWithoutItem = {
        ...mockOrder,
        items: [] // No items
      };
      Order.findById.mockResolvedValue(orderWithoutItem);

      mockReq.body = {
        orderId: mockOrderId.toString(),
        itemId: mockItemId.toString(),
        reason: 'defective'
      };

      await initiateReturn(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Item not found in order'
      });
    });

    it('should return 400 if return period has expired', async () => {
      const expiredOrder = {
        ...mockOrder,
        deliveredAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) // 35 days ago
      };
      Order.findById.mockResolvedValue(expiredOrder);

      mockReq.body = {
        orderId: mockOrderId.toString(),
        itemId: mockItemId.toString(),
        reason: 'defective'
      };

      await initiateReturn(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Return period has expired. Returns must be initiated within 30 days of delivery.'
      });
    });

    it('should return 400 if product is not return eligible', async () => {
      const nonReturnableProduct = {
        ...mockProduct,
        returnPolicy: {
          eligible: false,
          periodDays: 30
        }
      };
      Product.findById.mockResolvedValue(nonReturnableProduct);

      mockReq.body = {
        orderId: mockOrderId.toString(),
        itemId: mockItemId.toString(),
        reason: 'defective'
      };

      await initiateReturn(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'This product is not eligible for returns'
      });
    });

    it('should return 400 if return already exists', async () => {
      const existingReturn = {
        _id: mongoose.Types.ObjectId(),
        status: 'pending'
      };
      Return.findOne.mockResolvedValue(existingReturn);

      mockReq.body = {
        orderId: mockOrderId.toString(),
        itemId: mockItemId.toString(),
        reason: 'defective'
      };

      await initiateReturn(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'A return request already exists for this item'
      });
    });

    it('should return 400 if reason is invalid', async () => {
      mockReq.body = {
        orderId: mockOrderId.toString(),
        itemId: mockItemId.toString(),
        reason: 'invalid-reason'
      };

      await initiateReturn(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid return reason. Valid reasons: defective, wrong_item, not_as_described, damaged_shipping, other'
      });
    });
  });

  describe('getUserReturns', () => {
    const mockReturns = [{
      _id: mongoose.Types.ObjectId(),
      returnNumber: 'RET-001',
      status: 'pending',
      createdAt: new Date(),
      orderId: mongoose.Types.ObjectId(),
      orderNumber: 'ORD-001'
    }];

    it('should get user returns successfully', async () => {
      Return.find.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue(mockReturns)
        })
      });

      await getUserReturns(mockReq, mockRes);

      expect(Return.find).toHaveBeenCalledWith({ userId: mongoose.Types.ObjectId() });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          returns: mockReturns
        }
      });
    });

    it('should handle server errors', async () => {
      Return.find.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      });

      await getUserReturns(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while fetching returns'
      });
    });
  });

  describe('getReturnDetails', () => {
    const mockReturnId = mongoose.Types.ObjectId();
    const mockReturn = {
      _id: mockReturnId,
      returnNumber: 'RET-001',
      userId: mongoose.Types.ObjectId(),
      status: 'pending'
    };

    beforeEach(() => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    });

    it('should get return details successfully', async () => {
      Return.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockReturn)
      });

      mockReq.params.returnId = mockReturnId.toString();

      await getReturnDetails(mockReq, mockRes);

      expect(Return.findById).toHaveBeenCalledWith(mockReturnId.toString());
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          return: mockReturn
        }
      });
    });

    it('should return 400 if return ID is invalid format', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      mockReq.params.returnId = 'invalid-id';

      await getReturnDetails(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid return ID format'
      });
    });

    it('should return 404 if return not found', async () => {
      Return.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      });

      mockReq.params.returnId = mockReturnId.toString();

      await getReturnDetails(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Return not found'
      });
    });

    it('should return 403 if return belongs to different user', async () => {
      const differentReturn = {
        ...mockReturn,
        userId: mongoose.Types.ObjectId()
      };
      Return.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(differentReturn)
      });

      mockReq.params.returnId = mockReturnId.toString();

      await getReturnDetails(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized to view this return'
      });
    });
  });

  describe('uploadReturnLabel', () => {
    const mockReturnId = mongoose.Types.ObjectId();
    const mockReturn = {
      _id: mockReturnId,
      userId: mongoose.Types.ObjectId(),
      status: 'approved',
      save: vi.fn().mockResolvedValue()
    };

    beforeEach(() => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(true);
      Return.findById.mockResolvedValue(mockReturn);
    });

    it('should upload return label successfully', async () => {
      mockReq.params.returnId = mockReturnId.toString();
      mockReq.body = {
        labelUrl: 'https://example.com/label.pdf',
        trackingNumber: 'TRK123456'
      };

      await uploadReturnLabel(mockReq, mockRes);

      expect(mockReturn.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Return label uploaded successfully',
        data: {
          returnId: mockReturnId,
          status: 'label_uploaded'
        }
      });
    });

    it('should return 400 if required fields are missing', async () => {
      mockReq.params.returnId = mockReturnId.toString();
      mockReq.body = {}; // Missing fields

      await uploadReturnLabel(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Label URL and tracking number are required'
      });
    });

    it('should return 400 if return is not approved', async () => {
      const unapprovedReturn = {
        ...mockReturn,
        status: 'pending'
      };
      Return.findById.mockResolvedValue(unapprovedReturn);

      mockReq.params.returnId = mockReturnId.toString();
      mockReq.body = {
        labelUrl: 'https://example.com/label.pdf',
        trackingNumber: 'TRK123456'
      };

      await uploadReturnLabel(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Return must be approved before uploading label'
      });
    });
  });
});