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

// This router is mounted at '/api/internal/orders' (see app.js), so the route
// paths below must NOT repeat the '/orders' segment — otherwise the mounted
// path is doubled (e.g. '/api/internal/orders/orders/:orderId/status').
router.put('/:orderId/status', updateOrderStatus);

// Get order details for internal use
router.get('/:orderId', getOrderDetails);

// Get all orders with filtering (Admin dashboard)
router.get('/', getAllOrders);

export default router;