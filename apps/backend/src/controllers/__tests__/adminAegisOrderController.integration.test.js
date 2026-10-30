import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import adminAegisOrderRoutes from '../../routes/admin-aegis-orders.js';
import AegisOrder from '../../models/AegisOrder.js';
import User from '../../models/User.js';

/**
 * Integration tests for adminAegisOrderController. The router is mounted
 * OUTSIDE the main admin router (same as admin-flash-orders), so it carries
 * its own authenticate + requireRole('admin') middleware. Auth uses the REAL
 * middleware: tokens are signed with the same secret and the users exist +
 * are active in the DB.
 */
describe('Admin Aegis Order Controller (integration)', () => {
  let app;
  let order1, order2;
  let adminToken;
  let customerToken;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    // Test harness: supply the admin credential by default — the REAL
    // authenticate + requireRole middleware still validates it. Guard tests
    // opt out via x-test-no-auth or supply their own (customer) header.
    app.use((req, res, next) => {
      if (req.headers['x-test-no-auth']) {
        delete req.headers.authorization;
        return next();
      }
      if (!req.headers.authorization) {
        req.headers.authorization = `Bearer ${adminToken}`;
      }
      next();
    });
    app.use('/api/admin/aegis-orders', adminAegisOrderRoutes);
  });

  beforeEach(async () => {
    await Promise.all([AegisOrder.deleteMany({}), User.deleteMany({})]);

    const admin = await User.create({
      firstName: 'Admin', lastName: 'User', email: 'admin-aegis@test.com',
      password: 'password123', role: 'admin', isActive: true
    });
    const customer = await User.create({
      firstName: 'Cust', lastName: 'Omer', email: 'customer-aegis@test.com',
      password: 'password123', role: 'customer', isActive: true
    });
    adminToken = jwt.sign(
      { userId: admin._id, role: admin.role, email: admin.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );
    customerToken = jwt.sign(
      { userId: customer._id, role: customer.role, email: customer.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );

    order1 = await AegisOrder.create({
      customerEmail: 'alice@example.com',
      pixelModel: '7 Pro',
      amountGbp: 99.00,
      orderStatus: 'Awaiting_Payment',
      paymentStatus: 'Unpaid'
    });
    order2 = await AegisOrder.create({
      customerEmail: 'bob@example.com',
      pixelModel: '10 Pro Fold',
      amountGbp: 99.00,
      orderStatus: 'Paid',
      paymentStatus: 'Completed',
      paymentDetails: {
        paypalOrderId: 'PP-ORDER-2',
        paypalTransactionId: 'CAP-ORDER-2'
      }
    });
  });

  describe('access control', () => {
    it('rejects unauthenticated access with 401', async () => {
      const response = await request(app)
        .get('/api/admin/aegis-orders')
        .set('x-test-no-auth', '1');

      expect(response.status).toBe(401);
    });

    it('rejects non-admin tokens with 403', async () => {
      const response = await request(app)
        .get('/api/admin/aegis-orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/aegis-orders', () => {
    it('lists orders with pagination', async () => {
      const response = await request(app).get('/api/admin/aegis-orders');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orders).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('filters by status', async () => {
      const response = await request(app)
        .get('/api/admin/aegis-orders?status=Paid');

      expect(response.status).toBe(200);
      expect(response.body.data.orders).toHaveLength(1);
      expect(response.body.data.orders[0].orderNumber).toBe(order2.orderNumber);
    });

    it('filters by customer query (email / order number / model)', async () => {
      const byEmail = await request(app).get('/api/admin/aegis-orders?customerQuery=bob@');
      expect(byEmail.body.data.orders).toHaveLength(1);

      const byModel = await request(app).get('/api/admin/aegis-orders?customerQuery=10 Pro Fold');
      expect(byModel.body.data.orders).toHaveLength(1);
      expect(byModel.body.data.orders[0].customerEmail).toBe('bob@example.com');
    });
  });

  describe('GET /api/admin/aegis-orders/stats', () => {
    it('counts statuses and computes revenue', async () => {
      const response = await request(app).get('/api/admin/aegis-orders/stats');

      expect(response.status).toBe(200);
      expect(response.body.data.totalOrders).toBe(2);
      expect(response.body.data.awaitingPayment).toBe(1);
      expect(response.body.data.paid).toBe(1);
      expect(response.body.data.fulfilled).toBe(0);
      expect(response.body.data.totalRevenue).toBe(99.00); // one Completed payment
      expect(response.body.data.netRevenue).toBe(99.00);
    });
  });

  describe('GET /api/admin/aegis-orders/:id', () => {
    it('returns the full order', async () => {
      const response = await request(app).get(`/api/admin/aegis-orders/${order2._id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.orderNumber).toBe(order2.orderNumber);
      expect(response.body.data.paymentDetails.paypalTransactionId).toBe('CAP-ORDER-2');
    });

    it('404s for an unknown order', async () => {
      const response = await request(app).get('/api/admin/aegis-orders/507f1f77bcf86cd7994d9999');
      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/admin/aegis-orders/:id/status', () => {
    it('marks a paid order Fulfilled and records history', async () => {
      const response = await request(app)
        .patch(`/api/admin/aegis-orders/${order2._id}/status`)
        .send({ orderStatus: 'Fulfilled', note: 'Installer kit emailed' });

      expect(response.status).toBe(200);
      expect(response.body.data.orderStatus).toBe('Fulfilled');

      const saved = await AegisOrder.findById(order2._id);
      expect(saved.orderStatus).toBe('Fulfilled');
      const last = saved.statusHistory[saved.statusHistory.length - 1];
      expect(last.status).toBe('Fulfilled');
      expect(last.note).toBe('Installer kit emailed');
    });

    it('rejects an invalid status', async () => {
      const response = await request(app)
        .patch(`/api/admin/aegis-orders/${order2._id}/status`)
        .send({ orderStatus: 'Device_Received' }); // flash-service status

      expect(response.status).toBe(400);
    });
  });

  // ---------------- refund endpoint (full-amount policy) ----------------
  describe('POST /api/admin/aegis-orders/:id/refund', () => {
    it('refunds the full licence price and marks the order Refunded', async () => {
      const response = await request(app)
        .post(`/api/admin/aegis-orders/${order2._id}/refund`)
        .send({ reason: 'Customer could not complete installation' });

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/£99\.00/);

      const dbOrder = await AegisOrder.findById(order2._id);
      expect(dbOrder.paymentStatus).toBe('Refunded');
      expect(dbOrder.orderStatus).toBe('Refunded');
      expect(dbOrder.totalRefundedAmount).toBe(99.00);
      expect(dbOrder.refundHistory).toHaveLength(1);
      expect(dbOrder.refundHistory[0].status).toBe('succeeded');
      expect(dbOrder.refundHistory[0].refundId).toBe('mock-refund-id');
    });

    it('requires a reason', async () => {
      const response = await request(app)
        .post(`/api/admin/aegis-orders/${order2._id}/refund`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/reason/i);
    });

    it('refuses an unpaid order', async () => {
      const response = await request(app)
        .post(`/api/admin/aegis-orders/${order1._id}/refund`)
        .send({ reason: 'test' });

      expect(response.status).toBe(400);
    });

    it('refuses a second refund (409)', async () => {
      await request(app)
        .post(`/api/admin/aegis-orders/${order2._id}/refund`)
        .send({ reason: 'first refund' });

      const response = await request(app)
        .post(`/api/admin/aegis-orders/${order2._id}/refund`)
        .send({ reason: 'second refund' });

      expect(response.status).toBe(409);
    });

    it('refuses once the licence has been Fulfilled', async () => {
      await AegisOrder.findByIdAndUpdate(order2._id, { orderStatus: 'Fulfilled' });

      const response = await request(app)
        .post(`/api/admin/aegis-orders/${order2._id}/refund`)
        .send({ reason: 'too late' });

      expect(response.status).toBe(409);
      expect(response.body.error).toMatch(/already been delivered/i);
    });
  });
});
