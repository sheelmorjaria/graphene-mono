import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock the payment controller - use factory function to avoid hoisting issues
vi.mock('../../controllers/paymentController.js', () => ({
  getPaymentMethods: vi.fn(),
  createPayPalOrder: vi.fn(),
  capturePayPalPayment: vi.fn(),
  handlePayPalWebhook: vi.fn(),
  initializeBitcoinPayment: vi.fn(),
  getBitcoinPaymentStatus: vi.fn(),
  handleBlockonomicsWebhook: vi.fn(),
  createMoneroPayment: vi.fn(),
  checkMoneroPaymentStatus: vi.fn(),
  handleMoneroWebhook: vi.fn()
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
        { id: 'paypal', name: 'PayPal', enabled: true },
        { id: 'bitcoin', name: 'Bitcoin', enabled: true },
        { id: 'monero', name: 'Monero', enabled: true }
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

  describe('Bitcoin Routes', () => {
    describe('POST /api/payment/bitcoin/initialize', () => {
      it('should initialize Bitcoin payment with authentication', async () => {
        const bitcoinData = {
          orderId: 'ORDER-123',
          amount: 0.01234567
        };

        const mockBitcoinPayment = {
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          amount: 0.01234567,
          confirmationsRequired: 2,
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
        };

        paymentController.initializeBitcoinPayment.mockImplementation((req, res) => {
          expect(req.user.userId).toBe('test-user-123');
          res.json({ success: true, payment: mockBitcoinPayment });
        });

        const response = await request(app)
          .post('/api/payment/bitcoin/initialize')
          .send(bitcoinData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.payment).toEqual(mockBitcoinPayment);
        expect(optionalAuth).toHaveBeenCalled();
        expect(paymentController.initializeBitcoinPayment).toHaveBeenCalledTimes(1);
      });

      it('should handle Bitcoin initialization errors', async () => {
        paymentController.initializeBitcoinPayment.mockImplementation((req, res) => {
          res.status(500).json({ success: false, error: 'Bitcoin service unavailable' });
        });

        const response = await request(app)
          .post('/api/payment/bitcoin/initialize')
          .send({ orderId: 'ORDER-123' })
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Bitcoin service unavailable');
      });
    });

    describe('GET /api/payment/bitcoin/status/:orderId', () => {
      it('should get Bitcoin payment status with authentication', async () => {
        const orderId = 'ORDER-123';
        const mockStatus = {
          orderId,
          address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          status: 'confirmed',
          confirmations: 3,
          requiredConfirmations: 2
        };

        paymentController.getBitcoinPaymentStatus.mockImplementation((req, res) => {
          expect(req.user.userId).toBe('test-user-123');
          expect(req.params.orderId).toBe(orderId);
          res.json({ success: true, status: mockStatus });
        });

        const response = await request(app)
          .get(`/api/payment/bitcoin/status/${orderId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.status).toEqual(mockStatus);
        expect(optionalAuth).toHaveBeenCalled();
        expect(paymentController.getBitcoinPaymentStatus).toHaveBeenCalledTimes(1);
      });

      it('should handle Bitcoin status check errors', async () => {
        paymentController.getBitcoinPaymentStatus.mockImplementation((req, res) => {
          res.status(404).json({ success: false, error: 'Payment not found' });
        });

        const response = await request(app)
          .get('/api/payment/bitcoin/status/INVALID-ORDER')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Payment not found');
      });
    });

    describe('POST /api/payment/bitcoin/webhook', () => {
      it('should handle Blockonomics webhook without authentication', async () => {
        const webhookData = {
          txid: '1234567890abcdef',
          confirmations: 3,
          addr: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
        };

        paymentController.handleBlockonomicsWebhook.mockImplementation((req, res) => {
          res.json({ success: true, processed: true });
        });

        const response = await request(app)
          .post('/api/payment/bitcoin/webhook')
          .send(webhookData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.processed).toBe(true);
        expect(paymentController.handleBlockonomicsWebhook).toHaveBeenCalledTimes(1);
      });

      it('should handle invalid Bitcoin webhook', async () => {
        paymentController.handleBlockonomicsWebhook.mockImplementation((req, res) => {
          res.status(400).json({ success: false, error: 'Invalid webhook data' });
        });

        const response = await request(app)
          .post('/api/payment/bitcoin/webhook')
          .send({ invalid: 'data' })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid webhook data');
      });
    });
  });

  describe('Monero Routes', () => {
    describe('POST /api/payment/monero/create', () => {
      it('should create Monero payment with authentication', async () => {
        const moneroData = {
          orderId: 'ORDER-123',
          amount: 2.5
        };

        const mockMoneroPayment = {
          paymentId: 'MONERO-PAYMENT-456',
          address: '48daf1rG3hE1Txapcsxh6WXNe9MLNKtu7W7tKTivtSoVLHErYzvdcpea2nSTgGkz66RdYECMCGzAhd5Pvq7YGNX8',
          amount: 2.5,
          integratedAddress: '4L6Gcy9TAHqPVPMnqa5cPtJK25tr7Mayu7NTKrGT8JXKPJEbBW6XwvTZ3oPvL2',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
        };

        paymentController.createMoneroPayment.mockImplementation((req, res) => {
          expect(req.user.userId).toBe('test-user-123');
          res.json({ success: true, payment: mockMoneroPayment });
        });

        const response = await request(app)
          .post('/api/payment/monero/create')
          .send(moneroData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.payment).toEqual(mockMoneroPayment);
        expect(optionalAuth).toHaveBeenCalled();
        expect(paymentController.createMoneroPayment).toHaveBeenCalledTimes(1);
      });

      it('should handle Monero creation errors', async () => {
        paymentController.createMoneroPayment.mockImplementation((req, res) => {
          res.status(500).json({ success: false, error: 'Monero service unavailable' });
        });

        const response = await request(app)
          .post('/api/payment/monero/create')
          .send({ orderId: 'ORDER-123' })
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Monero service unavailable');
      });
    });

    describe('GET /api/payment/monero/status/:orderId', () => {
      it('should check Monero payment status with authentication', async () => {
        const orderId = 'ORDER-123';
        const mockStatus = {
          orderId,
          paymentId: 'MONERO-PAYMENT-456',
          status: 'confirmed',
          confirmations: 15,
          requiredConfirmations: 10
        };

        paymentController.checkMoneroPaymentStatus.mockImplementation((req, res) => {
          expect(req.user.userId).toBe('test-user-123');
          expect(req.params.orderId).toBe(orderId);
          res.json({ success: true, status: mockStatus });
        });

        const response = await request(app)
          .get(`/api/payment/monero/status/${orderId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.status).toEqual(mockStatus);
        expect(optionalAuth).toHaveBeenCalled();
        expect(paymentController.checkMoneroPaymentStatus).toHaveBeenCalledTimes(1);
      });

      it('should handle Monero status check errors', async () => {
        paymentController.checkMoneroPaymentStatus.mockImplementation((req, res) => {
          res.status(404).json({ success: false, error: 'Payment not found' });
        });

        const response = await request(app)
          .get('/api/payment/monero/status/INVALID-ORDER')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Payment not found');
      });
    });

    describe('POST /api/payment/monero/webhook', () => {
      it('should handle GloBee webhook without authentication', async () => {
        const webhookData = {
          id: 'GLOBEE-EVENT-123',
          payment_id: 'MONERO-PAYMENT-456',
          status: 'confirmed',
          confirmations: 12
        };

        paymentController.handleMoneroWebhook.mockImplementation((req, res) => {
          res.json({ success: true, processed: true });
        });

        const response = await request(app)
          .post('/api/payment/monero/webhook')
          .send(webhookData)
          .set('X-GloBee-Signature', 'test-signature')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.processed).toBe(true);
        expect(paymentController.handleMoneroWebhook).toHaveBeenCalledTimes(1);
      });

      it('should handle invalid Monero webhook', async () => {
        paymentController.handleMoneroWebhook.mockImplementation((req, res) => {
          res.status(400).json({ success: false, error: 'Invalid webhook signature' });
        });

        const response = await request(app)
          .post('/api/payment/monero/webhook')
          .send({ invalid: 'data' })
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
      paymentController.initializeBitcoinPayment.mockImplementation((req, res) => res.json({ success: true }));
      paymentController.getBitcoinPaymentStatus.mockImplementation((req, res) => res.json({ success: true }));
      paymentController.createMoneroPayment.mockImplementation((req, res) => res.json({ success: true }));
      paymentController.checkMoneroPaymentStatus.mockImplementation((req, res) => res.json({ success: true }));

      await request(app)
        .post('/api/payment/paypal/create-order')
        .send({ amount: 100 });

      await request(app)
        .post('/api/payment/paypal/capture')
        .send({ paypalOrderId: 'test' });

      await request(app)
        .post('/api/payment/bitcoin/initialize')
        .send({ orderId: 'test' });

      await request(app)
        .get('/api/payment/bitcoin/status/test');

      await request(app)
        .post('/api/payment/monero/create')
        .send({ orderId: 'test' });

      await request(app)
        .get('/api/payment/monero/status/test');

      // Should have been called 6 times for protected routes
      expect(optionalAuth).toHaveBeenCalledTimes(6);
    });

    it('should not apply auth middleware to public routes', async () => {
      vi.clearAllMocks();

      // Mock controller responses to prevent timeouts
      paymentController.getPaymentMethods.mockImplementation((req, res) => res.json({ success: true }));
      paymentController.handlePayPalWebhook.mockImplementation((req, res) => res.json({ success: true }));
      paymentController.handleBlockonomicsWebhook.mockImplementation((req, res) => res.json({ success: true }));
      paymentController.handleMoneroWebhook.mockImplementation((req, res) => res.json({ success: true }));

      await request(app)
        .get('/api/payment/methods');

      await request(app)
        .post('/api/payment/paypal/webhook')
        .send({});

      await request(app)
        .post('/api/payment/bitcoin/webhook')
        .send({});

      await request(app)
        .post('/api/payment/monero/webhook')
        .send({});

      // Should not have been called for public routes
      expect(optionalAuth).not.toHaveBeenCalled();
    });
  });

  describe('Route Parameter Handling', () => {
    it('should handle URL parameters correctly for Bitcoin status', async () => {
      const orderId = 'ORDER-WITH-SPECIAL-CHARS-123';
      
      paymentController.getBitcoinPaymentStatus.mockImplementation((req, res) => {
        expect(req.params.orderId).toBe(orderId);
        res.json({ success: true });
      });

      await request(app)
        .get(`/api/payment/bitcoin/status/${orderId}`)
        .expect(200);

      expect(paymentController.getBitcoinPaymentStatus).toHaveBeenCalledTimes(1);
    });

    it('should handle URL parameters correctly for Monero status', async () => {
      const orderId = 'ORDER-MONERO-456';
      
      paymentController.checkMoneroPaymentStatus.mockImplementation((req, res) => {
        expect(req.params.orderId).toBe(orderId);
        res.json({ success: true });
      });

      await request(app)
        .get(`/api/payment/monero/status/${orderId}`)
        .expect(200);

      expect(paymentController.checkMoneroPaymentStatus).toHaveBeenCalledTimes(1);
    });
  });
});