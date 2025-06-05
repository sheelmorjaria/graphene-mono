import express from 'express';
import { adminLogin, getDashboardMetrics, getAdminProfile, getAllOrders, getOrderById, updateOrderStatus, issueRefund, getAllReturnRequests, getReturnRequestById, updateReturnRequestStatus, getProducts, getProductById, createProduct, updateProduct, getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadProductImages, processProductImages, handleImageUploadError } from '../middleware/imageUpload.js';

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

// Products management
router.get('/products', getProducts);
router.get('/products/:productId', getProductById);
router.post('/products', uploadProductImages, processProductImages, createProduct, handleImageUploadError);
router.put('/products/:productId', uploadProductImages, processProductImages, updateProduct, handleImageUploadError);

// Categories management
router.get('/categories', getCategories);
router.get('/categories/:categoryId', getCategoryById);
router.post('/categories', createCategory);
router.put('/categories/:categoryId', updateCategory);
router.delete('/categories/:categoryId', deleteCategory);

export default router;