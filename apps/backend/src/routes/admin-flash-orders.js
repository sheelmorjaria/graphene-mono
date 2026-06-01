import express from 'express';
import {
  getAllFlashOrders,
  getFlashOrderById,
  updateFlashOrderStatus,
  getFlashOrderStats
} from '../controllers/adminFlashOrderController.js';

const router = express.Router();

// Note: Admin authentication is handled at the app level via /api/admin prefix
// Individual routes can add additional middleware if needed

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

export default router;
