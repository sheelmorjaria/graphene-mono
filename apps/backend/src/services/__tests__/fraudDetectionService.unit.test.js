import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock logger (fraudDetectionService imports logger + logSecurityEvent from ../../utils/logger.js).
// The global setup.vitest.js also mocks this module but omits logSecurityEvent,
// so we override it here to include every export the service uses.
vi.mock('../../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  },
  logSecurityEvent: vi.fn(),
  logInfo: vi.fn(),
  logPaymentEvent: vi.fn()
}));

// Import after mocks are registered
import { logSecurityEvent } from '../../utils/logger.js';
import {
  setFraudDetectionCookie,
  validateFraudDetectionCookie,
  assessOrderFraudRisk,
  fraudDetectionMiddleware
} from '../fraudDetectionService.js';

const COOKIE_NAME = 'fd_fp';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

const baseReq = (overrides = {}) => ({
  ip: '192.168.1.1',
  connection: { remoteAddress: '192.168.1.1' },
  headers: {
    'user-agent': 'Mozilla/5.0 (Test Browser)',
    'accept-language': 'en-US,en;q=0.9',
    'accept-encoding': 'gzip, deflate, br'
  },
  cookies: {},
  path: '/',
  ...overrides
});

describe('Fraud Detection Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------- setFraudDetectionCookie ----------------
  describe('setFraudDetectionCookie', () => {
    it('generates a new cookie and sets it on res when none exists', () => {
      const req = baseReq();
      const res = { cookie: vi.fn() };

      const result = setFraudDetectionCookie(req, res);

      expect(result.isNew).toBe(true);
      expect(result.deviceFingerprint).toEqual(expect.any(String));
      expect(result.deviceFingerprint).toHaveLength(64); // sha256 hex
      expect(result.cookieValue).toEqual(expect.any(String));
      // cookieValue format: timestamp.fingerprintPart.random
      const parts = result.cookieValue.split('.');
      expect(parts).toHaveLength(3);

      expect(res.cookie).toHaveBeenCalledTimes(1);
      const [name, value, opts] = res.cookie.mock.calls[0];
      expect(name).toBe(COOKIE_NAME);
      expect(value).toBe(result.cookieValue);
      expect(opts).toMatchObject({
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        sameSite: 'lax',
        path: '/'
      });
      // secure flag reflects NODE_ENV
      expect(opts.secure).toBe(process.env.NODE_ENV === 'production');

      expect(logSecurityEvent).toHaveBeenCalledWith(
        'fraud_detection_cookie_set',
        expect.objectContaining({
          ip: '192.168.1.1',
          deviceFingerprint: expect.stringContaining('...')
        })
      );
    });

    it('keeps existing cookie when present and not too old (under half max age)', () => {
      // Build a valid cookie value with a fresh timestamp
      const freshTimestamp = Date.now();
      const fingerprintPart = 'abcdef0123456789';
      const random = 'a'.repeat(32);
      const existingCookie = `${freshTimestamp}.${fingerprintPart}.${random}`;

      const req = baseReq({ cookies: { [COOKIE_NAME]: existingCookie } });
      const res = { cookie: vi.fn() };

      const result = setFraudDetectionCookie(req, res);

      expect(result.isNew).toBe(false);
      expect(result.cookieValue).toBe(existingCookie);
      expect(res.cookie).not.toHaveBeenCalled();
      expect(result.cookieData).toEqual(expect.objectContaining({
        timestamp: freshTimestamp,
        fpPart: fingerprintPart,
        random
      }));
    });

    it('regenerates cookie when existing one is older than half max age', () => {
      // Older than COOKIE_MAX_AGE / 2 but still under COOKIE_MAX_AGE
      const oldTimestamp = Date.now() - (COOKIE_MAX_AGE * 0.6);
      const existingCookie = `${oldTimestamp}.abcdef0123456789.${'b'.repeat(32)}`;

      const req = baseReq({ cookies: { [COOKIE_NAME]: existingCookie } });
      const res = { cookie: vi.fn() };

      const result = setFraudDetectionCookie(req, res);

      expect(result.isNew).toBe(true);
      expect(result.cookieValue).not.toBe(existingCookie);
      expect(res.cookie).toHaveBeenCalledTimes(1);
    });

    it('regenerates when existing cookie is invalid (unparseable)', () => {
      const req = baseReq({ cookies: { [COOKIE_NAME]: 'garbage.value' } });
      const res = { cookie: vi.fn() };

      const result = setFraudDetectionCookie(req, res);

      expect(result.isNew).toBe(true);
      expect(res.cookie).toHaveBeenCalledTimes(1);
    });

    it('handles missing req.cookies object gracefully', () => {
      const req = baseReq();
      delete req.cookies;
      const res = { cookie: vi.fn() };

      const result = setFraudDetectionCookie(req, res);

      expect(result.isNew).toBe(true);
      expect(res.cookie).toHaveBeenCalledTimes(1);
    });

    it('falls back to connection.remoteAddress when req.ip is undefined', () => {
      const req = baseReq();
      delete req.ip;
      const res = { cookie: vi.fn() };

      const result = setFraudDetectionCookie(req, res);

      expect(result.deviceFingerprint).toEqual(expect.any(String));
      expect(result.deviceFingerprint).toHaveLength(64);
    });
  });

  // ---------------- validateFraudDetectionCookie ----------------
  describe('validateFraudDetectionCookie', () => {
    it('returns medium risk with no_cookie flag when cookie missing', () => {
      const req = baseReq();

      const result = validateFraudDetectionCookie(req);

      expect(result.valid).toBe(false);
      expect(result.exists).toBe(false);
      expect(result.risk).toBe('medium');
      expect(result.flags).toEqual(['no_cookie']);
      expect(result.deviceFingerprint).toEqual(expect.any(String));
      expect(result.ip).toBe('192.168.1.1');
    });

    it('handles missing cookies object (no cookie)', () => {
      const req = baseReq();
      delete req.cookies;

      const result = validateFraudDetectionCookie(req);

      expect(result.valid).toBe(false);
      expect(result.exists).toBe(false);
      expect(result.flags).toEqual(['no_cookie']);
    });

    it('returns high risk with invalid_cookie flag for malformed cookie', () => {
      const req = baseReq({ cookies: { [COOKIE_NAME]: 'not.enough.parts' } });

      const result = validateFraudDetectionCookie(req);

      expect(result.valid).toBe(false);
      expect(result.exists).toBe(true);
      expect(result.risk).toBe('high');
      expect(result.flags).toEqual(['invalid_cookie']);
    });

    it('returns high risk for cookie with non-numeric timestamp', () => {
      const req = baseReq({ cookies: { [COOKIE_NAME]: 'notanumber.fp.random' } });

      const result = validateFraudDetectionCookie(req);

      expect(result.valid).toBe(false);
      expect(result.risk).toBe('high');
      expect(result.flags).toEqual(['invalid_cookie']);
    });

    it('returns high risk for expired cookie (older than max age)', () => {
      const expired = Date.now() - (COOKIE_MAX_AGE + 1000);
      const req = baseReq({ cookies: { [COOKIE_NAME]: `${expired}.fp.${'c'.repeat(32)}` } });

      const result = validateFraudDetectionCookie(req);

      expect(result.valid).toBe(false);
      expect(result.risk).toBe('high');
      expect(result.flags).toEqual(['invalid_cookie']);
    });

    it('returns low risk for a fresh, valid cookie', () => {
      // Age must be > 1000ms (to avoid rapid_creation) but well under 90% of max age.
      const fresh = Date.now() - 5000;
      const req = baseReq({ cookies: { [COOKIE_NAME]: `${fresh}.fp.${'d'.repeat(32)}` } });

      const result = validateFraudDetectionCookie(req);

      expect(result.valid).toBe(true);
      expect(result.exists).toBe(true);
      expect(result.risk).toBe('low');
      expect(result.flags).toBeNull();
      expect(result.cookieData).toBeDefined();
      expect(result.cookieData.timestamp).toBe(fresh);
    });

    it('flags expired_cookie (medium risk) when cookie is very old but still valid', () => {
      // older than 90% of max age but under max age
      const oldTimestamp = Date.now() - (COOKIE_MAX_AGE * 0.95);
      const req = baseReq({ cookies: { [COOKIE_NAME]: `${oldTimestamp}.fp.${'e'.repeat(32)}` } });

      const result = validateFraudDetectionCookie(req);

      expect(result.valid).toBe(true);
      expect(result.risk).toBe('medium');
      expect(result.flags).toContain('expired_cookie');
    });

    it('flags rapid_creation (medium risk) when cookie is brand new', () => {
      const now = Date.now();
      const req = baseReq({ cookies: { [COOKIE_NAME]: `${now}.fp.${'f'.repeat(32)}` } });

      const result = validateFraudDetectionCookie(req);

      expect(result.valid).toBe(true);
      expect(result.risk).toBe('medium');
      expect(result.flags).toContain('rapid_creation');
    });

    it('extracts IP from connection.remoteAddress when req.ip missing', () => {
      const req = baseReq();
      delete req.ip;
      req.connection.remoteAddress = '10.0.0.5';

      const result = validateFraudDetectionCookie(req);

      expect(result.ip).toBe('10.0.0.5');
    });
  });

  // ---------------- assessOrderFraudRisk ----------------
  describe('assessOrderFraudRisk', () => {
    it('returns low risk and proceed recommendation for clean data', () => {
      const fraudData = { risk: 'low', flags: null, ip: '1.2.3.4' };

      const result = assessOrderFraudRisk(fraudData, {});

      expect(result.riskLevel).toBe('low');
      expect(result.indicators).toEqual([]);
      expect(result.recommendation).toEqual({
        action: 'proceed',
        message: null,
        requiresManualReview: false
      });
      expect(logSecurityEvent).toHaveBeenCalledWith(
        'fraud_risk_assessment',
        expect.objectContaining({ riskLevel: 'low', ip: '1.2.3.4' })
      );
    });

    it('defaults orderData to empty object when omitted', () => {
      const fraudData = { risk: 'low', flags: null, ip: '1.2.3.4' };

      const result = assessOrderFraudRisk(fraudData);

      expect(result.riskLevel).toBe('low');
    });

    it('escalates to high risk when fraudData.risk is high', () => {
      const fraudData = { risk: 'high', flags: [], ip: '1.2.3.4' };

      const result = assessOrderFraudRisk(fraudData, {});

      expect(result.riskLevel).toBe('high');
      expect(result.indicators).toContain('invalid_or_missing_security_cookie');
      expect(result.recommendation.action).toBe('block');
      expect(result.recommendation.requiresManualReview).toBe(true);
    });

    it('flags tampered_security_cookie (high) when invalid_cookie flag present', () => {
      const fraudData = { risk: 'medium', flags: ['invalid_cookie'], ip: '1.2.3.4' };

      const result = assessOrderFraudRisk(fraudData, {});

      expect(result.riskLevel).toBe('high');
      expect(result.indicators).toContain('tampered_security_cookie');
    });

    it('escalates to medium risk for expired_cookie flag', () => {
      const fraudData = { risk: 'low', flags: ['expired_cookie'], ip: '1.2.3.4' };

      const result = assessOrderFraudRisk(fraudData, {});

      expect(result.riskLevel).toBe('medium');
      expect(result.indicators).toContain('expired_security_cookie');
      expect(result.recommendation.action).toBe('review');
      expect(result.recommendation.additionalVerification).toBe(true);
    });

    it('escalates to medium risk for rapid_creation flag', () => {
      const fraudData = { risk: 'low', flags: ['rapid_creation'], ip: '1.2.3.4' };

      const result = assessOrderFraudRisk(fraudData, {});

      expect(result.riskLevel).toBe('medium');
      expect(result.indicators).toContain('suspicious_cookie_pattern');
    });

    it('does not downgrade risk from high to medium for medium-level flags', () => {
      // risk already high from invalid_cookie; expired flag should not lower it
      const fraudData = { risk: 'high', flags: ['invalid_cookie', 'expired_cookie'], ip: '1.2.3.4' };

      const result = assessOrderFraudRisk(fraudData, {});

      expect(result.riskLevel).toBe('high');
      expect(result.indicators).toContain('expired_security_cookie');
      expect(result.indicators).toContain('tampered_security_cookie');
    });

    it('flags incomplete_address (medium) when shipping address missing fields', () => {
      const fraudData = { risk: 'low', flags: null, ip: '1.2.3.4' };
      const orderData = { shippingAddress: { addressLine1: '123 St' /* missing city, postalCode */ } };

      const result = assessOrderFraudRisk(fraudData, orderData);

      expect(result.riskLevel).toBe('medium');
      expect(result.indicators).toContain('incomplete_address');
    });

    it('does not flag address when shipping address is complete', () => {
      const fraudData = { risk: 'low', flags: null, ip: '1.2.3.4' };
      const orderData = {
        shippingAddress: { addressLine1: '123 St', city: 'London', postalCode: 'SW1A 1AA' }
      };

      const result = assessOrderFraudRisk(fraudData, orderData);

      expect(result.indicators).not.toContain('incomplete_address');
      expect(result.riskLevel).toBe('low');
    });

    it('flags high_value_order (medium) when totalPrice exceeds 1000', () => {
      const fraudData = { risk: 'low', flags: null, ip: '1.2.3.4' };
      const orderData = { totalPrice: 1500 };

      const result = assessOrderFraudRisk(fraudData, orderData);

      expect(result.riskLevel).toBe('medium');
      expect(result.indicators).toContain('high_value_order');
    });

    it('does not flag high_value_order at exactly 1000', () => {
      const fraudData = { risk: 'low', flags: null, ip: '1.2.3.4' };
      const orderData = { totalPrice: 1000 };

      const result = assessOrderFraudRisk(fraudData, orderData);

      expect(result.indicators).not.toContain('high_value_order');
      expect(result.riskLevel).toBe('low');
    });
  });

  // ---------------- fraudDetectionMiddleware ----------------
  describe('fraudDetectionMiddleware', () => {
    it('skips cookie setting for /api/ routes and calls next', () => {
      const req = baseReq({ path: '/api/orders' });
      const res = { cookie: vi.fn() };
      const next = vi.fn();

      fraudDetectionMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('skips cookie setting for /webhooks/ routes and calls next', () => {
      const req = baseReq({ path: '/webhooks/paypal' });
      const res = { cookie: vi.fn() };
      const next = vi.fn();

      fraudDetectionMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('sets the cookie for web (non-api) routes and calls next', () => {
      const req = baseReq({ path: '/products' });
      const res = { cookie: vi.fn() };
      const next = vi.fn();

      fraudDetectionMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.cookie).toHaveBeenCalledTimes(1);
    });
  });
});
