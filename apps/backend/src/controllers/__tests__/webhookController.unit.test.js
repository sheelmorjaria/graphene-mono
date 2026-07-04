import { vi, describe, beforeEach, it, expect } from 'vitest';
import {
  handleSESWebhook,
  handleUnsubscribe,
  getEmailPreferences,
  updateEmailPreferences
} from '../webhookController.js';

// ---- Mocks ---------------------------------------------------------------
const EmailPreference = vi.hoisted(() => ({
  findOne: vi.fn(),
  createDefaultPreferences: vi.fn(),
  findByUnsubscribeToken: vi.fn()
}));
const User = vi.hoisted(() => ({ findOne: vi.fn() }));
const EmailMetrics = vi.hoisted(() => ({
  findOne: vi.fn(),
  countDocuments: vi.fn()
}));

// https.get is used both for cert fetch (verifySNSSignature) and for SNS
// subscription confirmation. Provide a controllable implementation.
const httpsGet = vi.hoisted(() => vi.fn());
const cryptoCreateVerify = vi.hoisted(() =>
  vi.fn(() => ({ update: vi.fn(), verify: vi.fn(() => true) }))
);

vi.mock('../../models/EmailPreference.js', () => ({ default: EmailPreference }));
vi.mock('../../models/User.js', () => ({ default: User }));
vi.mock('../../models/EmailMetrics.js', () => ({ default: EmailMetrics }));
vi.mock('../../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  logError: vi.fn()
}));
vi.mock('https', () => ({ get: httpsGet }));
vi.mock('crypto', () => ({ createVerify: cryptoCreateVerify }));

// Helper: build a streaming-style response object consumed by https.get
function mockHttpsResponseBody(body) {
  return (url, callback) => {
    const res = {
      on: vi.fn((event, handler) => {
        if (event === 'data') handler(body);
        else if (event === 'end') handler();
        return res;
      })
    };
    callback(res);
    return { on: vi.fn() };
  };
}

// Build a valid SES Notification message body.
const notificationMessage = (notificationType, extra = {}) =>
  JSON.stringify({ notificationType, mail: { messageId: 'msg-1', destination: [] }, ...extra });

const baseReq = () => ({ body: {}, params: {}, query: {}, user: { _id: 'user123' } });
const baseRes = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });

