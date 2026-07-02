import { describe, it, test, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../server.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../test/setup.js';

describe('Admin Order Status Update', () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  let adminToken;
  let adminUser;
  let testOrder;
  let testProduct;
  let testCustomer;

  beforeEach(async () => {
    await clearTestDatabase();
    // Create unique identifiers
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Create admin user
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: `admin-${uniqueId}@test.com`,
      password: 'password123',
      role: 'admin',
      isActive: true
    });
    await adminUser.save();

    // Create customer user
    testCustomer = new User({
      firstName: 'Test',
      lastName: 'Customer',
      email: `customer-${uniqueId}@test.com`,
      password: 'password123',
      role: 'customer',
      isActive: true
    });
    await testCustomer.save();

    // Create test product (new variations-based Product schema)
    testProduct = new Product({
      name: 'Test Phone',
      slug: `test-phone-${uniqueId}`,
      sku: `TEST-PHONE-${uniqueId}`,
      baseModel: 'Pixel Test',
      shortDescription: 'A test phone',
      images: ['test-image.jpg'],
      status: 'active',
      isActive: true,
      variations: [{
        condition: 'new',
        color: 'Black',
        price: 500,
        stockQuantity: 10,
        stockStatus: 'in_stock',
        sku: `TEST-PHONE-${uniqueId}-V1`
      }]
    });
    await testProduct.save();

    // Create test order using the schema-compliant factory
    testOrder = new Order({
      orderNumber: `T-${uniqueId}`.slice(0, 20),
      userId: testCustomer._id,
      customerEmail: testCustomer.email,
      status: 'pending',
      paymentStatus: 'completed',
      items: [{
        productId: testProduct._id,
        productName: testProduct.name,
        productSlug: testProduct.slug,
        productImage: 'test-image.jpg',
        quantity: 2,
        unitPrice: 500,
        totalPrice: 1000
      }],
      subtotal: 1000,
      tax: 0,
      shipping: 10,
      totalAmount: 1010,
      shippingAddress: {
        fullName: 'Test Customer',
        addressLine1: '123 Test St',
        city: 'Test City',
        stateProvince: 'Test State',
        postalCode: 'TE1 2ST',
        country: 'UK'
      },
      billingAddress: {
        fullName: 'Test Customer',
        addressLine1: '123 Test St',
        city: 'Test City',
        stateProvince: 'Test State',
        postalCode: 'TE1 2ST',
        country: 'UK'
      },
      shippingMethod: {
        id: new mongoose.Types.ObjectId(),
        name: 'Standard Shipping',
        cost: 10
      },
      paymentMethod: { type: 'paypal', name: 'PayPal' },
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

      // Verify order was updated in database. Note: the Order model has a
      // pre-save hook that appends a statusHistory entry on every status
      // change, AND the controller appends its own entry, so a single update
      // produces more than one new history record.
      const updatedOrder = await Order.findById(testOrder._id);
      expect(updatedOrder.status).toBe('processing');
      expect(updatedOrder.statusHistory.length).toBeGreaterThanOrEqual(2);
      const lastEntry = updatedOrder.statusHistory[updatedOrder.statusHistory.length - 1];
      expect(lastEntry.status).toBe('processing');
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

    // The order's single item has no variationId, so the controller's legacy
    // fallback path restores stock to the product's single variation.
    test('should handle order cancellation with stock restoration', async () => {
      const initialStock = testProduct.variations[0].stockQuantity;

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
      expect(updatedProduct.variations[0].stockQuantity).toBe(initialStock + 2);
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
      // Valid per the controller's state machine AND persistable per the Order
      // model's status enum (which does NOT include 'awaiting_shipment' even
      // though the controller lists it as a valid target — flagged prod bug).
      const validTransitions = [
        { from: 'pending', to: 'processing' },
        { from: 'pending', to: 'cancelled' },
        { from: 'processing', to: 'shipped' },
        { from: 'processing', to: 'cancelled' },
        { from: 'shipped', to: 'delivered' },
        { from: 'shipped', to: 'cancelled' },
        { from: 'delivered', to: 'returned' }
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
        { from: 'delivered', to: 'refunded' }
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