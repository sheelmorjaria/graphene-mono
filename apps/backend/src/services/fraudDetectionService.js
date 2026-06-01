import crypto from 'crypto';
import logger, { logSecurityEvent } from '../utils/logger.js';

/**
 * Fraud Detection Service
 * Implements security cookies and device fingerprinting for fraud prevention
 */

// Cookie configuration
const FRAUD_DETECTION_COOKIE = 'fd_fp';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Generate a unique device fingerprint
 * @param {Object} req - Express request object
 * @returns {string} - Device fingerprint hash
 */
const generateDeviceFingerprint = (req) => {
  const fingerprintData = {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'] || '',
    acceptLanguage: req.headers['accept-language'] || '',
    acceptEncoding: req.headers['accept-encoding'] || '',
  };

  const fingerprintString = JSON.stringify(fingerprintData);
  return crypto.createHash('sha256').update(fingerprintString).digest('hex');
};

/**
 * Generate a new fraud detection cookie value
 * @param {string} deviceFingerprint - Device fingerprint hash
 * @returns {string} - Cookie value (timestamp:fingerprint:random)
 */
const generateCookieValue = (deviceFingerprint) => {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  return `${timestamp}.${deviceFingerprint.substring(0, 16)}.${random}`;
};

/**
 * Parse and validate fraud detection cookie
 * @param {string} cookieValue - Cookie value
 * @returns {Object|null} - Parsed cookie data or null if invalid
 */
const parseCookieValue = (cookieValue) => {
  if (!cookieValue) return null;

  const parts = cookieValue.split('.');
  if (parts.length !== 3) return null;

  const [timestamp, fpPart, random] = parts;

  // Validate timestamp is a number
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return null;

  // Check cookie age
  const age = Date.now() - ts;
  if (age > COOKIE_MAX_AGE) return null;

  return {
    timestamp: ts,
    fpPart,
    random,
    age
  };
};

/**
 * Set or update fraud detection cookie
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Fraud detection data
 */
export const setFraudDetectionCookie = (req, res) => {
  const deviceFingerprint = generateDeviceFingerprint(req);
  const existingCookie = req.cookies?.[FRAUD_DETECTION_COOKIE];
  let cookieData;

  if (existingCookie) {
    cookieData = parseCookieValue(existingCookie);
    // If cookie is valid and not too old, keep it
    if (cookieData && cookieData.age < COOKIE_MAX_AGE / 2) {
      return {
        deviceFingerprint,
        cookieValue: existingCookie,
        isNew: false,
        cookieData
      };
    }
  }

  // Generate new cookie
  const newCookieValue = generateCookieValue(deviceFingerprint);

  res.cookie(FRAUD_DETECTION_COOKIE, newCookieValue, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });

  logSecurityEvent('fraud_detection_cookie_set', {
    ip: req.ip,
    deviceFingerprint: deviceFingerprint.substring(0, 8) + '...'
  });

  return {
    deviceFingerprint,
    cookieValue: newCookieValue,
    isNew: true,
    cookieData: parseCookieValue(newCookieValue)
  };
};

/**
 * Validate fraud detection cookie and check for anomalies
 * @param {Object} req - Express request object
 * @returns {Object} - Validation result with risk flags
 */
