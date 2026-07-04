import { vi, describe, test, beforeEach, expect } from 'vitest';

// Mock the FlashOrder model with chainable query methods
vi.mock('../../models/FlashOrder.js', () => {
  const FlashOrder = Object.assign(vi.fn(), {
    find: vi.fn(),
    findById: vi.fn(),
    countDocuments: vi.fn()
  });
  return { default: FlashOrder };
});

// logger is mocked globally in setup.vitest.js, but re-import to control spies
import {
  getAllFlashOrders,
  getFlashOrderById,
  updateFlashOrderStatus,
  getFlashOrderStats
} from '../adminFlashOrderController.js';

import FlashOrder from '../../models/FlashOrder.js';

// Chainable mock for find().sort().skip().limit().lean()
const chainableLean = (data) => ({
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(data)
});

describe('Admin Flash Order Controller - Coverage Gap Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { params: {}, query: {}, body: {} };
    res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
  });

  // ---------------- getAllFlashOrders ----------------
  describe('getAllFlashOrders', () => {
    test('happy path: returns orders with pagination (defaults)', async () => {
      const orders = [{ _id: 'o1', orderNumber: 'FL-1' }];
      FlashOrder.find.mockReturnValue(chainableLean(orders));
      FlashOrder.countDocuments.mockResolvedValue(1);

      await getAllFlashOrders(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            orders,
            pagination: expect.objectContaining({ page: 1, limit: 20, total: 1, pages: 1 })
          })
        })
      );
    });

    test('applies status, customerQuery, date filters and asc sort', async () => {
      req.query = {
        status: 'Paid',
        customerQuery: 'john',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        sortBy: 'orderNumber',
        sortOrder: 'asc',
        page: 2,
        limit: 5
      };
      FlashOrder.find.mockReturnValue(chainableLean([]));
      FlashOrder.countDocuments.mockResolvedValue(0);

      await getAllFlashOrders(req, res);

      const filter = FlashOrder.find.mock.calls[0][0];
      expect(filter.orderStatus).toBe('Paid');
      expect(filter.$or).toBeInstanceOf(Array);
      expect(filter.createdAt).toEqual({ $gte: expect.any(Date), $lte: expect.any(Date) });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('does not apply orderStatus filter when status is "all"', async () => {
      req.query = { status: 'all' };
      FlashOrder.find.mockReturnValue(chainableLean([]));
      FlashOrder.countDocuments.mockResolvedValue(0);

      await getAllFlashOrders(req, res);

      const filter = FlashOrder.find.mock.calls[0][0];
      expect(filter.orderStatus).toBeUndefined();
    });

    test('error: returns 500 on failure', async () => {
      FlashOrder.find.mockImplementation(() => { throw new Error('DB down'); });
      await getAllFlashOrders(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Failed to fetch flash orders' });
    });
  });

  // ---------------- getFlashOrderById ----------------
  describe('getFlashOrderById', () => {
    test('happy path: returns order', async () => {
      const order = { _id: '507f1f77bcf86cd799439011', orderNumber: 'FL-1' };
      FlashOrder.findById.mockReturnValue(chainableLean(order));
      req.params.id = '507f1f77bcf86cd799439011';

      await getFlashOrderById(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, data: order });
    });

    test('returns 404 when order not found', async () => {
      FlashOrder.findById.mockReturnValue(chainableLean(null));
      req.params.id = '507f1f77bcf86cd799439011';
      await getFlashOrderById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Flash Order not found' });
    });

    test('error: returns 500 on failure', async () => {
      FlashOrder.findById.mockReturnValue({ lean: vi.fn().mockRejectedValue(new Error('boom')) });
      req.params.id = '507f1f77bcf86cd799439011';
      await getFlashOrderById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- updateFlashOrderStatus ----------------
  describe('updateFlashOrderStatus', () => {
    const makeOrder = (overrides = {}) => ({
      _id: '507f1f77bcf86cd799439011',
      orderNumber: 'FL-1',
      orderStatus: 'Awaiting_Payment',
      paymentStatus: 'Unpaid',
      statusHistory: [],
      poBoxAddress: undefined,
      save: vi.fn().mockResolvedValue(true),
      ...overrides
    });

    test('happy path: updates order status and pushes history', async () => {
      const order = makeOrder();
      FlashOrder.findById.mockResolvedValue(order);
      req.params.id = '507f1f77bcf86cd799439011';
      req.body = { orderStatus: 'Paid', note: 'paid in full' };

      await updateFlashOrderStatus(req, res);

      expect(order.orderStatus).toBe('Paid');
      expect(order.statusHistory.length).toBe(1);
      expect(order.statusHistory[0]).toEqual(expect.objectContaining({ status: 'Paid', note: 'paid in full' }));
      expect(order.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('updates payment status and adds note default when none provided', async () => {
      const order = makeOrder();
      FlashOrder.findById.mockResolvedValue(order);
      req.params.id = '507f1f77bcf86cd799439011';
      req.body = { paymentStatus: 'Completed' };

      await updateFlashOrderStatus(req, res);

      expect(order.paymentStatus).toBe('Completed');
      expect(order.statusHistory[0].note).toBe('Status updated to Completed');
    });

    test('auto-populates PO Box when both order Paid and payment Completed', async () => {
      const order = makeOrder({ orderStatus: 'Awaiting_Payment' });
      FlashOrder.findById.mockResolvedValue(order);
      req.params.id = '507f1f77bcf86cd799439011';
      req.body = { orderStatus: 'Paid', paymentStatus: 'Completed' };

      await updateFlashOrderStatus(req, res);

      expect(order.poBoxAddress).toBeDefined();
      expect(order.poBoxAddress.street).toBe('PO Box 12345');
    });

    test('does not overwrite existing poBoxAddress', async () => {
      const existing = { street: 'PO Box 99999' };
      const order = makeOrder({ poBoxAddress: existing });
      FlashOrder.findById.mockResolvedValue(order);
      req.params.id = '507f1f77bcf86cd799439011';
      req.body = { orderStatus: 'Paid', paymentStatus: 'Completed' };

      await updateFlashOrderStatus(req, res);

      expect(order.poBoxAddress).toBe(existing);
    });

    test('returns 404 when order not found', async () => {
      FlashOrder.findById.mockResolvedValue(null);
      req.params.id = '507f1f77bcf86cd799439011';
      req.body = { orderStatus: 'Paid' };
      await updateFlashOrderStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('returns 400 for invalid order status', async () => {
      FlashOrder.findById.mockResolvedValue(makeOrder());
      req.params.id = '507f1f77bcf86cd799439011';
      req.body = { orderStatus: 'Bogus' };
      await updateFlashOrderStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: expect.stringContaining('Invalid order status') }));
    });

    test('returns 400 for invalid payment status', async () => {
      FlashOrder.findById.mockResolvedValue(makeOrder());
      req.params.id = '507f1f77bcf86cd799439011';
      req.body = { paymentStatus: 'Weird' };
      await updateFlashOrderStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Invalid payment status') }));
    });

    test('error: returns 500 when findById throws', async () => {
      FlashOrder.findById.mockRejectedValue(new Error('fail'));
      req.params.id = '507f1f77bcf86cd799439011';
      req.body = { orderStatus: 'Paid' };
      await updateFlashOrderStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Failed to update flash order status' });
    });
  });

  // ---------------- getFlashOrderStats ----------------
  describe('getFlashOrderStats', () => {
    test('happy path: returns aggregated stats and revenue', async () => {
      // 8 countDocuments calls then find().lean()
      FlashOrder.countDocuments
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(10)  // awaiting
        .mockResolvedValueOnce(40)  // paid
        .mockResolvedValueOnce(5)   // deviceReceived
        .mockResolvedValueOnce(3)   // flashingInProgress
        .mockResolvedValueOnce(20)  // shippedBack
        .mockResolvedValueOnce(15)  // cancelled
        .mockResolvedValueOnce(7);  // refunded
      const paidOrders = [{ totalPrice: 100 }, { totalPrice: 50 }];
      FlashOrder.find.mockReturnValue(chainableLean(paidOrders));

      await getFlashOrderStats(req, res);

      const call = res.json.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data).toEqual(expect.objectContaining({
        totalOrders: 100,
        awaitingPayment: 10,
        paid: 40,
        deviceReceived: 5,
        flashingInProgress: 3,
        shippedBack: 20,
        cancelled: 15,
        refunded: 7,
        totalRevenue: 150
      }));
    });

    test('handles empty paid orders list (zero revenue)', async () => {
      FlashOrder.countDocuments.mockResolvedValue(0);
      FlashOrder.find.mockReturnValue(chainableLean([]));

      await getFlashOrderStats(req, res);

      const call = res.json.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.totalRevenue).toBe(0);
    });

    test('error: returns 500 on failure', async () => {
      FlashOrder.countDocuments.mockRejectedValue(new Error('fail'));
      await getFlashOrderStats(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Failed to fetch flash order statistics' });
    });
  });
});
