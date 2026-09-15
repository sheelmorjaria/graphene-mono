import { vi, describe, test, beforeEach, expect } from 'vitest';
import mongoose from 'mongoose';

vi.mock('../../models/User.js', () => ({
  default: Object.assign(vi.fn(), { find: vi.fn(), findById: vi.fn(), countDocuments: vi.fn(), findByEmail: vi.fn() })
}));
vi.mock('../../models/Order.js', () => ({
  default: Object.assign(vi.fn(), { find: vi.fn(), findById: vi.fn(), countDocuments: vi.fn() })
}));
vi.mock('../../models/Product.js', () => ({
  default: Object.assign(vi.fn(), { find: vi.fn(), findById: vi.fn(), updateOne: vi.fn() })
}));
vi.mock('../../models/ReturnRequest.js', () => ({
  default: Object.assign(vi.fn(), { find: vi.fn(), findById: vi.fn(), countDocuments: vi.fn() })
}));
vi.mock('../../models/Category.js', () => ({
  default: Object.assign(vi.fn(), { find: vi.fn(), findById: vi.fn() })
}));
vi.mock('../../models/Device.js', () => ({
  default: Object.assign(vi.fn(), { updateMany: vi.fn(), countDocuments: vi.fn() })
}));
vi.mock('../../services/emailService.js', () => ({
  default: {
    sendRefundConfirmationEmail: vi.fn().mockResolvedValue(true),
    sendOrderShippedEmail: vi.fn().mockResolvedValue(true),
    sendOrderStatusUpdateEmail: vi.fn().mockResolvedValue(true)
  }
}));
vi.mock('../../services/indexNowService.js', () => ({ notifyIndexNow: vi.fn() }));
vi.mock('../paymentController.js', () => ({ getPayPalClient: vi.fn() }));

import { issueRefund, updateOrderStatus } from '../adminController.js';
import Order from '../../models/Order.js';
import ReturnRequest from '../../models/ReturnRequest.js';
import Device from '../../models/Device.js';
import emailService from '../../services/emailService.js';
import { getPayPalClient } from '../paymentController.js';

const chainable = (data) => ({
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  populate: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(data)
});

const refundCapturedPayment = vi.fn().mockResolvedValue({ status: 'COMPLETED', id: 'REF-GUARD-1' });

