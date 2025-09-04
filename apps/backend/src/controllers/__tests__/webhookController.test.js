import { vi, describe, beforeEach, it, expect } from 'vitest';
import { handleSESWebhook, handleUnsubscribe, getEmailPreferences, updateEmailPreferences } from '../webhookController.js';

// Mock the models
const EmailPreference = vi.hoisted(() => ({
  findOne: vi.fn(),
  createDefaultPreferences: vi.fn(),
  findByUnsubscribeToken: vi.fn()
}));

const User = vi.hoisted(() => ({
  findOne: vi.fn()
}));

const EmailMetrics = vi.hoisted(() => ({
  findOne: vi.fn(),
  countDocuments: vi.fn()
}));

const logger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
}));

vi.mock('../../models/EmailPreference.js', () => ({ default: EmailPreference }));
vi.mock('../../models/User.js', () => ({ default: User }));
vi.mock('../../models/EmailMetrics.js', () => ({ default: EmailMetrics }));
vi.mock('../../utils/logger.js', () => ({ default: logger, logError: vi.fn() }));

// Mock https module for certificate fetching
vi.mock('https', () => ({
  get: vi.fn((url, callback) => {
    const mockResponse = {
      on: vi.fn((event, handler) => {
        if (event === 'data') {
          handler('-----BEGIN CERTIFICATE-----\nMOCKCERT\n-----END CERTIFICATE-----');
        } else if (event === 'end') {
          handler();
        }
        return mockResponse;
      })
    };
    callback(mockResponse);
    return { on: vi.fn() };
  })
}));

// Mock crypto module
vi.mock('crypto', () => ({
  createVerify: vi.fn(() => ({
    update: vi.fn(),
    verify: vi.fn(() => true) // Always return valid signature for testing
  }))
}));

