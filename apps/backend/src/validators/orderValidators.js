import { body, param } from 'express-validator';
import { validators } from '../middleware/validation.js';

// Country name to ISO code mapping
const countryNameToCode = {
  'United Kingdom': 'GB',
  'United States': 'US',
  'Canada': 'CA',
  'Australia': 'AU',
  'New Zealand': 'NZ',
  'Ireland': 'IE',
  'Germany': 'DE',
  'France': 'FR',
  'Spain': 'ES',
  'Italy': 'IT',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Poland': 'PL',
  'Portugal': 'PT',
  'Czech Republic': 'CZ',
  'Hungary': 'HU',
  'Romania': 'RO',
  'Bulgaria': 'BG',
  'Greece': 'GR',
  'Japan': 'JP',
  'Singapore': 'SG',
  'Hong Kong': 'HK',
  'India': 'IN',
  'Brazil': 'BR',
  'Mexico': 'MX',
  'Argentina': 'AR',
  'Israel': 'IL',
  'United Arab Emirates': 'AE',
  'South Africa': 'ZA'
};

export const createOrderValidation = [
  body('cartId')
    .optional()
    .custom(validators.isMongoId),
  
  body('items')
    .isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  
  body('items.*.product')
    .custom(validators.isMongoId),
  
  body('items.*.quantity')
    .isInt({ min: 1, max: 100 }).withMessage('Quantity must be between 1 and 100'),
  
  body('shippingAddress')
    .isObject().withMessage('Shipping address is required'),
  
  body('shippingAddress.fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ max: 100 }).withMessage('Full name is too long'),
  
  body('shippingAddress.addressLine1')
    .trim()
    .notEmpty().withMessage('Address line 1 is required')
    .isLength({ max: 200 }).withMessage('Address is too long'),
  
  body('shippingAddress.city')
    .trim()
    .notEmpty().withMessage('City is required')
    .isLength({ max: 100 }).withMessage('City name is too long'),
  
  body('shippingAddress.postalCode')
    .trim()
    .notEmpty().withMessage('Postal code is required')
    .matches(/^[A-Z0-9\s-]+$/i).withMessage('Invalid postal code format'),
  
  body('shippingAddress.country')
    .trim()
    .notEmpty().withMessage('Country is required')
    .customSanitizer(value => {
      // Convert country name to ISO code if needed
      return countryNameToCode[value] || value;
    })
    .isLength({ min: 2, max: 2 }).withMessage('Country must be 2-letter ISO code')
    .matches(/^[A-Z]{2}$/).withMessage('Country must be a valid ISO 3166-1 alpha-2 code'),
  
  body('paymentMethod')
    .trim()
    .notEmpty().withMessage('Payment method is required')
    .isIn(['paypal', 'bitcoin', 'monero']).withMessage('Invalid payment method')
];

export const updateOrderStatusValidation = [
  param('orderId')
    .custom(validators.isMongoId),
  
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
  
  body('trackingNumber')
    .optional()
    .trim()
    .matches(/^[A-Z0-9-]+$/i).withMessage('Invalid tracking number format')
];

export const refundOrderValidation = [
  param('orderId')
    .custom(validators.isMongoId),
  
  body('amount')
    .isFloat({ min: 0.01 }).withMessage('Refund amount must be greater than 0')
    .custom(validators.isValidPrice),
  
  body('reason')
    .trim()
    .notEmpty().withMessage('Refund reason is required')
    .isLength({ max: 500 }).withMessage('Refund reason is too long')
    .custom(validators.noScriptTags)
];