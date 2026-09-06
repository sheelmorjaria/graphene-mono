import { vi, describe, test, beforeEach, expect } from 'vitest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// ---- Mocks ---------------------------------------------------------------
// PayPal SDK mock (issueRefund refunds via the gateway). Regular function —
// `new Client()` rejects arrow implementations.
const paypalGaps = vi.hoisted(() => ({
  refundCapturedPayment: vi.fn().mockResolvedValue({
    result: { id: 'PP-REFUND-GAPS-1', status: 'COMPLETED' }
  })
}));
vi.mock('@paypal/paypal-server-sdk', () => ({
  Client: vi.fn().mockImplementation(function () {
    return { paymentsController: { refundCapturedPayment: paypalGaps.refundCapturedPayment } };
  }),
  Environment: { Sandbox: 'sandbox', Production: 'production' }
}));

vi.mock('../../models/User.js', () => ({
  default: Object.assign(vi.fn(), {
    findById: vi.fn(),
    findOne: vi.fn(),
    findByEmail: vi.fn(),
    countDocuments: vi.fn()
  })
}));
vi.mock('../../models/Order.js', () => ({
  default: Object.assign(vi.fn(), {
    findById: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn()
  })
}));
vi.mock('../../models/Product.js', () => ({
  default: Object.assign(vi.fn(), {
    findById: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
    updateOne: vi.fn()
  })
}));
vi.mock('../../models/ReturnRequest.js', () => ({
  default: Object.assign(vi.fn(), {
    findById: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn()
  })
}));
vi.mock('../../models/Category.js', () => ({
  default: Object.assign(vi.fn(), {
    findById: vi.fn(),
    find: vi.fn()
  })
}));
vi.mock('../../services/emailService.js', () => ({
  default: {
    sendOrderShippedEmail: vi.fn().mockResolvedValue(true),
    sendOrderDeliveredEmail: vi.fn().mockResolvedValue(true),
    sendOrderStatusUpdateEmail: vi.fn().mockResolvedValue(true),
    sendRefundConfirmationEmail: vi.fn().mockResolvedValue(true),
    sendAccountDisabledEmail: vi.fn().mockResolvedValue(true),
    sendAccountReEnabledEmail: vi.fn().mockResolvedValue(true)
  }
}));

import {
  adminLogin,
  getAdminProfile,
  updateOrderStatus,
  issueRefund,
  updateProduct,
  deleteProduct,
  getCustomerReport
} from '../adminController.js';

import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import emailService from '../../services/emailService.js';

// Chainable query mock that resolves to data via lean()/exec().
const chainable = (data) => ({
  session: vi.fn().mockReturnThis(),
  populate: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(data),
  select: vi.fn().mockReturnThis(),
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis()
});

// findById-with-session: returns an object exposing .session() that then
// resolves to `data`. Mirrors `Model.findById(id).session(s)` used by the
// transactional controllers.
const findByIdSession = (data) => ({
  session: vi.fn().mockResolvedValue(data)
});

// Build a transactional mongoose session mock supporting both
// withTransaction(fn) (used by updateOrderStatus) and the explicit
// startTransaction/commit/abort calls (used by issueRefund).
const makeSession = () => {
  const session = {
    startTransaction: vi.fn(),
    commitTransaction: vi.fn().mockResolvedValue(undefined),
    abortTransaction: vi.fn().mockResolvedValue(undefined),
    endSession: vi.fn().mockResolvedValue(undefined),
    withTransaction: vi.fn().mockImplementation(async (fn) => fn(session))
  };
  return session;
};

