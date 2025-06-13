import { body, param, query } from 'express-validator';
import { validators } from '../middleware/validation.js';

export const createProductValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 3, max: 200 }).withMessage('Product name must be between 3 and 200 characters')
    .custom(validators.noScriptTags),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Product description is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Description must be between 10 and 5000 characters')
    .custom(validators.noScriptTags),
  
  body('price')
    .isFloat({ min: 0.01 }).withMessage('Price must be greater than 0')
    .custom(validators.isValidPrice),
  
  body('sku')
    .trim()
    .notEmpty().withMessage('SKU is required')
    .matches(/^[A-Z0-9-]+$/i).withMessage('SKU can only contain letters, numbers, and hyphens'),
  
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .custom(validators.isMongoId),
  
  body('specifications')
    .optional()
    .isObject().withMessage('Specifications must be an object'),
  
  body('images')
    .optional()
    .isArray({ max: 10 }).withMessage('Maximum 10 images allowed'),
  
  body('images.*')
    .isURL().withMessage('Image must be a valid URL')
];

export const updateProductValidation = [
  param('productId')
    .custom(validators.isMongoId),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('Product name must be between 3 and 200 characters')
    .custom(validators.noScriptTags),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 }).withMessage('Description must be between 10 and 5000 characters')
    .custom(validators.noScriptTags),
  
  body('price')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Price must be greater than 0')
    .custom(validators.isValidPrice),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean value')
];

export const getProductsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  query('category')
    .optional()
    .custom(validators.isMongoId),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Minimum price must be positive'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Maximum price must be positive')
    .custom((value, { req }) => {
      if (req.query.minPrice && parseFloat(value) < parseFloat(req.query.minPrice)) {
        throw new Error('Maximum price must be greater than minimum price');
      }
      return true;
    }),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search query is too long')
    .custom(validators.noScriptTags)
];