describe('Webhook Controller', () => {
  let req, res;

  beforeEach(() => {
    // Set development mode for testing
    process.env.NODE_ENV = 'development';
    process.env.SKIP_SNS_VERIFICATION = 'true';
    req = {
      body: {},
      params: {},
      query: {},
      user: { _id: 'user123' }
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    vi.clearAllMocks();
  });

  describe('handleSESWebhook', () => {
    describe('Subscription Confirmation', () => {
      it('should handle subscription confirmation', async () => {
        req.body = {
          Type: 'SubscriptionConfirmation',
          TopicArn: 'arn:aws:sns:us-east-1:123456789:ses-bounces',
          Token: 'test-token',
          SubscribeURL: 'https://sns.amazonaws.com/confirm/subscription',
          SigningCertURL: 'https://sns.us-east-1.amazonaws.com/cert.pem',
          Signature: 'mock-signature',
          SignatureVersion: '1'
        };

        await handleSESWebhook(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Subscription confirmation processed'
        });
      });
    });

    describe('Bounce Handling', () => {
      it('should handle permanent bounce notification', async () => {
        const mockUser = { _id: 'user123', email: 'test@example.com' };
        const mockEmailPref = {
          userId: 'user123',
          emailStatus: { bounceCount: 0 },
          recordBounce: vi.fn(),
          save: vi.fn()
        };
        const mockMetrics = {
          recordEvent: vi.fn()
        };

        User.findOne.mockResolvedValue(mockUser);
        EmailPreference.findOne.mockResolvedValue(mockEmailPref);
        EmailMetrics.findOne.mockResolvedValue(mockMetrics);

        req.body = JSON.stringify({
          Type: 'Notification',
          Message: JSON.stringify({
            notificationType: 'Bounce',
            bounce: {
              bounceType: 'Permanent',
              bounceSubType: 'General',
              bouncedRecipients: [{
                emailAddress: 'test@example.com',
                diagnosticCode: 'smtp; 550 5.1.1 user unknown',
                status: '5.1.1',
                action: 'failed'
              }],
              timestamp: '2024-01-01T12:00:00.000Z'
            },
            mail: {
              messageId: 'test-message-id',
              destination: ['test@example.com']
            }
          }),
          TopicArn: 'arn:aws:sns:us-east-1:123456789:ses-bounces',
          SigningCertURL: 'https://sns.us-east-1.amazonaws.com/cert.pem',
          Signature: 'mock-signature',
          SignatureVersion: '1'
        });

        await handleSESWebhook(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(mockEmailPref.recordBounce).toHaveBeenCalled();
        expect(mockMetrics.recordEvent).toHaveBeenCalledWith('bounced', expect.any(Object));
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Notification processed',
          type: 'Bounce'
        });
      });

      it('should handle transient bounce notification', async () => {
        const mockUser = { _id: 'user123', email: 'test@example.com' };
        const mockEmailPref = {
          userId: 'user123',
          emailStatus: { 
            bounceCount: 1,
            lastBounceDate: null,
            lastBounceReason: null
          },
          save: vi.fn()
        };

        User.findOne.mockResolvedValue(mockUser);
        EmailPreference.findOne.mockResolvedValue(mockEmailPref);
        EmailMetrics.countDocuments.mockResolvedValue(1);

        req.body = JSON.stringify({
          Type: 'Notification',
          Message: JSON.stringify({
            notificationType: 'Bounce',
            bounce: {
              bounceType: 'Transient',
              bounceSubType: 'MailboxFull',
              bouncedRecipients: [{
                emailAddress: 'test@example.com',
                diagnosticCode: 'smtp; 452 4.2.2 mailbox full',
                status: '4.2.2',
                action: 'delayed'
              }]
            },
            mail: {
              messageId: 'test-message-id'
            }
          }),
          TopicArn: 'arn:aws:sns:us-east-1:123456789:ses-bounces',
          SigningCertURL: 'https://sns.us-east-1.amazonaws.com/cert.pem',
          Signature: 'mock-signature',
          SignatureVersion: '1'
        });

        await handleSESWebhook(req, res);

        expect(mockEmailPref.save).toHaveBeenCalled();
        expect(mockEmailPref.emailStatus.bounceCount).toBe(2);
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });

    describe('Complaint Handling', () => {
      it('should handle complaint notification', async () => {
        const mockUser = { _id: 'user123', email: 'test@example.com' };
        const mockEmailPref = {
          userId: 'user123',
          recordComplaint: vi.fn()
        };
        const mockMetrics = {
          recordEvent: vi.fn()
        };

        User.findOne.mockResolvedValue(mockUser);
        EmailPreference.findOne.mockResolvedValue(mockEmailPref);
        EmailMetrics.findOne.mockResolvedValue(mockMetrics);

        req.body = JSON.stringify({
          Type: 'Notification',
          Message: JSON.stringify({
            notificationType: 'Complaint',
            complaint: {
              complaintFeedbackType: 'abuse',
              complainedRecipients: [{
                emailAddress: 'test@example.com'
              }],
              userAgent: 'Gmail',
              timestamp: '2024-01-01T12:00:00.000Z'
            },
            mail: {
              messageId: 'test-message-id'
            }
          }),
          TopicArn: 'arn:aws:sns:us-east-1:123456789:ses-complaints',
          SigningCertURL: 'https://sns.us-east-1.amazonaws.com/cert.pem',
          Signature: 'mock-signature',
          SignatureVersion: '1'
        });

        await handleSESWebhook(req, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
        expect(mockEmailPref.recordComplaint).toHaveBeenCalledWith(
          'abuse',
          expect.stringContaining('abuse')
        );
        expect(mockMetrics.recordEvent).toHaveBeenCalledWith('complained', expect.any(Object));
        expect(res.status).toHaveBeenCalledWith(200);
      });

      it('should log error for complaint from unknown email', async () => {
        User.findOne.mockResolvedValue(null);

        req.body = JSON.stringify({
          Type: 'Notification',
          Message: JSON.stringify({
            notificationType: 'Complaint',
            complaint: {
              complaintFeedbackType: 'abuse',
              complainedRecipients: [{
                emailAddress: 'unknown@example.com'
              }]
            },
            mail: {
              messageId: 'test-message-id'
            }
          }),
          TopicArn: 'arn:aws:sns:us-east-1:123456789:ses-complaints',
          SigningCertURL: 'https://sns.us-east-1.amazonaws.com/cert.pem',
          Signature: 'mock-signature',
          SignatureVersion: '1'
        });

        await handleSESWebhook(req, res);

        expect(logger.warn).toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith(
          'Complaint from non-user email:',
          expect.any(Object)
        );
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });

    describe('Delivery Handling', () => {
      it('should handle delivery notification', async () => {
        const mockMetrics = {
          recordEvent: vi.fn()
        };
        const mockUser = { _id: 'user123', email: 'test@example.com' };
        const mockEmailPref = {
          emailStatus: { isValid: false, lastValidatedAt: null },
          save: vi.fn()
        };

        EmailMetrics.findOne.mockResolvedValue(mockMetrics);
        User.findOne.mockResolvedValue(mockUser);
        EmailPreference.findOne.mockResolvedValue(mockEmailPref);

        req.body = JSON.stringify({
          Type: 'Notification',
          Message: JSON.stringify({
            notificationType: 'Delivery',
            delivery: {
              recipients: ['test@example.com'],
              timestamp: '2024-01-01T12:00:00.000Z',
              processingTimeMillis: 1234,
              smtpResponse: '250 2.0.0 OK'
            },
            mail: {
              messageId: 'test-message-id'
            }
          }),
          TopicArn: 'arn:aws:sns:us-east-1:123456789:ses-delivery',
          SigningCertURL: 'https://sns.us-east-1.amazonaws.com/cert.pem',
          Signature: 'mock-signature',
          SignatureVersion: '1'
        });

        await handleSESWebhook(req, res);

        expect(mockMetrics.recordEvent).toHaveBeenCalledWith('delivered', expect.any(Object));
        expect(mockEmailPref.emailStatus.isValid).toBe(true);
        expect(mockEmailPref.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });

    describe('Error Handling', () => {
      it('should return 400 for invalid JSON', async () => {
        req.body = 'invalid json';

        await handleSESWebhook(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid JSON' });
      });

      it('should return 401 for invalid signature', async () => {
        // Temporarily disable skip verification for this test
        delete process.env.SKIP_SNS_VERIFICATION;
        
        // Mock crypto to return false for signature verification
        const crypto = await import('crypto');
        crypto.createVerify.mockReturnValue({
          update: vi.fn(),
          verify: vi.fn(() => false)
        });

        req.body = JSON.stringify({
          Type: 'Notification',
          Message: '{}',
          SigningCertURL: 'https://sns.us-east-1.amazonaws.com/cert.pem',
          Signature: 'invalid-signature'
        });

        await handleSESWebhook(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid signature' });
        
        // Restore skip verification for other tests
        process.env.SKIP_SNS_VERIFICATION = 'true';
      });

      it('should handle processing errors gracefully', async () => {
        User.findOne.mockRejectedValue(new Error('Database error'));

        req.body = JSON.stringify({
          Type: 'Notification',
          Message: JSON.stringify({
            notificationType: 'Bounce',
            bounce: {
              bounceType: 'Permanent',
              bouncedRecipients: [{
                emailAddress: 'test@example.com'
              }]
            },
            mail: {
              messageId: 'test-message-id'
            }
          }),
          TopicArn: 'arn:aws:sns:us-east-1:123456789:ses-bounces',
          SigningCertURL: 'https://sns.us-east-1.amazonaws.com/cert.pem',
          Signature: 'mock-signature',
          SignatureVersion: '1'
        });

        await handleSESWebhook(req, res);

        expect(logger.error).toHaveBeenCalled();
        // Should still return 200 to prevent SNS retries
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Notification processing failed but acknowledged'
        });
      });
    });
  });

  describe('handleUnsubscribe', () => {
    it('should handle global unsubscribe', async () => {
      const mockEmailPref = {
        updatePreferences: vi.fn()
      };
      EmailPreference.findByUnsubscribeToken.mockResolvedValue(mockEmailPref);

      req.params = { token: 'valid-token' };
      req.query = { all: 'true' };

      await handleUnsubscribe(req, res);

      expect(mockEmailPref.updatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          globalUnsubscribe: true,
          reason: 'User clicked unsubscribe all'
        }),
        'user'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'You have been unsubscribed from all non-essential emails'
      });
    });

    it('should handle category-specific unsubscribe', async () => {
      const mockEmailPref = {
        updatePreferences: vi.fn()
      };
      EmailPreference.findByUnsubscribeToken.mockResolvedValue(mockEmailPref);

      req.params = { token: 'valid-token' };
      req.query = { category: 'marketing' };

      await handleUnsubscribe(req, res);

      expect(mockEmailPref.updatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          marketing: {
            promotions: false,
            newsletter: false,
            productRecommendations: false,
            surveyInvitations: false
          }
        }),
        'user'
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for invalid token', async () => {
      EmailPreference.findByUnsubscribeToken.mockResolvedValue(null);

      req.params = { token: 'invalid-token' };

      await handleUnsubscribe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired unsubscribe link'
      });
    });
  });

  describe('getEmailPreferences', () => {
    it('should return user email preferences', async () => {
      const mockEmailPref = {
        notifications: {
          orderStatusUpdates: true,
          deliveryUpdates: true
        },
        marketing: {
          promotions: false,
          newsletter: false
        },
        globalUnsubscribe: false,
        emailStatus: {
          isValid: true
        }
      };
      EmailPreference.findOne.mockResolvedValue(mockEmailPref);

      await getEmailPreferences(req, res);

      expect(EmailPreference.findOne).toHaveBeenCalledWith({ userId: 'user123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        preferences: expect.objectContaining({
          notifications: mockEmailPref.notifications,
          marketing: mockEmailPref.marketing,
          globalUnsubscribe: false
        })
      });
    });

    it('should create default preferences if none exist', async () => {
      const mockNewPref = {
        notifications: {},
        marketing: {},
        globalUnsubscribe: false,
        emailStatus: { isValid: true }
      };
      EmailPreference.findOne.mockResolvedValue(null);
      EmailPreference.createDefaultPreferences.mockResolvedValue(mockNewPref);

      await getEmailPreferences(req, res);

      expect(EmailPreference.createDefaultPreferences).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateEmailPreferences', () => {
    it('should update email preferences', async () => {
      const mockEmailPref = {
        notifications: {},
        marketing: {},
        globalUnsubscribe: false,
        updatePreferences: vi.fn().mockResolvedValue({
          notifications: { orderStatusUpdates: false },
          marketing: {},
          globalUnsubscribe: false
        })
      };
      EmailPreference.findOne.mockResolvedValue(mockEmailPref);

      req.body = {
        notifications: { orderStatusUpdates: false }
      };

      await updateEmailPreferences(req, res);

      expect(mockEmailPref.updatePreferences).toHaveBeenCalledWith(
        { notifications: { orderStatusUpdates: false } },
        'user'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Email preferences updated successfully'
      }));
    });

    it('should reject invalid preference updates', async () => {
      req.body = {
        invalidField: 'value'
      };

      await updateEmailPreferences(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid preference update'
      });
    });
  });
});