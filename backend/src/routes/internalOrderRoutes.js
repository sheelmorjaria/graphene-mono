import express from 'express';
import { updateOrderStatus, getOrderDetails, getAllOrders } from '../controllers/internalOrderController.js';

const router = express.Router();

// Middleware to secure internal endpoints
const internalAuthMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.INTERNAL_API_KEY;

  // Check if API key is provided and matches
  if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or missing API key'
    });
  }

  // Optional: Check IP whitelist
  const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  const allowedIPs = process.env.INTERNAL_ALLOWED_IPS ? process.env.INTERNAL_ALLOWED_IPS.split(',') : [];
  
  if (allowedIPs.length > 0 && !allowedIPs.includes(clientIp)) {
    console.warn(`Unauthorized internal API access attempt from IP: ${clientIp}`);
    return res.status(403).json({
      success: false,
      error: 'Forbidden: IP not allowed'
    });
  }

  next();
};

// Apply internal auth middleware to all routes
router.use(internalAuthMiddleware);

// Update order status
router.put('/orders/:orderId/status', updateOrderStatus);

// Get order details for internal use
router.get('/orders/:orderId', getOrderDetails);

// Get all orders with filtering (Admin dashboard)
router.get('/orders', getAllOrders);

export default router;