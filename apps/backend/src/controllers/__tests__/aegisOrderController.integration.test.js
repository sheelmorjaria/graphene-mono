import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import aegisOrderRoutes from '../../routes/aegis-orders.js';
import AegisOrder from '../../models/AegisOrder.js';
import Product from '../../models/Product.js';
import emailService from '../../services/emailService.js';
import { verifyPayPalWebhookSignature } from '../../services/paypalWebhookVerificationService.js';

vi.mock('../../services/paypalWebhookVerificationService.js', () => ({
  verifyPayPalWebhookSignature: vi.fn().mockResolvedValue({ verified: true })
}));

const KIT_BYTES = Buffer.from('PK\x03\x04aegis-test-kit-zip-payload');

/**
 * Integration tests for the Aegis Hardening Suite order flow (£99 one-off
 * licence, PayPal-only, guest purchase). Mirrors the flash-order payment
 * tests; the PayPal SDK is mocked globally by the integration harness
 * (createOrder → mock-paypal-order-id, captureOrder → COMPLETED).
 *
 * The device list is catalog-driven: products are seeded directly into the
 * collection (raw insertMany — the Product schema's product-level required
 * fields are irrelevant to baseModel matching). The installer kit is a
 * temp file so the automated-delivery download endpoint is exercised for
 * real.
 */
