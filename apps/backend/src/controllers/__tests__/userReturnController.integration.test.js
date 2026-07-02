import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import ReturnRequest from '../../models/ReturnRequest.js';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

describe('User Return Controller', () => {
  let user;
  let authToken;
  let deliveredOrder;

  const createUser = async (overrides = {}) => {
    return User.create({
      email: `returns-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Return',
      lastName: 'Tester',
      isActive: true,
      role: 'customer',
      ...overrides
    });
  };

  const signToken = (u) => jwt.sign({ userId: u._id }, JWT_SECRET, { expiresIn: '7d' });

  const createOrder = async (overrides = {}) => {
    return Order.create({
      userId: user._id,
      customerEmail: user.email,
      orderNumber: `O${Date.now().toString().slice(-10)}`,
      status: 'delivered',
      deliveryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          productName: 'Google Pixel 8',
          productSlug: 'google-pixel-8',
          quantity: 2,
          unitPrice: 599.99,
          totalPrice: 1199.98
        }
      ],
      subtotal: 1199.98,
      tax: 0,
      shipping: 0,
      totalAmount: 1199.98,
      shippingAddress: {
        fullName: 'Return Tester',
        addressLine1: '1 Test St',
        city: 'London',
        stateProvince: 'London',
        postalCode: 'SW1A 1AA',
        country: 'GB'
      },
      billingAddress: {
        fullName: 'Return Tester',
        addressLine1: '1 Test St',
        city: 'London',
        stateProvince: 'London',
        postalCode: 'SW1A 1AA',
        country: 'GB'
      },
      shippingMethod: { id: new mongoose.Types.ObjectId(), name: 'Standard', cost: 0 },
      paymentMethod: { type: 'paypal', name: 'PayPal' },
      paymentStatus: 'completed',
      ...overrides
    });
  };

  beforeEach(async () => {
    user = await createUser();
    authToken = signToken(user);
    deliveredOrder = await createOrder();
  });

  describe('GET /api/user/returns', () => {
    it('should get user return requests successfully', async () => {
      const response = await request(app)
        .get('/api/user/returns')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should return empty list when user has no return requests', async () => {
      const response = await request(app)
        .get('/api/user/returns')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/user/returns').expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should only return the authenticated user return requests', async () => {
      const otherUser = await createUser();
      await ReturnRequest.create({
        orderId: deliveredOrder._id,
        orderNumber: deliveredOrder.orderNumber,
        userId: otherUser._id,
        customerEmail: otherUser.email,
        returnRequestNumber: 'RR-OTHER-001',
        status: 'pending_review',
        returnWindow: 30,
        items: [
          {
            productId: deliveredOrder.items[0].productId,
            productName: 'Google Pixel 8',
            productSlug: 'google-pixel-8',
            quantity: 1,
            unitPrice: 599.99,
            totalRefundAmount: 599.99,
            reason: 'changed_mind'
          }
        ],
        totalRefundAmount: 599.99
      });

      const response = await request(app)
        .get('/api/user/returns')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(0); // belongs to other user
    });
  });

  describe('GET /api/user/returns/:returnRequestId', () => {
    it('should get return request details successfully', async () => {
      const rr = await ReturnRequest.create({
        orderId: deliveredOrder._id,
        orderNumber: deliveredOrder.orderNumber,
        userId: user._id,
        customerEmail: user.email,
        returnRequestNumber: 'RR-001',
        status: 'pending_review',
        returnWindow: 30,
        items: [
          {
            productId: deliveredOrder.items[0].productId,
            productName: 'Google Pixel 8',
            productSlug: 'google-pixel-8',
            quantity: 1,
            unitPrice: 599.99,
            totalRefundAmount: 599.99,
            reason: 'changed_mind'
          }
        ],
        totalRefundAmount: 599.99
      });

      const response = await request(app)
        .get(`/api/user/returns/${rr._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.returnRequest).toBeDefined();
      expect(response.body.data.returnRequest.id).toBe(String(rr._id));
    });

    it('should return 400 for invalid return request ID', async () => {
      const response = await request(app)
        .get('/api/user/returns/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid return request ID');
    });

    it('should return 404 for non-existent return request', async () => {
      const response = await request(app)
        .get(`/api/user/returns/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should not allow viewing another user return request', async () => {
      const otherUser = await createUser();
      const rr = await ReturnRequest.create({
        orderId: deliveredOrder._id,
        orderNumber: deliveredOrder.orderNumber,
        userId: otherUser._id,
        customerEmail: otherUser.email,
        returnRequestNumber: 'RR-OTHER-DETAIL',
        status: 'pending_review',
        returnWindow: 30,
        items: [
          {
            productId: deliveredOrder.items[0].productId,
            productName: 'Google Pixel 8',
            productSlug: 'google-pixel-8',
            quantity: 1,
            unitPrice: 599.99,
            totalRefundAmount: 599.99,
            reason: 'changed_mind'
          }
        ],
        totalRefundAmount: 599.99
      });

      const response = await request(app)
        .get(`/api/user/returns/${rr._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/user/returns/request', () => {
    it('should submit a return request successfully', async () => {
      // The ReturnRequest model now populates `returnRequestNumber` and
      // `totalRefundAmount` via a pre('validate') hook (before required-field
      // validation), so the endpoint can successfully create a ReturnRequest.
      const response = await request(app)
        .post('/api/user/returns/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: deliveredOrder._id.toString(),
          items: [
            {
              productId: deliveredOrder.items[0].productId.toString(),
              quantity: 1,
              reason: 'changed_mind'
            }
          ]
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/user/returns/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Order ID and items are required');
    });

    it('should return 400 for invalid order ID format', async () => {
      const response = await request(app)
        .post('/api/user/returns/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: 'invalid-id',
          items: [
            {
              productId: deliveredOrder.items[0].productId.toString(),
              quantity: 1,
              reason: 'changed_mind'
            }
          ]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid order ID');
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .post('/api/user/returns/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: new mongoose.Types.ObjectId().toString(),
          items: [
            {
              productId: deliveredOrder.items[0].productId.toString(),
              quantity: 1,
              reason: 'changed_mind'
            }
          ]
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Order not found');
    });

    it('should return 400 if order is not delivered', async () => {
      const processingOrder = await createOrder({ status: 'processing' });

      const response = await request(app)
        .post('/api/user/returns/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: processingOrder._id.toString(),
          items: [
            {
              productId: processingOrder.items[0].productId.toString(),
              quantity: 1,
              reason: 'changed_mind'
            }
          ]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Only delivered orders are eligible');
    });

    it('should return 400 when return window has expired', async () => {
      const oldOrder = await createOrder({
        deliveryDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) // 35 days ago
      });

      const response = await request(app)
        .post('/api/user/returns/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: oldOrder._id.toString(),
          items: [
            {
              productId: oldOrder.items[0].productId.toString(),
              quantity: 1,
              reason: 'changed_mind'
            }
          ]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('30-day return window has expired');
    });

    it('should return 400 if a return request already exists for the order', async () => {
      // Simulate an order that already has a return request flagged. (We mark
      // the order directly because the submit endpoint itself is currently
      // broken — see the "submit a return request successfully" test note.)
      await Order.findByIdAndUpdate(deliveredOrder._id, { hasReturnRequest: true });

      const body = {
        orderId: deliveredOrder._id.toString(),
        items: [
          {
            productId: deliveredOrder.items[0].productId.toString(),
            quantity: 1,
            reason: 'changed_mind'
          }
        ]
      };

      const response = await request(app)
        .post('/api/user/returns/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send(body)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already been submitted');
    });

    it('should return 400 for an invalid return reason', async () => {
      const response = await request(app)
        .post('/api/user/returns/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: deliveredOrder._id.toString(),
          items: [
            {
              productId: deliveredOrder.items[0].productId.toString(),
              quantity: 1,
              reason: 'invalid-reason'
            }
          ]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid return reason');
    });

    it('should return 400 when product is not in the order', async () => {
      const response = await request(app)
        .post('/api/user/returns/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: deliveredOrder._id.toString(),
          items: [
            {
              productId: new mongoose.Types.ObjectId().toString(),
              quantity: 1,
              reason: 'changed_mind'
            }
          ]
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found in this order');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/user/returns/request')
        .send({
          orderId: deliveredOrder._id.toString(),
          items: [
            {
              productId: deliveredOrder.items[0].productId.toString(),
              quantity: 1,
              reason: 'changed_mind'
            }
          ]
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
