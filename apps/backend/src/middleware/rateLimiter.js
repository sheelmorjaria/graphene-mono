import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip validation errors about trust proxy setting
  validate: false,
  // Use safer trust proxy configuration
  skip: (req) => {
    // Skip rate limiting for health checks and internal requests
    return req.path === '/health' || req.path === '/ping';
  }
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip validation errors about trust proxy setting
  validate: false
});

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: 'Too many password reset attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip validation errors about trust proxy setting
  validate: false
});

// Admin login rate limiter (credential brute-force guard — bots spray this
// endpoint). Passthrough in test env, mirroring the authLimiter wiring in
// routes/auth.js, so integration tests can hit the endpoint freely.
export const adminLoginLimiter = process.env.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 failed attempts per IP per window
      // Successful logins don't count — a real admin logging in normally
      // can never lock themselves out, only repeated failures trip this.
      skipSuccessfulRequests: true,
      message: {
        success: false,
        error: 'Too many admin login attempts. Please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      validate: false
    });