describe('Webhook Controller - additional unit coverage', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    // Skip the real SNS crypto/cert path for the majority of tests; the
    // dedicated "signature verification" describe block opts back in.
    process.env.NODE_ENV = 'development';
    process.env.SKIP_SNS_VERIFICATION = 'true';

    req = baseReq();
    res = baseRes();
  });

  describe('handleSESWebhook - signature verification', () => {
    it('returns 401 when verification runs (not skipped) and signature is invalid', async () => {
      // Opt out of the dev skip so verifySNSSignature runs the real-looking
      // path; mock the crypto verifier to report an invalid signature.
      process.env.NODE_ENV = 'production';
      delete process.env.SKIP_SNS_VERIFICATION;
      cryptoCreateVerify.mockReturnValue({ update: vi.fn(), verify: vi.fn(() => false) });
      httpsGet.mockImplementation(mockHttpsResponseBody('-----BEGIN CERTIFICATE-----\nMOCK\n-----END CERTIFICATE-----'));

      req.body = { Type: 'Notification', Message: notificationMessage('Send'), MessageId: '1', TopicArn: 'arn', Signature: 'sig', SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/cert.pem' };

      await handleSESWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid signature' });
    });

    it('returns 401 when SigningCertURL is not an AWS URL (cert fetch rejects)', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.SKIP_SNS_VERIFICATION;
      httpsGet.mockImplementation(mockHttpsResponseBody('-----BEGIN CERTIFICATE-----\nMOCK\n-----END CERTIFICATE-----'));

      req.body = { Type: 'Notification', Message: notificationMessage('Send'), MessageId: '1', TopicArn: 'arn', Signature: 'sig', SigningCertURL: 'https://evil.example.com/cert.pem' };

      await handleSESWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('handleSESWebhook - subscription / unsubscribe', () => {
    it('handles SubscriptionConfirmation and confirms via SubscribeURL', async () => {
      httpsGet
        .mockImplementationOnce(mockHttpsResponseBody('-----BEGIN CERTIFICATE-----\nMOCK\n-----END CERTIFICATE-----'))
        .mockImplementationOnce(mockHttpsResponseBody('<Confirmation>OK</Confirmation>'));
      req.body = { Type: 'SubscriptionConfirmation', Message: 'msg', MessageId: '1', SubscribeURL: 'https://sns.eu-west-1.amazonaws.com/?Action=ConfirmSubscription&Token=t', Token: 't', TopicArn: 'arn', Signature: 'sig', SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/cert.pem' };

      await handleSESWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Subscription confirmation processed' }));
    });

    it('still 200s on SubscriptionConfirmation when confirmSubscription errors', async () => {
      httpsGet
        .mockImplementationOnce(mockHttpsResponseBody('-----BEGIN CERTIFICATE-----\nMOCK\n-----END CERTIFICATE-----'))
        .mockImplementation(() => ({ on: vi.fn((ev, h) => { if (ev === 'error') h(new Error('boom')); return { on: vi.fn() }; }), on: vi.fn() }));
      req.body = { Type: 'SubscriptionConfirmation', Message: 'msg', MessageId: '1', SubscribeURL: 'https://sns.eu-west-1.amazonaws.com/?Action=ConfirmSubscription&Token=t', Token: 't', TopicArn: 'arn', Signature: 'sig', SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/cert.pem' };

      await handleSESWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('handles UnsubscribeConfirmation', async () => {
      req.body = { Type: 'UnsubscribeConfirmation', Message: 'msg', MessageId: '1', TopicArn: 'arn', Signature: 'sig', SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/cert.pem' };

      await handleSESWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unsubscribe confirmation received' }));
    });
  });

  describe('handleSESWebhook - notification switch', () => {
    const sendNotif = (msg, extra = {}) => {
      req.body = { Type: 'Notification', Message: msg, MessageId: '1', TopicArn: 'arn', Signature: 'sig', SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/cert.pem', ...extra };
    };

    beforeEach(() => {
      // No metrics docs by default; handlers should no-op cleanly.
      EmailMetrics.findOne.mockResolvedValue(null);
      User.findOne.mockResolvedValue(null);
    });

    it('returns 400 for a malformed notification message', async () => {
      sendNotif('{ not valid json');
      await handleSESWebhook(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid notification format' });
    });

    it('handles Send notification type', async () => {
      sendNotif(notificationMessage('Send'));
      await handleSESWebhook(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ type: 'Send' }));
    });

    it('handles Reject notification type', async () => {
      sendNotif(notificationMessage('Reject', { reject: { reason: 'spam' } }));
      await handleSESWebhook(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('handles Open notification type', async () => {
      sendNotif(notificationMessage('Open'));
      await handleSESWebhook(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('handles Click notification type', async () => {
      sendNotif(notificationMessage('Click', { click: { link: 'https://x' } }));
      await handleSESWebhook(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('handles Rendering Failure notification type', async () => {
      sendNotif(notificationMessage('Rendering Failure', { failure: { templateName: 't', errorMessage: 'bad' } }));
      await handleSESWebhook(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('handles unknown notification type (default branch)', async () => {
      sendNotif(notificationMessage('MysteryType'));
      await handleSESWebhook(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ type: 'MysteryType' }));
    });

    it('handles Notification with eventType instead of notificationType', async () => {
      sendNotif(JSON.stringify({ eventType: 'Open', mail: { messageId: 'm' } }));
      await handleSESWebhook(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 200 ack when notification processing throws (no retry)', async () => {
      // Force handleBounce to throw by making User.findOne reject.
      User.findOne.mockRejectedValue(new Error('db down'));
      sendNotif(notificationMessage('Bounce', { bounce: { bounceType: 'Permanent', bouncedRecipients: [{ emailAddress: 'a@b.com' }] } }));
      await handleSESWebhook(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Notification processing failed but acknowledged' }));
    });

    it('returns 400 for an unknown top-level SNS message type', async () => {
      sendNotif(notificationMessage('Send'));
      req.body.Type = 'SomethingElse';
      await handleSESWebhook(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unknown message type' });
    });

    it('accepts a stringified SNS body and parses it', async () => {
      const message = { Type: 'Notification', Message: notificationMessage('Open'), MessageId: '1', TopicArn: 'arn', Signature: 'sig', SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/cert.pem' };
      req.body = JSON.stringify(message);
      await handleSESWebhook(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 400 when the stringified body is invalid JSON', async () => {
      req.body = '{ broken';
      await handleSESWebhook(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid JSON' });
    });
  });

  describe('handleSESWebhook - bounce / complaint / delivery internals', () => {
    beforeEach(() => {
      EmailMetrics.findOne.mockResolvedValue({ recordEvent: vi.fn().mockResolvedValue({}) });
    });

    it('records a permanent bounce for a known user', async () => {
      const pref = { recordBounce: vi.fn().mockResolvedValue({}), save: vi.fn().mockResolvedValue({}), emailStatus: {} };
      User.findOne.mockResolvedValue({ _id: 'u1' });
      EmailPreference.findOne.mockResolvedValue(pref);
      req.body = { Type: 'Notification', Message: notificationMessage('Bounce', { bounce: { bounceType: 'Permanent', bounceSubType: 'General', bouncedRecipients: [{ emailAddress: 'a@b.com', diagnosticCode: 'd', status: '5.1.1', action: 'failed' }], timestamp: new Date().toISOString() } }), MessageId: '1', TopicArn: 'arn', Signature: 'sig', SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/cert.pem' };

      await handleSESWebhook(req, res);
      expect(pref.recordBounce).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('records a transient bounce that does NOT cross the threshold', async () => {
      const pref = { recordBounce: vi.fn(), save: vi.fn().mockResolvedValue({}), emailStatus: { bounceCount: 0 } };
      User.findOne.mockResolvedValue({ _id: 'u1' });
      EmailPreference.findOne.mockResolvedValue(pref);
      EmailMetrics.countDocuments.mockResolvedValue(1); // below 3
      req.body = { Type: 'Notification', Message: notificationMessage('Bounce', { bounce: { bounceType: 'Transient', bounceSubType: 'MailboxFull', bouncedRecipients: [{ emailAddress: 'a@b.com' }], timestamp: new Date().toISOString() } }), MessageId: '1', TopicArn: 'arn', Signature: 'sig', SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/cert.pem' };

      await handleSESWebhook(req, res);
      expect(pref.save).toHaveBeenCalled();
      expect(pref.recordBounce).not.toHaveBeenCalled();
    });

    it('records a transient bounce that DOES cross the threshold', async () => {
      const pref = { recordBounce: vi.fn().mockResolvedValue({}), save: vi.fn(), emailStatus: { bounceCount: 2 } };
      User.findOne.mockResolvedValue({ _id: 'u1' });
      EmailPreference.findOne.mockResolvedValue(pref);
      EmailMetrics.countDocuments.mockResolvedValue(3); // >= 3
      req.body = { Type: 'Notification', Message: notificationMessage('Bounce', { bounce: { bounceType: 'Transient', bounceSubType: 'MailboxFull', bouncedRecipients: [{ emailAddress: 'a@b.com' }], timestamp: new Date().toISOString() } }), MessageId: '1', TopicArn: 'arn', Signature: 'sig', SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/cert.pem' };

      await handleSESWebhook(req, res);
      expect(pref.recordBounce).toHaveBeenCalled();
    });

    it('handles an Undetermined bounce as transient', async () => {
      const pref = { save: vi.fn().mockResolvedValue({}), emailStatus: { bounceCount: 0 } };
      User.findOne.mockResolvedValue({ _id: 'u1' });
      EmailPreference.findOne.mockResolvedValue(pref);
      req.body = { Type: 'Notification', Message: notificationMessage('Bounce', { bounce: { bounceType: 'Undetermined', bouncedRecipients: [{ emailAddress: 'a@b.com' }], timestamp: new Date().toISOString() } }), MessageId: '1', TopicArn: 'arn', Signature: 'sig', SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/cert.pem' };

      await handleSESWebhook(req, res);
      expect(pref.save).toHaveBeenCalled();
    });

    it('creates default preferences for a known user with none on bounce', async () => {
      const pref = { recordBounce: vi.fn().mockResolvedValue({}), emailStatus: {} };
      User.findOne.mockResolvedValue({ _id: 'u1' });
      EmailPreference.findOne.mockResolvedValue(null);
      EmailPreference.createDefaultPreferences.mockResolvedValue(pref);
      req.body = { Type: 'Notification', Message: notificationMessage('Bounce', { bounce: { bounceType: 'Permanent', bounceSubType: 'General', bouncedRecipients: [{ emailAddress: 'a@b.com' }], timestamp: new Date().toISOString() } }), MessageId: '1', TopicArn: 'arn', Signature: 'sig', SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/cert.pem' };

      await handleSESWebhook(req, res);
      expect(EmailPreference.createDefaultPreferences).toHaveBeenCalledWith('u1');
    });

    it('records a complaint with abuse feedback type for a known user', async () => {
      const pref = { recordComplaint: vi.fn().mockResolvedValue({}) };
      User.findOne.mockResolvedValue({ _id: 'u1' });
      EmailPreference.findOne.mockResolvedValue(pref);
      req.body = { Type: 'Notification', Message: notificationMessage('Complaint', { complaint: { complaintFeedbackType: 'abuse', complainedRecipients: [{ emailAddress: 'a@b.com' }], timestamp: new Date().toISOString() } }), MessageId: '1', TopicArn: 'arn', Signature: 'sig', SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/cert.pem' };

      await handleSESWebhook(req, res);
      expect(pref.recordComplaint).toHaveBeenCalledWith('abuse', expect.any(String));
    });

    it('walks complaint feedback type severity branches', async () => {
      const types = ['auth-failure', 'fraud', 'not-spam', 'other', 'virus', 'custom'];
      for (const t of types) {
        const pref = { recordComplaint: vi.fn().mockResolvedValue({}) };
        User.findOne.mockResolvedValueOnce({ _id: 'u1' });
        EmailPreference.findOne.mockResolvedValueOnce(pref);
        req.body = { Type: 'Notification', Message: notificationMessage('Complaint', { complaint: { complaintFeedbackType: t, complainedRecipients: [{ emailAddress: 'a@b.com' }], timestamp: new Date().toISOString() } }), MessageId: '1', TopicArn: 'arn', Signature: 'sig', SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/cert.pem' };
        await handleSESWebhook(req, res);
      }
      expect(res.status).toHaveBeenLastCalledWith(200);
    });

    it('logs but does not throw for a complaint from an unknown email', async () => {
      User.findOne.mockResolvedValue(null);
      req.body = { Type: 'Notification', Message: notificationMessage('Complaint', { complaint: { complaintFeedbackType: 'abuse', complainedRecipients: [{ emailAddress: 'x@y.com' }], timestamp: new Date().toISOString() } }), MessageId: '1', TopicArn: 'arn', Signature: 'sig', SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/cert.pem' };

      await handleSESWebhook(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('marks an email valid after a successful delivery', async () => {
      const pref = { emailStatus: { isValid: false }, save: vi.fn().mockResolvedValue({}) };
      User.findOne.mockResolvedValue({ _id: 'u1' });
      EmailPreference.findOne.mockResolvedValue(pref);
      req.body = { Type: 'Notification', Message: notificationMessage('Delivery', { delivery: { recipients: ['a@b.com'], processingTimeMillis: 10, smtpResponse: '250 OK', timestamp: new Date().toISOString() } }), MessageId: '1', TopicArn: 'arn', Signature: 'sig', SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/cert.pem' };

      await handleSESWebhook(req, res);
      expect(pref.emailStatus.isValid).toBe(true);
      expect(pref.save).toHaveBeenCalled();
    });

    it('delivers without a messageId without error', async () => {
      req.body = { Type: 'Notification', Message: JSON.stringify({ notificationType: 'Delivery', mail: {}, delivery: { recipients: ['a@b.com'], timestamp: new Date().toISOString() } }), MessageId: '1', TopicArn: 'arn', Signature: 'sig', SigningCertURL: 'https://sns.eu-west-1.amazonaws.com/cert.pem' };

      await handleSESWebhook(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('handleUnsubscribe', () => {
    it('returns 400 when no token is provided', async () => {
      req.params = {};
      await handleUnsubscribe(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 for an invalid/expired token', async () => {
      req.params = { token: 't' };
      EmailPreference.findByUnsubscribeToken.mockResolvedValue(null);
      await handleUnsubscribe(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('unsubscribes from notifications category', async () => {
      const pref = { updatePreferences: vi.fn().mockResolvedValue({}) };
      req.params = { token: 't' };
      req.query = { category: 'notifications' };
      EmailPreference.findByUnsubscribeToken.mockResolvedValue(pref);
      await handleUnsubscribe(req, res);
      expect(pref.updatePreferences).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('defaults to marketing unsubscribe when no category/all provided', async () => {
      const pref = { updatePreferences: vi.fn().mockResolvedValue({}) };
      req.params = { token: 't' };
      req.query = {};
      EmailPreference.findByUnsubscribeToken.mockResolvedValue(pref);
      await handleUnsubscribe(req, res);
      expect(pref.updatePreferences).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('marketing') }));
    });

    it('returns 500 when updatePreferences throws', async () => {
      const pref = { updatePreferences: vi.fn().mockRejectedValue(new Error('boom')) };
      req.params = { token: 't' };
      req.query = { all: 'true' };
      EmailPreference.findByUnsubscribeToken.mockResolvedValue(pref);
      await handleUnsubscribe(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getEmailPreferences', () => {
    it('creates default preferences when none exist', async () => {
      EmailPreference.findOne.mockResolvedValue(null);
      EmailPreference.createDefaultPreferences.mockResolvedValue({
        notifications: {}, marketing: {}, globalUnsubscribe: false, emailStatus: { isValid: true }
      });
      await getEmailPreferences(req, res);
      expect(EmailPreference.createDefaultPreferences).toHaveBeenCalledWith('user123');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 500 on error', async () => {
      EmailPreference.findOne.mockRejectedValue(new Error('boom'));
      await getEmailPreferences(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateEmailPreferences', () => {
    it('updates preferences successfully', async () => {
      const pref = {
        updatePreferences: vi.fn().mockResolvedValue({}),
        notifications: {}, marketing: {}, globalUnsubscribe: false
      };
      req.body = { marketing: { promotions: false } };
      EmailPreference.findOne.mockResolvedValue(pref);
      await updateEmailPreferences(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('rejects disallowed update keys with 400', async () => {
      const pref = { updatePreferences: vi.fn() };
      req.body = { role: 'admin' }; // not in allowed list
      EmailPreference.findOne.mockResolvedValue(pref);
      await updateEmailPreferences(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(pref.updatePreferences).not.toHaveBeenCalled();
    });

    it('creates default preferences when none exist before updating', async () => {
      const pref = { updatePreferences: vi.fn().mockResolvedValue({}), notifications: {}, marketing: {}, globalUnsubscribe: false };
      EmailPreference.findOne.mockResolvedValue(null);
      EmailPreference.createDefaultPreferences.mockResolvedValue(pref);
      req.body = { globalUnsubscribe: true };
      await updateEmailPreferences(req, res);
      expect(EmailPreference.createDefaultPreferences).toHaveBeenCalled();
    });

    it('returns 500 on error', async () => {
      EmailPreference.findOne.mockRejectedValue(new Error('boom'));
      req.body = { marketing: {} };
      await updateEmailPreferences(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
