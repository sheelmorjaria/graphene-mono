import express from 'express';
import { adminLogin, getDashboardMetrics, getAdminProfile, getAllOrders, getOrderById, updateOrderStatus, issueRefund, getAllReturnRequests, getReturnRequestById, updateReturnRequestStatus, getProducts, getProductById, createProduct, updateProduct, deleteProduct, getCategories, getCategoryById, createCategory, updateCategory, deleteCategory, getAllUsers, getUserById, updateUserStatus, getSalesReport, getProductPerformanceReport, getCustomerReport, getInventoryReport } from '../controllers/adminController.js';
import { 
  getGeneralSettings, 
  updateGeneralSettings, 
  getShippingSettings, 
  createShippingMethod, 
  updateShippingMethod, 
  deleteShippingMethod,
  getTaxSettings,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  getPaymentSettings,
  updatePaymentGateway,
  createPaymentGateway,
  togglePaymentGateway
} from '../controllers/settingsController.js';
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
router.delete('/products/:productId', deleteProduct);

// Categories management
router.get('/categories', getCategories);
router.get('/categories/:categoryId', getCategoryById);
router.post('/categories', createCategory);
router.put('/categories/:categoryId', updateCategory);
router.delete('/categories/:categoryId', deleteCategory);

// User management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId/status', updateUserStatus);

// Reports
router.get('/reports/sales-summary', getSalesReport);
router.get('/reports/product-performance', getProductPerformanceReport);
router.get('/reports/customer-acquisition', getCustomerReport);
router.get('/reports/inventory-summary', getInventoryReport);


// Settings management
// General settings
router.get('/settings/general', getGeneralSettings);
router.put('/settings/general', updateGeneralSettings);

// Shipping settings
router.get('/settings/shipping', getShippingSettings);
router.post('/settings/shipping', createShippingMethod);
router.put('/settings/shipping/:methodId', updateShippingMethod);
router.delete('/settings/shipping/:methodId', deleteShippingMethod);

// Tax settings
router.get('/settings/taxes', getTaxSettings);
router.post('/settings/taxes', createTaxRate);
router.put('/settings/taxes/:taxRateId', updateTaxRate);
router.delete('/settings/taxes/:taxRateId', deleteTaxRate);

// Payment settings
router.get('/settings/payments', getPaymentSettings);
router.post('/settings/payments', createPaymentGateway);
router.put('/settings/payments/:gatewayId', updatePaymentGateway);
router.put('/settings/payments/:gatewayId/toggle', togglePaymentGateway);

export default router;