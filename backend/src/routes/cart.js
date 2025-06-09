import express from 'express';
import { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart,
  applyPromotion,
  removePromotion
} from '../controllers/cartController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// All cart routes use optional authentication (works for both guests and authenticated users)
router.use(optionalAuth);

// Cart management routes
router.get('/', getCart);
router.post('/add', addToCart);
router.put('/item/:productId', updateCartItem);
router.delete('/item/:productId', removeFromCart);
router.delete('/clear', clearCart);

// Promotion routes
router.post('/apply-promotion', applyPromotion);
router.delete('/remove-promotion', removePromotion);

export default router;