import '../../test/setup.js';
import request from 'supertest';
import express from 'express';
import flashOrderRoutes from '../../routes/flash-orders.js';
import FlashOrder from '../../models/FlashOrder.js';


// The flash flow created orders that could never be paid: the success page
// says "complete your payment" but no payment step existed. These tests pin
// the missing server-side PayPal step: create-order, capture, unlock
// instructions — mirroring the proven checkout flow.

let app;
let testOrder;

const seedOrder = async (overrides = {}) => {
  return FlashOrder.create({
    customerEmail: 'flash@example.com',
    pixelModel: 'Pixel 8 Pro',
    shippingRegion: 'uk',
    returnAddress: {
      fullName: 'Test User',
      addressLine1: '1 Main St',
      city: 'London',
      stateProvince: 'England',
      postalCode: 'E1 6AN',
      country: 'GB',
      phoneNumber: '+44 20 7946 0958'
    },
    factoryResetConfirmed: true,
    ...overrides
  });
};

beforeAll(async () => {
  app = express();
  app.use(express.json());
  app.use('/api/flash-orders', flashOrderRoutes);
});

beforeEach(async () => {
  process.env.PAYPAL_CLIENT_ID = 'test-client-id';
  process.env.PAYPAL_CLIENT_SECRET = 'test-client-secret';
  process.env.PAYPAL_ENVIRONMENT = 'sandbox';
  testOrder = await seedOrder();
});

describe('Flash order PayPal payment flow', () => {
  describe('GET /api/flash-orders/:id/summary', () => {
    it('returns order number, total and payment status', async () => {
      const response = await request(app).get(`/api/flash-orders/${testOrder._id}/summary`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.orderNumber).toBe(testOrder.orderNumber);
      expect(response.body.data.totalPrice).toBeDefined();
      expect(response.body.data.paymentStatus).toBe('Unpaid');
      // Never leaks the PO Box (instructions-only field)
      expect(JSON.stringify(response.body)).not.toContain('PO Box');
    });

    it('404s for an unknown order', async () => {
      const response = await request(app).get('/api/flash-orders/507f1f77bcf86cd7994d9999/summary');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/flash-orders/:id/paypal/create-order', () => {
    it('creates a PayPal order for the flash total and stores its ID', async () => {
      const response = await request(app).post(`/api/flash-orders/${testOrder._id}/paypal/create-order`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.paypalOrderId).toBe('mock-paypal-order-id');

      const saved = await FlashOrder.findById(testOrder._id);
      expect(saved.paymentDetails.paypalOrderId).toBe('mock-paypal-order-id');
      expect(saved.paymentStatus).toBe('Pending');
    });

    it('rejects creating a payment for an already-paid order', async () => {
      await FlashOrder.findByIdAndUpdate(testOrder._id, { paymentStatus: 'Completed' });

      const response = await request(app).post(`/api/flash-orders/${testOrder._id}/paypal/create-order`);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/flash-orders/:id/paypal/capture', () => {
    it('captures, marks the order paid and unlocks shipping instructions', async () => {
      await request(app).post(`/api/flash-orders/${testOrder._id}/paypal/create-order`);

      const response = await request(app)
        .post(`/api/flash-orders/${testOrder._id}/paypal/capture`)
        .send({ paypalOrderId: 'mock-paypal-order-id' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const saved = await FlashOrder.findById(testOrder._id);
      expect(saved.paymentStatus).toBe('Completed');
      expect(saved.orderStatus).toBe('Paid');
      expect(saved.paymentDetails.paypalTransactionId).toBe('mock-capture-id');

      // The whole point: instructions are now accessible
      const instructions = await request(app).get(`/api/flash-orders/${testOrder._id}/instructions`);
      expect(instructions.status).toBe(200);
      expect(instructions.body.data.paymentStatus).toBe('Completed');
    });

    it('is idempotent for an already-captured order', async () => {
      await FlashOrder.findByIdAndUpdate(testOrder._id, {
        paymentStatus: 'Completed',
        'paymentDetails.paypalOrderId': 'mock-paypal-order-id'
      });

      const response = await request(app)
        .post(`/api/flash-orders/${testOrder._id}/paypal/capture`)
        .send({ paypalOrderId: 'mock-paypal-order-id' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('already_paid');
    });

    it('rejects a paypalOrderId that does not match the stored one', async () => {
      await request(app).post(`/api/flash-orders/${testOrder._id}/paypal/create-order`);

      const response = await request(app)
        .post(`/api/flash-orders/${testOrder._id}/paypal/capture`)
        .send({ paypalOrderId: 'SOME-OTHER-ORDER' });

      expect(response.status).toBe(400);
    });
  });
});
