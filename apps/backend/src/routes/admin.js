import express from 'express';
import { adminLogin, getDashboardMetrics, getAdminProfile, getAllOrders, getOrderById, updateOrderStatus, issueRefund, getAllReturnRequests, getReturnRequestById, updateReturnRequestStatus, getCategories, getCategoryById, createCategory, updateCategory, deleteCategory, getAllUsers, getUserById, updateUserStatus, getSalesReport, getProductPerformanceReport, getCustomerReport, getInventoryReport } from '../controllers/adminController.js';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, updateVariationStock } from '../controllers/adminProductController.js';
import { 
  getDeliveryStats, 
  getEngagementStats,
  getEmailTypeStats,
  getRecentEmails,
  getFailedEmails,
  getEmailDetails,
  getDashboardSummary
} from '../controllers/emailMetricsController.js';
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
import { uploadProductImages, processProductImages, uploadProductAndVariationImages, processProductAndVariationImages, handleImageUploadError } from '../middleware/imageUpload.js';

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
router.post('/products', uploadProductAndVariationImages, processProductAndVariationImages, createProduct, handleImageUploadError);
router.put('/products/:productId', uploadProductAndVariationImages, processProductAndVariationImages, updateProduct, handleImageUploadError);
router.delete('/products/:productId', deleteProduct);
router.patch('/products/:productId/variations/:variationId/stock', updateVariationStock);

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

// Email metrics routes
router.get('/email-metrics/delivery-stats', getDeliveryStats);
router.get('/email-metrics/engagement-stats', getEngagementStats);
router.get('/email-metrics/type-stats', getEmailTypeStats);
router.get('/email-metrics/recent', getRecentEmails);
router.get('/email-metrics/failed', getFailedEmails);
router.get('/email-metrics/dashboard', getDashboardSummary);
router.get('/email-metrics/:id', getEmailDetails);

export default router;