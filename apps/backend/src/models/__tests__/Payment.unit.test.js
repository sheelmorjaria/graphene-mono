import { describe, it, expect, afterEach } from 'vitest';
import mongoose from 'mongoose';
import Payment from '../Payment.js';

let idCounter = 0;
// Helper: build a valid payment doc (callers may override fields).
// paymentId must be unique per call (it has a unique index).
const validPayment = (over = {}) => ({
  paymentId: `PAY-TEST-${++idCounter}`,
  orderId: new mongoose.Types.ObjectId(),
  orderNumber: 'ORD-100001',
  userId: new mongoose.Types.ObjectId(),
  customerEmail: 'customer@example.com',
  paymentMethod: 'paypal',
  amount: 199.99,
  ...over
});

describe('Payment Model', () => {
  afterEach(async () => {
    await Payment.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create a valid payment with required fields', async () => {
      const data = validPayment();
      const payment = new Payment(data);
      const saved = await payment.save();

      expect(saved._id).toBeDefined();
      expect(saved.paymentId).toBe(data.paymentId);
      expect(saved.orderNumber).toBe(data.orderNumber);
      expect(saved.customerEmail).toBe('customer@example.com');
      expect(saved.amount).toBe(data.amount);
      expect(saved.createdAt).toBeDefined();
      expect(saved.updatedAt).toBeDefined();
    });

    it('should apply defaults (currency, status, fees, retryCount, initiatedAt)', async () => {
      const saved = await new Payment(validPayment()).save();

      expect(saved.currency).toBe('GBP');
      expect(saved.status).toBe('pending');
      expect(saved.transactionFee).toBe(0);
      expect(saved.networkFee).toBe(0);
      expect(saved.refundAmount).toBe(0);
      expect(saved.retryCount).toBe(0);
      expect(saved.initiatedAt).toBeDefined();
    });

    it('should require paymentId', async () => {
      const payment = new Payment(validPayment({ paymentId: undefined }));
      await expect(payment.save()).rejects.toThrow('Payment ID is required');
    });

    it('should require orderId', async () => {
      const payment = new Payment(validPayment({ orderId: undefined }));
      await expect(payment.save()).rejects.toThrow('Order ID is required');
    });

    it('should require orderNumber', async () => {
      const payment = new Payment(validPayment({ orderNumber: undefined }));
      await expect(payment.save()).rejects.toThrow('Order number is required');
    });

    it('should require userId', async () => {
      const payment = new Payment(validPayment({ userId: undefined }));
      await expect(payment.save()).rejects.toThrow('User ID is required');
    });

    it('should require customerEmail', async () => {
      const payment = new Payment(validPayment({ customerEmail: undefined }));
      await expect(payment.save()).rejects.toThrow('Customer email is required');
    });

    it('should require paymentMethod', async () => {
      const payment = new Payment(validPayment({ paymentMethod: undefined }));
      await expect(payment.save()).rejects.toThrow('Payment method is required');
    });

    it('should reject an invalid paymentMethod (enum)', async () => {
      const payment = new Payment(validPayment({ paymentMethod: 'bitcoin' }));
      await expect(payment.save()).rejects.toThrow();
    });

    it('should reject a negative amount', async () => {
      const payment = new Payment(validPayment({ amount: -5 }));
      await expect(payment.save()).rejects.toThrow('Payment amount cannot be negative');
    });

    it('should require amount', async () => {
      const payment = new Payment(validPayment({ amount: undefined }));
      await expect(payment.save()).rejects.toThrow('Payment amount is required');
    });

    it('should enforce paymentId uniqueness', async () => {
      await new Payment(validPayment({ paymentId: 'PAY-UNIQUE-1' })).save();
      const dup = new Payment(validPayment({ paymentId: 'PAY-UNIQUE-1' }));
      await expect(dup.save()).rejects.toThrow();
    });

    it('should enforce currency enum', async () => {
      const ok = await new Payment(validPayment({ currency: 'usd' })).save();
      expect(ok.currency).toBe('USD');
      const bad = new Payment(validPayment({ currency: 'JPY' }));
      await expect(bad.save()).rejects.toThrow();
    });

    it('should enforce status enum and lowercase it', async () => {
      const saved = await new Payment(validPayment({ status: 'COMPLETED' })).save();
      expect(saved.status).toBe('completed');
      const bad = new Payment(validPayment({ status: 'nonsense' }));
      await expect(bad.save()).rejects.toThrow();
    });

    it('should lowercase customerEmail and paypalPayerEmail', async () => {
      const saved = await new Payment(
        validPayment({ customerEmail: 'UPPER@EXAMPLE.COM', paypalPayerEmail: 'PAYER@EXAMPLE.COM' })
      ).save();
      expect(saved.customerEmail).toBe('upper@example.com');
      expect(saved.paypalPayerEmail).toBe('payer@example.com');
    });
  });

  describe('Pre-save middleware', () => {
    it('should generate a paymentId when none is provided (skip required validation)', async () => {
      // The schema marks paymentId as required, and Mongoose runs required
      // validators BEFORE pre('save') hooks. So the generation path only runs
      // when validation is skipped. This documents that the hook fires.
      const payment = new Payment(validPayment());
      payment.paymentId = undefined;
      const saved = await payment.save({ validateBeforeSave: false });
      expect(saved.paymentId).toMatch(/^PAY-/);
    });
  });

  describe('Instance methods', () => {
    it('isCompleted / isPending', async () => {
      const completed = await new Payment(validPayment({ status: 'completed' })).save();
      const processing = await new Payment(validPayment({ status: 'processing' })).save();
      const failed = await new Payment(validPayment({ status: 'failed' })).save();

      expect(completed.isCompleted()).toBe(true);
      expect(processing.isCompleted()).toBe(false);
      expect(processing.isPending()).toBe(true);
      expect(failed.isPending()).toBe(false);
    });

    it('canBeRefunded', async () => {
      const completed = await new Payment(validPayment({ amount: 100, status: 'completed' })).save();
      const pending = await new Payment(validPayment({ amount: 100, status: 'pending' })).save();
      const fullyRefunded = await new Payment(
        validPayment({ amount: 100, refundAmount: 100, status: 'completed' })
      ).save();

      expect(completed.canBeRefunded()).toBe(true);
      expect(pending.canBeRefunded()).toBe(false);
      expect(fullyRefunded.canBeRefunded()).toBe(false);
    });

    it('getRefundableAmount', async () => {
      const partial = await new Payment(
        validPayment({ amount: 100, refundAmount: 30 })
      ).save();
      const full = await new Payment(
        validPayment({ amount: 100, refundAmount: 150 })
      ).save();
      expect(partial.getRefundableAmount()).toBe(70);
      expect(full.getRefundableAmount()).toBe(0);
    });

    it('markAsCompleted sets status + completedAt', async () => {
      const payment = await new Payment(validPayment()).save();
      const updated = await payment.markAsCompleted();
      expect(updated.status).toBe('completed');
      expect(updated.completedAt).toBeDefined();
    });

    it('markAsFailed sets status + failureReason', async () => {
      const payment = await new Payment(validPayment()).save();
      const updated = await payment.markAsFailed('Card declined');
      expect(updated.status).toBe('failed');
      expect(updated.failureReason).toBe('Card declined');
    });

    it('addWebhookData pushes a webhook entry', async () => {
      const payment = await new Payment(validPayment()).save();
      const updated = await payment.addWebhookData('PAYMENT.CAPTURE.COMPLETED', { id: 'cap-1' });
      expect(updated.webhookData).toHaveLength(1);
      expect(updated.webhookData[0].event).toBe('PAYMENT.CAPTURE.COMPLETED');
      expect(updated.webhookData[0].data).toEqual({ id: 'cap-1' });
      expect(updated.webhookData[0].timestamp).toBeDefined();
    });
  });

  describe('Static methods', () => {
    it('findByOrderId returns payments for the order, newest first', async () => {
      const orderId = new mongoose.Types.ObjectId();
      const older = await new Payment(validPayment({ orderId, paymentId: 'P-OLD' })).save();
      const newer = await new Payment(validPayment({ orderId, paymentId: 'P-NEW' })).save();
      // Unrelated payment
      await new Payment(validPayment({ paymentId: 'P-OTHER' })).save();

      const found = await Payment.findByOrderId(orderId);
      expect(found).toHaveLength(2);
      expect(found[0]._id.toString()).toBe(newer._id.toString());
      expect(found[1]._id.toString()).toBe(older._id.toString());
    });

    it('findPendingPayments returns pending + processing', async () => {
      await new Payment(validPayment({ paymentId: 'P1', status: 'pending' })).save();
      await new Payment(validPayment({ paymentId: 'P2', status: 'processing' })).save();
      await new Payment(validPayment({ paymentId: 'P3', status: 'completed' })).save();

      const found = await Payment.findPendingPayments();
      expect(found).toHaveLength(2);
      expect(found.every(p => ['pending', 'processing'].includes(p.status))).toBe(true);
    });

    it('findCompletedPayments filters by completed status', async () => {
      await new Payment(validPayment({ paymentId: 'P1', status: 'completed', completedAt: new Date('2024-01-01') })).save();
      await new Payment(validPayment({ paymentId: 'P2', status: 'pending' })).save();

      const all = await Payment.findCompletedPayments();
      expect(all).toHaveLength(1);

      const none = await Payment.findCompletedPayments(new Date('2030-01-01'));
      expect(none).toHaveLength(0);
    });

    it('getPaymentStats aggregates completed payments by method', async () => {
      await new Payment(validPayment({ paymentId: 'P1', paymentMethod: 'paypal', amount: 100, status: 'completed' })).save();
      await new Payment(validPayment({ paymentId: 'P2', paymentMethod: 'paypal', amount: 200, status: 'completed' })).save();
      await new Payment(validPayment({ paymentId: 'P3', paymentMethod: 'paypal', amount: 50, status: 'pending' })).save();

      const stats = await Payment.getPaymentStats();
      expect(stats).toHaveLength(1);
      expect(stats[0]._id).toBe('paypal');
      expect(stats[0].count).toBe(2);
      expect(stats[0].totalAmount).toBe(300);
      expect(stats[0].avgAmount).toBe(150);
    });
  });
});
