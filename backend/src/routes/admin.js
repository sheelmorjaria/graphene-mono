import express from 'express';
import { adminLogin, getDashboardMetrics, getAdminProfile, getAllOrders, getOrderById, updateOrderStatus, issueRefund, getAllReturnRequests, getReturnRequestById, updateReturnRequestStatus } from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public admin routes (no authentication required)
router.post('/login', adminLogin);

// Protected admin routes (authentication + admin role required)
router.use(authenticate);
router.use(requireRole('admin'));

// Dashboard metrics
router.get('/dashboard-metrics', getDashboardMetrics);

// Admin profile
router.get('/profile', getAdminProfile);

// Orders management
router.get('/orders', getAllOrders);
router.get('/orders/:orderId', getOrderById);
router.put('/orders/:orderId/status', updateOrderStatus);
router.post('/orders/:orderId/refund', issueRefund);

// Return requests management
router.get('/returns', getAllReturnRequests);
router.get('/returns/:returnRequestId', getReturnRequestById);
router.put('/returns/:returnRequestId/status', updateReturnRequestStatus);

export default router;