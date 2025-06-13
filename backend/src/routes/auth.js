import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, logout, getProfile, updateProfile, changePassword, forgotPassword, resetPassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} from '../validators/authValidators.js';

const router = express.Router();

// Rate limiting for auth endpoints (disabled in test environment)
const authLimiter = process.env.NODE_ENV === 'test' ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = process.env.NODE_ENV === 'test' ? (req, res, next) => next() : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour
  message: {
    success: false,
    error: 'Too many registration attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes
router.post('/register', registerLimiter, registerValidation, handleValidationErrors, register);
router.post('/login', authLimiter, loginValidation, handleValidationErrors, login);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, handleValidationErrors, forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidation, handleValidationErrors, resetPassword);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePasswordValidation, handleValidationErrors, changePassword);
router.post('/logout', authenticate, logout);

export default router;