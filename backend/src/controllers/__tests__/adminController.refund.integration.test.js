import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// Import models
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';

// Import routes
import adminRoutes from '../../routes/admin.js';

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

describe('Admin Refund Integration Tests', () => {
  let adminUser;
  let adminToken;
  let testOrder;
  let testProduct;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect('mongodb://localhost:27017/graphene-store-test');
    
    // Clear existing data
    await User.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});
  });

  afterAll(async () => {
    // Clean up
    await User.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Create admin user
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'AdminPass123!',
      role: 'admin'
    });
    await adminUser.save();

    // Generate admin token
    adminToken = jwt.sign(
      { _id: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || 'test-secret'
    );

    // Create test product
    testProduct = new Product({
      name: 'Test Product',
      slug: 'test-product',
      shortDescription: 'A test product for refund testing',
      longDescription: 'A detailed description of the test product',
      price: 100.00,
      images: ['test-image.jpg'],
      condition: 'new',
      stockStatus: 'in_stock'
    });
    await testProduct.save();

    // Create test order
    testOrder = new Order({
      userId: adminUser._id,
      customerEmail: 'customer@example.com',
      status: 'delivered',
      items: [{
        productId: testProduct._id,
        productName: testProduct.name,
        productSlug: testProduct.slug,
        productImage: testProduct.images[0],
        quantity: 2,
        unitPrice: testProduct.price,
        totalPrice: testProduct.price * 2
      }],
      subtotal: 200.00,
      tax: 16.00,
      shipping: 10.00,
      totalAmount: 226.00,
      shippingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Test Street',
        city: 'Test City',
        stateProvince: 'Test State',
        postalCode: '12345',
        country: 'Test Country'
      },
      billingAddress: {
        fullName: 'John Doe',
        addressLine1: '123 Test Street',
        city: 'Test City',
        stateProvince: 'Test State',
        postalCode: '12345',
        country: 'Test Country'
      },
      shippingMethod: {
        id: new mongoose.Types.ObjectId(),
        name: 'Standard Shipping',
        cost: 10.00,
        estimatedDelivery: '3-5 business days'
      },
      paymentMethod: {
        type: 'paypal',
        name: 'PayPal'
      },
      paymentStatus: 'completed'
    });
    await testOrder.save();
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});
  });

  describe('Full Refund Integration Test', () => {
    it('should process a full refund and update all relevant data', async () => {
      // Record initial product stock (if stock tracking is implemented)
      // const initialStock = testProduct.stockQuantity;

      // Issue full refund
      const refundData = {
        refundAmount: 226.00,
        refundReason: 'Customer requested full refund'
      };

      const response = await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData)
        .expect(200);

      // Verify response
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Refund of £226.00 processed successfully');
      expect(response.body.data.order).toBeDefined();
      expect(response.body.data.refund).toBeDefined();

      // Verify order updates in database
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.totalRefundedAmount).toBe(226.00);
      expect(updatedOrder.refundStatus).toBe('fully_refunded');
      expect(updatedOrder.paymentStatus).toBe('refunded');
      expect(updatedOrder.status).toBe('refunded');
      expect(updatedOrder.refundHistory).toHaveLength(1);
      
      const refundEntry = updatedOrder.refundHistory[0];
      expect(refundEntry.amount).toBe(226.00);
      expect(refundEntry.reason).toBe('Customer requested full refund');
      expect(refundEntry.adminUserId.toString()).toBe(adminUser._id.toString());
      expect(refundEntry.status).toBe('succeeded');
      expect(refundEntry.refundId).toBeDefined();

      // Verify status history was updated
      const refundStatusUpdate = updatedOrder.statusHistory.find(
        entry => entry.status === 'refunded'
      );
      expect(refundStatusUpdate).toBeDefined();
      expect(refundStatusUpdate.updatedBy.toString()).toBe(adminUser._id.toString());

      // Note: In a real implementation, we would also verify:
      // - Product stock was incremented (stock restoration logic)
      // - Email was sent (mock email service verification)
      // - Payment gateway refund was initiated (mock PayPal API)
    });
  });

  describe('Partial Refund Integration Test', () => {
    it('should process a partial refund correctly', async () => {
      // Issue partial refund
      const refundData = {
        refundAmount: 100.00,
        refundReason: 'Partial refund for one item'
      };

      const response = await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData)
        .expect(200);

      // Verify response
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Refund of £100.00 processed successfully');

      // Verify order updates in database
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.totalRefundedAmount).toBe(100.00);
      expect(updatedOrder.refundStatus).toBe('partial_refunded');
      expect(updatedOrder.paymentStatus).toBe('completed'); // Should remain completed for partial refunds
      expect(updatedOrder.status).toBe('delivered'); // Should not change for partial refunds
      expect(updatedOrder.refundHistory).toHaveLength(1);

      // Verify maximum refundable amount is correct
      const maxRefundable = updatedOrder.getMaxRefundableAmount();
      expect(maxRefundable).toBe(126.00); // 226.00 - 100.00
    });
  });

  describe('Multiple Refunds Integration Test', () => {
    it('should handle multiple partial refunds correctly', async () => {
      // First partial refund
      const firstRefundData = {
        refundAmount: 50.00,
        refundReason: 'First partial refund'
      };

      await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(firstRefundData)
        .expect(200);

      // Second partial refund
      const secondRefundData = {
        refundAmount: 100.00,
        refundReason: 'Second partial refund'
      };

      await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(secondRefundData)
        .expect(200);

      // Verify cumulative refund amount
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.totalRefundedAmount).toBe(150.00);
      expect(updatedOrder.refundStatus).toBe('partial_refunded');
      expect(updatedOrder.refundHistory).toHaveLength(2);

      // Third refund to reach full refund
      const thirdRefundData = {
        refundAmount: 76.00, // Remaining amount: 226.00 - 150.00 = 76.00
        refundReason: 'Final refund to complete full refund'
      };

      await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(thirdRefundData)
        .expect(200);

      // Verify full refund status
      const finalOrder = await Order.findById(testOrder._id);
      expect(finalOrder.totalRefundedAmount).toBe(226.00);
      expect(finalOrder.refundStatus).toBe('fully_refunded');
      expect(finalOrder.paymentStatus).toBe('refunded');
      expect(finalOrder.status).toBe('refunded');
      expect(finalOrder.refundHistory).toHaveLength(3);
    });
  });

  describe('Error Cases Integration Tests', () => {
    it('should reject refund amount exceeding maximum refundable', async () => {
      const refundData = {
        refundAmount: 300.00, // Exceeds order total of 226.00
        refundReason: 'Excessive refund attempt'
      };

      const response = await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('exceeds maximum refundable amount');

      // Verify order was not modified
      const unchangedOrder = await Order.findById(testOrder._id);
      expect(unchangedOrder.totalRefundedAmount).toBe(0);
      expect(unchangedOrder.refundStatus).toBe('none');
      expect(unchangedOrder.refundHistory).toHaveLength(0);
    });

    it('should reject refund for already fully refunded order', async () => {
      // First, fully refund the order
      const fullRefundData = {
        refundAmount: 226.00,
        refundReason: 'Full refund'
      };

      await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(fullRefundData)
        .expect(200);

      // Try to refund again
      const attemptRefundData = {
        refundAmount: 50.00,
        refundReason: 'Attempt second refund'
      };

      const response = await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(attemptRefundData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('exceeds maximum refundable amount');
    });

    it('should reject refund for order with non-completed payment status', async () => {
      // Update order payment status to pending
      await Order.findByIdAndUpdate(testOrder._id, { paymentStatus: 'pending' });

      const refundData = {
        refundAmount: 100.00,
        refundReason: 'Refund for pending payment'
      };

      const response = await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Cannot refund order with payment status: pending');
    });

    it('should reject unauthorized access', async () => {
      const refundData = {
        refundAmount: 100.00,
        refundReason: 'Unauthorized refund attempt'
      };

      // Test without token
      await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .send(refundData)
        .expect(401);

      // Test with invalid token
      await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', 'Bearer invalid-token')
        .send(refundData)
        .expect(401);
    });

    it('should reject non-admin user access', async () => {
      // Create regular user
      const regularUser = new User({
        firstName: 'Regular',
        lastName: 'User',
        email: 'user@example.com',
        password: 'UserPass123!',
        role: 'customer'
      });
      await regularUser.save();

      // Generate user token
      const userToken = jwt.sign(
        { _id: regularUser._id, role: regularUser.role },
        process.env.JWT_SECRET || 'test-secret'
      );

      const refundData = {
        refundAmount: 100.00,
        refundReason: 'Non-admin refund attempt'
      };

      await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(refundData)
        .expect(403);
    });

    it('should handle invalid order ID', async () => {
      const refundData = {
        refundAmount: 100.00,
        refundReason: 'Refund for non-existent order'
      };

      await request(app)
        .post('/api/admin/orders/507f1f77bcf86cd799439011/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData)
        .expect(404);
    });

    it('should validate required fields', async () => {
      // Test missing refund amount
      await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ refundReason: 'Missing amount' })
        .expect(400);

      // Test missing refund reason
      await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ refundAmount: 100.00 })
        .expect(400);

      // Test invalid refund amount
      await request(app)
        .post(`/api/admin/orders/${testOrder._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ refundAmount: -50.00, refundReason: 'Negative amount' })
        .expect(400);
    });
  });
});