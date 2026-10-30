import express from 'express';
import {
  getAllAegisOrders,
  getAegisOrderById,
  updateAegisOrderStatus,
  getAegisOrderStats,
  refundAegisOrder
} from '../controllers/adminAegisOrderController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// SECURITY: mounted at /api/admin/aegis-orders OUTSIDE the main admin router
// (same as admin-flash-orders) — apply the identical middleware here rather
// than relying on inheritance that does not happen across routers.
router.use(authenticate);
router.use(requireRole('admin'));

// Get all Aegis Orders with filtering and pagination
// GET /api/admin/aegis-orders
router.get('/', getAllAegisOrders);

// Get Aegis Order statistics
// GET /api/admin/aegis-orders/stats
router.get('/stats', getAegisOrderStats);

// Get Aegis Order by ID
// GET /api/admin/aegis-orders/:id
router.get('/:id', getAegisOrderById);

// Update Aegis Order status
// PATCH /api/admin/aegis-orders/:id/status
router.patch('/:id/status', updateAegisOrderStatus);

// Refund an Aegis Order (full amount only — blocked once Fulfilled)
// POST /api/admin/aegis-orders/:id/refund
router.post('/:id/refund', refundAegisOrder);

export default router;
