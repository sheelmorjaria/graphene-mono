import express from 'express';
import { 
  createPaymentIntent, 
  getPaymentIntent,
  getPaymentMethods
} from '../controllers/paymentController.js';
import { optionalAuth, authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get available payment methods (public)
router.get('/methods', getPaymentMethods);

// Create payment intent (requires authentication or valid session)
router.post('/create-intent', optionalAuth, createPaymentIntent);

// Get payment intent details (requires authentication or valid session)
router.get('/intent/:paymentIntentId', optionalAuth, getPaymentIntent);

// Note: Stripe webhook is handled directly in server.js before JSON middleware
// to ensure raw body access for signature verification

export default router;