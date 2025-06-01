import express from 'express';
import { getUserAddresses, addUserAddress, updateUserAddress, deleteUserAddress } from '../controllers/userAddressController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Address management routes
router.get('/addresses', getUserAddresses);
router.post('/addresses', addUserAddress);
router.put('/addresses/:addressId', updateUserAddress);
router.delete('/addresses/:addressId', deleteUserAddress);

export default router;