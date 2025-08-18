import express from 'express';
import { 
  handleSESWebhook, 
  handleUnsubscribe,
  getEmailPreferences,
  updateEmailPreferences
} from '../controllers/webhookController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// AWS SES webhook endpoint (no auth required - verified by signature)
// SNS sends with text/plain content-type
router.post('/ses', express.text({ type: 'text/plain' }), handleSESWebhook);

// Unsubscribe endpoint (no auth required - uses token)
router.get('/unsubscribe/:token', handleUnsubscribe);

// Email preferences endpoints (requires auth)
router.get('/email-preferences', authenticate, getEmailPreferences);
router.put('/email-preferences', authenticate, updateEmailPreferences);

export default router;