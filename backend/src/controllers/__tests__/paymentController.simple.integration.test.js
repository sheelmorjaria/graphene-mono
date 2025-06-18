import { vi } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import Order from '../../models/Order.js';
import Payment from '../../models/Payment.js';
import User from '../../models/User.js';
import mongoose from 'mongoose';
import { createValidOrderData } from '../../test/helpers/testDataFactory.js';

describe('Payment Controller Simple Integration Tests', () => {
  let testUser, testOrder;

  beforeEach(async () => {
    // Create test user
    testUser = new User({
      email: 'test@example.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'customer'
    });
    await testUser.save();

    // Create test order with proper validation data
    const orderData = createValidOrderData(testUser, 'ORD-TEST-001', 'paypal');
    testOrder = new Order(orderData);
    await testOrder.save();
  });

  describe('Payment Model Integration', () => {
    it('should create a payment record successfully', async () => {
      const payment = new Payment({
        paymentId: 'PAY-TEST-001',
        orderId: testOrder._id,
        orderNumber: testOrder.orderNumber,
        userId: testUser._id,
        customerEmail: testUser.email,
        paymentMethod: 'paypal',
        amount: 105.98,
        currency: 'GBP',
        status: 'pending'
      });

      await payment.save();
      expect(payment._id).toBeDefined();
      expect(payment.paymentId).toBe('PAY-TEST-001');
      expect(payment.isCompleted()).toBe(false);
      expect(payment.isPending()).toBe(true);
    });

    it('should update payment status correctly', async () => {
      const payment = new Payment({
        paymentId: 'PAY-TEST-002',
        orderId: testOrder._id,
        orderNumber: testOrder.orderNumber,
        userId: testUser._id,
        customerEmail: testUser.email,
        paymentMethod: 'bitcoin',
        amount: 105.98,
        currency: 'GBP',
        status: 'pending',
        bitcoinAddress: 'test-address',
        bitcoinAmount: 0.00235511,
        bitcoinExchangeRate: 45000
      });

      await payment.save();
      
      // Update to completed
      await payment.markAsCompleted();
      
      expect(payment.status).toBe('completed');
      expect(payment.completedAt).toBeDefined();
      expect(payment.isCompleted()).toBe(true);
      expect(payment.canBeRefunded()).toBe(true);
    });

    it('should handle payment webhook data', async () => {
      const payment = new Payment({
        paymentId: 'PAY-TEST-003',
        orderId: testOrder._id,
        orderNumber: testOrder.orderNumber,
        userId: testUser._id,
        customerEmail: testUser.email,
        paymentMethod: 'monero',
        amount: 105.98,
        currency: 'GBP',
        status: 'pending'
      });

      await payment.save();
      
      // Add webhook data
      await payment.addWebhookData('payment.received', { amount: 0.425 });
      
      expect(payment.webhookData).toHaveLength(1);
      expect(payment.webhookData[0].event).toBe('payment.received');
      expect(payment.webhookData[0].data.amount).toBe(0.425);
    });
  });

  describe('Order and Payment Relationship', () => {
    it('should link payments to orders correctly', async () => {
      const payment = new Payment({
        paymentId: 'PAY-TEST-004',
        orderId: testOrder._id,
        orderNumber: testOrder.orderNumber,
        userId: testUser._id,
        customerEmail: testUser.email,
        paymentMethod: 'paypal',
        amount: testOrder.totalAmount,
        currency: 'GBP',
        status: 'completed'
      });

      await payment.save();
      
      // Find payments for this order
      const orderPayments = await Payment.findByOrderId(testOrder._id);
      
      expect(orderPayments).toHaveLength(1);
      expect(orderPayments[0].paymentId).toBe('PAY-TEST-004');
      expect(orderPayments[0].amount).toBe(testOrder.totalAmount);
    });

    it('should validate payment amounts match orders', async () => {
      // Try to create payment with wrong amount
      const payment = new Payment({
        paymentId: 'PAY-TEST-005',
        orderId: testOrder._id,
        orderNumber: testOrder.orderNumber,
        userId: testUser._id,
        customerEmail: testUser.email,
        paymentMethod: 'bitcoin',
        amount: 50.00, // Different from order total
        currency: 'GBP',
        status: 'pending',
        bitcoinAmount: 0.001,
        bitcoinExchangeRate: 40000 // This would calculate to 40.00, which doesn't match 50.00
      });

      // This should fail validation in the pre-save hook
      await expect(payment.save()).rejects.toThrow('Bitcoin amount does not match GBP amount');
    });
  });

  describe('Payment Query Methods', () => {
    beforeEach(async () => {
      // Create multiple payments for testing queries
      const payments = [
        {
          paymentId: 'PAY-QUERY-001',
          orderId: testOrder._id,
          orderNumber: testOrder.orderNumber,
          userId: testUser._id,
          customerEmail: testUser.email,
          paymentMethod: 'paypal',
          amount: 100,
          currency: 'GBP',
          status: 'completed',
          completedAt: new Date()
        },
        {
          paymentId: 'PAY-QUERY-002',
          orderId: testOrder._id,
          orderNumber: testOrder.orderNumber,
          userId: testUser._id,
          customerEmail: testUser.email,
          paymentMethod: 'bitcoin',
          amount: 200,
          currency: 'GBP',
          status: 'pending'
        }
      ];

      await Payment.create(payments);
    });

    it('should find pending payments', async () => {
      const pendingPayments = await Payment.findPendingPayments();
      
      expect(pendingPayments.length).toBeGreaterThanOrEqual(1);
      expect(pendingPayments.every(p => ['pending', 'processing'].includes(p.status))).toBe(true);
    });

    it('should find completed payments', async () => {
      const completedPayments = await Payment.findCompletedPayments();
      
      expect(completedPayments.length).toBeGreaterThanOrEqual(1);
      expect(completedPayments.every(p => p.status === 'completed')).toBe(true);
    });

    it('should generate payment statistics', async () => {
      const stats = await Payment.getPaymentStats();
      
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBeGreaterThan(0);
      
      // Should have payment method groupings
      const paypalStats = stats.find(s => s._id === 'paypal');
      expect(paypalStats).toBeDefined();
      expect(paypalStats.totalAmount).toBeGreaterThan(0);
      expect(paypalStats.count).toBeGreaterThan(0);
    });
  });
});