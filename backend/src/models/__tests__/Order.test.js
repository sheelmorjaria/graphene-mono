import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import Order from '../Order.js';

describe('Order Model', () => {
  // Using global test setup for MongoDB connection

  beforeEach(async () => {
    await Order.deleteMany({});
  });

  afterEach(async () => {
    await Order.deleteMany({});
  });

  const getValidOrderData = () => ({
    userId: new mongoose.Types.ObjectId(),
    customerEmail: `test-${Date.now()}-${Math.random()}@example.com`,
    status: 'pending',
    items: [{
      productId: new mongoose.Types.ObjectId(),
      productName: 'GrapheneOS Pixel 9 Pro',
      productSlug: 'grapheneos-pixel-9-pro',
      quantity: 1,
      unitPrice: 999.99,
      totalPrice: 999.99
    }],
    subtotal: 999.99,
    tax: 80.00,
    shipping: 15.00,
    shippingAddress: {
      fullName: 'John Doe',
      addressLine1: '123 Main St',
      city: 'New York',
      stateProvince: 'NY',
      postalCode: '10001',
      country: 'United States',
      phoneNumber: '+1 (555) 123-4567'
    },
    billingAddress: {
      fullName: 'John Doe',
      addressLine1: '123 Main St',
      city: 'New York',
      stateProvince: 'NY',
      postalCode: '10001',
      country: 'United States',
      phoneNumber: '+1 (555) 123-4567'
    },
    shippingMethod: {
      id: new mongoose.Types.ObjectId(),
      name: 'Standard Shipping',
      cost: 15.00,
      estimatedDelivery: '3-5 business days'
    },
    paymentMethod: {
      type: 'paypal',
      name: 'PayPal'
    }
  });

  describe('Schema Validation', () => {
    it('should create a valid order', async () => {
      const order = new Order(getValidOrderData());
      const savedOrder = await order.save();

      expect(savedOrder._id).toBeDefined();
      expect(savedOrder.orderNumber).toMatch(/^ORD-\d+-\d{3}$/);
      expect(savedOrder.totalAmount).toBe(1094.99); // subtotal + tax + shipping
      expect(savedOrder.orderDate).toBeDefined();
      expect(savedOrder.paymentStatus).toBe('pending'); // default value
    });

    it('should require userId', async () => {
      const invalidOrder = new Order({
        ...getValidOrderData(),
        userId: undefined
      });

      await expect(invalidOrder.save()).rejects.toThrow('User ID is required');
    });

    it('should require customerEmail', async () => {
      const invalidOrder = new Order({
        ...getValidOrderData(),
        customerEmail: undefined
      });

      await expect(invalidOrder.save()).rejects.toThrow('Customer email is required');
    });

    it('should require at least one item', async () => {
      const invalidOrder = new Order({
        ...getValidOrderData(),
        items: []
      });

      await expect(invalidOrder.save()).rejects.toThrow('Order must contain at least one item');
    });

    it('should require valid order status', async () => {
      const invalidOrder = new Order({
        ...getValidOrderData(),
        status: 'invalid_status'
      });

      await expect(invalidOrder.save()).rejects.toThrow('Status must be one of');
    });

    it('should require valid payment method', async () => {
      const invalidOrder = new Order({
        ...getValidOrderData(),
        paymentMethod: {
          type: 'invalid_method',
          name: 'Invalid Payment'
        }
      });

      await expect(invalidOrder.save()).rejects.toThrow('Payment method type must be: paypal, bitcoin, monero');
    });

    it('should not allow negative amounts', async () => {
      const invalidOrder = new Order({
        ...getValidOrderData(),
        totalAmount: -100
      });

      await expect(invalidOrder.save()).rejects.toThrow('Total amount cannot be negative');
    });

    it('should require shipping address', async () => {
      const invalidOrder = new Order({
        ...getValidOrderData(),
        shippingAddress: undefined
      });

      await expect(invalidOrder.save()).rejects.toThrow('Shipping address is required');
    });

    it('should require billing address', async () => {
      const invalidOrder = new Order({
        ...getValidOrderData(),
        billingAddress: undefined
      });

      await expect(invalidOrder.save()).rejects.toThrow('Billing address is required');
    });
  });

  describe('Order Number Generation', () => {
    it('should auto-generate order number if not provided', async () => {
      const order = new Order(getValidOrderData());
      const savedOrder = await order.save();

      expect(savedOrder.orderNumber).toMatch(/^ORD-\d+-\d{3}$/);
    });

    it('should use provided order number', async () => {
      const customOrderNumber = 'CUSTOM-12345';
      const order = new Order({
        ...getValidOrderData(),
        orderNumber: customOrderNumber
      });
      const savedOrder = await order.save();

      expect(savedOrder.orderNumber).toBe(customOrderNumber);
    });

    it('should ensure order number uniqueness', async () => {
      const orderNumber = 'DUPLICATE-ORDER';
      
      const order1 = new Order({
        ...getValidOrderData(),
        orderNumber
      });
      await order1.save();

      const order2 = new Order({
        ...getValidOrderData(),
        orderNumber,
        customerEmail: 'different@example.com'
      });

      await expect(order2.save()).rejects.toThrow();
    });
  });

  describe('Total Amount Calculation', () => {
    it('should calculate total amount from subtotal, tax, and shipping', async () => {
      const orderData = {
        ...getValidOrderData(),
        subtotal: 100.00,
        tax: 8.25,
        shipping: 10.00
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.totalAmount).toBe(118.25);
    });

    it('should handle zero tax and shipping', async () => {
      const orderData = {
        ...getValidOrderData(),
        subtotal: 100.00,
        tax: 0,
        shipping: 0
      };

      const order = new Order(orderData);
      const savedOrder = await order.save();

      expect(savedOrder.totalAmount).toBe(100.00);
    });

  });

  describe('Instance Methods', () => {
    let savedOrder;

    beforeEach(async () => {
      const order = new Order(getValidOrderData());
      savedOrder = await order.save();
    });

    it('should format status display correctly', () => {
      expect(savedOrder.getStatusDisplay()).toBe('Pending');
      
      savedOrder.status = 'processing';
      expect(savedOrder.getStatusDisplay()).toBe('Processing');
      
      savedOrder.status = 'shipped';
      expect(savedOrder.getStatusDisplay()).toBe('Shipped');
    });

    it('should format order date correctly', () => {
      const formattedDate = savedOrder.getFormattedDate();
      expect(formattedDate).toMatch(/\w+ \d{1,2}, \d{4}/);
    });

    it('should format payment method display correctly', () => {
      // Test basic payment method
      expect(savedOrder.getPaymentMethodDisplay()).toBe('PayPal');
      
      // Test with different payment method name
      savedOrder.paymentMethod = {
        type: 'bitcoin',
        name: 'Bitcoin'
      };
      expect(savedOrder.getPaymentMethodDisplay()).toBe('Bitcoin');
      
      // Test PayPal
      savedOrder.paymentMethod = {
        type: 'paypal',
        name: 'PayPal'
      };
      savedOrder.paymentDetails = {};
      expect(savedOrder.getPaymentMethodDisplay()).toBe('PayPal');
    });

    it('should calculate maximum refundable amount correctly', () => {
      expect(savedOrder.getMaxRefundableAmount()).toBe(1094.99); // Total amount - 0 refunded
      
      // Test with some refunded amount
      savedOrder.totalRefundedAmount = 500;
      expect(savedOrder.getMaxRefundableAmount()).toBe(594.99); // 1094.99 - 500
      
      // Test fully refunded
      savedOrder.totalRefundedAmount = 1094.99;
      expect(savedOrder.getMaxRefundableAmount()).toBe(0);
      
      // Test over-refunded (should not be negative)
      savedOrder.totalRefundedAmount = 1200;
      expect(savedOrder.getMaxRefundableAmount()).toBe(0);
    });

    it('should check refund eligibility correctly', () => {
      // Order should be eligible when payment is completed and not fully refunded
      savedOrder.paymentStatus = 'completed';
      savedOrder.refundStatus = 'none';
      savedOrder.totalRefundedAmount = 0;
      expect(savedOrder.isRefundEligible()).toBe(true);
      
      // Not eligible if payment not completed
      savedOrder.paymentStatus = 'pending';
      expect(savedOrder.isRefundEligible()).toBe(false);
      
      // Not eligible if fully refunded
      savedOrder.paymentStatus = 'completed';
      savedOrder.refundStatus = 'fully_refunded';
      expect(savedOrder.isRefundEligible()).toBe(false);
      
      // Not eligible if no refundable amount left
      savedOrder.refundStatus = 'partial_refunded';
      savedOrder.totalRefundedAmount = 1094.99;
      expect(savedOrder.isRefundEligible()).toBe(false);
    });
  });

  describe('Static Methods', () => {
    let userId;
    // let orders; // For future test expansion

    beforeEach(async () => {
      userId = new mongoose.Types.ObjectId();
      
      // Create multiple orders for the same user
      await Promise.all([
        new Order({
          ...getValidOrderData(),
          userId,
          customerEmail: 'user1@example.com',
          orderDate: new Date('2024-01-01'),
          totalAmount: 100
        }).save(),
        new Order({
          ...getValidOrderData(),
          userId,
          customerEmail: 'user1@example.com',
          orderDate: new Date('2024-01-02'),
          totalAmount: 200
        }).save(),
        new Order({
          ...getValidOrderData(),
          userId,
          customerEmail: 'user1@example.com',
          orderDate: new Date('2024-01-03'),
          totalAmount: 300
        }).save()
      ]);

      // Create order for different user
      await new Order({
        ...getValidOrderData(),
        userId: new mongoose.Types.ObjectId(),
        customerEmail: 'user2@example.com'
      }).save();
    });

    it('should find orders by user with default sorting (newest first)', async () => {
      const userOrders = await Order.findByUser(userId);

      expect(userOrders).toHaveLength(3);
      expect(userOrders[0].totalAmount).toBe(300); // Most recent order
      expect(userOrders[1].totalAmount).toBe(200);
      expect(userOrders[2].totalAmount).toBe(100); // Oldest order
    });

    it('should support pagination', async () => {
      const page1 = await Order.findByUser(userId, { page: 1, limit: 2 });
      const page2 = await Order.findByUser(userId, { page: 2, limit: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(1);
      expect(page1[0].totalAmount).toBe(300);
      expect(page1[1].totalAmount).toBe(200);
      expect(page2[0].totalAmount).toBe(100);
    });

    it('should support custom sorting', async () => {
      const userOrders = await Order.findByUser(userId, { 
        sortBy: 'totalAmount', 
        sortOrder: 1 
      });

      expect(userOrders).toHaveLength(3);
      expect(userOrders[0].totalAmount).toBe(100); // Lowest amount first
      expect(userOrders[1].totalAmount).toBe(200);
      expect(userOrders[2].totalAmount).toBe(300); // Highest amount last
    });

    it('should count orders by user', async () => {
      const count = await Order.countByUser(userId);
      expect(count).toBe(3);
    });

    it('should return 0 count for user with no orders', async () => {
      const newUserId = new mongoose.Types.ObjectId();
      const count = await Order.countByUser(newUserId);
      expect(count).toBe(0);
    });
  });

  describe('Indexes', () => {
    it('should have index on userId', async () => {
      const indexes = await Order.collection.getIndexes();
      const userIdIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'userId')
      );
      expect(userIdIndex).toBeDefined();
    });

    it('should have compound index on userId and orderDate', async () => {
      const indexes = await Order.collection.getIndexes();
      const compoundIndex = Object.keys(indexes).find(key => {
        const fields = indexes[key];
        return fields.length >= 2 && 
               fields.some(field => field[0] === 'userId') &&
               fields.some(field => field[0] === 'orderDate');
      });
      expect(compoundIndex).toBeDefined();
    });
  });
});