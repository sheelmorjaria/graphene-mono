import express from 'express';
import { 
  getPaymentMethods,
  createPayPalOrder,
  capturePayPalPayment,
  handlePayPalWebhook
} from '../controllers/paymentController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get available payment methods (public)
router.get('/methods', getPaymentMethods);

// PayPal payment routes
// Create PayPal order (requires authentication or valid session)
router.post('/paypal/create-order', optionalAuth, createPayPalOrder);

// Capture PayPal payment (requires authentication or valid session)
router.post('/paypal/capture', optionalAuth, capturePayPalPayment);

// PayPal webhook (public endpoint for PayPal callbacks)
router.post('/paypal/webhook', handlePayPalWebhook);

export default router;