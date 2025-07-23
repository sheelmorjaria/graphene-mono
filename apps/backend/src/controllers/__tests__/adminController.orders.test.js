import { vi, describe, it, test, expect, beforeEach, afterEach } from 'vitest';

// Set up the mock before any imports (factory function must be self-contained)
vi.mock('../../models/Order.js', () => ({
  default: {
    aggregate: vi.fn()
  }
}));

// Import after mocking
import { getAllOrders } from '../adminController.js';
import Order from '../../models/Order.js';

describe('Admin Controller - getAllOrders', () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {},
      user: { _id: 'admin123', role: 'admin' }
    };
    res = {
      json: vi.fn(),
      status: vi.fn(() => res)
    };
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Default parameters', () => {
    it('should fetch orders with default pagination and sorting', async () => {
      const mockOrders = [
        {
          _id: 'order1',
          orderNumber: 'ORD-001',
          status: 'pending',
          totalAmount: 999.99,
          createdAt: new Date(),
          customer: {
            _id: 'user1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
          }
        }
      ];

      const mockCountResult = [{ total: 1 }];

      Order.aggregate.mockImplementation((pipeline) => {
        // Check if this is the count pipeline (has $count stage)
        const hasCount = pipeline.some(stage => stage.$count);
        if (hasCount) {
          return Promise.resolve(mockCountResult);
        }
        return Promise.resolve(mockOrders);
      });

      await getAllOrders(req, res);

      expect(Order.aggregate).toHaveBeenCalledTimes(2); // Once for count, once for data
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          orders: mockOrders,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalOrders: 1,
            hasNextPage: false,
            hasPrevPage: false,
            limit: 20
          }
        }
      });
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      const mockCountResult = [{ total: 0 }];
      Order.aggregate.mockImplementation((pipeline) => {
        const hasCount = pipeline.some(stage => stage.$count);
        if (hasCount) {
          return Promise.resolve(mockCountResult);
        }
        return Promise.resolve([]);
      });
    });

    it('should filter by status', async () => {
      req.query.status = 'pending';

      await getAllOrders(req, res);

      expect(Order.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              status: 'pending'
            })
          })
        ])
      );
    });

    it('should filter by date range', async () => {
      req.query.startDate = '2024-01-01';
      req.query.endDate = '2024-01-31';

      await getAllOrders(req, res);

      expect(Order.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              createdAt: expect.objectContaining({
                $gte: expect.any(Date),
                $lte: expect.any(Date)
              })
            })
          })
        ])
      );
    });

    it('should filter by customer query', async () => {
      req.query.customerQuery = 'john';

      await getAllOrders(req, res);

      expect(Order.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: expect.objectContaining({
              $or: expect.arrayContaining([
                { 'customer.firstName': { $regex: 'john', $options: 'i' } },
                { 'customer.lastName': { $regex: 'john', $options: 'i' } },
                { 'customer.email': { $regex: 'john', $options: 'i' } }
              ])
            })
          })
        ])
      );
    });

    it('should not include status filter when status is "all"', async () => {
      req.query.status = 'all';

      await getAllOrders(req, res);

      const firstCall = Order.aggregate.mock.calls[0][0];
      const matchStage = firstCall.find(stage => stage.$match);
      
      expect(matchStage.$match).not.toHaveProperty('status');
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      const mockCountResult = [{ total: 0 }];
      Order.aggregate.mockImplementation((pipeline) => {
        const hasCount = pipeline.some(stage => stage.$count);
        if (hasCount) {
          return Promise.resolve(mockCountResult);
        }
        return Promise.resolve([]);
      });
    });

    it('should sort by createdAt descending by default', async () => {
      await getAllOrders(req, res);

      expect(Order.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $sort: { createdAt: -1 }
          })
        ])
      );
    });

    it('should sort by totalAmount ascending when specified', async () => {
      req.query.sortBy = 'totalAmount';
      req.query.sortOrder = 'asc';

      await getAllOrders(req, res);

      expect(Order.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $sort: { totalAmount: 1 }
          })
        ])
      );
    });
  });

  describe('Pagination', () => {
    it('should calculate pagination correctly', async () => {
      req.query.page = '2';
      req.query.limit = '10';

      const mockCountResult = [{ total: 25 }];
      Order.aggregate.mockImplementation((pipeline) => {
        const hasCount = pipeline.some(stage => stage.$count);
        if (hasCount) {
          return Promise.resolve(mockCountResult);
        }
        return Promise.resolve([]);
      });

      await getAllOrders(req, res);

      expect(Order.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          { $skip: 10 }, // (page-1) * limit = (2-1) * 10 = 10
          { $limit: 10 }
        ])
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          orders: [],
          pagination: {
            currentPage: 2,
            totalPages: 3, // Math.ceil(25/10) = 3
            totalOrders: 25,
            hasNextPage: true,
            hasPrevPage: true,
            limit: 10
          }
        }
      });
    });
  });

  describe('Error handling', () => {
    it('should handle database errors', async () => {
      const mockError = new Error('Database connection failed');
      Order.aggregate.mockRejectedValue(mockError);

      await getAllOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error while fetching orders'
      });
    });
  });

  describe('Data projection', () => {
    it('should include customer information in the response', async () => {
      const mockOrders = [
        {
          _id: 'order1',
          orderNumber: 'ORD-001',
          status: 'pending',
          totalAmount: 999.99,
          createdAt: new Date(),
          customer: {
            _id: 'user1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
          }
        }
      ];

      const mockCountResult = [{ total: 1 }];

      Order.aggregate.mockImplementation((pipeline) => {
        const hasCount = pipeline.some(stage => stage.$count);
        if (hasCount) {
          return Promise.resolve(mockCountResult);
        }
        return Promise.resolve(mockOrders);
      });

      await getAllOrders(req, res);

      // Verify that the lookup stage is included
      expect(Order.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'customer'
            }
          })
        ])
      );

      // Verify that the projection stage is included
      expect(Order.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $project: expect.objectContaining({
              customer: {
                _id: '$customer._id',
                firstName: '$customer.firstName',
                lastName: '$customer.lastName',
                email: '$customer.email'
              }
            })
          })
        ])
      );
    });
  });
});