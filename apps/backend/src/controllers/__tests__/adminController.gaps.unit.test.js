import { vi, describe, test, beforeEach, expect } from 'vitest';
import mongoose from 'mongoose';

// Mock models individually
vi.mock('../../models/User.js', () => ({
  default: Object.assign(vi.fn(), {
    find: vi.fn(),
    findById: vi.fn(),
    countDocuments: vi.fn()
  })
}));

vi.mock('../../models/Order.js', () => ({
  default: Object.assign(vi.fn(), {
    find: vi.fn(),
    findById: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn()
  })
}));

vi.mock('../../models/Product.js', () => ({
  default: Object.assign(vi.fn(), {
    find: vi.fn(),
    findById: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn()
  })
}));

vi.mock('../../models/ReturnRequest.js', () => ({
  default: Object.assign(vi.fn(), {
    find: vi.fn(),
    findById: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn()
  })
}));

vi.mock('../../services/emailService.js', () => ({
  default: {
    sendReturnApprovedEmail: vi.fn().mockResolvedValue(true),
    sendReturnRejectedEmail: vi.fn().mockResolvedValue(true),
    sendReturnRefundedEmail: vi.fn().mockResolvedValue(true),
    sendAccountDisabledEmail: vi.fn().mockResolvedValue(true),
    sendAccountReEnabledEmail: vi.fn().mockResolvedValue(true)
  }
}));

// The global setup.vitest.js mocks mongoose but its top-level startSession
// does not provide withTransaction. Patch it in beforeEach (below) so the
// transactional controllers can run their transaction callbacks.

import {
  getDashboardMetrics,
  getAllUsers,
  getUserById,
  updateUserStatus,
  getAllOrders,
  getSalesReport,
  getProductPerformanceReport,
  getInventoryReport,
  getAllReturnRequests,
  getReturnRequestById,
  updateReturnRequestStatus
} from '../adminController.js';

import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import ReturnRequest from '../../models/ReturnRequest.js';
import emailService from '../../services/emailService.js';

// Helper to build a chainable query mock that resolves to data
const chainable = (data) => ({
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  populate: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(data)
});

