import express from 'express';
import {
  getAllFlashOrders,
  getFlashOrderById,
  updateFlashOrderStatus,
  getFlashOrderStats,
  refundFlashOrder
} from '../controllers/adminFlashOrderController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// SECURITY: this router is mounted at /api/admin/flash-orders OUTSIDE the
// main admin router, so it never inherited the app-level authenticate +
// requireRole guard — every route below was publicly reachable (customer
// PII in flash orders). Same middleware as routes/admin.js.
router.use(authenticate);
router.use(requireRole('admin'));

// Get all Flash Orders with filtering and pagination
// GET /api/admin/flash-orders
router.get('/', getAllFlashOrders);

// Get Flash Order statistics
// GET /api/admin/flash-orders/stats
router.get('/stats', getFlashOrderStats);

// Get Flash Order by ID
// GET /api/admin/flash-orders/:id
router.get('/:id', getFlashOrderById);

// Update Flash Order status
// PATCH /api/admin/flash-orders/:id/status
router.patch('/:id/status', updateFlashOrderStatus);

// Refund a Flash Order (tiered policy — blocked once flashing has begun)
// POST /api/admin/flash-orders/:id/refund
router.post('/:id/refund', refundFlashOrder);

export default router;