export const validateFraudDetectionCookie = (req) => {
  const cookieValue = req.cookies?.[FRAUD_DETECTION_COOKIE];
  const currentDeviceFingerprint = generateDeviceFingerprint(req);
  const currentIp = req.ip || req.connection.remoteAddress;

  if (!cookieValue) {
    return {
      valid: false,
      exists: false,
      risk: 'medium',
      flags: ['no_cookie'],
      deviceFingerprint: currentDeviceFingerprint,
      ip: currentIp
    };
  }

  const cookieData = parseCookieValue(cookieValue);

  if (!cookieData) {
    return {
      valid: false,
      exists: true,
      risk: 'high',
      flags: ['invalid_cookie'],
      deviceFingerprint: currentDeviceFingerprint,
      ip: currentIp
    };
  }

  const flags = [];
  let risk = 'low';

  // Check if cookie is very old (might be reused/stolen)
  if (cookieData.age > COOKIE_MAX_AGE * 0.9) {
    flags.push('expired_cookie');
    risk = 'medium';
  }

  // Check for suspicious patterns (could be extended)
  if (cookieData.age < 1000) {
    // Cookie created less than 1 second ago - suspicious
    flags.push('rapid_creation');
    risk = 'medium';
  }

  return {
    valid: true,
    exists: true,
    risk,
    flags: flags.length > 0 ? flags : null,
    deviceFingerprint: currentDeviceFingerprint,
    ip: currentIp,
    cookieData
  };
};

/**
 * Check for fraud indicators in order context
 * @param {Object} fraudData - Fraud detection data
 * @param {Object} orderData - Order data
 * @returns {Object} - Fraud assessment
 */
export const assessOrderFraudRisk = (fraudData, orderData = {}) => {
  const indicators = [];
  let riskLevel = 'low';

  // High-risk indicators
  if (fraudData.risk === 'high') {
    indicators.push('invalid_or_missing_security_cookie');
    riskLevel = 'high';
  }

  if (fraudData.flags?.includes('invalid_cookie')) {
    indicators.push('tampered_security_cookie');
    riskLevel = 'high';
  }

  // Medium-risk indicators
  if (fraudData.flags?.includes('expired_cookie')) {
    indicators.push('expired_security_cookie');
    if (riskLevel === 'low') riskLevel = 'medium';
  }

  if (fraudData.flags?.includes('rapid_creation')) {
    indicators.push('suspicious_cookie_pattern');
    if (riskLevel === 'low') riskLevel = 'medium';
  }

  // Check order data patterns
  if (orderData.shippingAddress) {
    const { addressLine1, city, postalCode } = orderData.shippingAddress;

    // Check for incomplete addresses
    if (!addressLine1 || !city || !postalCode) {
      indicators.push('incomplete_address');
      if (riskLevel === 'low') riskLevel = 'medium';
    }
  }

  // High value order flag
  if (orderData.totalPrice && orderData.totalPrice > 1000) {
    indicators.push('high_value_order');
    if (riskLevel === 'low') riskLevel = 'medium';
  }

  logSecurityEvent('fraud_risk_assessment', {
    riskLevel,
    indicatorCount: indicators.length,
    indicators: indicators.slice(0, 3), // Log first 3
    ip: fraudData.ip
  });

  return {
    riskLevel,
    indicators,
    recommendation: getRiskRecommendation(riskLevel, indicators)
  };
};

/**
 * Get recommendation based on risk level
 * @param {string} riskLevel - Risk level (low, medium, high)
 * @param {Array} indicators - Risk indicators
 * @returns {Object} - Recommendation object
 */
const getRiskRecommendation = (riskLevel, indicators) => {
  switch (riskLevel) {
    case 'high':
      return {
        action: 'block',
        message: 'Order could not be processed. Please contact support.',
        requiresManualReview: true
      };
    case 'medium':
      return {
        action: 'review',
        message: 'Order is being reviewed for security purposes.',
        requiresManualReview: false,
        additionalVerification: true
      };
    default:
      return {
        action: 'proceed',
        message: null,
        requiresManualReview: false
      };
  }
};

/**
 * Middleware to ensure fraud detection cookie is set
 */
export const fraudDetectionMiddleware = (req, res, next) => {
  // Skip for non-web routes (API, webhooks, etc.)
  if (req.path.startsWith('/api/') || req.path.startsWith('/webhooks/')) {
    return next();
  }

  // Set/update fraud detection cookie for web pages
  setFraudDetectionCookie(req, res);
  next();
};

export default {
  setFraudDetectionCookie,
  validateFraudDetectionCookie,
  assessOrderFraudRisk,
  fraudDetectionMiddleware
};
