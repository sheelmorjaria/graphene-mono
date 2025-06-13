import { validationResult } from 'express-validator';
// import mongoSanitize from 'express-mongo-sanitize'; // Available for future data sanitization
import xss from 'xss';
import hpp from 'hpp';
import logger from '../utils/logger.js';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation error', {
      path: req.path,
      method: req.method,
      errors: errors.array(),
      ip: req.ip
    });
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Sanitize request data
 */
export const sanitizeInput = (req, res, next) => {
  // Custom NoSQL injection prevention
  const removeNoSQLChars = (obj) => {
    if (typeof obj === 'string') {
      // Only remove $ chars - preserve dots for email addresses etc.
      return obj.replace(/[\$]/g, '_');
    }
    if (Array.isArray(obj)) {
      // Handle arrays properly
      return obj.map(item => removeNoSQLChars(item));
    }
    if (typeof obj === 'object' && obj !== null) {
      const cleaned = {};
      for (const key in obj) {
        if (!/[\$\.]/.test(key)) { // Remove keys with $ or .
          cleaned[key] = removeNoSQLChars(obj[key]);
        }
      }
      return cleaned;
    }
    return obj;
  };
  
  // Sanitize string inputs to prevent XSS
  const sanitizeObject = (obj) => {
    if (Array.isArray(obj)) {
      // Handle arrays
      for (let i = 0; i < obj.length; i++) {
        if (typeof obj[i] === 'string') {
          obj[i] = xss(obj[i]);
        } else if (typeof obj[i] === 'object' && obj[i] !== null) {
          sanitizeObject(obj[i]);
        }
      }
    } else {
      // Handle objects
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = xss(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    }
  };
  
  // Apply sanitization
  if (req.body) {
    req.body = removeNoSQLChars(req.body);
    sanitizeObject(req.body);
  }
  if (req.query && Object.keys(req.query).length > 0) {
    const sanitizedQuery = removeNoSQLChars(req.query);
    sanitizeObject(sanitizedQuery);
    // Replace query object properties
    Object.keys(req.query).forEach(key => delete req.query[key]);
    Object.assign(req.query, sanitizedQuery);
  }
  
  next();
};

/**
 * Global input sanitization middleware
 */
export const globalSanitization = [
  // Custom input sanitization
  sanitizeInput,
  
  // Prevent parameter pollution
  hpp({
    whitelist: ['sort', 'fields', 'page', 'limit', 'category', 'minPrice', 'maxPrice']
  })
];

/**
 * Custom validators
 */
export const validators = {
  // MongoDB ObjectId validator
  isMongoId: (value) => {
    const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!mongoIdRegex.test(value)) {
      throw new Error('Invalid ID format');
    }
    return true;
  },
  
  // Price validator
  isValidPrice: (value) => {
    if (value < 0) {
      throw new Error('Price must be a positive number');
    }
    if (value > 999999) {
      throw new Error('Price exceeds maximum allowed value');
    }
    return true;
  },
  
  // Email validator with additional checks
  isSecureEmail: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }
    // Check for common SQL injection patterns
    if (value.includes('--') || value.includes('/*') || value.includes('*/')) {
      throw new Error('Invalid characters in email');
    }
    return true;
  },
  
  // Password strength validator
  isStrongPassword: (value) => {
    if (value.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(value)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(value)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(value)) {
      throw new Error('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(value)) {
      throw new Error('Password must contain at least one special character (!@#$%^&*)');
    }
    return true;
  },
  
  // Phone number validator
  isValidPhone: (value) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(value) || value.length < 10 || value.length > 20) {
      throw new Error('Invalid phone number format');
    }
    return true;
  },
  
  // Prevent common XSS patterns
  noScriptTags: (value) => {
    const scriptPattern = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
    if (scriptPattern.test(value)) {
      throw new Error('Invalid content detected');
    }
    return true;
  }
};