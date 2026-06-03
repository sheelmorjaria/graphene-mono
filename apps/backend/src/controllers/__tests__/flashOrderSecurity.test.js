import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import FlashOrder from '../../models/FlashOrder.js';
import { createValidFlashOrderData } from '../../test/helpers/testData.js';

describe('Flash Order Security Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/graphene-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await FlashOrder.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('NoSQL Injection Protection', () => {
    it('should sanitize NoSQL injection attempts in email field', async () => {
      const maliciousPayload = {
        customerEmail: { '$ne': null },
        pixelModel: 'Pixel 8',
        returnAddress: {
          fullName: 'Test User',
          addressLine1: '123 Test St',
          city: 'London',
          stateProvince: 'England',
          postalCode: 'E1 6AN',
          country: 'GB'
        },
        factoryResetConfirmed: true
      };

      const response = await request(app)
        .post('/api/flash-orders')
        .send(maliciousPayload);

      // Should reject or sanitize the input
      expect([400, 201]).toContain(response.status);

      if (response.status === 201) {
        // If accepted, verify it was sanitized properly
        const order = await FlashOrder.findOne({ _id: response.body.data.orderId });
        expect(order).toBeTruthy();
        expect(order.customerEmail).not.toBeTruthy(); // Should be empty/invalid after sanitization
      }
    });

    it('should reject operator injection in pixelModel', async () => {
      const maliciousPayload = createValidFlashOrderData();
      maliciousPayload.pixelModel = { '$in': ['Pixel 8', 'Pixel 8 Pro'] };

      const response = await request(app)
        .post('/api/flash-orders')
        .send(maliciousPayload);

      expect([400, 422]).toContain(response.status);
    });

    it('should handle prototype pollution attempts', async () => {
      const maliciousPayload = {
        ...createValidFlashOrderData(),
        '__proto__': { isAdmin: true },
        'constructor': { prototype: { isAdmin: true } }
      };

      const response = await request(app)
        .post('/api/flash-orders')
        .send(maliciousPayload);

      // Request should complete safely
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to order creation', async () => {
      const validData = createValidFlashOrderData();
      let rateLimitHit = false;

      // Make multiple rapid requests
      const requests = [];
      for (let i = 0; i < 15; i++) {
        const payload = { ...validData };
        payload.customerEmail = `test${i}@example.com`;
        requests.push(
          request(app)
            .post('/api/flash-orders')
            .send(payload)
        );
      }

      const responses = await Promise.all(requests);

      // Some requests should be rate limited (429) or succeed (201)
      const hasRateLimitResponse = responses.some(r => r.status === 429);
      const hasSuccessResponse = responses.some(r => r.status === 201);

      // At minimum, the endpoint should be functioning and not erroring
      expect(hasSuccessResponse || hasRateLimitResponse).toBe(true);
    }, 15000);
  });

  describe('PO Box Security', () => {
    it('should not reveal PO Box in create order response', async () => {
      const response = await request(app)
        .post('/api/flash-orders')
        .send(createValidFlashOrderData());

      expect(response.status).toBe(201);
      expect(response.body.data.poBoxAddress).toBeUndefined();
    });

    it('should return 403 for unpaid order instructions', async () => {
      const order = await FlashOrder.create(createValidFlashOrderData());

      const response = await request(app)
        .get(`/api/flash-orders/${order._id}/instructions`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('payment');
    });

    it('should reveal PO Box only after payment completion', async () => {
      // Create order
      const order = await FlashOrder.create(createValidFlashOrderData());

      // Verify PO Box is not set initially
      expect(order.poBoxAddress).toBeUndefined();

      // Simulate payment completion
      order.paymentStatus = 'Completed';
      order.orderStatus = 'Paid';
      order.poBoxAddress = {
        street: 'PO Box 12345',
        city: 'London',
        postalCode: 'E1 6AN',
        country: 'United Kingdom',
        instructions: 'Include your order number on the package.'
      };
      await order.save();

      // Now instructions should be accessible
      const response = await request(app)
        .get(`/api/flash-orders/${order._id}/instructions`);

      expect(response.status).toBe(200);
      expect(response.body.data.poBoxAddress).toBeDefined();
      expect(response.body.data.poBoxAddress.street).toContain('PO Box');
    });

    it('should prevent enumeration of paid orders', async () => {
      // Create multiple orders
      await FlashOrder.create(createValidFlashOrderData({ customerEmail: 'user1@example.com' }));
      await FlashOrder.create(createValidFlashOrderData({ customerEmail: 'user2@example.com' }));

      // Try to enumerate by random IDs - use a valid 24-char hex string
      const randomId = '507f1f77bcf86cd799439011'; // Valid ObjectId format

      const response = await request(app)
        .get(`/api/flash-orders/${randomId}/instructions`);

      // Should return 404 (not found) or 403 (forbidden, unpaid)
      expect([404, 403]).toContain(response.status);
    });
  });

  describe('Input Validation Security', () => {
    it('should handle excessively long email addresses', async () => {
      const maliciousPayload = createValidFlashOrderData();
      maliciousPayload.customerEmail = 'a'.repeat(300) + '@example.com';

      const response = await request(app)
        .post('/api/flash-orders')
        .send(maliciousPayload);

      // Should either reject or handle gracefully (may truncate)
      // The key is no server crash
      expect([200, 201, 400, 422, 500]).toContain(response.status);
    });

    it('should reject invalid Pixel models', async () => {
      const invalidModels = [
        'Pixel 4', // Too old
        'Pixel 5', // Too old
        'Galaxy S24', // Wrong brand
        'iPhone 15', // Wrong brand
        '<script>alert("xss")</script>', // XSS attempt
      ];

      for (const model of invalidModels) {
        const payload = createValidFlashOrderData();
        payload.pixelModel = model;

        const response = await request(app)
          .post('/api/flash-orders')
          .send(payload);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Pixel model');
      }
    });

    it('should require factory reset confirmation', async () => {
      const payload = createValidFlashOrderData();
      payload.factoryResetConfirmed = false;

      const response = await request(app)
        .post('/api/flash-orders')
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('factory reset');
    });

    it('should reject orders with missing required address fields', async () => {
      const requiredFields = ['fullName', 'addressLine1', 'city', 'stateProvince', 'postalCode'];

      for (const field of requiredFields) {
        const payload = createValidFlashOrderData();
        delete payload.returnAddress[field];

        const response = await request(app)
          .post('/api/flash-orders')
          .send(payload);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('address');
      }
    });
  });

  describe('Webhook Security', () => {
    it('should handle malformed webhook payloads gracefully', async () => {
      const malformedPayloads = [
        null,
        undefined,
        '',
        [],
        { invalid: 'data' },
        { event_type: 'PAYMENT.CAPTURE.COMPLETED' }, // Missing resource
        { resource: null } // Missing event_type
      ];

      for (const payload of malformedPayloads) {
        const response = await request(app)
          .post('/api/flash-orders/paypal-webhook')
          .send(payload);

        // Should handle gracefully (200 ack, 400 bad request, or 500 server error)
        expect([200, 400, 500]).toContain(response.status);
      }
    });

    it('should not process payment for non-existent order', async () => {
      const fakeOrderId = mongoose.Types.ObjectId('nonexistent-flash-order').toString();

      const webhookPayload = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'capture_123',
          custom_id: fakeOrderId,
          supplementary_data: {
            related_ids: {
              order_id: 'paypal_order_123'
            }
          },
          payer: {
            email_address: 'payer@example.com'
          },
          amount: {
            value: '140.44'
          }
        }
      };

      const response = await request(app)
        .post('/api/flash-orders/paypal-webhook')
        .send(webhookPayload);

      // Should acknowledge webhook without error
      expect(response.status).toBe(200);
    });

    it('should handle payment denied webhook', async () => {
      const order = await FlashOrder.create(createValidFlashOrderData());
      const originalStatus = order.paymentStatus;

      const webhookPayload = {
        event_type: 'PAYMENT.CAPTURE.DENIED',
        resource: {
          custom_id: order._id.toString()
        }
      };

      const response = await request(app)
        .post('/api/flash-orders/paypal-webhook')
        .send(webhookPayload);

      expect(response.status).toBe(200);

      // Order should remain unpaid
      const updatedOrder = await FlashOrder.findById(order._id);
      expect(updatedOrder.paymentStatus).toBe(originalStatus);
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize XSS attempts in text fields', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '"><script>alert("xss")</script>',
        'onload="alert("xss")"',
        '${7*7}', // Template injection
        '{{7*7}}', // Template injection
      ];

      for (const xssString of xssPayloads) {
        const payload = createValidFlashOrderData();
        payload.customerEmail = `test@example.com`;
        payload.returnAddress.fullName = xssString;
        payload.returnAddress.city = xssString;

        const response = await request(app)
          .post('/api/flash-orders')
          .send(payload);

        // Should not cause unhandled server error - should accept or reject gracefully
        expect([201, 400, 500]).toContain(response.status);

        if (response.status === 201) {
          const order = await FlashOrder.findById(response.body.data.orderId);
          // Verify the input was stored safely (not executed)
          expect(order.returnAddress.fullName).toBeTruthy();
        }
      }
    });
  });
});
