import express from 'express';
import { 
  getPaymentMethods,
  createPayPalOrder,
  capturePayPalPayment,
  handlePayPalWebhook,
  initializeBitcoinPayment,
  getBitcoinPaymentStatus,
  handleBlockonomicsWebhook
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

// Bitcoin payment routes
// Initialize Bitcoin payment (requires authentication or valid session)
router.post('/bitcoin/initialize', optionalAuth, initializeBitcoinPayment);

// Get Bitcoin payment status (requires authentication or valid session)
router.get('/bitcoin/status/:orderId', optionalAuth, getBitcoinPaymentStatus);

// Blockonomics webhook (public endpoint for Bitcoin payment notifications)
router.post('/bitcoin/webhook', handleBlockonomicsWebhook);

export default router;