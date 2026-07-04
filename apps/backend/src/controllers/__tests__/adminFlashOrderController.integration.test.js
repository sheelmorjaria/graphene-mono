import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import adminFlashOrderRoutes from '../../routes/admin-flash-orders.js';
import FlashOrder from '../../models/FlashOrder.js';

/**
 * Integration tests for adminFlashOrderController.
 *
 * NOTE: the /api/admin/flash-orders router does NOT apply authentication
 * middleware (its comment states auth is "handled at the app level"), so these
 * routes are exercised directly without an Authorization header. The controller
 * logic, real Mongoose queries, and the FlashOrder schema (pre-save order-number
 * hook, validation, PO-Box auto-population) are all exercised against the real DB.
 */
describe('Admin Flash Order Controller (integration)', () => {
  let app;
  let order1, order2;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/admin/flash-orders', adminFlashOrderRoutes);
  });

  beforeEach(async () => {
    await FlashOrder.deleteMany({});

    order1 = await FlashOrder.create({
      customerEmail: 'alice@example.com',
      pixelModel: 'Pixel 8 Pro',
      returnAddress: {
        fullName: 'Alice Smith',
        addressLine1: '1 Test Street',
        city: 'London',
        stateProvince: 'England',
        postalCode: 'E1 6AN',
        country: 'GB',
        phoneNumber: '+44 20 7946 0958'
      },
      factoryResetConfirmed: true,
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
          street: 'PO Box 12345',
          city: 'London',
          postalCode: 'E1 6AN',
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
});