describe('Aegis Order API (integration)', () => {
  let app;
  let paidOrder;
  let kitPath;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/aegis-orders', aegisOrderRoutes);
    kitPath = path.join(os.tmpdir(), `aegis-test-kit-${Date.now()}.zip`);
    fs.writeFileSync(kitPath, KIT_BYTES);
    // Build the schema indexes the way the full CI run does (earlier suites
    // sync them; running this file alone would otherwise skip them) — the
    // seed below must satisfy the unique variations.sku index.
    await Product.syncIndexes();
  });

  beforeEach(async () => {
    process.env.PAYPAL_CLIENT_ID = 'test-client-id';
    process.env.PAYPAL_CLIENT_SECRET = 'test-client-secret';
    process.env.PAYPAL_ENVIRONMENT = 'sandbox';
    process.env.PAYPAL_AEGIS_WEBHOOK_ID = 'test-aegis-webhook-id';
    process.env.AEGIS_KIT_PATH = kitPath;
    process.env.BACKEND_URL = 'https://api.test.example';
    vi.mocked(verifyPayPalWebhookSignature).mockResolvedValue({ verified: true });

    await Promise.all([
      AegisOrder.deleteMany({}),
      Product.deleteMany({})
    ]);

    // Catalog: two stocked models + one delisted (isActive false). Raw
    // collection insert — only baseModel/isActive matter here, and the
    // Product schema's required catalog fields are irrelevant to matching.
    // Each doc carries a UNIQUE variations.sku: the schema's unique index
    // on that path rejects multiple nulls (E11000) once indexes exist.
    await Product.collection.insertMany([
      { name: 'GrapheneOS Pixel 7 Pro', slug: 'grapheneos-pixel-7-pro', sku: 'PX-7PRO', baseModel: '7 Pro', isActive: true, variations: [{ sku: 'test-var-7pro' }] },
      { name: 'GrapheneOS Pixel 10 Pro Fold', slug: 'grapheneos-pixel-10-pro-fold', sku: 'PX-10PROFOLD', baseModel: '10 Pro Fold', isActive: true, variations: [{ sku: 'test-var-10profold' }] },
      { name: 'GrapheneOS Pixel 6', slug: 'grapheneos-pixel-6', sku: 'PX-6', baseModel: '6', isActive: false, variations: [{ sku: 'test-var-6' }] }
    ]);

    paidOrder = await AegisOrder.create({
      customerEmail: 'paid@example.com',
      pixelModel: '7 Pro',
      amountGbp: 99.00
    });
  });

  describe('GET /api/aegis-orders/models', () => {
    it('returns the live catalog models with display labels', async () => {
      const response = await request(app).get('/api/aegis-orders/models');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      const models = response.body.data.models;
      expect(models).toHaveLength(2); // delisted '6' excluded
      expect(models.map((m) => m.value)).toEqual(['7 Pro', '10 Pro Fold']);
      expect(models[0].label).toBe('Pixel 7 Pro');
    });
  });

  describe('POST /api/aegis-orders', () => {
    it('creates an order for a stocked model without an account', async () => {
      const response = await request(app)
        .post('/api/aegis-orders')
        .send({ customerEmail: 'Buyer@Example.com', pixelModel: '7 Pro' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orderNumber).toMatch(/^AEG-\d+-\d{3}$/);
      expect(response.body.data.customerEmail).toBe('buyer@example.com'); // lowercased
      expect(response.body.data.amountGbp).toBe(99.00);
      expect(response.body.data.orderStatus).toBe('Awaiting_Payment');
      expect(response.body.data.paymentStatus).toBe('Unpaid');
    });

    it('rejects an invalid email', async () => {
      const response = await request(app)
        .post('/api/aegis-orders')
        .send({ customerEmail: 'not-an-email', pixelModel: '7 Pro' });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/valid email/i);
    });

    it('rejects a model that is not in the live catalog', async () => {
      const response = await request(app)
        .post('/api/aegis-orders')
        .send({ customerEmail: 'buyer@example.com', pixelModel: 'Pixel 4' });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/Invalid Pixel model/i);
    });

    it('rejects a delisted model (isActive false)', async () => {
      const response = await request(app)
        .post('/api/aegis-orders')
        .send({ customerEmail: 'buyer@example.com', pixelModel: '6' });

      expect(response.status).toBe(400);
    });

    it('rejects missing fields', async () => {
      const response = await request(app)
        .post('/api/aegis-orders')
        .send({ customerEmail: 'buyer@example.com' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/aegis-orders/:id/summary', () => {
    it('returns the payment-step summary', async () => {
      const response = await request(app).get(`/api/aegis-orders/${paidOrder._id}/summary`);

      expect(response.status).toBe(200);
      expect(response.body.data.orderNumber).toBe(paidOrder.orderNumber);
      expect(response.body.data.amountGbp).toBe(99.00);
      expect(response.body.data.paymentStatus).toBe('Unpaid');
    });

    it('404s for an unknown order', async () => {
      const response = await request(app).get('/api/aegis-orders/507f1f77bcf86cd7994d9999/summary');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/aegis-orders/:id/paypal/create-order', () => {
    it('creates a PayPal order for the licence price and stores its ID', async () => {
      const response = await request(app)
        .post(`/api/aegis-orders/${paidOrder._id}/paypal/create-order`);

      expect(response.status).toBe(200);
      expect(response.body.data.paypalOrderId).toBe('mock-paypal-order-id');

      const saved = await AegisOrder.findById(paidOrder._id);
      expect(saved.paymentDetails.paypalOrderId).toBe('mock-paypal-order-id');
      expect(saved.paymentStatus).toBe('Pending');
    });

    it('rejects creating a payment for an already-paid order', async () => {
      await AegisOrder.findByIdAndUpdate(paidOrder._id, { paymentStatus: 'Completed' });

      const response = await request(app)
        .post(`/api/aegis-orders/${paidOrder._id}/paypal/create-order`);

      expect(response.status).toBe(400);
    });

    it('404s for an unknown order', async () => {
      const response = await request(app)
        .post('/api/aegis-orders/507f1f77bcf86cd7994d9999/paypal/create-order');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/aegis-orders/:id/paypal/capture', () => {
    it('captures and marks the order Paid', async () => {
      await request(app).post(`/api/aegis-orders/${paidOrder._id}/paypal/create-order`);

      const response = await request(app)
        .post(`/api/aegis-orders/${paidOrder._id}/paypal/capture`)
        .send({ paypalOrderId: 'mock-paypal-order-id', payerId: 'mock-payer' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('captured');

      const saved = await AegisOrder.findById(paidOrder._id);
      expect(saved.paymentStatus).toBe('Completed');
      expect(saved.orderStatus).toBe('Paid');
      expect(saved.paymentDetails.paypalTransactionId).toBe('mock-capture-id');
      expect(saved.paymentDetails.paypalPayerId).toBe('mock-payer');

      // Automated delivery: token minted, link returned, email carries it
      expect(saved.downloadToken).toMatch(/^[A-Za-z0-9_-]{16,}$/);
      expect(response.body.data.downloadUrl).toBe(`https://api.test.example/api/aegis-orders/download/${saved.downloadToken}`);
      expect(emailService.sendAegisOrderConfirmationEmail).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ downloadUrl: expect.stringContaining(`/api/aegis-orders/download/${saved.downloadToken}`) })
      );
    });

    it('is idempotent — re-capturing a paid order returns already_paid', async () => {
      await request(app).post(`/api/aegis-orders/${paidOrder._id}/paypal/create-order`);
      await request(app)
        .post(`/api/aegis-orders/${paidOrder._id}/paypal/capture`)
        .send({ paypalOrderId: 'mock-paypal-order-id' });

      const again = await request(app)
        .post(`/api/aegis-orders/${paidOrder._id}/paypal/capture`)
        .send({ paypalOrderId: 'mock-paypal-order-id' });

      expect(again.status).toBe(200);
      expect(again.body.data.status).toBe('already_paid');
    });

    it('rejects a mismatched PayPal order id', async () => {
      await request(app).post(`/api/aegis-orders/${paidOrder._id}/paypal/create-order`);

      const response = await request(app)
        .post(`/api/aegis-orders/${paidOrder._id}/paypal/capture`)
        .send({ paypalOrderId: 'some-other-order' });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/restart the payment/i);
    });
  });

  describe('POST /api/aegis-orders/paypal-webhook', () => {
    const captureEvent = (customId, captureId = 'CAP-123') => ({
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: {
        id: captureId,
        custom_id: customId,
        amount: { value: '99.00' },
        payer: { email_address: 'payer@example.com' },
        supplementary_data: { related_ids: { order_id: 'PP-ORDER-1' } }
      }
    });

    it('rejects an unverified signature (fails closed)', async () => {
      vi.mocked(verifyPayPalWebhookSignature).mockResolvedValueOnce({ verified: false, reason: 'bad signature' });

      const response = await request(app)
        .post('/api/aegis-orders/paypal-webhook')
        .send(captureEvent(String(paidOrder._id)));

      expect(response.status).toBe(401);
    });

    it('marks the order Paid on CAPTURE.COMPLETED', async () => {
      const response = await request(app)
        .post('/api/aegis-orders/paypal-webhook')
        .send(captureEvent(String(paidOrder._id)));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: true });

      const saved = await AegisOrder.findById(paidOrder._id);
      expect(saved.paymentStatus).toBe('Completed');
      expect(saved.orderStatus).toBe('Paid');
      expect(saved.paymentDetails.paypalTransactionId).toBe('CAP-123');
      // Automated delivery minted on the webhook path too
      expect(saved.downloadToken).toMatch(/^[A-Za-z0-9_-]{16,}$/);
    });

    it('ignores foreign custom_ids (store checkout JSON refs, flash ObjectIds)', async () => {
      const response = await request(app)
        .post('/api/aegis-orders/paypal-webhook')
        .send(captureEvent('{"c":"cart","s":"ship"}'));

      expect(response.status).toBe(200);

      const saved = await AegisOrder.findById(paidOrder._id);
      expect(saved.paymentStatus).toBe('Unpaid'); // untouched
    });

    it('skips webhook replays of the same capture (single status entry)', async () => {
      const event = captureEvent(String(paidOrder._id), 'CAP-REPLAY');
      await request(app).post('/api/aegis-orders/paypal-webhook').send(event);
      await request(app).post('/api/aegis-orders/paypal-webhook').send(event);

      const saved = await AegisOrder.findById(paidOrder._id);
      const paidEntries = saved.statusHistory.filter((h) => h.status === 'Paid');
      expect(paidEntries).toHaveLength(1);
    });

    it('never resurrects a refunded order', async () => {
      await AegisOrder.findByIdAndUpdate(paidOrder._id, {
        paymentStatus: 'Refunded',
        orderStatus: 'Refunded'
      });

      await request(app)
        .post('/api/aegis-orders/paypal-webhook')
        .send(captureEvent(String(paidOrder._id)));

      const saved = await AegisOrder.findById(paidOrder._id);
      expect(saved.paymentStatus).toBe('Refunded');
    });
  });

  describe('GET /api/aegis-orders/download/:token (automated delivery)', () => {
    const paidOrderWithToken = async (overrides = {}) => {
      const order = await AegisOrder.create({
        customerEmail: 'kit@example.com',
        pixelModel: '7 Pro',
        amountGbp: 99.00,
        orderStatus: 'Paid',
        paymentStatus: 'Completed',
        downloadToken: 'valid-download-token-0123456789abcdef',
        ...overrides
      });
      return order;
    };

    it('streams the installer kit and counts the download', async () => {
      await paidOrderWithToken();

      // superagent has no binary parser by default — collect the bytes raw
      const binaryParser = (res, callback) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      };

      const response = await request(app)
        .get('/api/aegis-orders/download/valid-download-token-0123456789abcdef')
        .parse(binaryParser);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/zip');
      expect(response.headers['content-length']).toBe(String(KIT_BYTES.length));
      expect(response.headers['content-disposition']).toMatch(/attachment; filename=".*\.zip"/);
      expect(response.body.equals(KIT_BYTES)).toBe(true);

      const saved = await AegisOrder.findOne({ downloadToken: 'valid-download-token-0123456789abcdef' });
      expect(saved.downloadCount).toBe(1);
      expect(saved.lastDownloadedAt).toBeTruthy();
    });

    it('404s an unknown token without leaking whether it ever existed', async () => {
      const response = await request(app).get('/api/aegis-orders/download/no-such-token-0123456789abcdef');

      expect(response.status).toBe(404);
      expect(response.body.error).toMatch(/not found/i);
    });

    it('400s a malformed token', async () => {
      const short = await request(app).get('/api/aegis-orders/download/short');
      expect(short.status).toBe(400);

      const badChars = await request(app).get('/api/aegis-orders/download/bad%20token%20with%20spaces%20here');
      expect(badChars.status).toBe(400);
    });

    it('403s an unpaid order (payment never completed)', async () => {
      await paidOrderWithToken({ paymentStatus: 'Unpaid', orderStatus: 'Awaiting_Payment' });

      const response = await request(app).get('/api/aegis-orders/download/valid-download-token-0123456789abcdef');

      expect(response.status).toBe(403);
    });

    it('403s a refunded order — the link dies with the licence', async () => {
      await paidOrderWithToken({ paymentStatus: 'Refunded', orderStatus: 'Refunded' });

      const response = await request(app).get('/api/aegis-orders/download/valid-download-token-0123456789abcdef');

      expect(response.status).toBe(403);
      expect(response.body.error).toMatch(/no longer active/i);
    });

    it('503s with a clear error when the kit file is missing', async () => {
      await paidOrderWithToken();
      const original = process.env.AEGIS_KIT_PATH;
      process.env.AEGIS_KIT_PATH = path.join(os.tmpdir(), 'aegis-kit-that-does-not-exist.zip');

      try {
        const response = await request(app).get('/api/aegis-orders/download/valid-download-token-0123456789abcdef');

        expect(response.status).toBe(503);
        expect(response.body.error).toMatch(/temporarily unavailable/i);
      } finally {
        process.env.AEGIS_KIT_PATH = original;
      }
    });
  });
});
