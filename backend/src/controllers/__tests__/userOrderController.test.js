import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../../server.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import Cart from '../../models/Cart.js';
import Product from '../../models/Product.js';
import ShippingMethod from '../../models/ShippingMethod.js';
import emailService from '../../services/emailService.js';
import { createValidProductData, createValidUserData, createValidOrderData } from '../../test/helpers/testData.js';

// Apply session mocking to models
if (global.enhanceModelWithSessionMocking) {
  global.enhanceModelWithSessionMocking(Order);
  global.enhanceModelWithSessionMocking(Product);
  global.enhanceModelWithSessionMocking(Cart);
  global.enhanceModelWithSessionMocking(ShippingMethod);
  global.enhanceModelWithSessionMocking(User);
}

// Set up environment variables for testing

describe('User Order Controller', () => {
  let testUser;
  let authToken;
  let testOrders;

  // Using global test setup for MongoDB connection

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Clear test data
    await User.deleteMany({});
    await Order.deleteMany({});

    // Mock email service methods
    jest.spyOn(emailService, 'sendOrderCancellationEmail').mockResolvedValue();

    // Create test user
    testUser = new User(createValidUserData({
      email: 'orders.test@example.com',
      password: 'TestPass123!',
      firstName: 'Order',
      lastName: 'Tester'
    }));
    await testUser.save();

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET || 'your-secret-key'
    );

    // Create test orders
    const orderData = {
      userId: testUser._id,
      customerEmail: testUser.email,
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
        addressLine1: '456 Oak Ave',
        city: 'Los Angeles',
        stateProvince: 'CA',
        postalCode: '90210',
        country: 'United States',
        phoneNumber: '+1 (555) 987-6543'
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
      },
      paymentStatus: 'completed'
    };

    testOrders = await Promise.all([
      new Order({
        ...orderData,
        orderNumber: 'TEST-ORDER-001',
        orderDate: new Date('2024-01-01'),
        totalAmount: 1000,
        status: 'delivered'
      }).save(),
      new Order({
        ...orderData,
        orderNumber: 'TEST-ORDER-002',
        orderDate: new Date('2024-01-02'),
        totalAmount: 2000,
        status: 'shipped'
      }).save(),
      new Order({
        ...orderData,
        orderNumber: 'TEST-ORDER-003',
        orderDate: new Date('2024-01-03'),
        totalAmount: 3000,
        status: 'pending'
      }).save()
    ]);
  });

  describe('GET /api/user/orders', () => {
    it('should get user orders with default pagination', async () => {
      const response = await request(app)
        .get('/api/user/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(3);
      expect(response.body.data.pagination).toMatchObject({
        currentPage: 1,
        totalPages: 1,
        totalOrders: 3,
        hasNextPage: false,
        hasPrevPage: false,
        limit: 10
      });

      // Should be sorted by date descending (newest first)
      const orders = response.body.data.orders;
      expect(orders[0].totalAmount).toBe(3000);
      expect(orders[1].totalAmount).toBe(2000);
      expect(orders[2].totalAmount).toBe(1000);
    });

    it('should include formatted order data', async () => {
      const response = await request(app)
        .get('/api/user/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const order = response.body.data.orders[0];
      expect(order).toHaveProperty('_id');
      expect(order).toHaveProperty('orderNumber');
      expect(order).toHaveProperty('orderDate');
      expect(order).toHaveProperty('totalAmount');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('statusDisplay');
      expect(order).toHaveProperty('formattedDate');
      expect(order).toHaveProperty('itemCount');
      expect(order.statusDisplay).toBe('Pending');
      expect(order.formattedDate).toMatch(/\w+ \d{1,2}, \d{4}/);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/user/orders?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.orders).toHaveLength(2);
      expect(response.body.data.pagination).toMatchObject({
        currentPage: 1,
        totalPages: 2,
        totalOrders: 3,
        hasNextPage: true,
        hasPrevPage: false,
        limit: 2
      });
    });

    it('should support custom sorting by totalAmount ascending', async () => {
      const response = await request(app)
        .get('/api/user/orders?sortBy=totalAmount&sortOrder=asc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const orders = response.body.data.orders;
      expect(orders[0].totalAmount).toBe(1000);
      expect(orders[1].totalAmount).toBe(2000);
      expect(orders[2].totalAmount).toBe(3000);
    });

    it('should validate sortBy parameter', async () => {
      const response = await request(app)
        .get('/api/user/orders?sortBy=invalidField')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should fall back to default sorting (orderDate desc)
      const orders = response.body.data.orders;
      expect(orders[0].totalAmount).toBe(3000); // Most recent
    });

    it('should limit maximum orders per page', async () => {
      const response = await request(app)
        .get('/api/user/orders?limit=100')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.pagination.limit).toBe(50); // Should be capped at 50
    });

    it('should return empty array for user with no orders', async () => {
      // Create new user with no orders
      const newUser = new User(createValidUserData({
        email: 'noorders@example.com',
        password: 'TestPass123!',
        firstName: 'No',
        lastName: 'Orders'
      }));
      await newUser.save();

      const newUserToken = jwt.sign(
        { userId: newUser._id },
        process.env.JWT_SECRET || 'your-secret-key'
      );

      const response = await request(app)
        .get('/api/user/orders')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(response.body.data.orders).toHaveLength(0);
      expect(response.body.data.pagination.totalOrders).toBe(0);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/user/orders')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });

    it('should only return orders for authenticated user', async () => {
      // Create another user with orders
      const otherUser = new User(createValidUserData({
        email: 'other@example.com',
        password: 'TestPass123!',
        firstName: 'Other',
        lastName: 'User'
      }));
      await otherUser.save();

      // Create order for other user
      await new Order(createValidOrderData({
        orderNumber: 'OTHER-USER-ORDER-001',
        userId: otherUser._id,
        customerEmail: otherUser.email,
        status: 'pending',
        items: [{
          productId: new mongoose.Types.ObjectId(),
          productName: 'Test Product',
          productSlug: 'test-product',
          quantity: 1,
          unitPrice: 100,
          totalPrice: 100
        }],
        subtotal: 100,
        tax: 8,
        shipping: 5,
        shippingAddress: {
          fullName: 'Other User',
          addressLine1: '456 Oak St',
          city: 'Los Angeles',
          stateProvince: 'CA',
          postalCode: '90210',
          country: 'United States'
        },
        billingAddress: {
          fullName: 'Other User',
          addressLine1: '456 Oak St',
          city: 'Los Angeles',
          stateProvince: 'CA',
          postalCode: '90210',
          country: 'United States'
        },
        shippingMethod: {
          id: new mongoose.Types.ObjectId(),
          name: 'Standard Shipping',
          cost: 5.00,
          estimatedDelivery: '3-5 business days'
        },
        paymentMethod: {
          type: 'paypal',
          name: 'PayPal'
        },
        paymentStatus: 'completed'
      })).save();

      // Request orders with original user's token
      const response = await request(app)
        .get('/api/user/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Should only return 3 orders (original user's orders)
      expect(response.body.data.orders).toHaveLength(3);
      expect(response.body.data.pagination.totalOrders).toBe(3);
    });
  });

  describe('GET /api/user/orders/:orderId', () => {
    it('should get detailed order information', async () => {
      const orderId = testOrders[0]._id;

      const response = await request(app)
        .get(`/api/user/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const order = response.body.data.order;
      
      expect(order).toHaveProperty('_id');
      expect(order).toHaveProperty('orderNumber');
      expect(order).toHaveProperty('items');
      expect(order).toHaveProperty('shippingAddress');
      expect(order).toHaveProperty('billingAddress');
      expect(order).toHaveProperty('paymentMethod');
      expect(order).toHaveProperty('paymentMethodDisplay');
      expect(order).toHaveProperty('paymentStatus');
      expect(order.trackingNumber).toBeUndefined();
      expect(order.trackingUrl).toBeUndefined();
      expect(order.items).toHaveLength(1);
      expect(order.shippingAddress.fullName).toBe('John Doe');
      expect(order.billingAddress.fullName).toBe('John Doe');
      expect(order.paymentMethodDisplay).toBe('PayPal');
    });

    it('should fail with invalid order ID format', async () => {
      const response = await request(app)
        .get('/api/user/orders/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid order ID format');
    });

    it('should fail for non-existent order', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/user/orders/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order not found');
    });

    it('should not allow access to other user\'s orders', async () => {
      // Create another user
      const otherUser = new User(createValidUserData({
        email: 'other@example.com',
        password: 'TestPass123!',
        firstName: 'Other',
        lastName: 'User'
      }));
      await otherUser.save();

      const otherUserToken = jwt.sign(
        { userId: otherUser._id },
        process.env.JWT_SECRET || 'your-secret-key'
      );

      // Try to access original user's order with other user's token
      const orderId = testOrders[0]._id;

      const response = await request(app)
        .get(`/api/user/orders/${orderId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order not found');
    });

    it('should fail without authentication', async () => {
      const orderId = testOrders[0]._id;

      const response = await request(app)
        .get(`/api/user/orders/${orderId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });
  });

  describe('POST /api/user/orders/place-order', () => {
    let testProduct;
    let testCart;
    let testShippingMethod;

    beforeEach(async () => {
      // Clear additional collections
      await Cart.deleteMany({});
      await Product.deleteMany({});
      await ShippingMethod.deleteMany({});

      // Create test product
      testProduct = new Product(createValidProductData({
        name: 'Test Product',
        shortDescription: 'A test product',
        price: 29.99,
        stockQuantity: 10,
        category: new mongoose.Types.ObjectId(),
        isActive: true,
        weight: 100,
        slug: 'test-product',
        images: ['test-image.jpg']
      }));
      await testProduct.save();

      // Create test shipping method
      testShippingMethod = new ShippingMethod({
        name: 'Standard Shipping',
        code: 'STANDARD',
        baseCost: 7.99,
        isActive: true,
        estimatedDelivery: '3-5 business days',
        estimatedDeliveryDays: {
          min: 3,
          max: 5
        },
        criteria: {
          supportedCountries: ['GB', 'IE'],
          freeShippingThreshold: 60.00
        }
      });
      await testShippingMethod.save();

      // Create test cart
      testCart = new Cart({
        userId: testUser._id,
        items: [{
          productId: testProduct._id,
          productName: testProduct.name,
          productSlug: testProduct.slug,
          unitPrice: testProduct.price,
          quantity: 2,
          subtotal: testProduct.price * 2
        }]
      });
      await testCart.save();
    });

    const validOrderData = {
      shippingAddress: {
        firstName: 'John',
        lastName: 'Doe',
        addressLine1: '123 Test Street',
        city: 'London',
        stateProvince: 'London',
        postalCode: 'SW1A 1AA',
        country: 'GB',
        phoneNumber: '+44 20 7946 0958'
      },
      useSameAsShipping: true,
      paypalOrderId: 'PAYPAL-TEST-12345'
    };

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/user/orders/place-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 for missing shipping address', async () => {
      const response = await request(app)
        .post('/api/user/orders/place-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingMethodId: testShippingMethod._id.toString(),
          paypalOrderId: 'PAYPAL-TEST-12345'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Shipping address');
    });

    it('should return 400 for missing shipping method', async () => {
      const response = await request(app)
        .post('/api/user/orders/place-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddress: validOrderData.shippingAddress,
          paypalOrderId: 'PAYPAL-TEST-12345'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('shipping method');
    });

    it('should return 400 for missing PayPal order', async () => {
      const response = await request(app)
        .post('/api/user/orders/place-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddress: validOrderData.shippingAddress,
          shippingMethodId: testShippingMethod._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('PayPal order');
    });

    it('should return 400 for empty cart', async () => {
      // Clear cart
      await Cart.findByIdAndUpdate(testCart._id, { items: [] });

      const response = await request(app)
        .post('/api/user/orders/place-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validOrderData,
          shippingMethodId: testShippingMethod._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Cart is empty');
    });

    it('should return 400 for invalid shipping method', async () => {
      const invalidShippingMethodId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .post('/api/user/orders/place-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validOrderData,
          shippingMethodId: invalidShippingMethodId
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid shipping method');
    });

    it('should return 400 for insufficient stock', async () => {
      // Set product out of stock
      await Product.findByIdAndUpdate(testProduct._id, { stockQuantity: 0 });

      const response = await request(app)
        .post('/api/user/orders/place-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validOrderData,
          shippingMethodId: testShippingMethod._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Insufficient stock');
    });

    it('should return 400 for invalid PayPal order', async () => {
      const response = await request(app)
        .post('/api/user/orders/place-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validOrderData,
          shippingMethodId: testShippingMethod._id.toString(),
          paypalOrderId: 'INVALID-PAYPAL-123'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid PayPal order');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/user/orders/place-order')
        .send({
          ...validOrderData,
          shippingMethodId: testShippingMethod._id.toString()
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Access denied');
    });

    it('should require authentication for place order endpoint', async () => {
      const response = await request(app)
        .post('/api/user/orders/place-order')
        .send(validOrderData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Order Tracking Features (Story 4.1)', () => {
    let trackingOrder;

    beforeEach(async () => {
      // Create an order specifically for tracking tests
      trackingOrder = new Order(createValidOrderData({
        orderNumber: 'TRACK-TEST-001',
        userId: testUser._id,
        customerEmail: testUser.email,
        status: 'pending',
        items: [{
          productId: new mongoose.Types.ObjectId(),
          productName: 'Tracking Test Product',
          productSlug: 'tracking-test-product',
          quantity: 1,
          unitPrice: 50.00,
          totalPrice: 50.00
        }],
        subtotal: 50.00,
        tax: 4.00,
        shipping: 7.99,
        totalAmount: 61.99,
        shippingAddress: {
          fullName: 'Tracking Test User',
          addressLine1: '123 Test St',
          city: 'London',
          stateProvince: 'London',
          postalCode: 'SW1A 1AA',
          country: 'GB',
          phoneNumber: '+44 20 7946 0958'
        },
        billingAddress: {
          fullName: 'Tracking Test User',
          addressLine1: '123 Test St',
          city: 'London',
          stateProvince: 'London',
          postalCode: 'SW1A 1AA',
          country: 'GB',
          phoneNumber: '+44 20 7946 0958'
        },
        shippingMethod: {
          id: new mongoose.Types.ObjectId(),
          name: 'Standard Shipping',
          cost: 7.99,
          estimatedDelivery: '3-5 business days'
        },
        paymentMethod: {
          type: 'paypal',
          name: 'PayPal'
        },
        paymentStatus: 'completed'
      }));
      await trackingOrder.save();
    });

    describe('Enhanced Status Enum', () => {
      it('should support all new order statuses', async () => {
        const newStatuses = ['out_for_delivery', 'returned'];
        
        for (const status of newStatuses) {
          trackingOrder.status = status;
          const savedOrder = await trackingOrder.save();
          expect(savedOrder.status).toBe(status);
        }
      });

      it('should automatically add status history entry on status change', async () => {
        // Initial status should have history entry
        expect(trackingOrder.statusHistory).toHaveLength(1);
        expect(trackingOrder.statusHistory[0].status).toBe('pending');
        expect(trackingOrder.statusHistory[0].note).toBe('Order created');

        // Change status and verify history is updated
        trackingOrder.status = 'processing';
        await trackingOrder.save();

        expect(trackingOrder.statusHistory).toHaveLength(2);
        expect(trackingOrder.statusHistory[1].status).toBe('processing');
        expect(trackingOrder.statusHistory[1].note).toBe('Status updated');
      });

      it('should display formatted status correctly', async () => {
        const statusTests = [
          { status: 'pending', expected: 'Pending' },
          { status: 'processing', expected: 'Processing' },
          { status: 'shipped', expected: 'Shipped' },
          { status: 'out_for_delivery', expected: 'Out for Delivery' },
          { status: 'delivered', expected: 'Delivered' },
          { status: 'cancelled', expected: 'Cancelled' },
          { status: 'returned', expected: 'Returned' }
        ];

        for (const test of statusTests) {
          trackingOrder.status = test.status;
          expect(trackingOrder.getStatusDisplay()).toBe(test.expected);
        }
      });
    });

    describe('GET /api/user/orders/:orderId - Enhanced with Tracking Data', () => {
      it('should return statusHistory and shippingMethod in order details', async () => {
        const response = await request(app)
          .get(`/api/user/orders/${trackingOrder._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        const order = response.body.data.order;
        
        // Check statusHistory is included
        expect(order.statusHistory).toBeDefined();
        expect(Array.isArray(order.statusHistory)).toBe(true);
        expect(order.statusHistory.length).toBeGreaterThan(0);
        expect(order.statusHistory[0]).toHaveProperty('status');
        expect(order.statusHistory[0]).toHaveProperty('timestamp');
        expect(order.statusHistory[0]).toHaveProperty('note');

        // Check shippingMethod is included
        expect(order.shippingMethod).toBeDefined();
        expect(order.shippingMethod).toHaveProperty('name');
        expect(order.shippingMethod).toHaveProperty('cost');
        expect(order.shippingMethod).toHaveProperty('estimatedDelivery');
      });

      it('should return tracking information when present', async () => {
        // Add tracking info to order
        trackingOrder.trackingNumber = 'TRACK123456789';
        trackingOrder.trackingUrl = 'https://tracking.example.com/TRACK123456789';
        trackingOrder.status = 'shipped';
        await trackingOrder.save();

        const response = await request(app)
          .get(`/api/user/orders/${trackingOrder._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        const order = response.body.data.order;
        
        expect(order.trackingNumber).toBe('TRACK123456789');
        expect(order.trackingUrl).toBe('https://tracking.example.com/TRACK123456789');
        expect(order.status).toBe('shipped');
      });

      it('should handle orders without tracking information', async () => {
        const response = await request(app)
          .get(`/api/user/orders/${trackingOrder._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        const order = response.body.data.order;
        
        expect(order.trackingNumber).toBeUndefined();
        expect(order.trackingUrl).toBeUndefined();
        expect(order.statusHistory).toBeDefined();
      });
    });

    describe('Status History Tracking', () => {
      it('should track multiple status changes with timestamps', async () => {
        const statuses = ['processing', 'shipped', 'out_for_delivery', 'delivered'];
        
        for (let i = 0; i < statuses.length; i++) {
          // Add a small delay to ensure different timestamps
          await new Promise(resolve => setTimeout(resolve, 10));
          
          trackingOrder.status = statuses[i];
          await trackingOrder.save();
          
          expect(trackingOrder.statusHistory).toHaveLength(i + 2); // +1 for initial 'pending', +1 for current
          expect(trackingOrder.statusHistory[i + 1].status).toBe(statuses[i]);
          expect(trackingOrder.statusHistory[i + 1].timestamp).toBeInstanceOf(Date);
        }
      });

      it('should not add duplicate history entries for same status', async () => {
        const initialHistoryLength = trackingOrder.statusHistory.length;
        
        // Save without changing status
        await trackingOrder.save();
        
        // History length should remain the same
        expect(trackingOrder.statusHistory).toHaveLength(initialHistoryLength);
      });

      it('should maintain chronological order in status history', async () => {
        trackingOrder.status = 'processing';
        await trackingOrder.save();
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        trackingOrder.status = 'shipped';
        await trackingOrder.save();

        const history = trackingOrder.statusHistory;
        expect(history).toHaveLength(3);
        
        // Verify chronological order
        for (let i = 1; i < history.length; i++) {
          expect(new Date(history[i].timestamp).getTime())
            .toBeGreaterThanOrEqual(new Date(history[i - 1].timestamp).getTime());
        }
      });
    });

    describe('Order Cancellation', () => {
      let pendingOrder, shippedOrder, testProduct;

      beforeEach(async () => {
        // Create a test product for stock tracking
        testProduct = new Product(createValidProductData({
          name: 'Test Product',
          slug: 'test-product',
          price: 99.99,
          stockQuantity: 10,
          isActive: true
        }));
        await testProduct.save();

        // Create a pending order
        pendingOrder = new Order(createValidOrderData({
          orderNumber: `PEND-${Math.random().toString(36).substr(2, 9)}`,
          userId: testUser._id,
          customerEmail: testUser.email,
          items: [{
            productId: testProduct._id,
            productName: 'Test Product',
            productSlug: 'test-product',
            quantity: 2,
            unitPrice: 99.99,
            totalPrice: 199.98
          }],
          subtotal: 199.98,
          shipping: 5.99,
          tax: 20.00,
          totalAmount: 225.97,
          status: 'pending',
          paymentStatus: 'completed',
          paypalOrderId: 'PAYPAL-TEST-PENDING',
          shippingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            stateProvince: 'Test State',
            postalCode: '12345',
            country: 'GB'
          },
          billingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            stateProvince: 'Test State',
            postalCode: '12345',
            country: 'GB'
          },
          shippingMethod: {
            id: new mongoose.Types.ObjectId(),
            name: 'Standard Shipping',
            cost: 5.99,
            estimatedDelivery: '3-5 business days'
          },
          paymentMethod: {
            type: 'paypal',
            name: 'PayPal'
          }
        }));
        await pendingOrder.save();

        // Create a shipped order (non-cancellable)
        shippedOrder = new Order(createValidOrderData({
          orderNumber: `SHIP-${Math.random().toString(36).substr(2, 9)}`,
          userId: testUser._id,
          customerEmail: testUser.email,
          items: [{
            productId: testProduct._id,
            productName: 'Test Product',
            productSlug: 'test-product',
            quantity: 1,
            unitPrice: 99.99,
            totalPrice: 99.99
          }],
          subtotal: 99.99,
          shipping: 5.99,
          tax: 10.00,
          totalAmount: 115.98,
          status: 'shipped',
          paymentStatus: 'completed',
          shippingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            stateProvince: 'Test State',
            postalCode: '12345',
            country: 'GB'
          },
          billingAddress: {
            fullName: 'Test User',
            addressLine1: '123 Test St',
            city: 'Test City',
            stateProvince: 'Test State',
            postalCode: '12345',
            country: 'GB'
          },
          shippingMethod: {
            id: new mongoose.Types.ObjectId(),
            name: 'Standard Shipping',
            cost: 5.99,
            estimatedDelivery: '3-5 business days'
          },
          paymentMethod: {
            type: 'paypal',
            name: 'PayPal'
          }
        }));
        await shippedOrder.save();
      });

      it('should successfully cancel a pending order', async () => {
        const initialStock = testProduct.stockQuantity;

        const response = await request(app)
          .post(`/api/user/orders/${pendingOrder._id}/cancel`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Order cancelled successfully');
        expect(response.body.data.status).toBe('cancelled');

        // Verify order status updated in database
        const updatedOrder = await Order.findById(pendingOrder._id);
        expect(updatedOrder.status).toBe('cancelled');

        // Verify stock was restored
        const updatedProduct = await Product.findById(testProduct._id);
        expect(updatedProduct.stockQuantity).toBe(initialStock + 2); // 2 was the quantity ordered
      });

      it('should not allow cancelling a shipped order', async () => {
        const response = await request(app)
          .post(`/api/user/orders/${shippedOrder._id}/cancel`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('cannot be cancelled');
        expect(response.body.error).toContain('shipped');

        // Verify order status unchanged
        const unchangedOrder = await Order.findById(shippedOrder._id);
        expect(unchangedOrder.status).toBe('shipped');
      });

      it('should return 404 for non-existent order', async () => {
        const fakeOrderId = new mongoose.Types.ObjectId();

        const response = await request(app)
          .post(`/api/user/orders/${fakeOrderId}/cancel`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Order not found');
      });

      it('should return 400 for invalid order ID', async () => {
        const response = await request(app)
          .post('/api/user/orders/invalid-id/cancel')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid order ID');
      });

      it('should not allow cancelling another user\'s order', async () => {
        // Create another user
        const otherUser = new User(createValidUserData({
          firstName: 'Other',
          lastName: 'User',
          email: 'other@test.com',
          password: 'hashedpassword'
        }));
        await otherUser.save();

        // Create order for other user
        const otherUserOrder = new Order(createValidOrderData({
          orderNumber: `OTHER-${Math.random().toString(36).substr(2, 8)}`,
          userId: otherUser._id,
          customerEmail: otherUser.email,
          items: [{
            productId: testProduct._id,
            productName: 'Test Product',
            productSlug: 'test-product',
            quantity: 1,
            unitPrice: 99.99,
            totalPrice: 99.99
          }],
          subtotal: 99.99,
          shipping: 5.99,
          tax: 10.00,
          totalAmount: 115.98,
          status: 'pending',
          shippingAddress: {
            fullName: 'Other User',
            addressLine1: '456 Other St',
            city: 'Other City',
            stateProvince: 'Other State',
            postalCode: '67890',
            country: 'GB'
          },
          billingAddress: {
            fullName: 'Other User',
            addressLine1: '456 Other St',
            city: 'Other City',
            stateProvince: 'Other State',
            postalCode: '67890',
            country: 'GB'
          },
          shippingMethod: {
            id: new mongoose.Types.ObjectId(),
            name: 'Standard Shipping',
            cost: 5.99,
            estimatedDelivery: '3-5 business days'
          },
          paymentMethod: {
            type: 'paypal',
            name: 'PayPal'
          }
        }));
        await otherUserOrder.save();

        const response = await request(app)
          .post(`/api/user/orders/${otherUserOrder._id}/cancel`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Order not found');
      });

      it('should handle refund initiation for paid orders', async () => {
        const response = await request(app)
          .post(`/api/user/orders/${pendingOrder._id}/cancel`)
          .set('Authorization', `Bearer ${authToken}`);

        // Debug the response if it's not 200
        if (response.status !== 200) {
          console.log('Response status:', response.status);
          console.log('Response body:', response.body);
        }

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.refund).toBeDefined();
        
        // Check if refund information is included (will be error in test environment)
        if (response.body.data.refund && response.body.data.refund.error) {
          expect(response.body.data.refund.error).toBeDefined();
        }
      });
    });
  });
});