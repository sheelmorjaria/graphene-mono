import express from 'express';
import { getUserAddresses, addUserAddress, updateUserAddress, deleteUserAddress } from '../controllers/userAddressController.js';
import { getUserOrders, getUserOrderDetails, placeOrder, cancelOrder } from '../controllers/userOrderController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Address management routes
router.get('/addresses', getUserAddresses);
router.post('/addresses', addUserAddress);
router.put('/addresses/:addressId', updateUserAddress);
router.delete('/addresses/:addressId', deleteUserAddress);

// Order management routes
router.get('/orders', getUserOrders);
router.get('/orders/:orderId', getUserOrderDetails);
router.post('/orders/place-order', placeOrder);
router.post('/orders/:orderId/cancel', cancelOrder);

export default router;