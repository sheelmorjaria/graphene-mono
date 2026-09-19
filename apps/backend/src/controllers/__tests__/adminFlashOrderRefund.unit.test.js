import { vi, describe, test, beforeEach, expect } from 'vitest';
import mongoose from 'mongoose';

// Explicit model mock (global setup auto-mock returns truthy garbage for
// unknown models' findOne/findById).
vi.mock('../../models/FlashOrder.js', () => ({
  default: Object.assign(vi.fn(), {
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
    countDocuments: vi.fn()
  })
}));

vi.mock('../../models/User.js', () => ({
  default: Object.assign(vi.fn(), { find: vi.fn(), findById: vi.fn(), countDocuments: vi.fn() })
}));

vi.mock('../../services/emailService.js', () => ({
  default: {
    sendFlashServiceRefundEmail: vi.fn().mockResolvedValue(true),
    sendFlashServiceIntakeEmail: vi.fn().mockResolvedValue(true)
  }
}));

vi.mock('../../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  logError: vi.fn(),
  logPaymentEvent: vi.fn()
}));

vi.mock('../paymentController.js', () => ({ getPayPalClient: vi.fn() }));

import { refundFlashOrder } from '../adminFlashOrderController.js';
import FlashOrder from '../../models/FlashOrder.js';
import emailService from '../../services/emailService.js';
import { getPayPalClient } from '../paymentController.js';

const refundCapturedPayment = vi.fn();

const sessionQuery = (value) => () => ({ session: vi.fn().mockResolvedValue(value) });

