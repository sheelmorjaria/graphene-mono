import { vi, describe, it, test, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../test/setup.js';

// Mock the Order model
let mockOrderResolveValue = null;

const createMockQueryChain = () => {
  const queryChain = {};
  
  queryChain.session = vi.fn().mockReturnValue(queryChain);
  queryChain.populate = vi.fn().mockReturnValue(queryChain);
  queryChain.sort = vi.fn().mockReturnValue(queryChain);
  queryChain.limit = vi.fn().mockReturnValue(queryChain);
  queryChain.skip = vi.fn().mockReturnValue(queryChain);
  queryChain.select = vi.fn().mockReturnValue(queryChain);
  queryChain.exec = vi.fn().mockImplementation(() => Promise.resolve(mockOrderResolveValue));
  queryChain.then = vi.fn().mockImplementation((resolve) => Promise.resolve(mockOrderResolveValue).then(resolve));
  
  return queryChain;
};

const mockFindById = vi.fn().mockImplementation(() => createMockQueryChain());
const mockSave = vi.fn();
const mockGetMaxRefundableAmount = vi.fn();
const mockIsRefundEligible = vi.fn();

const mockOrder = {
  findById: mockFindById,
  save: mockSave,
  getMaxRefundableAmount: mockGetMaxRefundableAmount,
  isRefundEligible: mockIsRefundEligible
};

// Mock email service (prepared for testing)
const mockSendRefundConfirmationEmail = vi.fn();
// const mockEmailService = { sendRefundConfirmationEmail: mockSendRefundConfirmationEmail };

// Set up mocks before imports
// Mocking will be handled in beforeEach

// Mock mongoose session
const mockSession = {
  startTransaction: vi.fn(),
  commitTransaction: vi.fn(),
  abortTransaction: vi.fn(),
  endSession: vi.fn()
};

// Use global mongoose mock from setup.vitest.js instead of local override

// Import dependencies
import Order from '../../models/Order.js';
import emailService from '../../services/emailService.js';
import { issueRefund } from '../adminController.js';

describe('Admin Controller - issueRefund', () => {
  let req, res;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Mock Order methods
    vi.spyOn(Order, 'findById').mockImplementation(mockFindById);
    
    // Mock email service
    vi.spyOn(emailService, 'sendRefundConfirmationEmail').mockImplementation(mockSendRefundConfirmationEmail);
    
    req = {
      params: { orderId: '507f1f77bcf86cd799439011' },
      body: {
        refundAmount: 50.00,
        refundReason: 'Customer requested refund'
      },
      user: { _id: 'admin123' }
    };
    
    res = {
      status: vi.fn(() => res),
      json: vi.fn()
    };
    
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
      mongoose.Types.ObjectId.isValid = vi.fn().mockReturnValue(false);
      
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
      // mongoose already imported at top
      mongoose.Types.ObjectId.isValid = vi.fn().mockReturnValue(true);
    });

    it('should return 404 if order is not found', async () => {
      mockOrderResolveValue = null;
      
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
        getMaxRefundableAmount: vi.fn()
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
        getMaxRefundableAmount: vi.fn().mockReturnValue(25.00),
        refundHistory: [],
        totalRefundedAmount: 0,
        totalAmount: 100,
        save: vi.fn()
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
        getMaxRefundableAmount: vi.fn().mockReturnValue(100),
        save: vi.fn().mockResolvedValue()
      };
      
      // mongoose already imported at top
      mongoose.Types.ObjectId.isValid = vi.fn().mockReturnValue(true);
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
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockPopulatedOrder)
      };
      mockOrder.findById = vi.fn().mockReturnValue(mockQuery);
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
      // mongoose already imported at top
      mongoose.Types.ObjectId.isValid = vi.fn().mockReturnValue(true);
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