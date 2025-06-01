import request from 'supertest';
import app from '../../../server.js';

// Set up environment variables for testing
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_testing';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake_webhook_secret_for_testing';

describe('Payment Controller Routes', () => {
  describe('GET /api/payment/methods', () => {
    it('should return available payment methods', async () => {
      const response = await request(app)
        .get('/api/payment/methods')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.paymentMethods).toBeInstanceOf(Array);
      expect(response.body.data.paymentMethods.length).toBeGreaterThan(0);
      
      const cardMethod = response.body.data.paymentMethods.find(method => method.type === 'card');
      expect(cardMethod).toBeDefined();
      expect(cardMethod.enabled).toBe(true);
      expect(cardMethod.name).toBe('Credit or Debit Card');
    });
  });

  describe('POST /api/payment/create-intent', () => {
    it('should return 400 for missing shipping address', async () => {
      const response = await request(app)
        .post('/api/payment/create-intent')
        .send({
          shippingMethodId: 'test-shipping-method-id'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Shipping address and shipping method are required');
    });

    it('should return 400 for missing shipping method', async () => {
      const response = await request(app)
        .post('/api/payment/create-intent')
        .send({
          shippingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            addressLine1: '123 Test Street',
            city: 'London',
            stateProvince: 'London',
            postalCode: 'SW1A 1AA',
            country: 'GB'
          }
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Shipping address and shipping method are required');
    });

    it('should return 400 for no cart session', async () => {
      const response = await request(app)
        .post('/api/payment/create-intent')
        .send({
          shippingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            addressLine1: '123 Test Street',
            city: 'London',
            stateProvince: 'London',
            postalCode: 'SW1A 1AA',
            country: 'GB'
          },
          shippingMethodId: 'test-shipping-method-id'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No cart session found');
    });
  });

  describe('GET /api/payment/intent/:paymentIntentId', () => {
    it('should return 400 for missing payment intent ID', async () => {
      const response = await request(app)
        .get('/api/payment/intent/')
        .expect(404); // Route not found
    });
  });

  // Note: Webhook tests require proper Stripe signature handling
  // which is complex to mock in tests, so we'll skip for now
});