describe('Admin Flash Order refund (unit)', () => {
  let req, res, session;

  const ORDER_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';

  const paidOrder = (overrides = {}) => ({
    _id: ORDER_ID,
    orderNumber: 'FLO-1-001',
    customerEmail: 'customer@example.com',
    pixelModel: 'Pixel 8 Pro',
    orderStatus: 'Device_Received',
    paymentStatus: 'Completed',
    basePrice: 119.99,
    returnShipping: 20.45,
    totalPrice: 140.44,
    totalRefundedAmount: 0,
    refundHistory: [],
    statusHistory: [],
    returnAddress: { fullName: 'Test Customer' },
    paymentDetails: { paypalTransactionId: 'CAP-FLASH-1' },
    save: vi.fn().mockResolvedValue(true),
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();

    req = { params: { id: ORDER_ID }, body: { reason: 'Customer cancelled', category: 'cancellation_before_flashing' }, user: { _id: 'admin123' } };
    res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    session = {
      startTransaction: vi.fn(),
      commitTransaction: vi.fn().mockResolvedValue(undefined),
      abortTransaction: vi.fn().mockResolvedValue(undefined),
      endSession: vi.fn().mockResolvedValue(undefined)
    };
    mongoose.startSession = vi.fn().mockResolvedValue(session);
    mongoose.Types.ObjectId.isValid = vi.fn().mockImplementation((id) => /^[0-9a-fA-F]{24}$/.test(String(id || '')));

    refundCapturedPayment.mockClear();
    refundCapturedPayment.mockResolvedValue({ status: 'COMPLETED', id: 'REF-FLASH-1' });
    getPayPalClient.mockReturnValue({ paymentsController: { refundCapturedPayment } });

    // Default happy-path wiring (individual tests override)
    FlashOrder.findById.mockImplementation(sessionQuery(paidOrder()));
    FlashOrder.findOneAndUpdate.mockResolvedValue(paidOrder());
    FlashOrder.updateOne.mockResolvedValue({ modifiedCount: 1 });
  });

  // ---------------- validation (pre-DB) ----------------
  test('400 on invalid order id', async () => {
    req.params.id = 'nope';
    await refundFlashOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 on missing reason', async () => {
    req.body.reason = '  ';
    await refundFlashOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 on invalid category', async () => {
    req.body.category = 'because';
    await refundFlashOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // ---------------- guards (phase A) ----------------
  test('404 when the order does not exist', async () => {
    FlashOrder.findById.mockImplementation(sessionQuery(null));
    await refundFlashOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('400 when payment is not Completed', async () => {
    FlashOrder.findById.mockImplementation(sessionQuery(paidOrder({ paymentStatus: 'Unpaid' })));
    await refundFlashOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('409 when already refunded', async () => {
    FlashOrder.findById.mockImplementation(sessionQuery(paidOrder({ paymentStatus: 'Refunded' })));
    await refundFlashOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(refundCapturedPayment).not.toHaveBeenCalled();
  });

  test('409 policy-blocked once flashing has begun', async () => {
    FlashOrder.findById.mockImplementation(sessionQuery(paidOrder({ orderStatus: 'Flashing_In_Progress' })));
    await refundFlashOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringMatching(/service has begun|non-refundable/i)
    }));
    expect(refundCapturedPayment).not.toHaveBeenCalled();
  });

  test('409 for statuses outside the refundable set', async () => {
    FlashOrder.findById.mockImplementation(sessionQuery(paidOrder({ orderStatus: 'Awaiting_Payment', paymentStatus: 'Completed' })));
    await refundFlashOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('400 with manual-refund guidance when no capture id exists', async () => {
    FlashOrder.findById.mockImplementation(sessionQuery(paidOrder({ paymentDetails: {} })));
    await refundFlashOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringMatching(/PayPal dashboard/i)
    }));
  });

  test('409 when another refund is already in progress (claim miss)', async () => {
    FlashOrder.findOneAndUpdate.mockResolvedValue(null);
    await refundFlashOrder(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(refundCapturedPayment).not.toHaveBeenCalled();
    expect(session.abortTransaction).toHaveBeenCalled();
  });

  // ---------------- success paths ----------------
  test('cancellation refunds the FULL total and flips statuses', async () => {
    const finalized = paidOrder({
      refundHistory: [{ refundId: 'pending-x', amount: 140.44, status: 'pending', category: 'cancellation_before_flashing' }]
    });
    let call = 0;
    FlashOrder.findById.mockImplementation(() => {
      call += 1;
      return sessionQuery(call === 1 ? paidOrder() : finalized)();
    });

    await refundFlashOrder(req, res);

    expect(refundCapturedPayment).toHaveBeenCalledWith(expect.objectContaining({
      captureId: 'CAP-FLASH-1',
      body: { amount: { value: '140.44', currencyCode: 'GBP' } }
    }));
    expect(finalized.refundHistory[0].status).toBe('succeeded');
    expect(finalized.paymentStatus).toBe('Refunded');
    expect(finalized.orderStatus).toBe('Refunded');
    expect(finalized.totalRefundedAmount).toBe(140.44);
    expect(finalized.statusHistory.some((h) => h.status === 'Refunded')).toBe(true);
    expect(emailService.sendFlashServiceRefundEmail).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('device_unflashable refunds total minus return shipping', async () => {
    req.body.category = 'device_unflashable';
    const finalized = paidOrder({
      refundHistory: [{ refundId: 'pending-x', amount: 119.99, status: 'pending', category: 'device_unflashable' }]
    });
    let call = 0;
    FlashOrder.findById.mockImplementation(() => {
      call += 1;
      return sessionQuery(call === 1 ? paidOrder() : finalized)();
    });

    await refundFlashOrder(req, res);

    expect(refundCapturedPayment).toHaveBeenCalledWith(expect.objectContaining({
      body: { amount: { value: '119.99', currencyCode: 'GBP' } }
    }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  // ---------------- failure path ----------------
  test('PayPal failure marks the claim failed and returns 502', async () => {
    refundCapturedPayment.mockRejectedValue(new Error('gateway down'));
    await refundFlashOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(502);
    // The pending claim is flipped to failed so retries are not blocked
    expect(FlashOrder.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: ORDER_ID }),
      expect.objectContaining({ $set: expect.objectContaining({ 'refundHistory.$.status': 'failed' }) })
    );
  });
});