describe('Admin Controller — device-verification refund guard + device transitions', () => {
  let req, res, session;

  const refundableOrder = () => ({
    _id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
    orderNumber: 'ORD-1-001',
    status: 'delivered',
    paymentStatus: 'completed',
    totalAmount: 500,
    totalRefundedAmount: 0,
    paymentDetails: { paypalTransactionId: 'CAP-1' },
    refundHistory: [],
    statusHistory: [],
    getMaxRefundableAmount() { return 500; },
    save: vi.fn().mockResolvedValue(true)
  });

  beforeEach(() => {
    vi.clearAllMocks();

    req = { params: { orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb' }, query: {}, body: {}, user: { _id: 'admin123' } };
    res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    session = {
      startTransaction: vi.fn(),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      abortTransaction: vi.fn().mockResolvedValue(undefined),
      endSession: vi.fn().mockResolvedValue(undefined),
      withTransaction: vi.fn().mockImplementation(async (fn) => fn(session))
    };
    mongoose.startSession = vi.fn().mockResolvedValue(session);
    mongoose.Types.ObjectId.isValid = vi.fn().mockReturnValue(true);

    refundCapturedPayment.mockClear();
    refundCapturedPayment.mockResolvedValue({ status: 'COMPLETED', id: 'REF-GUARD-1' });
    getPayPalClient.mockReturnValue({ paymentsController: { refundCapturedPayment } });

    // Default: no device blocks
    Device.countDocuments.mockResolvedValue(0);
    ReturnRequest.countDocuments.mockResolvedValue(0);
  });

  // ---------------- issueRefund guard ----------------
  describe('issueRefund device-verification guard', () => {
    const setupRefundRequest = () => {
      req.body = { refundAmount: 100, refundReason: 'Return received' };
      const order = refundableOrder();
      let findByIdCall = 0;
      Order.findById.mockImplementation(() => {
        findByIdCall += 1;
        return findByIdCall === 1
          ? { session: vi.fn().mockResolvedValue(order) }
          : chainable(order);
      });
      return order;
    };

    test('409 + PayPal untouched when the order has a quarantined device', async () => {
      const order = setupRefundRequest();
      Device.countDocuments.mockResolvedValue(1); // quarantined devices

      await issueRefund(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        data: expect.objectContaining({ blocked: true, quarantinedDevices: 1 })
      }));
      expect(refundCapturedPayment).not.toHaveBeenCalled();
      expect(order.refundHistory).toHaveLength(0);
    });

    test('409 via a return request with mismatched IMEI verification', async () => {
      const order = setupRefundRequest();
      ReturnRequest.countDocuments.mockResolvedValue(1);

      await issueRefund(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ blocked: true, mismatchedReturns: 1 })
      }));
      expect(refundCapturedPayment).not.toHaveBeenCalled();
    });

    test('override flag lets the refund through and is audited on the refund entry', async () => {
      const order = setupRefundRequest();
      Device.countDocuments.mockResolvedValue(1);
      req.body.overrideDeviceMismatch = true;

      await issueRefund(req, res);

      expect(refundCapturedPayment).toHaveBeenCalled();
      expect(order.refundHistory).toHaveLength(1);
      expect(order.refundHistory[0].deviceVerificationOverride).toBe(true);
      expect(order.statusHistory.some((h) => (h.notes || '').includes('device-verification override'))).toBe(true);
    });

    test('normal refund (no blocks) passes without the override flag', async () => {
      const order = setupRefundRequest();

      await issueRefund(req, res);

      expect(refundCapturedPayment).toHaveBeenCalled();
      expect(order.refundHistory[0].deviceVerificationOverride).toBe(false);
      expect(emailService.sendRefundConfirmationEmail).toHaveBeenCalled();
    });
  });

  // ---------------- updateOrderStatus device transitions ----------------
  describe('updateOrderStatus device transitions', () => {
    const shippableOrder = () => ({
      _id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
      orderNumber: 'ORD-1-001',
      status: 'processing',
      items: [],
      statusHistory: [],
      save: vi.fn().mockResolvedValue(true)
    });

    test('shipped advances allocated devices to shipped', async () => {
      const order = shippableOrder();
      let findByIdCall = 0;
      Order.findById.mockImplementation(() => {
        findByIdCall += 1;
        return findByIdCall === 1
          ? { session: vi.fn().mockResolvedValue(order) }
          : chainable(order);
      });
      Device.updateMany.mockResolvedValue({ modifiedCount: 2 });

      req.body = { newStatus: 'shipped', trackingNumber: 'TRK-1', trackingUrl: 'https://t.co/1' };
      await updateOrderStatus(req, res);

      expect(Device.updateMany).toHaveBeenCalledWith(
        { orderId: order._id, status: 'allocated' },
        expect.objectContaining({ status: 'shipped' }),
        expect.objectContaining({ session: session })
      );
    });

    test('cancelled releases only allocated devices back to stock', async () => {
      const order = shippableOrder();
      let findByIdCall = 0;
      Order.findById.mockImplementation(() => {
        findByIdCall += 1;
        return findByIdCall === 1
          ? { session: vi.fn().mockResolvedValue(order) }
          : chainable(order);
      });
      Device.updateMany.mockResolvedValue({ modifiedCount: 0 });

      req.body = { newStatus: 'cancelled' };
      await updateOrderStatus(req, res);

      expect(Device.updateMany).toHaveBeenCalledWith(
        { orderId: order._id, status: 'allocated' },
        expect.objectContaining({ status: 'in_stock', orderId: null }),
        expect.objectContaining({ session: session })
      );
    });
  });
});
