import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import supportRoutes from '../../routes/support.js';
import Order from '../../models/Order.js';
import User from '../../models/User.js';

// The support router disables its rate limiter when NODE_ENV === 'test', which
// the integration harness sets. emailService is mocked globally by the harness,
// so sendSupportRequestEmail / sendContactAcknowledgmentEmail resolve cleanly.
const app = express();
app.use(express.json());
app.use('/api/support', supportRoutes);

const validPayload = (overrides = {}) => ({
  fullName: 'Alice Example',
  email: 'alice@example.com',
  subject: 'order-inquiry',
  message: 'Hello, I have a question about my recent order.',
  ...overrides
});

// Build a minimal valid Order to exercise the orderNumber validation path.
// The Order schema requires userId, customerEmail, item productName/productSlug,
// and shippingMethod.id + name + cost.
const createOrder = async (overrides = {}) => {
  const user = await User.create({
    firstName: 'Order',
    lastName: 'Customer',
    email: `order-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`,
    password: 'password123'
  });

  return Order.create({
    userId: user._id,
    customerEmail: 'alice@example.com',
    status: 'pending',
    paymentStatus: 'pending',
    refundStatus: 'none',
    items: [
      {
        productId: new mongoose.Types.ObjectId(),
        productName: 'Test Product',
        productSlug: 'test-product',
        quantity: 1,
        unitPrice: 100,
        totalPrice: 100
      }
    ],
    subtotal: 100,
    tax: 0,
    shipping: 0,
    totalAmount: 100,
    shippingAddress: {
      fullName: 'Alice Example',
      addressLine1: '1 Test St',
      city: 'London',
      stateProvince: 'London',
      postalCode: 'SW1 1AA',
      country: 'GB'
    },
    billingAddress: {
      fullName: 'Alice Example',
      addressLine1: '1 Test St',
      city: 'London',
      stateProvince: 'London',
      postalCode: 'SW1 1AA',
      country: 'GB'
    },
    shippingMethod: {
      id: new mongoose.Types.ObjectId(),
      name: 'Standard',
      cost: 0
    },
    paymentMethod: { type: 'paypal', name: 'PayPal' },
    ...overrides
  });
};

describe('Support Controller - Integration Tests', () => {
  beforeEach(async () => {
    // Harness wipes collections, but ensure NODE_ENV stays 'test' so the
    // contact-form rate limiter remains disabled across every test.
    process.env.NODE_ENV = 'test';
  });

  describe('POST /api/support/contact - validation', () => {
    it('returns 400 when fullName is missing', async () => {
      const response = await request(app)
        .post('/api/support/contact')
        .send(validPayload({ fullName: '   ' }))
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/validation failed/i);
      expect(response.body.errors).toEqual(expect.arrayContaining(['Full name is required']));
    });

    it('returns 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/support/contact')
        .send(validPayload({ email: '' }))
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining(['Email is required'])
      );
    });

    it('returns 400 for an invalid email format', async () => {
      const response = await request(app)
        .post('/api/support/contact')
        .send(validPayload({ email: 'not-an-email' }))
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining(['Please enter a valid email address'])
      );
    });

    it('returns 400 when subject is missing', async () => {
      const response = await request(app)
        .post('/api/support/contact')
        .send(validPayload({ subject: '' }))
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(expect.arrayContaining(['Subject is required']));
    });

    it('returns 400 for an unsupported subject value', async () => {
      const response = await request(app)
        .post('/api/support/contact')
        .send(validPayload({ subject: 'not-a-real-subject' }))
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(
        expect.arrayContaining(['Please select a valid subject'])
      );
    });

    it('returns 400 when message is missing', async () => {
      const response = await request(app)
        .post('/api/support/contact')
        .send(validPayload({ message: '' }))
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toEqual(expect.arrayContaining(['Message is required']));
    });

    it('aggregates multiple validation errors at once', async () => {
      const response = await request(app)
        .post('/api/support/contact')
        .send({ fullName: '', email: 'bad', subject: 'wrong', message: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('POST /api/support/contact - success', () => {
    it('accepts a valid contact form submission and returns a success response', async () => {
      const response = await request(app)
        .post('/api/support/contact')
        .send(validPayload())
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/sent successfully/i);
      expect(response.body.submittedAt).toBeTruthy();
    });

    it('accepts all valid subject options', async () => {
      const subjects = ['order-inquiry', 'product-question', 'technical-issue', 'other'];

      for (const subject of subjects) {
        const response = await request(app)
          .post('/api/support/contact')
          .send(validPayload({ subject }))
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    it('succeeds when an orderNumber matches an existing order', async () => {
      const order = await createOrder();

      const response = await request(app)
        .post('/api/support/contact')
        .send(validPayload({ orderNumber: order.orderNumber }))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/sent successfully/i);
    });

    it('still succeeds when an orderNumber does not match any order (order validation is non-fatal)', async () => {
      const response = await request(app)
        .post('/api/support/contact')
        .send(validPayload({ orderNumber: 'ORD-DOES-NOT-EXIST-9999' }))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('succeeds without an orderNumber (optional field)', async () => {
      const payload = validPayload();
      delete payload.orderNumber;

      const response = await request(app)
        .post('/api/support/contact')
        .send(payload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
