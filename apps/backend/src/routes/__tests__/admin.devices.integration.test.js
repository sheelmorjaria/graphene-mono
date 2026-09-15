import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';
import adminRoutes from '../admin.js';
import userRoutes from '../user.js';
import User from '../../models/User.js';
import Product from '../../models/Product.js';
import Order from '../../models/Order.js';
import ReturnRequest from '../../models/ReturnRequest.js';
import Device from '../../models/Device.js';
import emailService from '../../services/emailService.js';
import { createValidOrderData, createValidReturnRequestData } from '../../test/helpers/testDataFactory.js';

// Mock the PayPal server SDK (getPayPalClient news up controllers from it).
// Implementations must be REGULAR functions — `new Client()` rejects arrows.
const paypal = vi.hoisted(() => ({
  refundCapturedPayment: vi.fn()
}));
vi.mock('@paypal/paypal-server-sdk', () => ({
  Client: vi.fn().mockImplementation(function () {
    return {};
  }),
  PaymentsController: vi.fn().mockImplementation(function () {
    return { refundCapturedPayment: paypal.refundCapturedPayment };
  }),
  OrdersController: vi.fn().mockImplementation(function () {
    return {};
  }),
  Environment: { Sandbox: 'sandbox', Production: 'production' }
}));

// End-to-end IMEI device tracking through the admin API: receive →
// allocate → ship (email paper trail) → return verification → the refund
// hard-block and its explicit override.
describe('Admin Devices Integration Tests (IMEI tracking)', () => {
  let app;
  let adminUser;
  let customerUser;
  let adminToken;
  let customerToken;
  let product;
  let variation;

  const IMEI_A = '123456789012345';
  const IMEI_B = '987654321054321';
  const IMEI_C = '111111111111111';

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);
    app.use('/api/user', userRoutes);
  });

  afterAll(async () => {
    // DB cleanup handled by global test setup
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      ReturnRequest.deleteMany({}),
      Device.deleteMany({})
    ]);

    vi.clearAllMocks();
    paypal.refundCapturedPayment.mockResolvedValue({ status: 'COMPLETED', id: 'REF-INT-1' });

    adminUser = await User.create({
      firstName: 'Admin', lastName: 'User', email: 'admin@test.com',
      password: 'password123', role: 'admin', isActive: true
    });
    customerUser = await User.create({
      firstName: 'John', lastName: 'Doe', email: 'john@test.com',
      password: 'password123', role: 'customer', isActive: true
    });

    adminToken = jwt.sign(
      { userId: adminUser._id, role: adminUser.role, email: adminUser.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );
    customerToken = jwt.sign(
      { userId: customerUser._id, role: customerUser.role, email: customerUser.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );

    product = await Product.create({
      name: 'GrapheneOS Pixel 9 Pro',
      slug: 'grapheneos-pixel-9-pro-int-test',
      sku: 'PIX9PRO-INT-BASE',
      baseModel: '9 Pro',
      shortDescription: 'Test phone',
      status: 'active',
      isActive: true,
      variations: [{
        condition: 'good', color: 'Obsidian', storage: '256GB',
        price: 999.99, stockQuantity: 5, stockStatus: 'in_stock', sku: 'PIX9PRO-INT-V1'
      }]
    });
    variation = product.variations[0];
  });

  const orderDataWithItem = (overrides = {}) => createValidOrderData({
    userId: customerUser._id.toString(),
    customerEmail: customerUser.email,
    items: [{
      productId: product._id.toString(),
      productName: product.name,
      productSlug: product.slug,
      variationId: String(variation._id),
      sku: variation.sku,
      quantity: 1,
      unitPrice: 999.99,
      totalPrice: 999.99
    }],
    subtotal: 999.99,
    totalAmount: 999.99,
    shipping: 0,
    tax: 0,
    paymentStatus: 'completed',
    paymentDetails: { paypalTransactionId: 'CAP-INT-1', status: 'COMPLETED' },
    ...overrides
  });

  // Creates an order (processing) with its single item and returns the doc
  const createProcessingOrder = async (overrides = {}) => {
    const order = await Order.create(orderDataWithItem({ status: 'processing', ...overrides }));
    return order;
  };

  // ---------------- auth guards ----------------
  describe('auth', () => {
    it('rejects unauthenticated device list access', async () => {
      const response = await request(app).get('/api/admin/devices');
      expect(response.status).toBe(401);
    });

    it('rejects non-admin device access with 403', async () => {
      const response = await request(app)
        .get('/api/admin/devices')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(response.status).toBe(403);
    });
  });

  // ---------------- receive ----------------
  describe('POST /api/admin/devices (receive)', () => {
    it('creates a device in stock', async () => {
      const response = await request(app)
        .post('/api/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imei: IMEI_A, serialNumber: 'SN-INT-1', productId: product._id.toString(), variationId: String(variation._id), sku: variation.sku });

      expect(response.status).toBe(201);
      expect(response.body.data.device.status).toBe('in_stock');
      const dbDevice = await Device.findOne({ imei: IMEI_A });
      expect(dbDevice).toBeTruthy();
      expect(dbDevice.productName).toBe(product.name);
    });

    it('rejects an invalid IMEI with 400', async () => {
      const response = await request(app)
        .post('/api/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imei: '12345', productId: product._id.toString() });
      expect(response.status).toBe(400);
    });

    it('rejects a duplicate IMEI with 409', async () => {
      await Device.create({ imei: IMEI_A, productId: product._id });
      const response = await request(app)
        .post('/api/admin/devices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imei: IMEI_A, productId: product._id.toString() });
      expect(response.status).toBe(409);
    });
  });

  // ---------------- list / detail ----------------
  describe('GET /api/admin/devices', () => {
    it('lists devices filtered by status and exact IMEI', async () => {
      await Device.create({ imei: IMEI_A, productId: product._id, status: 'in_stock' });
      await Device.create({ imei: IMEI_B, productId: product._id, status: 'shipped' });

      const response = await request(app)
        .get(`/api/admin/devices?status=shipped&imei=${IMEI_B}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.devices).toHaveLength(1);
      expect(response.body.data.devices[0].imei).toBe(IMEI_B);
    });

    it('404s an unknown device id', async () => {
      const response = await request(app)
        .get(`/api/admin/devices/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(404);
    });
  });

  // ---------------- allocate (JIT scan) ----------------
  describe('POST /api/admin/devices/allocate', () => {
    it('JIT-creates the device from the order item and allocates it', async () => {
      const order = await createProcessingOrder();

      const response = await request(app)
        .post('/api/admin/devices/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imei: IMEI_A, orderId: order._id.toString(), orderItemId: String(order.items[0]._id) });

      expect(response.status).toBe(200);
      expect(response.body.data.itemAllocation).toMatchObject({ allocated: 1, required: 1 });

      const dbOrder = await Order.findById(order._id);
      expect(dbOrder.items[0].devices).toHaveLength(1);
      expect(dbOrder.items[0].devices[0].imei).toBe(IMEI_A);

      const dbDevice = await Device.findOne({ imei: IMEI_A });
      expect(dbDevice.status).toBe('allocated');
      expect(String(dbDevice.orderId)).toBe(String(order._id));
    });

    it('409s when the IMEI is allocated to a different order', async () => {
      const orderA = await createProcessingOrder();
      const orderB = await createProcessingOrder();
      await Device.create({
        imei: IMEI_A, productId: product._id, status: 'allocated',
        orderId: orderB._id, orderItemId: String(orderB.items[0]._id), orderNumber: orderB.orderNumber
      });

      const response = await request(app)
        .post('/api/admin/devices/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imei: IMEI_A, orderId: orderA._id.toString(), orderItemId: String(orderA.items[0]._id) });

      expect(response.status).toBe(409);
    });

    it('400s when the item already has all units allocated', async () => {
      const order = await createProcessingOrder();
      const device = await Device.create({ imei: IMEI_A, productId: product._id });
      await request(app)
        .post('/api/admin/devices/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imei: device.imei, orderId: order._id.toString(), orderItemId: String(order.items[0]._id) });

      const second = await request(app)
        .post('/api/admin/devices/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imei: IMEI_B, orderId: order._id.toString(), orderItemId: String(order.items[0]._id) });

      expect(second.status).toBe(400);
    });

    it('409s when the device belongs to a different product', async () => {
      const order = await createProcessingOrder();
      const otherProduct = await Product.create({
        name: 'GrapheneOS Pixel 8', slug: 'grapheneos-pixel-8-int-test',
        sku: 'PIX8-INT-BASE', baseModel: '8', shortDescription: 'x',
        status: 'active', isActive: true,
        variations: [{ condition: 'good', color: 'Obsidian', storage: '128GB', price: 499, stockQuantity: 1, stockStatus: 'in_stock', sku: 'PIX8-INT-V1' }]
      });
      await Device.create({ imei: IMEI_A, productId: otherProduct._id });

      const response = await request(app)
        .post('/api/admin/devices/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imei: IMEI_A, orderId: order._id.toString(), orderItemId: String(order.items[0]._id) });

      expect(response.status).toBe(409);
    });
  });

  // ---------------- release ----------------
  describe('POST /api/admin/devices/:id/release', () => {
    it('releases an allocated device and clears the order snapshot', async () => {
      const order = await createProcessingOrder();
      const allocate = await request(app)
        .post('/api/admin/devices/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imei: IMEI_A, orderId: order._id.toString(), orderItemId: String(order.items[0]._id) });
      const deviceId = allocate.body.data.device._id;

      const response = await request(app)
        .post(`/api/admin/devices/${deviceId}/release`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'wrong unit scanned' });

      expect(response.status).toBe(200);
      const dbDevice = await Device.findById(deviceId);
      expect(dbDevice.status).toBe('in_stock');
      expect(dbDevice.orderId).toBeNull();
      const dbOrder = await Order.findById(order._id);
      expect(dbOrder.items[0].devices).toHaveLength(0);
    });
  });

  // ---------------- ship / cancel transitions ----------------
  describe('order status transitions', () => {
    it('shipping the order marks allocated devices shipped and emails the IMEI', async () => {
      const order = await createProcessingOrder();
      await request(app)
        .post('/api/admin/devices/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imei: IMEI_A, orderId: order._id.toString(), orderItemId: String(order.items[0]._id) });

      const response = await request(app)
        .put(`/api/admin/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newStatus: 'shipped', trackingNumber: 'TRK-INT-1', trackingUrl: 'https://track.example/1' });

      expect(response.status).toBe(200);
      const dbDevice = await Device.findOne({ imei: IMEI_A });
      expect(dbDevice.status).toBe('shipped');
      expect(dbDevice.shippedAt).toBeTruthy();

      // Shipped email carries the IMEI (dispute paper trail)
      expect(emailService.sendOrderShippedEmail).toHaveBeenCalled();
      const emailedOrder = emailService.sendOrderShippedEmail.mock.calls[0][0];
      expect(JSON.stringify(emailedOrder)).toContain(IMEI_A);
    });

    it('cancelling the order releases allocated devices back to stock', async () => {
      const order = await createProcessingOrder();
      await request(app)
        .post('/api/admin/devices/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imei: IMEI_A, orderId: order._id.toString(), orderItemId: String(order.items[0]._id) });

      const response = await request(app)
        .put(`/api/admin/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newStatus: 'cancelled' });

      expect(response.status).toBe(200);
      const dbDevice = await Device.findOne({ imei: IMEI_A });
      expect(dbDevice.status).toBe('in_stock');
      expect(dbDevice.orderId).toBeNull();
    });
  });

  // ---------------- return verification + refund gate ----------------
  describe('return verification and the refund hard-block', () => {
    const shipOrderWithDevice = async (imei = IMEI_A) => {
      const order = await createProcessingOrder();
      await request(app)
        .post('/api/admin/devices/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imei, orderId: order._id.toString(), orderItemId: String(order.items[0]._id) });
      await request(app)
        .put(`/api/admin/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newStatus: 'shipped', trackingNumber: 'TRK-INT-2', trackingUrl: 'https://track.example/2' });
      await Order.updateOne({ _id: order._id }, { status: 'delivered', deliveryDate: new Date() });
      return Order.findById(order._id);
    };

    const createReturnFor = async (order) => {
      const rrData = createValidReturnRequestData(order, { status: 'item_received' });
      return ReturnRequest.create(rrData);
    };

    it('a matching scan verifies the return and unblocks nothing (no mismatch)', async () => {
      const order = await shipOrderWithDevice(IMEI_A);
      const rr = await createReturnFor(order);

      const response = await request(app)
        .post(`/api/admin/returns/${rr._id}/verify-device`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imei: IMEI_A });

      expect(response.status).toBe(200);
      expect(response.body.data.result).toBe('match');
      const dbDevice = await Device.findOne({ imei: IMEI_A });
      expect(dbDevice.status).toBe('returned');
      const dbRr = await ReturnRequest.findById(rr._id);
      expect(dbRr.deviceVerification.status).toBe('verified');
    });

    it('a mismatched scan quarantines/flags and HARD-BLOCKS the refund until override', async () => {
      const order = await shipOrderWithDevice(IMEI_A);
      const rr = await createReturnFor(order);

      // Customer ships back a different phone (IMEI unknown to the system)
      const verify = await request(app)
        .post(`/api/admin/returns/${rr._id}/verify-device`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imei: IMEI_C });
      expect(verify.status).toBe(200);
      expect(verify.body.data.result).toBe('mismatch');

      const dbRr = await ReturnRequest.findById(rr._id);
      expect(dbRr.deviceVerification.status).toBe('mismatch');
      expect(dbRr.deviceVerification.scans[0].deviceId).toBeNull();

      // Refund is blocked and PayPal is never called
      const blocked = await request(app)
        .post(`/api/admin/orders/${order._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ refundAmount: 999.99, refundReason: 'Return received' });
      expect(blocked.status).toBe(409);
      expect(blocked.body.data.blocked).toBe(true);
      expect(paypal.refundCapturedPayment).not.toHaveBeenCalled();

      // Explicit override refunds and audits the decision
      const overridden = await request(app)
        .post(`/api/admin/orders/${order._id}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ refundAmount: 999.99, refundReason: 'Return received', overrideDeviceMismatch: true });
      expect(overridden.status).toBe(200);
      expect(paypal.refundCapturedPayment).toHaveBeenCalledTimes(1);

      const dbOrder = await Order.findById(order._id);
      expect(dbOrder.refundHistory[0].deviceVerificationOverride).toBe(true);
    });
  });

  // ---------------- customer-facing leak check ----------------
  describe('customer order endpoint never exposes devices', () => {
    it('returns order details without device/IMEI data', async () => {
      const order = await createProcessingOrder();
      await request(app)
        .post('/api/admin/devices/allocate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ imei: IMEI_A, orderId: order._id.toString(), orderItemId: String(order.items[0]._id) });

      const response = await request(app)
        .get(`/api/user/orders/${order._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      const body = JSON.stringify(response.body);
      expect(body).not.toContain('devices');
      expect(body).not.toContain(IMEI_A);
    });
  });
});
