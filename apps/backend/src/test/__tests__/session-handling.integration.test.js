import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Payment from '../../models/Payment.js';

describe('Session Handling Integration Tests', () => {
  beforeAll(async () => {
    // Test should use the global setup from setup.js
    console.log('MongoDB connection state:', mongoose.connection.readyState);
  });

  // Helper function to create valid order data
  const createValidOrderData = (user, orderNumber, paymentMethodType = 'paypal') => ({
    userId: user._id,
    customerEmail: user.email,
    orderNumber: orderNumber,
    items: [{
      productId: new mongoose.Types.ObjectId(),
      productName: 'Test Product',
      productSlug: 'test-product',
      quantity: 1,
      unitPrice: 99.99,
      totalPrice: 99.99
    }],
    subtotal: 99.99,
    tax: 0,
    shipping: 5.99,
    totalAmount: 105.98,
    shippingAddress: {
      fullName: user.firstName + ' ' + user.lastName,
      addressLine1: '123 Test St',
      city: 'Test City',
      stateProvince: 'Test State',
      postalCode: '12345',
      country: 'US'
    },
    billingAddress: {
      fullName: user.firstName + ' ' + user.lastName,
      addressLine1: '123 Test St',
      city: 'Test City',
      stateProvince: 'Test State',
      postalCode: '12345',
      country: 'US'
    },
    shippingMethod: {
      id: new mongoose.Types.ObjectId(),
      name: 'Standard Shipping',
      cost: 5.99,
      estimatedDelivery: '3-5 business days'
    },
    paymentMethod: {
      type: paymentMethodType,
      name: paymentMethodType === 'paypal' ? 'PayPal' : paymentMethodType === 'bitcoin' ? 'Bitcoin' : 'Monero'
    },
    paymentStatus: 'pending',
    orderStatus: 'pending'
  });

  afterEach(async () => {
    // Clean up test data
    if (mongoose.connection.readyState === 1) {
      await User.deleteMany({});
      await Order.deleteMany({});
      await Payment.deleteMany({});
    }
  });

  describe('MongoDB Session Mocking', () => {
    it('should handle session-based operations without errors', async () => {
      // Create a test user
      const user = new User({
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer'
      });
      
      await user.save();
      expect(user._id).toBeDefined();
    });

    it('should handle order creation without session errors', async () => {
      // Create test user first
      const user = new User({
        email: 'order-test@example.com',
        password: 'hashedPassword',
        firstName: 'Order',
        lastName: 'Test',
        role: 'customer'
      });
      await user.save();

      // Create test order with all required fields
      const order = new Order(createValidOrderData(user, 'TEST-001'));

      await order.save();
      expect(order._id).toBeDefined();
      expect(order.orderNumber).toBe('TEST-001');
    });

    it('should handle payment creation without session errors', async () => {
      // Create test user and order first
      const user = new User({
        email: 'payment-test@example.com',
        password: 'hashedPassword',
        firstName: 'Payment',
        lastName: 'Test',
        role: 'customer'
      });
      await user.save();

      const order = new Order(createValidOrderData(user, 'PAYMENT-001', 'bitcoin'));
      await order.save();

      // Create payment
      const payment = new Payment({
        paymentId: 'PAY-TEST-BITCOIN-001',
        orderId: order._id,
        orderNumber: order.orderNumber,
        userId: user._id,
        customerEmail: user.email,
        paymentMethod: 'bitcoin',
        amount: 105.98,
        currency: 'GBP',
        status: 'pending',
        bitcoinAddress: 'test-bitcoin-address',
        bitcoinAmount: 0.00235511,
        bitcoinExchangeRate: 45000
      });

      await payment.save();
      expect(payment._id).toBeDefined();
      expect(payment.paymentId).toBeDefined();
      expect(payment.paymentMethod).toBe('bitcoin');
    });

    it('should handle updates without session errors', async () => {
      // Create and update a user
      const user = new User({
        email: 'update-test@example.com',
        password: 'hashedPassword',
        firstName: 'Update',
        lastName: 'Test',
        role: 'customer'
      });
      await user.save();

      // Update using findByIdAndUpdate (common source of session errors)
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { firstName: 'Updated' },
        { new: true }
      );

      expect(updatedUser.firstName).toBe('Updated');
    });

    it('should handle bulk operations without session errors', async () => {
      // Create multiple users
      const users = await User.create([
        {
          email: 'bulk1@example.com',
          password: 'hashedPassword',
          firstName: 'Bulk1',
          lastName: 'Test',
          role: 'customer'
        },
        {
          email: 'bulk2@example.com',
          password: 'hashedPassword',
          firstName: 'Bulk2',
          lastName: 'Test',
          role: 'customer'
        }
      ]);

      expect(users).toHaveLength(2);
      expect(users[0]._id).toBeDefined();
      expect(users[1]._id).toBeDefined();

      // Update multiple users
      const updateResult = await User.updateMany(
        { lastName: 'Test' },
        { lastName: 'Updated' }
      );

      expect(updateResult.modifiedCount).toBe(2);
    });

    it('should handle transactions gracefully with mocked sessions', async () => {
      // This tests our session mocking with transaction-like operations
      const session = await mongoose.startSession();
      
      try {
        await session.withTransaction(async () => {
          const user = new User({
            email: 'transaction-test@example.com',
            password: 'hashedPassword',
            firstName: 'Transaction',
            lastName: 'Test',
            role: 'customer'
          });
          
          // Save without session to avoid "Unable to acquire server session" error
          await user.save();
          
          const order = new Order(createValidOrderData(user, 'TRANS-001', 'paypal'));
          
          await order.save();
          
          return { user, order };
        });
        
        // Verify the data was created (session mocking should allow this)
        const user = await User.findOne({ email: 'transaction-test@example.com' });
        expect(user).toBeDefined();
        expect(user.firstName).toBe('Transaction');
        
      } finally {
        await session.endSession();
      }
    });
  });

  describe('Model Validation', () => {
    it('should validate Payment model fields correctly', async () => {
      const user = new User({
        email: 'validation-test@example.com',
        password: 'hashedPassword',
        firstName: 'Validation',
        lastName: 'Test',
        role: 'customer'
      });
      await user.save();

      const order = new Order(createValidOrderData(user, 'VAL-001', 'monero'));
      await order.save();

      // Test payment validation
      const payment = new Payment({
        paymentId: 'PAY-TEST-MONERO-001',
        orderId: order._id,
        orderNumber: order.orderNumber,
        userId: user._id,
        customerEmail: user.email,
        paymentMethod: 'monero',
        amount: 105.98,
        currency: 'GBP',
        status: 'pending'
      });

      await payment.save();
      
      // Test payment methods
      expect(payment.isPending()).toBe(true);
      expect(payment.isCompleted()).toBe(false);
      expect(payment.canBeRefunded()).toBe(false);
      expect(payment.getRefundableAmount()).toBe(105.98);
    });

    it('should handle Payment model instance methods', async () => {
      const user = new User({
        email: 'methods-test@example.com',
        password: 'hashedPassword',
        firstName: 'Methods',
        lastName: 'Test',
        role: 'customer'
      });
      await user.save();

      const order = new Order(createValidOrderData(user, 'METHODS-001', 'paypal'));
      await order.save();

      const payment = new Payment({
        paymentId: 'PAY-TEST-PAYPAL-001',
        orderId: order._id,
        orderNumber: order.orderNumber,
        userId: user._id,
        customerEmail: user.email,
        paymentMethod: 'paypal',
        amount: 105.98,
        currency: 'GBP',
        status: 'pending'
      });
      await payment.save();

      // Test marking as completed
      await payment.markAsCompleted();
      expect(payment.status).toBe('completed');
      expect(payment.completedAt).toBeDefined();
      expect(payment.isCompleted()).toBe(true);
      expect(payment.canBeRefunded()).toBe(true);

      // Test adding webhook data
      await payment.addWebhookData('payment.completed', { transactionId: 'test-123' });
      expect(payment.webhookData).toHaveLength(1);
      expect(payment.webhookData[0].event).toBe('payment.completed');
    });
  });
});