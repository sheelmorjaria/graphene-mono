import express from 'express';
import { submitContactForm } from '../controllers/supportController.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for contact form - more restrictive to prevent spam
const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 contact form submissions per 15 minutes
  message: {
    success: false,
    message: 'Too many contact form submissions. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/support/contact - Submit contact form
router.post('/contact', contactFormLimiter, submitContactForm);

export default router;