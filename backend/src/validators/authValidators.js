import { body, param, query } from 'express-validator';
import { validators } from '../middleware/validation.js';

export const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .custom(validators.isSecureEmail),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .custom(validators.isStrongPassword),
  
  body('phone')
    .optional()
    .trim()
    .custom(validators.isValidPhone)
];

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .custom(validators.isSecureEmail),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

export const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .custom(validators.isSecureEmail)
];

export const resetPasswordValidation = [
  body('token')
    .trim()
    .notEmpty().withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 }).withMessage('Invalid reset token'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .custom(validators.isStrongPassword)
];

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .custom(validators.isStrongPassword)
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    })
];

export const verifyEmailValidation = [
  body('token')
    .trim()
    .notEmpty().withMessage('Verification token is required')
    .isLength({ min: 64, max: 64 }).withMessage('Invalid verification token')
];