describe('Admin Controller - Coverage Gap Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = { params: {}, query: {}, body: {}, user: { _id: 'admin123', userId: 'admin123' } };
    res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    // Patch the global mongoose mock's startSession to provide withTransaction.
    const session = {
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      abortTransaction: vi.fn(),
      endSession: vi.fn().mockResolvedValue(undefined),
      withTransaction: vi.fn().mockImplementation(async (fn) => fn(session))
    };
    mongoose.startSession = vi.fn().mockResolvedValue(session);
    mongoose.Types.ObjectId.isValid = vi.fn().mockImplementation((id) => {
      if (!id) return false;
      return /^[0-9a-fA-F]{24}$/.test(id.toString());
    });
  });

  // ---------------- getDashboardMetrics ----------------
  describe('getDashboardMetrics', () => {
    test('happy path: returns formatted metrics', async () => {
      // Order.countDocuments called 6 times, then 4 aggregates, then User.countDocuments x3
      Order.countDocuments
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(10) // today
        .mockResolvedValueOnce(40) // week
        .mockResolvedValueOnce(80) // month
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(3); // awaiting shipment

      Order.aggregate
        .mockResolvedValueOnce([{ total: 5000 }]) // total revenue
        .mockResolvedValueOnce([{ total: 500 }]) // today
        .mockResolvedValueOnce([{ total: 2000 }]) // week
        .mockResolvedValueOnce([]); // month (empty -> 0)

      User.countDocuments
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(20);

      await getDashboardMetrics(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            orders: { total: 100, today: 10, week: 40, month: 80, pending: 5, awaitingShipment: 3 },
            revenue: { total: 5000, today: 500, week: 2000, month: 0 },
            customers: { newToday: 2, newWeek: 8, newMonth: 20 }
          })
        })
      );
    });

    test('error: returns 500 on failure', async () => {
      Order.countDocuments.mockRejectedValue(new Error('DB down'));
      await getDashboardMetrics(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Server error while fetching dashboard metrics' });
    });
  });

  // ---------------- getAllUsers ----------------
  describe('getAllUsers', () => {
    test('happy path: returns users with pagination', async () => {
      const users = [{ _id: 'u1', email: 'a@b.com' }];
      User.find.mockReturnValue(chainable(users));
      User.countDocuments.mockResolvedValue(1);

      await getAllUsers(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ users, pagination: expect.any(Object) })
        })
      );
    });

    test('applies filters when provided', async () => {
      req.query = { searchQuery: 'john', accountStatus: 'active', emailVerified: 'true', role: 'customer', startDate: '2024-01-01', endDate: '2024-12-31', sortBy: 'email', sortOrder: 'asc' };
      User.find.mockReturnValue(chainable([]));
      User.countDocuments.mockResolvedValue(0);

      await getAllUsers(req, res);

      expect(User.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error: returns 500 on failure', async () => {
      User.find.mockImplementation(() => { throw new Error('boom'); });
      await getAllUsers(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Server error while fetching users' });
    });
  });

  // ---------------- getUserById ----------------
  describe('getUserById', () => {
    test('happy path: returns user with stats', async () => {
      const user = { _id: '507f1f77bcf86cd799439011', email: 'a@b.com' };
      User.findById.mockReturnValue(chainable(user));
      Order.countDocuments.mockResolvedValue(3);
      Order.aggregate.mockResolvedValue([{ total: 250 }]);

      req.params.userId = '507f1f77bcf86cd799439011';
      await getUserById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: { user: expect.objectContaining({ orderCount: 3, totalSpent: 250 }) } })
      );
    });

    test('returns 404 when user not found', async () => {
      User.findById.mockReturnValue(chainable(null));
      req.params.userId = '507f1f77bcf86cd799439011';
      await getUserById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'User not found' });
    });

    test('returns 400 on CastError', async () => {
      const err = new Error('Cast');
      err.name = 'CastError';
      User.findById.mockImplementation(() => { throw err; });
      req.params.userId = 'bad';
      await getUserById(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Invalid user ID format' });
    });
  });

  // ---------------- updateUserStatus ----------------
  describe('updateUserStatus', () => {
    test('happy path: disables user', async () => {
      const user = { _id: '507f1f77bcf86cd799439011', email: 'a@b.com', firstName: 'A', lastName: 'B', accountStatus: 'active', save: vi.fn().mockResolvedValue(true), updatedAt: new Date() };
      User.findById.mockResolvedValueOnce(user); // the target user
      User.findById.mockResolvedValueOnce({ _id: 'admin123' }); // admin user for email
      req.params.userId = '507f1f77bcf86cd799439011';
      req.body.newStatus = 'disabled';

      await updateUserStatus(req, res);

      expect(emailService.sendAccountDisabledEmail).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('happy path: re-enables user', async () => {
      const user = { _id: '507f1f77bcf86cd799439011', email: 'a@b.com', accountStatus: 'disabled', save: vi.fn().mockResolvedValue(true), updatedAt: new Date() };
      User.findById.mockResolvedValueOnce(user);
      User.findById.mockResolvedValueOnce({ _id: 'admin123' });
      req.params.userId = '507f1f77bcf86cd799439011';
      req.body.newStatus = 'active';

      await updateUserStatus(req, res);

      expect(emailService.sendAccountReEnabledEmail).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('returns 400 when newStatus missing', async () => {
      req.params.userId = '507f1f77bcf86cd799439011';
      req.body.newStatus = '';
      await updateUserStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 for invalid status value', async () => {
      req.params.userId = '507f1f77bcf86cd799439011';
      req.body.newStatus = 'frozen';
      await updateUserStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    test('returns 404 when user not found', async () => {
      User.findById.mockResolvedValue(null);
      req.params.userId = '507f1f77bcf86cd799439011';
      req.body.newStatus = 'disabled';
      await updateUserStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('prevents admin disabling own account', async () => {
      const user = { _id: 'admin123', accountStatus: 'active', save: vi.fn() };
      User.findById.mockResolvedValue(user);
      req.params.userId = 'admin123';
      req.body.newStatus = 'disabled';
      await updateUserStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Cannot disable your own account' });
    });

    test('returns 400 when status already set', async () => {
      const user = { _id: '507f1f77bcf86cd799439011', accountStatus: 'active', save: vi.fn() };
      User.findById.mockResolvedValue(user);
      req.params.userId = '507f1f77bcf86cd799439011';
      req.body.newStatus = 'active';
      await updateUserStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'User account is already active' });
    });
  });

  // ---------------- getAllOrders ----------------
  describe('getAllOrders', () => {
    test('happy path: returns orders with pagination', async () => {
      Order.aggregate
        .mockResolvedValueOnce([{ total: 5 }]) // count pipeline
        .mockResolvedValueOnce([{ _id: 'o1', orderNumber: 'ORD1' }]); // main pipeline
      req.query = { page: 1, limit: 10, status: 'pending', startDate: '2024-01-01', endDate: '2024-12-31', customerQuery: 'john', sortBy: 'totalAmount', sortOrder: 'asc' };

      await getAllOrders(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ orders: expect.any(Array), pagination: expect.any(Object) })
        })
      );
    });

    test('error: returns 500 on failure', async () => {
      Order.aggregate.mockRejectedValue(new Error('agg fail'));
      await getAllOrders(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Server error while fetching orders' });
    });
  });

  // ---------------- getSalesReport ----------------
  describe('getSalesReport', () => {
    test('happy path: returns sales data', async () => {
      Order.aggregate.mockResolvedValue([{ totalRevenue: 1000, orderCount: 10, averageOrderValue: 100 }]);
      req.query = { startDate: '2024-01-01', endDate: '2024-12-31' };
      await getSalesReport(req, res);
      expect(res.json).toHaveBeenCalledWith({ success: true, totalRevenue: 1000, orderCount: 10, averageOrderValue: 100 });
    });

    test('happy path: returns zeros when no data', async () => {
      Order.aggregate.mockResolvedValue([]);
      req.query = { startDate: '2024-01-01', endDate: '2024-12-31' };
      await getSalesReport(req, res);
      expect(res.json).toHaveBeenCalledWith({ success: true, totalRevenue: 0, orderCount: 0, averageOrderValue: 0 });
    });

    test('returns 400 when dates missing', async () => {
      req.query = {};
      await getSalesReport(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Start date and end date are required' });
    });

    test('error: returns 500 on failure', async () => {
      Order.aggregate.mockRejectedValue(new Error('fail'));
      req.query = { startDate: '2024-01-01', endDate: '2024-12-31' };
      await getSalesReport(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- getProductPerformanceReport ----------------
  describe('getProductPerformanceReport', () => {
    test('happy path: returns top and low stock products', async () => {
      Order.aggregate.mockResolvedValue([{ _id: 'p1', name: 'Phone', quantitySold: 5, revenue: 500 }]);
      Product.aggregate
        .mockResolvedValueOnce([{ _id: 'p1', name: 'Low', sku: 'L1', stockQuantity: 3 }]) // low stock
        .mockResolvedValueOnce([]); // not used here but safe
      req.query = { startDate: '2024-01-01', endDate: '2024-12-31' };

      await getProductPerformanceReport(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, topProducts: expect.any(Array), lowStockProducts: expect.any(Array) })
      );
    });

    test('returns 400 when dates missing', async () => {
      req.query = {};
      await getProductPerformanceReport(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('error: returns 500 on failure', async () => {
      Order.aggregate.mockRejectedValue(new Error('fail'));
      req.query = { startDate: '2024-01-01', endDate: '2024-12-31' };
      await getProductPerformanceReport(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- getInventoryReport ----------------
  describe('getInventoryReport', () => {
    test('happy path: returns inventory buckets', async () => {
      Product.aggregate.mockReset();
      Product.aggregate
        .mockResolvedValueOnce([{ _id: 0, count: 2 }, { _id: 1, count: 3 }, { _id: 11, count: 5 }])
        .mockResolvedValueOnce([{ _id: 'p1', name: 'Low', sku: 'L1', stockQuantity: 4 }]);

      await getInventoryReport(req, res);

      const call = res.json.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.inStockCount).toBe(5);
      expect(call.outOfStockCount).toBe(2);
      expect(call.lowStockCount).toBe(3);
      expect(Array.isArray(call.lowStockProducts)).toBe(true);
    });

    test('happy path: handles empty buckets', async () => {
      Product.aggregate.mockResolvedValue([]);
      await getInventoryReport(req, res);
      const call = res.json.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.inStockCount).toBe(0);
      expect(call.outOfStockCount).toBe(0);
      expect(call.lowStockCount).toBe(0);
    });

    test('error: returns 500 on failure', async () => {
      Product.aggregate.mockRejectedValue(new Error('fail'));
      await getInventoryReport(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- getAllReturnRequests ----------------
  describe('getAllReturnRequests', () => {
    test('happy path: returns return requests with pagination', async () => {
      ReturnRequest.aggregate
        .mockResolvedValueOnce([{ total: 3 }]) // count
        .mockResolvedValueOnce([{ _id: 'r1', returnRequestNumber: 'RR1' }]); // main
      req.query = { status: 'pending_review', customerQuery: 'john', startDate: '2024-01-01', endDate: '2024-12-31', sortBy: 'requestDate', sortOrder: 'asc' };

      await getAllReturnRequests(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: expect.objectContaining({ returnRequests: expect.any(Array), pagination: expect.any(Object) }) })
      );
    });

    test('error: returns 500 on failure', async () => {
      ReturnRequest.aggregate.mockRejectedValue(new Error('fail'));
      await getAllReturnRequests(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- getReturnRequestById ----------------
  describe('getReturnRequestById', () => {
    test('happy path: returns return request', async () => {
      ReturnRequest.aggregate.mockResolvedValue([{ _id: 'r1', status: 'pending_review' }]);
      req.params.returnRequestId = '507f1f77bcf86cd799439011';
      await getReturnRequestById(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { returnRequest: expect.any(Object) } }));
    });

    test('returns 404 when not found', async () => {
      ReturnRequest.aggregate.mockResolvedValue([]);
      req.params.returnRequestId = '507f1f77bcf86cd799439011';
      await getReturnRequestById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('returns 400 when ObjectId cast fails', async () => {
      const err = new Error('Cast to ObjectId failed');
      err.name = 'CastError';
      ReturnRequest.aggregate.mockRejectedValue(err);
      req.params.returnRequestId = '507f1f77bcf86cd799439011';
      await getReturnRequestById(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('error: returns 500 on failure', async () => {
      ReturnRequest.aggregate.mockRejectedValue(new Error('fail'));
      req.params.returnRequestId = '507f1f77bcf86cd799439011';
      await getReturnRequestById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- updateReturnRequestStatus ----------------
  describe('updateReturnRequestStatus', () => {
    // Build a thenable that also supports .session() chaining (used inside the
    // transaction) for the FIRST findById call.
    const sessionFindById = (resolved) => {
      const query = {
        session: vi.fn().mockReturnThis(),
        then: (fulfill) => Promise.resolve(resolved).then(fulfill)
      };
      // Make it a proper thenable
      query[Symbol.toStringTag] = 'Promise';
      return query;
    };

    // Chainable populate().populate().lean() for the SECOND findById call.
    const leanFindById = (resolved) => ({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(resolved)
        })
      })
    });

    test('happy path: approves return request', async () => {
      const rr = { _id: '507f1f77bcf86cd799439011', status: 'pending_review', save: vi.fn().mockResolvedValue(true) };
      ReturnRequest.findById.mockReturnValueOnce(sessionFindById(rr));
      ReturnRequest.findById.mockReturnValueOnce(leanFindById(rr));
      req.params.returnRequestId = '507f1f77bcf86cd799439011';
      req.body = { newStatus: 'approved', adminNotes: 'looks good' };

      await updateReturnRequestStatus(req, res);

      expect(emailService.sendReturnApprovedEmail).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('happy path: rejects return request with reason', async () => {
      const rr = { _id: '507f1f77bcf86cd799439011', status: 'pending_review', save: vi.fn().mockResolvedValue(true) };
      ReturnRequest.findById.mockReturnValueOnce(sessionFindById(rr));
      ReturnRequest.findById.mockReturnValueOnce(leanFindById(rr));
      req.params.returnRequestId = '507f1f77bcf86cd799439011';
      req.body = { newStatus: 'rejected', rejectionReason: 'damaged by customer' };

      await updateReturnRequestStatus(req, res);

      expect(emailService.sendReturnRejectedEmail).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('happy path: refund status', async () => {
      const rr = { _id: '507f1f77bcf86cd799439011', status: 'processing_refund', save: vi.fn().mockResolvedValue(true) };
      ReturnRequest.findById.mockReturnValueOnce(sessionFindById(rr));
      ReturnRequest.findById.mockReturnValueOnce(leanFindById(rr));
      req.params.returnRequestId = '507f1f77bcf86cd799439011';
      req.body = { newStatus: 'refunded' };

      await updateReturnRequestStatus(req, res);

      expect(emailService.sendReturnRefundedEmail).toHaveBeenCalled();
    });

    test('returns 400 when newStatus missing', async () => {
      req.params.returnRequestId = '507f1f77bcf86cd799439011';
      req.body = {};
      await updateReturnRequestStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 for invalid status value', async () => {
      req.params.returnRequestId = '507f1f77bcf86cd799439011';
      req.body = { newStatus: 'bogus' };
      await updateReturnRequestStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('returns 400 when rejected without reason', async () => {
      req.params.returnRequestId = '507f1f77bcf86cd799439011';
      req.body = { newStatus: 'rejected' };
      await updateReturnRequestStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Rejection reason is required when rejecting a return request' });
    });

    test('returns 404 when return request not found', async () => {
      ReturnRequest.findById.mockReturnValueOnce(sessionFindById(null));
      req.params.returnRequestId = '507f1f77bcf86cd799439011';
      req.body = { newStatus: 'approved' };
      await updateReturnRequestStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('returns 500 on unexpected error', async () => {
      // startSession is awaited outside the try block, so trigger a 500 via an
      // unexpected error thrown inside the transaction (non-matching message).
      const failingQuery = {
        session: vi.fn().mockReturnValue({
          then: (fulfill, reject) => Promise.reject(new Error('unexpected internal failure')).then(fulfill, reject)
        })
      };
      ReturnRequest.findById.mockReturnValueOnce(failingQuery);
      req.params.returnRequestId = '507f1f77bcf86cd799439011';
      req.body = { newStatus: 'approved' };
      await updateReturnRequestStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Server error while updating return request status' });
    });
  });
});
