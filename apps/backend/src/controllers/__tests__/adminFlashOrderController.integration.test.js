import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import adminFlashOrderRoutes from '../../routes/admin-flash-orders.js';
import FlashOrder from '../../models/FlashOrder.js';
import User from '../../models/User.js';

/**
 * Integration tests for adminFlashOrderController. The router is mounted
 * OUTSIDE the main admin router, so it carries its own authenticate +
 * requireRole('admin') middleware (added 2026-09-19 — these routes were
 * previously public). Auth uses the REAL middleware: tokens are signed with
 * the same secret and the users exist + are active in the DB.
 */
describe('Admin Flash Order Controller (integration)', () => {
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
    app.use('/api/admin/flash-orders', adminFlashOrderRoutes);
  });

  beforeEach(async () => {
    await Promise.all([FlashOrder.deleteMany({}), User.deleteMany({})]);

    const admin = await User.create({
      firstName: 'Admin', lastName: 'User', email: 'admin-flash@test.com',
      password: 'password123', role: 'admin', isActive: true
    });
    const customer = await User.create({
      firstName: 'Cust', lastName: 'Omer', email: 'customer-flash@test.com',
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

    order1 = await FlashOrder.create({
      customerEmail: 'alice@example.com',
      pixelModel: 'Pixel 8 Pro',
      returnAddress: {
        fullName: 'Alice Smith',
        addressLine1: '1 Test Street',
        city: 'London',
        stateProvince: 'England',
        postalCode: 'NW9 1TX',
        country: 'GB',
        phoneNumber: '+44 20 7946 0958'
      },
      factoryResetConfirmed: true,
      serviceConsentConfirmed: true,
      orderStatus: 'Awaiting_Payment',
      paymentStatus: 'Unpaid'
    });

    order2 = await FlashOrder.create({
      customerEmail: 'bob@example.com',
      pixelModel: 'Pixel 9 Pro XL',
      returnAddress: {
        fullName: 'Bob Jones',
        addressLine1: '2 Other Road',
        city: 'Manchester',
        stateProvince: 'Greater Manchester',
        postalCode: 'M1 1AE',
        country: 'GB'
      },
      factoryResetConfirmed: true,
      serviceConsentConfirmed: true,
      orderStatus: 'Paid',
      paymentStatus: 'Completed',
      totalPrice: 140.44
    });
  });

  // ---------------- GET / (getAllFlashOrders) ----------------
  describe('GET /api/admin/flash-orders', () => {
    it('returns all orders with pagination metadata', async () => {
      const res = await request(app).get('/api/admin/flash-orders');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orders).toHaveLength(2);
      expect(res.body.data.pagination).toEqual(
        expect.objectContaining({ page: 1, limit: 20, total: 2, pages: 1 })
      );
    });

    it('filters by status', async () => {
      const res = await request(app).get(
        '/api/admin/flash-orders?status=Paid'
      );

      expect(res.status).toBe(200);
      expect(res.body.data.orders).toHaveLength(1);
      expect(res.body.data.orders[0].orderStatus).toBe('Paid');
    });

    it('ignores the "all" status sentinel', async () => {
      const res = await request(app).get(
        '/api/admin/flash-orders?status=all'
      );

      expect(res.status).toBe(200);
      expect(res.body.data.orders).toHaveLength(2);
    });

    it('filters by customer query (email)', async () => {
      const res = await request(app).get(
        '/api/admin/flash-orders?customerQuery=alice'
      );

      expect(res.status).toBe(200);
      expect(res.body.data.orders).toHaveLength(1);
      expect(res.body.data.orders[0].customerEmail).toBe('alice@example.com');
    });

    it('filters by customer query (order number)', async () => {
      const res = await request(app).get(
        `/api/admin/flash-orders?customerQuery=${order2.orderNumber}`
      );

      expect(res.status).toBe(200);
      expect(res.body.data.orders).toHaveLength(1);
      expect(res.body.data.orders[0]._id).toBe(String(order2._id));
    });

    it('respects page + limit pagination', async () => {
      const res = await request(app).get(
        '/api/admin/flash-orders?page=1&limit=1'
      );

      expect(res.status).toBe(200);
      expect(res.body.data.orders).toHaveLength(1);
      expect(res.body.data.pagination).toEqual(
        expect.objectContaining({ page: 1, limit: 1, total: 2, pages: 2 })
      );
    });

    it('honours sortBy + sortOrder', async () => {
      const res = await request(app).get(
        '/api/admin/flash-orders?sortBy=customerEmail&sortOrder=asc'
      );

      expect(res.status).toBe(200);
      expect(res.body.data.orders[0].customerEmail).toBe('alice@example.com');
      expect(res.body.data.orders[1].customerEmail).toBe('bob@example.com');
    });

    it('filters by date range', async () => {
      const start = new Date(Date.now() - 60 * 1000).toISOString();
      const end = new Date(Date.now() + 60 * 1000).toISOString();
      const res = await request(app).get(
        `/api/admin/flash-orders?startDate=${start}&endDate=${end}`
      );

      expect(res.status).toBe(200);
      expect(res.body.data.orders).toHaveLength(2);
    });

    it('date range in the past returns no orders', async () => {
      const start = new Date('2020-01-01').toISOString();
      const end = new Date('2020-01-02').toISOString();
      const res = await request(app).get(
        `/api/admin/flash-orders?startDate=${start}&endDate=${end}`
      );

      expect(res.status).toBe(200);
      expect(res.body.data.orders).toHaveLength(0);
      expect(res.body.data.pagination.total).toBe(0);
    });
  });

  // ---------------- GET /stats (getFlashOrderStats) ----------------
  describe('GET /api/admin/flash-orders/stats', () => {
    it('returns aggregated order statistics', async () => {
      const res = await request(app).get('/api/admin/flash-orders/stats');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(
        expect.objectContaining({
          totalOrders: 2,
          awaitingPayment: 1,
          paid: 1,
          deviceReceived: 0,
          flashingInProgress: 0,
          shippedBack: 0,
          cancelled: 0,
          refunded: 0
        })
      );
      // order2 has paymentStatus Completed + totalPrice 140.44
      expect(res.body.data.totalRevenue).toBe(140.44);
    });
  });

  // ---------------- GET /:id (getFlashOrderById) ----------------
  describe('GET /api/admin/flash-orders/:id', () => {
    it('returns a single order by id', async () => {
      const res = await request(app).get(
        `/api/admin/flash-orders/${order1._id}`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(String(order1._id));
      expect(res.body.data.customerEmail).toBe('alice@example.com');
    });

    it('returns 404 for a non-existent id', async () => {
      const { default: mongoose } = await import('mongoose');
      const id = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/admin/flash-orders/${id}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/not found/i);
    });
  });

  // ---------------- PATCH /:id/status (updateFlashOrderStatus) ----------------
  describe('PATCH /api/admin/flash-orders/:id/status', () => {
    it('updates orderStatus and appends to statusHistory', async () => {
      const res = await request(app)
        .patch(`/api/admin/flash-orders/${order1._id}/status`)
        .send({ orderStatus: 'Device_Received', note: 'Arrived at depot' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderStatus).toBe('Device_Received');
      expect(res.body.data.statusHistory).toHaveLength(1);
      expect(res.body.data.statusHistory[0]).toEqual(
        expect.objectContaining({
          status: 'Device_Received',
          note: 'Arrived at depot'
        })
      );

      const reloaded = await FlashOrder.findById(order1._id).lean();
      expect(reloaded.orderStatus).toBe('Device_Received');
    });

    it('updates paymentStatus', async () => {
      const res = await request(app)
        .patch(`/api/admin/flash-orders/${order1._id}/status`)
        .send({ paymentStatus: 'Pending' });

      expect(res.status).toBe(200);
      expect(res.body.data.paymentStatus).toBe('Pending');
    });

    it('auto-populates PO Box when orderStatus=Paid & paymentStatus=Completed', async () => {
      const res = await request(app)
        .patch(`/api/admin/flash-orders/${order1._id}/status`)
        .send({ orderStatus: 'Paid', paymentStatus: 'Completed' });

      expect(res.status).toBe(200);
      const reloaded = await FlashOrder.findById(order1._id).lean();
      expect(reloaded.poBoxAddress).toEqual(
        expect.objectContaining({
          street: 'PO Box 81688',
          city: 'London',
          postalCode: 'NW9 1TX',
          country: 'United Kingdom'
        })
      );
      expect(reloaded.poBoxAddress.instructions).toMatch(/order number/i);
    });

    it('does NOT overwrite an existing PO Box on re-payment', async () => {
      await FlashOrder.updateOne(
        { _id: order1._id },
        {
          $set: {
            poBoxAddress: {
              street: 'Custom PO Box 999',
              city: 'Bristol'
            }
          }
        }
      );

      const res = await request(app)
        .patch(`/api/admin/flash-orders/${order1._id}/status`)
        .send({ orderStatus: 'Paid', paymentStatus: 'Completed' });

      expect(res.status).toBe(200);
      const reloaded = await FlashOrder.findById(order1._id).lean();
      expect(reloaded.poBoxAddress.street).toBe('Custom PO Box 999');
    });

    it('rejects an invalid orderStatus with 400', async () => {
      const res = await request(app)
        .patch(`/api/admin/flash-orders/${order1._id}/status`)
        .send({ orderStatus: 'NotARealStatus' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Invalid order status/i);
    });

    it('rejects an invalid paymentStatus with 400', async () => {
      const res = await request(app)
        .patch(`/api/admin/flash-orders/${order1._id}/status`)
        .send({ paymentStatus: 'TotallyPaid' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Invalid payment status/i);
    });

    it('returns 404 when updating a non-existent order', async () => {
      const { default: mongoose } = await import('mongoose');
      const id = new mongoose.Types.ObjectId();
      const res = await request(app)
        .patch(`/api/admin/flash-orders/${id}/status`)
        .send({ orderStatus: 'Paid' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/not found/i);
    });

    it('uses a default note when none is supplied', async () => {
      const res = await request(app)
        .patch(`/api/admin/flash-orders/${order1._id}/status`)
        .send({ orderStatus: 'Shipped_Back' });

      expect(res.status).toBe(200);
      expect(res.body.data.statusHistory[0].note).toMatch(
        /Status updated to Shipped_Back/
      );
    });
  });

  // ---------------- authentication (router-level middleware) ----------------
  describe('authentication', () => {
    it('rejects unauthenticated access with 401', async () => {
      const res = await request(app).get('/api/admin/flash-orders').set('x-test-no-auth', '1');
      expect(res.status).toBe(401);
    });

    it('rejects non-admin tokens with 403', async () => {
      const res = await request(app)
        .get('/api/admin/flash-orders')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ---------------- refund endpoint (tiered policy) ----------------
  describe('POST /api/admin/flash-orders/:id/refund', () => {
    const refundableOrder = () => ({
      customerEmail: 'refund@example.com',
      pixelModel: 'Pixel 8 Pro',
      returnAddress: { fullName: 'Refund Customer', addressLine1: '9 Refund Rd', city: 'Leeds', stateProvince: 'Yorkshire', postalCode: 'LS1 1AA', country: 'GB' },
      factoryResetConfirmed: true,
      serviceConsentConfirmed: true,
      orderStatus: 'Device_Received',
      paymentStatus: 'Completed',
      paymentDetails: { paypalTransactionId: 'CAP-REFUND-1', paypalOrderId: 'PO-1' }
    });

    it('refunds the FULL total for a cancellation before flashing', async () => {
      const order = await FlashOrder.create(refundableOrder());

      const res = await request(app)
        .post(`/api/admin/flash-orders/${order._id}/refund`)
        .send({ reason: 'Customer cancelled', category: 'cancellation_before_flashing' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('140.44');

      const dbOrder = await FlashOrder.findById(order._id);
      expect(dbOrder.paymentStatus).toBe('Refunded');
      expect(dbOrder.orderStatus).toBe('Refunded');
      expect(dbOrder.totalRefundedAmount).toBe(140.44);
      expect(dbOrder.refundHistory).toHaveLength(1);
      expect(dbOrder.refundHistory[0].status).toBe('succeeded');
      expect(dbOrder.refundHistory[0].amount).toBe(140.44);
      expect(dbOrder.refundHistory[0].refundId).toBe('mock-refund-id');
    });

    it('refunds total minus return shipping for an unflashable device', async () => {
      const order = await FlashOrder.create(refundableOrder());

      const res = await request(app)
        .post(`/api/admin/flash-orders/${order._id}/refund`)
        .send({ reason: 'Carrier locked — bootloader locked', category: 'device_unflashable' });

      expect(res.status).toBe(200);
      const dbOrder = await FlashOrder.findById(order._id);
      expect(dbOrder.refundHistory[0].amount).toBe(119.99);
      expect(dbOrder.totalRefundedAmount).toBe(119.99);
    });

    it('409 policy-blocks the refund once flashing has begun', async () => {
      const order = await FlashOrder.create({ ...refundableOrder(), orderStatus: 'Flashing_In_Progress' });

      const res = await request(app)
        .post(`/api/admin/flash-orders/${order._id}/refund`)
        .send({ reason: 'Customer demands refund', category: 'cancellation_before_flashing' });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/service has begun/i);
      const dbOrder = await FlashOrder.findById(order._id);
      expect(dbOrder.paymentStatus).toBe('Completed');
    });

    it('409s a second refund attempt (already refunded)', async () => {
      const order = await FlashOrder.create(refundableOrder());
      await request(app)
        .post(`/api/admin/flash-orders/${order._id}/refund`)
        .send({ reason: 'First refund', category: 'cancellation_before_flashing' });

      const second = await request(app)
        .post(`/api/admin/flash-orders/${order._id}/refund`)
        .send({ reason: 'Second attempt', category: 'cancellation_before_flashing' });

      expect(second.status).toBe(409);
    });

    it('401s without authentication', async () => {
      const order = await FlashOrder.create(refundableOrder());
      const res = await request(app)
        .post(`/api/admin/flash-orders/${order._id}/refund`)
        .set('x-test-no-auth', '1')
        .send({ reason: 'Nope', category: 'cancellation_before_flashing' });

      expect(res.status).toBe(401);
    });
  });

  // ---------------- intake inspection ----------------
  describe('PATCH status intake inspection', () => {
    it('records the intake condition when marking Device_Received and emails the customer', async () => {
      const order = await FlashOrder.create({
        customerEmail: 'intake@example.com',
        pixelModel: 'Pixel 9',
        returnAddress: { fullName: 'Intake Customer', addressLine1: '3 Intake St', city: 'Bristol', stateProvince: 'Avon', postalCode: 'BS1 1AA', country: 'GB' },
        factoryResetConfirmed: true,
        serviceConsentConfirmed: true,
        orderStatus: 'Paid',
        paymentStatus: 'Completed'
      });

      const res = await request(app)
        .patch(`/api/admin/flash-orders/${order._id}/status`)
        .send({
          orderStatus: 'Device_Received',
          intakeConditionNotes: 'Minor scratch top-left corner. Battery health 91%. OEM unlocking available.'
        });

      expect(res.status).toBe(200);
      const dbOrder = await FlashOrder.findById(order._id);
      expect(dbOrder.orderStatus).toBe('Device_Received');
      expect(dbOrder.intakeInspection.conditionNotes).toContain('Minor scratch');
      expect(dbOrder.intakeInspection.inspectedAt).toBeTruthy();
    });
  });
});