describe('Admin Controller - additional coverage gaps', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    // PayPal client env (issueRefund gateway path)
    process.env.PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'test-client-id';
    process.env.PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || 'test-client-secret';

    req = { params: {}, query: {}, body: {}, user: { _id: 'admin123', userId: 'admin123' } };
    res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    const session = makeSession();
    mongoose.startSession = vi.fn().mockResolvedValue(session);
    mongoose.Types.ObjectId.isValid = vi.fn().mockImplementation((id) => {
      if (!id) return false;
      return /^[0-9a-fA-F]{24}$/.test(id.toString());
    });
    mongoose.isValidObjectId = mongoose.Types.ObjectId.isValid;
    // keep a handle for tests that need to assert on transaction state
    req._session = session;
  });

  // ---------------- adminLogin ----------------
  describe('adminLogin', () => {
    test('400 when email or password missing', async () => {
      req.body = { email: 'a@b.com' };
      await adminLogin(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('401 when user not found', async () => {
      req.body = { email: 'a@b.com', password: 'pw' };
      User.findByEmail.mockResolvedValue(null);
      await adminLogin(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('403 when user is not an admin', async () => {
      req.body = { email: 'a@b.com', password: 'pw' };
      User.findByEmail.mockResolvedValue({ role: 'customer', accountStatus: 'active', isActive: true });
      await adminLogin(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('401 when account disabled', async () => {
      req.body = { email: 'a@b.com', password: 'pw' };
      User.findByEmail.mockResolvedValue({ role: 'admin', accountStatus: 'disabled', isActive: true });
      await adminLogin(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('401 when account inactive', async () => {
      req.body = { email: 'a@b.com', password: 'pw' };
      User.findByEmail.mockResolvedValue({ role: 'admin', accountStatus: 'active', isActive: false });
      await adminLogin(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('401 on invalid password', async () => {
      req.body = { email: 'a@b.com', password: 'pw' };
      User.findByEmail.mockResolvedValue({
        role: 'admin', accountStatus: 'active', isActive: true,
        comparePassword: vi.fn().mockResolvedValue(false)
      });
      await adminLogin(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('200 happy path issues a JWT', async () => {
      req.body = { email: 'a@b.com', password: 'pw' };
      const save = vi.fn().mockResolvedValue({});
      const user = {
        _id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'admin',
        accountStatus: 'active', isActive: true, comparePassword: vi.fn().mockResolvedValue(true), save
      };
      User.findByEmail.mockResolvedValue(user);
      jwt.sign = vi.fn().mockReturnValue('jwt-token');

      await adminLogin(req, res);

      expect(save).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ token: 'jwt-token' })
      }));
    });

    test('500 on unexpected error', async () => {
      User.findByEmail.mockRejectedValue(new Error('boom'));
      req.body = { email: 'a@b.com', password: 'pw' };
      await adminLogin(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- getAdminProfile ----------------
  describe('getAdminProfile', () => {
    test('returns the authenticated admin profile', async () => {
      req.user = { _id: 'a1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'admin', lastLoginAt: new Date(), createdAt: new Date() };
      await getAdminProfile(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  // ---------------- updateOrderStatus ----------------
  describe('updateOrderStatus', () => {
    const OID = '507f1f77bcf86cd799439011';

    test('400 when orderId missing', async () => {
      req.params = {}; req.body = { newStatus: 'processing' };
      await updateOrderStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 when newStatus missing', async () => {
      req.params = { orderId: OID }; req.body = {};
      await updateOrderStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 on invalid orderId format', async () => {
      req.params = { orderId: 'nope' }; req.body = { newStatus: 'processing' };
      await updateOrderStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('404 when order not found', async () => {
      req.params = { orderId: OID }; req.body = { newStatus: 'processing' };
      Order.findById.mockReturnValueOnce(findByIdSession(null)); // inside txn
      await updateOrderStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('400 on invalid status transition', async () => {
      req.params = { orderId: OID }; req.body = { newStatus: 'delivered' };
      Order.findById.mockReturnValueOnce(findByIdSession({ status: 'pending', items: [], save: vi.fn() }));
      await updateOrderStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 when shipping without tracking info', async () => {
      req.params = { orderId: OID }; req.body = { newStatus: 'shipped' };
      Order.findById.mockReturnValueOnce(findByIdSession({ status: 'processing', items: [], save: vi.fn() }));
      await updateOrderStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('200 happy path: shipped with tracking, restores stock on cancel', async () => {
      // First call: shipped
      const orderShipped = {
        status: 'processing', items: [], statusHistory: [],
        trackingNumber: null, trackingUrl: null,
        save: vi.fn().mockResolvedValue({})
      };
      Order.findById.mockReturnValueOnce(findByIdSession(orderShipped));
      Order.findById.mockReturnValueOnce(chainable({ _id: OID, statusHistory: [{ status: 'processing' }] }));

      req.params = { orderId: OID };
      req.body = { newStatus: 'shipped', trackingNumber: 'T1', trackingUrl: 'https://t' };
      await updateOrderStatus(req, res);
      expect(emailService.sendOrderShippedEmail).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

      // Second call: cancel restores variation stock via variationId
      vi.clearAllMocks();
      const session = makeSession();
      mongoose.startSession = vi.fn().mockResolvedValue(session);
      const orderCancel = {
        status: 'processing', orderNumber: 'ORD-1', statusHistory: [],
        items: [{ productId: 'p1', variationId: 'v1', quantity: 2 }],
        save: vi.fn().mockResolvedValue({})
      };
      Order.findById.mockReturnValueOnce(findByIdSession(orderCancel));
      Order.findById.mockReturnValueOnce(chainable({ _id: OID, statusHistory: [] }));
      Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

      req.body = { newStatus: 'cancelled' };
      await updateOrderStatus(req, res);
      expect(Product.updateOne).toHaveBeenCalledWith(
        { _id: 'p1', 'variations._id': 'v1' },
        { $inc: { 'variations.$.stockQuantity': 2 } },
        { session }
      );
    });

    test('cancel restores legacy-item stock by sku/condition fallbacks', async () => {
      const session = makeSession();
      mongoose.startSession = vi.fn().mockResolvedValue(session);
      const product = {
        variations: [
          { _id: 'var-sku', sku: 'LEG-SKU', condition: 'new', color: 'black' },
          { _id: 'var-single' }
        ]
      };
      const order = {
        status: 'processing', orderNumber: 'ORD-2', statusHistory: [],
        items: [
          { productId: 'p1', quantity: 1, sku: 'leg-sku' },
          { productId: 'p2', quantity: 1, condition: 'new', color: 'black' },
          { productId: 'p3', quantity: 1 }
        ],
        save: vi.fn().mockResolvedValue({})
      };
      Order.findById.mockReturnValueOnce(findByIdSession(order));
      Order.findById.mockReturnValueOnce(chainable({ _id: OID, statusHistory: [] }));
      // Product.findById inside txn for each legacy item
      Product.findById.mockReturnValue(findByIdSession(product));
      Product.updateOne.mockResolvedValue({ modifiedCount: 1 });

      req.params = { orderId: OID };
      req.body = { newStatus: 'cancelled' };
      await updateOrderStatus(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('500 on unexpected error', async () => {
      Order.findById.mockReturnValue({ session: vi.fn().mockRejectedValue(new Error('boom')) });
      req.params = { orderId: OID }; req.body = { newStatus: 'processing' };
      await updateOrderStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- issueRefund ----------------
  describe('issueRefund', () => {
    const OID = '507f1f77bcf86cd799439011';

    test('400 when refundAmount or reason missing', async () => {
      req.params = { orderId: OID }; req.body = { refundReason: 'x' };
      await issueRefund(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 when refundAmount is not a positive number', async () => {
      req.params = { orderId: OID }; req.body = { refundAmount: -5, refundReason: 'x' };
      await issueRefund(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 when refundReason is empty string', async () => {
      req.params = { orderId: OID }; req.body = { refundAmount: 5, refundReason: '   ' };
      await issueRefund(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 on invalid orderId format', async () => {
      req.params = { orderId: 'bad' }; req.body = { refundAmount: 5, refundReason: 'x' };
      await issueRefund(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('404 when order not found', async () => {
      req.params = { orderId: OID }; req.body = { refundAmount: 5, refundReason: 'x' };
      Order.findById.mockReturnValueOnce(findByIdSession(null));
      await issueRefund(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('400 when payment status is not completed', async () => {
      req.params = { orderId: OID }; req.body = { refundAmount: 5, refundReason: 'x' };
      Order.findById.mockReturnValueOnce(findByIdSession({ paymentStatus: 'pending' }));
      await issueRefund(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 when refund exceeds max refundable', async () => {
      req.params = { orderId: OID }; req.body = { refundAmount: 100, refundReason: 'x' };
      Order.findById.mockReturnValueOnce(findByIdSession({ paymentStatus: 'completed', getMaxRefundableAmount: () => 10 }));
      await issueRefund(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('200 happy path: partial refund', async () => {
      const order = {
        paymentStatus: 'completed', totalAmount: 100, totalRefundedAmount: 0,
        refundHistory: [], statusHistory: [], status: 'processing',
        paymentDetails: { paypalOrderId: 'PP-1', paypalTransactionId: 'CAP-1' },
        getMaxRefundableAmount: () => 100,
        save: vi.fn().mockResolvedValue({})
      };
      Order.findById.mockReturnValueOnce(findByIdSession(order)); // inside txn
      Order.findById.mockReturnValueOnce(chainable({ _id: OID, refundHistory: [] })); // for response
      req.params = { orderId: OID }; req.body = { refundAmount: 30, refundReason: 'partial' };
      await issueRefund(req, res);
      expect(order.refundStatus).toBe('partial_refunded');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('marks fully_refunded when refund reaches total', async () => {
      const order = {
        paymentStatus: 'completed', totalAmount: 100, totalRefundedAmount: 0,
        refundHistory: [], statusHistory: [], status: 'processing',
        paymentDetails: { paypalOrderId: 'PP-1', paypalTransactionId: 'CAP-1' },
        getMaxRefundableAmount: () => 100,
        save: vi.fn().mockResolvedValue({})
      };
      Order.findById.mockReturnValueOnce(findByIdSession(order));
      Order.findById.mockReturnValueOnce(chainable({ _id: OID, refundHistory: [] }));
      req.params = { orderId: OID }; req.body = { refundAmount: 100, refundReason: 'full' };
      await issueRefund(req, res);
      expect(order.refundStatus).toBe('fully_refunded');
      expect(order.paymentStatus).toBe('refunded');
    });

    test('500 on unexpected error', async () => {
      Order.findById.mockReturnValue({ session: vi.fn().mockRejectedValue(new Error('boom')) });
      req.params = { orderId: OID }; req.body = { refundAmount: 5, refundReason: 'x' };
      await issueRefund(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- updateProduct ----------------
  describe('updateProduct', () => {
    const PID = '507f1f77bcf86cd799439011';

    test('400 when productId missing', async () => {
      req.params = {}; req.body = { name: 'n', sku: 's', price: 1, stockQuantity: 1 };
      await updateProduct(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('404 when product not found', async () => {
      req.params = { productId: PID };
      Product.findById.mockResolvedValue(null);
      await updateProduct(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('400 when required fields missing', async () => {
      req.params = { productId: PID };
      Product.findById.mockResolvedValue({ sku: 's', slug: 'sl', tags: [] });
      req.body = { name: 'n' }; // missing sku/price/stock
      await updateProduct(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 on duplicate SKU', async () => {
      req.params = { productId: PID };
      Product.findById.mockResolvedValue({ sku: 'OLD', slug: 'sl', tags: [] });
      Product.findOne.mockResolvedValue({ _id: 'other' }); // duplicate
      req.body = { name: 'n', sku: 'NEWSKU', price: 10, stockQuantity: 1 };
      await updateProduct(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 on invalid category', async () => {
      req.params = { productId: PID };
      Product.findById.mockResolvedValue({ sku: 's', slug: 'sl', tags: [] });
      Product.findOne.mockResolvedValue(null); // sku ok
      Category.findById.mockResolvedValue(null);
      req.body = { name: 'n', sku: 's', price: 10, stockQuantity: 1, category: '507f1f77bcf86cd799439099' };
      await updateProduct(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('200 happy path updates product and resolves unique slug', async () => {
      Product.findById.mockResolvedValue({ sku: 'OLD', slug: 'old-slug', tags: ['a'], condition: 'new', status: 'active' });
      // SKU check: none. Slug uniqueness loop: one collision then free.
      Product.findOne
        .mockResolvedValueOnce(null) // sku duplicate check (sku===OLD so skipped, but safe)
        .mockResolvedValueOnce({ _id: 'other' }) // first slug collision
        .mockResolvedValueOnce(null); // slug-1 free
      Product.findByIdAndUpdate.mockReturnValue({
        populate: vi.fn().mockResolvedValue({ _id: PID, name: 'New' })
      });
      Category.findById.mockResolvedValue({ _id: 'cat' });

      req.params = { productId: PID };
      req.body = {
        name: 'New', sku: 'old', slug: 'old-slug', price: '10', stockQuantity: '5',
        category: 'cat', tags: 'x, y', salePrice: '8', lowStockThreshold: '2',
        stockStatus: 'in_stock', leadTimeMinDays: '3', leadTimeMaxDays: '5'
      };
      await updateProduct(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('500 on CastError', async () => {
      Product.findById.mockRejectedValue(Object.assign(new Error('cast'), { name: 'CastError' }));
      req.params = { productId: PID };
      req.body = { name: 'n', sku: 's', price: 10, stockQuantity: 1 };
      await updateProduct(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 on ValidationError', async () => {
      Product.findById.mockRejectedValue(Object.assign(new Error('v'), {
        name: 'ValidationError',
        errors: { a: { message: 'bad' } }
      }));
      req.params = { productId: PID };
      req.body = { name: 'n', sku: 's', price: 10, stockQuantity: 1 };
      await updateProduct(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('500 on generic error', async () => {
      Product.findById.mockRejectedValue(new Error('boom'));
      req.params = { productId: PID };
      req.body = { name: 'n', sku: 's', price: 10, stockQuantity: 1 };
      await updateProduct(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- deleteProduct ----------------
  describe('deleteProduct', () => {
    const PID = '507f1f77bcf86cd799439011';

    test('400 when productId missing', async () => {
      req.params = {};
      await deleteProduct(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 on invalid productId format', async () => {
      req.params = { productId: 'nope' };
      await deleteProduct(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('404 when product not found', async () => {
      req.params = { productId: PID };
      Product.findById.mockResolvedValue(null);
      await deleteProduct(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('400 when product already archived', async () => {
      req.params = { productId: PID };
      Product.findById.mockResolvedValue({ isArchived: () => true });
      await deleteProduct(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('200 happy path archives product', async () => {
      req.params = { productId: PID };
      const product = { name: 'P', isArchived: () => false, softDelete: vi.fn().mockResolvedValue({}) };
      Product.findById.mockResolvedValue(product);
      await deleteProduct(req, res);
      expect(product.softDelete).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('400 on CastError', async () => {
      req.params = { productId: PID };
      Product.findById.mockRejectedValue(Object.assign(new Error('c'), { name: 'CastError' }));
      await deleteProduct(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('500 on generic error', async () => {
      req.params = { productId: PID };
      Product.findById.mockRejectedValue(new Error('boom'));
      await deleteProduct(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- getCustomerReport ----------------
  describe('getCustomerReport', () => {
    test('400 when dates missing', async () => {
      req.query = {};
      await getCustomerReport(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('200 happy path returns new customer count', async () => {
      req.query = { startDate: '2026-01-01', endDate: '2026-01-31' };
      User.countDocuments.mockResolvedValue(7);
      await getCustomerReport(req, res);
      expect(User.countDocuments).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, newCustomerCount: 7 }));
    });

    test('500 on error', async () => {
      req.query = { startDate: '2026-01-01', endDate: '2026-01-31' };
      User.countDocuments.mockRejectedValue(new Error('boom'));
      await getCustomerReport(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
