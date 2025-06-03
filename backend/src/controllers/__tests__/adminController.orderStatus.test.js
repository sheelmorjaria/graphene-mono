import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../server.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';

describe('Admin Order Status Update', () => {
  let adminToken;
  let adminUser;
  let testOrder;
  let testProduct;
  let testCustomer;

  beforeEach(async () => {
    // Create admin user
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      isActive: true
    });
    await adminUser.save();

    // Create customer user
    testCustomer = new User({
      firstName: 'Test',
      lastName: 'Customer',
      email: 'customer@test.com',
      password: 'password123',
      role: 'customer',
      isActive: true
    });
    await testCustomer.save();

    // Create test product
    testProduct = new Product({
      name: 'Test Phone',
      slug: 'test-phone',
      description: 'A test phone',
      price: 500,
      stockQuantity: 10,
      category: 'phones',
      image: 'test-image.jpg',
      isActive: true
    });
    await testProduct.save();

    // Create test order
    testOrder = new Order({
      orderNumber: 'TEST-' + Date.now(),
      userId: testCustomer._id,
      status: 'pending',
      items: [{
        productId: testProduct._id,
        name: testProduct.name,
        slug: testProduct.slug,
        price: testProduct.price,
        quantity: 2,
        image: testProduct.image,
        lineTotal: testProduct.price * 2
      }],
      subtotalAmount: 1000,
      shippingCost: 10,
      totalAmount: 1010,
      shippingAddress: {
        firstName: 'Test',
        lastName: 'Customer',
        addressLine1: '123 Test St',
        city: 'Test City',
        postalCode: 'TE1 2ST',
        country: 'UK'
      },
      billingAddress: {
        firstName: 'Test',
        lastName: 'Customer',
        addressLine1: '123 Test St',
        city: 'Test City',
        postalCode: 'TE1 2ST',
        country: 'UK'
      },
      paymentMethod: { type: 'card' },
      paymentStatus: 'completed',
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        notes: 'Order created'
      }]
    });
    await testOrder.save();

    // Generate admin JWT token
    adminToken = jwt.sign(
      { 
        userId: adminUser._id,
        role: adminUser.role,
        email: adminUser.email
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});
  });

  describe('PUT /api/admin/orders/:orderId/status', () => {
    test('should update order status from pending to processing', async () => {
      const response = await request(app)
        .put(`/api/admin/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'processing'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe('processing');

      // Verify order was updated in database
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.status).toBe('processing');
      expect(updatedOrder.statusHistory).toHaveLength(2);
      expect(updatedOrder.statusHistory[1].status).toBe('processing');
      expect(updatedOrder.statusHistory[1].updatedBy.toString()).toBe(adminUser._id.toString());
    });

    test('should update order status to shipped with tracking info', async () => {
      // First update to processing
      await testOrder.updateOne({ status: 'processing' });

      const trackingData = {
        newStatus: 'shipped',
        trackingNumber: 'TRK123456789',
        trackingUrl: 'https://tracking.example.com/TRK123456789'
      };

      const response = await request(app)
        .put(`/api/admin/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(trackingData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe('shipped');

      // Verify tracking info was saved
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.trackingNumber).toBe(trackingData.trackingNumber);
      expect(updatedOrder.trackingUrl).toBe(trackingData.trackingUrl);
    });

    test('should reject shipped status without tracking info', async () => {
      await testOrder.updateOne({ status: 'processing' });

      const response = await request(app)
        .put(`/api/admin/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'shipped'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('tracking');
    });

    test('should handle order cancellation with stock restoration', async () => {
      const initialStock = testProduct.stockQuantity;

      const response = await request(app)
        .put(`/api/admin/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'cancelled'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.order.status).toBe('cancelled');

      // Verify stock was restored
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.stockQuantity).toBe(initialStock + 2); // Added back the ordered quantity
    });

    test('should reject invalid status transitions', async () => {
      const response = await request(app)
        .put(`/api/admin/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'delivered' // Can't go directly from pending to delivered
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid status transition');
    });

    test('should require admin authentication', async () => {
      const response = await request(app)
        .put(`/api/admin/orders/${testOrder._id}/status`)
        .send({
          newStatus: 'processing'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject non-admin users', async () => {
      // Create regular user token
      const customerToken = jwt.sign(
        { 
          userId: testCustomer._id,
          role: 'customer',
          email: testCustomer.email
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '8h' }
      );

      const response = await request(app)
        .put(`/api/admin/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          newStatus: 'processing'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should handle invalid order ID', async () => {
      const response = await request(app)
        .put('/api/admin/orders/invalid-id/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'processing'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid order ID');
    });

    test('should handle non-existent order', async () => {
      const fakeOrderId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/admin/orders/${fakeOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'processing'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .put(`/api/admin/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });
  });

  describe('Status Transition Logic', () => {
    test('should allow valid status transitions', async () => {
      const validTransitions = [
        { from: 'pending', to: 'processing' },
        { from: 'pending', to: 'cancelled' },
        { from: 'processing', to: 'awaiting_shipment' },
        { from: 'processing', to: 'shipped' },
        { from: 'processing', to: 'cancelled' },
        { from: 'awaiting_shipment', to: 'shipped' },
        { from: 'awaiting_shipment', to: 'cancelled' },
        { from: 'shipped', to: 'delivered' },
        { from: 'shipped', to: 'cancelled' },
        { from: 'delivered', to: 'refunded' }
      ];

      for (const transition of validTransitions) {
        // Reset order status
        await testOrder.updateOne({ status: transition.from });

        const requestData = { newStatus: transition.to };
        
        // Add tracking info if transitioning to shipped
        if (transition.to === 'shipped') {
          requestData.trackingNumber = 'TRK123456789';
          requestData.trackingUrl = 'https://tracking.example.com/TRK123456789';
        }

        const response = await request(app)
          .put(`/api/admin/orders/${testOrder._id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(requestData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.order.status).toBe(transition.to);
      }
    });

    test('should reject invalid status transitions', async () => {
      const invalidTransitions = [
        { from: 'pending', to: 'delivered' },
        { from: 'pending', to: 'shipped' },
        { from: 'processing', to: 'delivered' },
        { from: 'awaiting_shipment', to: 'delivered' },
        { from: 'cancelled', to: 'processing' },
        { from: 'delivered', to: 'processing' },
        { from: 'refunded', to: 'processing' }
      ];

      for (const transition of invalidTransitions) {
        await testOrder.updateOne({ status: transition.from });

        const response = await request(app)
          .put(`/api/admin/orders/${testOrder._id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ newStatus: transition.to });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid status transition');
      }
    });
  });
});