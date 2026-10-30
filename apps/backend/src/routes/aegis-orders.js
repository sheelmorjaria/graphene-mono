import express from 'express';
import {
  getAegisModels,
  createAegisOrder,
  handleAegisOrderWebhook,
  getAegisOrderSummary,
  createAegisOrderPayPalOrder,
  captureAegisOrderPayPalOrder,
  downloadAegisKit
} from '../controllers/aegisOrderController.js';

const router = express.Router();

/**
 * Aegis Order Routes
 * These endpoints handle the Aegis Hardening Suite licence purchases
 * (£99 one-off, digital delivery — no account required)
 */

// Catalog-driven device list for the purchase dropdown (public)
router.get('/models', getAegisModels);

// Create a new Aegis Order (public)
router.post('/', createAegisOrder);

// PayPal webhook for Aegis Orders (public endpoint for PayPal callbacks)
router.post('/paypal-webhook', handleAegisOrderWebhook);

// Order summary for the payment step (public by unguessable id)
router.get('/:id/summary', getAegisOrderSummary);

// Server-side PayPal payment for Aegis orders (public by unguessable id)
router.post('/:id/paypal/create-order', createAegisOrderPayPalOrder);
router.post('/:id/paypal/capture', captureAegisOrderPayPalOrder);

// Automated kit delivery (public by unguessable per-order token)
router.get('/download/:token', downloadAegisKit);

export default router;
