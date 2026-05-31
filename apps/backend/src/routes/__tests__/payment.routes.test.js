import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock the payment controller - use factory function to avoid hoisting issues
vi.mock('../../controllers/paymentController.js', () => ({
  getPaymentMethods: vi.fn(),
  createPayPalOrder: vi.fn(),
  capturePayPalPayment: vi.fn(),
  handlePayPalWebhook: vi.fn()
}));

// Mock auth middleware
vi.mock('../../middleware/auth.js', () => ({
  optionalAuth: vi.fn((req, res, next) => {
    req.user = { userId: 'test-user-123' };
    next();
  })
}));

import paymentRoutes from '../payment.js';
import * as paymentController from '../../controllers/paymentController.js';
import { optionalAuth } from '../../middleware/auth.js';

describe('Payment Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/payment', paymentRoutes);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/payment/methods', () => {
    it('should get payment methods without authentication', async () => {
      const mockMethods = [
        { id: 'paypal', name: 'PayPal', enabled: true }
      ];

      paymentController.getPaymentMethods.mockImplementation((req, res) => {
        res.json({ success: true, methods: mockMethods });
      });

      const response = await request(app)
        .get('/api/payment/methods')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.methods).toEqual(mockMethods);
      expect(paymentController.getPaymentMethods).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when getting payment methods', async () => {
      paymentController.getPaymentMethods.mockImplementation((req, res) => {
        res.status(500).json({ success: false, error: 'Internal server error' });
      });

      const response = await request(app)
        .get('/api/payment/methods')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('PayPal Routes', () => {
    describe('POST /api/payment/paypal/create-order', () => {
      it('should create PayPal order with authentication', async () => {
        const orderData = {
          amount: 599.99,
          currency: 'GBP',
          orderId: 'ORDER-123'
        };

        const mockPayPalOrder = {
          id: 'PAYPAL-ORDER-456',
          status: 'CREATED',
          links: [{
            href: 'https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL-ORDER-456',
            rel: 'approve',
            method: 'GET'
          }]
        };

        paymentController.createPayPalOrder.mockImplementation((req, res) => {
          expect(req.user.userId).toBe('test-user-123');
          res.json({ success: true, order: mockPayPalOrder });
        });

        const response = await request(app)
          .post('/api/payment/paypal/create-order')
          .send(orderData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.order).toEqual(mockPayPalOrder);
        expect(optionalAuth).toHaveBeenCalled();
        expect(paymentController.createPayPalOrder).toHaveBeenCalledTimes(1);
      });

      it('should handle PayPal order creation errors', async () => {
        paymentController.createPayPalOrder.mockImplementation((req, res) => {
          res.status(400).json({ success: false, error: 'Invalid order data' });
        });

        const response = await request(app)
          .post('/api/payment/paypal/create-order')
          .send({ invalid: 'data' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid order data');
      });
    });

    describe('POST /api/payment/paypal/capture', () => {
      it('should capture PayPal payment with authentication', async () => {
        const captureData = {
          paypalOrderId: 'PAYPAL-ORDER-456'
        };

        const mockCaptureResult = {
          id: 'PAYPAL-ORDER-456',
          status: 'COMPLETED',
          purchase_units: [{
            payments: {
              captures: [{
                id: 'CAPTURE-789',
                status: 'COMPLETED',
                amount: { currency_code: 'GBP', value: '599.99' }
              }]
            }
          }]
        };

        paymentController.capturePayPalPayment.mockImplementation((req, res) => {
          expect(req.user.userId).toBe('test-user-123');
          res.json({ success: true, capture: mockCaptureResult });
        });

        const response = await request(app)
          .post('/api/payment/paypal/capture')
          .send(captureData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.capture).toEqual(mockCaptureResult);
        expect(optionalAuth).toHaveBeenCalled();
        expect(paymentController.capturePayPalPayment).toHaveBeenCalledTimes(1);
      });

      it('should handle PayPal capture errors', async () => {
        paymentController.capturePayPalPayment.mockImplementation((req, res) => {
          res.status(400).json({ success: false, error: 'Payment capture failed' });
        });

        const response = await request(app)
          .post('/api/payment/paypal/capture')
          .send({ paypalOrderId: 'INVALID-ORDER' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Payment capture failed');
      });
    });

    describe('POST /api/payment/paypal/webhook', () => {
      it('should handle PayPal webhook without authentication', async () => {
        const webhookData = {
          id: 'WH-EVENT-123',
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          resource: {
            id: 'CAPTURE-789',
            status: 'COMPLETED'
          }
        };

        paymentController.handlePayPalWebhook.mockImplementation((req, res) => {
          res.json({ success: true, processed: true });
        });

        const response = await request(app)
          .post('/api/payment/paypal/webhook')
          .send(webhookData)
          .set('PayPal-Transmission-Id', 'test-transmission-id')
          .set('PayPal-Auth-Algo', 'SHA256withRSA')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.processed).toBe(true);
        expect(paymentController.handlePayPalWebhook).toHaveBeenCalledTimes(1);
      });

      it('should handle invalid PayPal webhook', async () => {
        paymentController.handlePayPalWebhook.mockImplementation((req, res) => {
          res.status(400).json({ success: false, error: 'Invalid webhook signature' });
        });

        const response = await request(app)
          .post('/api/payment/paypal/webhook')
          .send({ invalid: 'webhook' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid webhook signature');
      });
    });
  });

  describe('Route Middleware Integration', () => {
    it('should apply optionalAuth middleware to protected routes', async () => {
      // Mock controller responses to prevent timeouts
      paymentController.createPayPalOrder.mockImplementation((req, res) => res.json({ success: true }));
      paymentController.capturePayPalPayment.mockImplementation((req, res) => res.json({ success: true }));

      await request(app)
        .post('/api/payment/paypal/create-order')
        .send({ amount: 100 });

      await request(app)
        .post('/api/payment/paypal/capture')
        .send({ paypalOrderId: 'test' });

      // Should have been called 2 times for protected routes
      expect(optionalAuth).toHaveBeenCalledTimes(2);
    });

    it('should not apply auth middleware to public routes', async () => {
      vi.clearAllMocks();

      // Mock controller responses to prevent timeouts
      paymentController.getPaymentMethods.mockImplementation((req, res) => res.json({ success: true }));
      paymentController.handlePayPalWebhook.mockImplementation((req, res) => res.json({ success: true }));

      await request(app)
        .get('/api/payment/methods');

      await request(app)
        .post('/api/payment/paypal/webhook')
        .send({});

      // Should not have been called for public routes
      expect(optionalAuth).not.toHaveBeenCalled();
    });
  });

  describe('Route Parameter Handling', () => {
    it('should handle URL parameters correctly for PayPal order', async () => {
      const orderId = 'ORDER-WITH-SPECIAL-CHARS-123';

      paymentController.createPayPalOrder.mockImplementation((req, res) => {
        expect(req.body.orderId).toBe(orderId);
        res.json({ success: true });
      });

      await request(app)
        .post('/api/payment/paypal/create-order')
        .send({ orderId })
        .expect(200);

      expect(paymentController.createPayPalOrder).toHaveBeenCalledTimes(1);
    });
  });
});
