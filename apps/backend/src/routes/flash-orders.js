import express from 'express';
import {
  createFlashOrder,
  handleFlashOrderWebhook,
  getFlashOrderInstructions
} from '../controllers/flashOrderController.js';

const router = express.Router();

/**
 * Flash Order Routes
 * These endpoints handle the mail-in GrapheneOS flashing service
 */

// Create a new Flash Order (public)
router.post('/', createFlashOrder);

// PayPal webhook for Flash Orders (public endpoint for PayPal callbacks)
router.post('/paypal-webhook', handleFlashOrderWebhook);

// Get shipping instructions with PO Box address (requires paid order)
router.get('/:id/instructions', getFlashOrderInstructions);

export default router;
