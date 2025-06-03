import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// Mock the Order model
const mockFindById = jest.fn();
const mockSave = jest.fn();
const mockGetMaxRefundableAmount = jest.fn();
const mockIsRefundEligible = jest.fn();

const mockOrder = {
  findById: mockFindById,
  save: mockSave,
  getMaxRefundableAmount: mockGetMaxRefundableAmount,
  isRefundEligible: mockIsRefundEligible
};

// Mock email service
const mockSendRefundConfirmationEmail = jest.fn();
const mockEmailService = {
  sendRefundConfirmationEmail: mockSendRefundConfirmationEmail
};

// Set up mocks before imports
jest.unstable_mockModule('../../models/Order.js', () => ({
  default: mockOrder
}));

jest.unstable_mockModule('../../services/emailService.js', () => ({
  default: mockEmailService
}));

// Mock mongoose session
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn()
};

jest.unstable_mockModule('mongoose', () => ({
  default: {
    startSession: jest.fn(() => mockSession),
    Types: {
      ObjectId: {
        isValid: jest.fn()
      }
    },
    Schema: class MockSchema {
      constructor() {}
    },
    model: jest.fn()
  }
}));

// Dynamic import of the controller
const { issueRefund } = await import('../adminController.js');

describe('Admin Controller - issueRefund', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { orderId: '507f1f77bcf86cd799439011' },
      body: {
        refundAmount: 50.00,
        refundReason: 'Customer requested refund'
      },
      user: { _id: 'admin123' }
    };
    
    res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };

    jest.clearAllMocks();
    
    // Default mongoose session mock setup
    mockSession.startTransaction.mockResolvedValue();
    mockSession.commitTransaction.mockResolvedValue();
    mockSession.abortTransaction.mockResolvedValue();
    mockSession.endSession.mockResolvedValue();
  });

  describe('Input Validation', () => {
    it('should return 400 if refund amount is missing', async () => {
      req.body.refundAmount = undefined;
      
      await issueRefund(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Refund amount and reason are required'
      });
    });

    it('should return 400 if refund reason is missing', async () => {
      req.body.refundReason = undefined;
      
      await issueRefund(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Refund amount and reason are required'
      });
    });

    it('should return 400 if refund amount is not a positive number', async () => {
      req.body.refundAmount = -10;
      
      await issueRefund(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Refund amount must be a positive number'
      });
    });

    it('should return 400 if refund reason is empty string', async () => {
      req.body.refundReason = '   ';
      
      await issueRefund(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Refund reason is required'
      });
    });

    it('should return 400 if order ID format is invalid', async () => {
      req.params.orderId = 'invalid-id';
      
      // Mock mongoose ObjectId validation
      const mockMongoose = await import('mongoose');
      mockMongoose.default.Types.ObjectId.isValid.mockReturnValue(false);
      
      await issueRefund(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid order ID format'
      });
    });
  });

  describe('Order Validation', () => {
    beforeEach(() => {
      // Mock valid ObjectId
      const mockMongoose = import('mongoose');
      mockMongoose.then(m => m.default.Types.ObjectId.isValid.mockReturnValue(true));
    });

    it('should return 404 if order is not found', async () => {
      mockFindById.mockResolvedValue(null);
      
      await issueRefund(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Order not found'
      });
    });

    it('should return 400 if order payment status is not completed', async () => {
      const mockOrderDoc = {
        paymentStatus: 'pending',
        getMaxRefundableAmount: jest.fn()
      };
      
      mockFindById.mockResolvedValue(mockOrderDoc);
      
      await issueRefund(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot refund order with payment status: pending'
      });
    });

    it('should return 400 if refund amount exceeds maximum refundable', async () => {
      const mockOrderDoc = {
        paymentStatus: 'completed',
        getMaxRefundableAmount: jest.fn().mockReturnValue(25.00),
        refundHistory: [],
        totalRefundedAmount: 0,
        totalAmount: 100,
        save: jest.fn()
      };
      
      mockFindById.mockResolvedValue(mockOrderDoc);
      req.body.refundAmount = 50.00; // Exceeds max refundable of 25.00
      
      await issueRefund(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Refund amount (£50.00) exceeds maximum refundable amount (£25.00)'
      });
    });
  });

  describe('Successful Refund Processing', () => {
    let mockOrderDoc;

    beforeEach(() => {
      mockOrderDoc = {
        _id: '507f1f77bcf86cd799439011',
        paymentStatus: 'completed',
        refundStatus: 'none',
        totalAmount: 100,
        totalRefundedAmount: 0,
        refundHistory: [],
        statusHistory: [],
        getMaxRefundableAmount: jest.fn().mockReturnValue(100),
        save: jest.fn().mockResolvedValue()
      };
      
      const mockMongoose = import('mongoose');
      mockMongoose.then(m => m.default.Types.ObjectId.isValid.mockReturnValue(true));
      mockFindById.mockResolvedValue(mockOrderDoc);
      
      // Mock the populated order response
      const mockPopulatedOrder = {
        ...mockOrderDoc,
        userId: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        refundHistory: [{
          refundId: expect.any(String),
          amount: 50,
          reason: 'Customer requested refund',
          adminUserId: { firstName: 'Admin', lastName: 'User' },
          status: 'succeeded'
        }]
      };
      
      // Mock chained populate calls
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockPopulatedOrder)
      };
      mockOrder.findById = jest.fn().mockReturnValue(mockQuery);
    });

    it('should process partial refund successfully', async () => {
      req.body.refundAmount = 50.00;
      
      await issueRefund(req, res);
      
      expect(mockOrderDoc.save).toHaveBeenCalled();
      expect(mockOrderDoc.totalRefundedAmount).toBe(50);
      expect(mockOrderDoc.refundStatus).toBe('partial_refunded');
      expect(mockOrderDoc.refundHistory).toHaveLength(1);
      expect(mockOrderDoc.refundHistory[0].amount).toBe(50);
      expect(mockOrderDoc.refundHistory[0].reason).toBe('Customer requested refund');
      
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Refund of £50.00 processed successfully',
        data: expect.objectContaining({
          order: expect.any(Object),
          refund: expect.any(Object)
        })
      });
    });

    it('should process full refund and update order status', async () => {
      req.body.refundAmount = 100.00;
      mockOrderDoc.getMaxRefundableAmount.mockReturnValue(100);
      
      await issueRefund(req, res);
      
      expect(mockOrderDoc.totalRefundedAmount).toBe(100);
      expect(mockOrderDoc.refundStatus).toBe('fully_refunded');
      expect(mockOrderDoc.paymentStatus).toBe('refunded');
      expect(mockOrderDoc.status).toBe('refunded');
      expect(mockOrderDoc.statusHistory).toHaveLength(1);
      expect(mockOrderDoc.statusHistory[0].status).toBe('refunded');
    });

    it('should send refund confirmation email', async () => {
      await issueRefund(req, res);
      
      expect(mockSendRefundConfirmationEmail).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          amount: 50,
          reason: 'Customer requested refund'
        })
      );
    });

    it('should not fail if email sending fails', async () => {
      mockSendRefundConfirmationEmail.mockRejectedValue(new Error('Email service down'));
      
      await issueRefund(req, res);
      
      // Should still return success even if email fails
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Refund of £50.00 processed successfully',
        data: expect.any(Object)
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      const mockMongoose = import('mongoose');
      mockMongoose.then(m => m.default.Types.ObjectId.isValid.mockReturnValue(true));
    });

    it('should handle database errors and abort transaction', async () => {
      mockFindById.mockRejectedValue(new Error('Database connection failed'));
      
      await issueRefund(req, res);
      
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error while processing refund'
      });
    });

    it('should handle validation errors specifically', async () => {
      mockFindById.mockRejectedValue(new Error('refund amount exceeds limit'));
      
      await issueRefund(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'refund amount exceeds limit'
      });
    });
  });
});