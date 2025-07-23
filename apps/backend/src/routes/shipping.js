import express from 'express';
import { 
  calculateShippingRates, 
  getShippingMethods, 
  validateShippingMethod 
} from '../controllers/shippingController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// All shipping routes can work with or without authentication
router.use(optionalAuth);

// Calculate shipping rates for cart and address
router.post('/calculate-rates', calculateShippingRates);

// Get all available shipping methods
router.get('/methods', getShippingMethods);

// Validate a specific shipping method for cart
router.post('/validate-method', validateShippingMethod);

export default router;