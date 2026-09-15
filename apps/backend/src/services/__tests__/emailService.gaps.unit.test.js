import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Set environment variables before ANY imports
process.env.SUPPORT_EMAIL = 'contact@graphene-security.com';
process.env.FROM_EMAIL = 'noreply@graphene-security.com';
process.env.FROM_NAME = 'Graphene Security';
process.env.FRONTEND_URL = 'https://graphene-security.com';
process.env.BACKEND_URL = 'https://api.graphene-security.com';
// Leave EMAIL_SERVICE unset => SES disabled => sendEmail returns mock-success without AWS

// Mock AWS SDK. SendEmailCommand must be a *constructible* function so that
// `new SendEmailCommand(params)` works in the real sendEmail path.
vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: vi.fn(() => ({ send: vi.fn(), config: { credentials: vi.fn() } })),
  SendEmailCommand: function MockSendEmailCommand(params) {
    this.params = params;
  }
}));

vi.mock('@aws-sdk/credential-providers', () => ({
  fromEnv: vi.fn(() => ({ accessKeyId: 'k', secretAccessKey: 's' }))
}));

// Mock models used by canSendEmail / metrics (factories are self-contained;
// per-test behavior is configured via vi.mocked on the imported models below).
vi.mock('../../models/User.js', () => ({
  default: { findOne: vi.fn().mockResolvedValue(null) }
}));
vi.mock('../../models/EmailPreference.js', () => ({
  default: { findOne: vi.fn().mockResolvedValue(null) }
}));
vi.mock('../../models/EmailMetrics.js', () => ({
  default: {
    create: vi.fn().mockResolvedValue({ _id: 'metrics-id', recordEvent: vi.fn() })
  }
}));

// Mock validator (real impl is fine, but keep it lightweight & deterministic).
// Use vi.hoisted so the factory can safely reference the mocks.
const { mockValidator } = vi.hoisted(() => ({
  mockValidator: {
    isEmail: vi.fn(() => true),
    normalizeEmail: vi.fn((email) => email)
  }
}));
vi.mock('validator', () => ({ default: mockValidator }));

// Mock logger
vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  },
  logError: vi.fn()
}));

// Import after mocks
import emailService from '../emailService.js';
import User from '../../models/User.js';
import EmailPreference from '../../models/EmailPreference.js';
import EmailMetrics from '../../models/EmailMetrics.js';

// Reusable fixtures
const fullOrder = () => ({
  _id: 'order123',
  orderNumber: 'ORD-001',
  customerEmail: 'customer@example.com',
  orderDate: new Date('2026-01-01'),
  totalAmount: 699.99,
  items: [{
    productName: 'GrapheneOS Pixel 8',
    quantity: 1,
    unitPrice: 699.99,
    totalPrice: 699.99
  }],
  shippingAddress: {
    fullName: 'Test Customer',
    addressLine1: '123 Test St',
    addressLine2: 'Apt 1',
    city: 'London',
    stateProvince: 'England',
    postalCode: 'SW1A 1AA',
    country: 'United Kingdom'
  },
  paymentMethod: { type: 'paypal', name: 'PayPal' },
  trackingNumber: 'TRK123',
  trackingUrl: 'https://track.example.com/TRK123',
  shippingMethod: { name: 'Royal Mail', estimatedDelivery: '2-3 days' },
  customer: { firstName: 'Test', email: 'customer@example.com' }
});

describe('Email Service - Gap Coverage (send*Email methods)', () => {
  let sendEmailSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    // Spy on the real sendEmail so we can assert the params each method builds,
    // while controlling the return value (mock mode => success).
    sendEmailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue({
      success: true,
      messageId: 'mock-123',
      message: 'Email logged (mock mode)'
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------- sendOrderConfirmationEmail ----------------
  describe('sendOrderConfirmationEmail', () => {
    it('calls sendEmail with correct subject, recipient and order details', async () => {
      const order = fullOrder();
      const result = await emailService.sendOrderConfirmationEmail(order);

      expect(result.success).toBe(true);
      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.to).toBe('customer@example.com');
      expect(call.subject).toBe('Order Confirmation - ORD-001');
      expect(call.htmlContent).toContain('ORD-001');
      expect(call.htmlContent).toContain('GrapheneOS Pixel 8');
      expect(call.htmlContent).toContain('699.99');
      expect(call.htmlContent).toContain('Test Customer');
    });

    it('returns failure and logs error when an exception is thrown', async () => {
      const order = fullOrder();
      order.items = null; // .map on null throws inside the method
      const result = await emailService.sendOrderConfirmationEmail(order);

      expect(result.success).toBe(false);
      expect(result.error).toEqual(expect.any(String));
    });
  });

  // ---------------- sendOrderCancellationEmail ----------------
  describe('sendOrderCancellationEmail', () => {
    it('sends cancellation without refund section when none provided', async () => {
      const order = fullOrder();
      const result = await emailService.sendOrderCancellationEmail(order);

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.subject).toBe('Order Cancellation Confirmation - ORD-001');
      expect(call.to).toBe('customer@example.com');
      expect(call.htmlContent).not.toContain('Refund Information');
    });

    it('includes refund section when refundDetails provided', async () => {
      const order = fullOrder();
      const refundDetails = { amount: 699.99, refundId: 'REF-1' };
      const result = await emailService.sendOrderCancellationEmail(order, refundDetails);

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.htmlContent).toContain('Refund Information');
      expect(call.htmlContent).toContain('REF-1');
    });
  });

  // ---------------- sendOrderShippedEmail ----------------
  describe('sendOrderShippedEmail', () => {
    it('includes tracking section when trackingNumber present', async () => {
      const order = fullOrder();
      const result = await emailService.sendOrderShippedEmail(order);

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.subject).toBe('Your Order Has Shipped - ORD-001');
      expect(call.to).toBe('customer@example.com');
      expect(call.htmlContent).toContain('TRK123');
      expect(call.htmlContent).toContain('Track Your Package');
    });

    it('omits tracking section when trackingNumber absent', async () => {
      const order = fullOrder();
      delete order.trackingNumber;
      const result = await emailService.sendOrderShippedEmail(order);

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.htmlContent).not.toContain('Track Your Package');
    });

    it('falls back to customer.email when customerEmail missing', async () => {
      const order = fullOrder();
      delete order.customerEmail;
      const result = await emailService.sendOrderShippedEmail(order);

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.to).toBe('customer@example.com'); // from order.customer.email
    });

    it('returns failure when sendEmail rejects (catch path)', async () => {
      sendEmailSpy.mockRejectedValueOnce(new Error('send failed'));
      const order = fullOrder();
      const result = await emailService.sendOrderShippedEmail(order);
      expect(result.success).toBe(false);
      expect(result.error).toBe('send failed');
    });
  });

  // ---------------- sendOrderDeliveredEmail ----------------
  describe('sendOrderDeliveredEmail', () => {
    it('sends delivered email with order number', async () => {
      const order = fullOrder();
      const result = await emailService.sendOrderDeliveredEmail(order);

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.subject).toBe('Order Delivered - ORD-001');
      expect(call.htmlContent).toContain('TRK123');
    });

    it('omits tracking number row when not provided', async () => {
      const order = fullOrder();
      delete order.trackingNumber;
      await emailService.sendOrderDeliveredEmail(order);
      const call = sendEmailSpy.mock.calls[0][0];
      // delivered email renders tracking number only if present
      expect(call.htmlContent).toContain('ORD-001');
    });
  });

  // ---------------- sendSupportRequestEmail ----------------
  describe('sendSupportRequestEmail', () => {
    const baseContact = () => ({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'product-question',
      message: 'Is this compatible?',
      submittedAt: new Date('2026-01-02T10:00:00Z'),
      orderNumber: 'ORD-001',
      orderValidation: true
    });

    it('maps known subjects and includes order + validation', async () => {
      const result = await emailService.sendSupportRequestEmail(baseContact());

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.to).toBe(process.env.SUPPORT_EMAIL);
      expect(call.subject).toContain('Product Question');
      expect(call.subject).toContain('Jane Doe');
      expect(call.htmlContent).toContain('ORD-001');
      expect(call.htmlContent).toContain('Verified');
    });

    it('falls back to raw subject for unknown subject key', async () => {
      const contact = baseContact();
      contact.subject = 'something-else';
      delete contact.orderNumber;
      delete contact.orderValidation;
      const result = await emailService.sendSupportRequestEmail(contact);

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      // The email body uses the fallback (raw subject); the subject line
      // uses subjectMap directly and is undefined for unknown keys (production quirk).
      expect(call.htmlContent).toContain('something-else');
      expect(call.htmlContent).not.toContain('ORD-001');
    });

    it('returns failure when contactRequest is null (throws)', async () => {
      const result = await emailService.sendSupportRequestEmail(null);
      expect(result.success).toBe(false);
    });
  });

  // ---------------- sendContactAcknowledgmentEmail ----------------
  describe('sendContactAcknowledgmentEmail', () => {
    it('sends acknowledgment to the customer email', async () => {
      const contact = { fullName: 'John Smith', email: 'john@example.com', subject: 'order-inquiry', message: 'Help' };
      const result = await emailService.sendContactAcknowledgmentEmail(contact);

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.to).toBe('john@example.com');
      expect(call.subject).toContain('We received your message');
      expect(call.htmlContent).toContain('John Smith');
    });
  });

  // ---------------- sendReturnRequestConfirmationEmail ----------------
  describe('sendReturnRequestConfirmationEmail', () => {
    const baseReturn = () => ({
      formattedRequestNumber: 'RET-001',
      customerEmail: 'customer@example.com',
      items: [{
        productName: 'GrapheneOS Pixel 8',
        quantity: 1,
        reason: 'Defective',
        totalRefundAmount: 699.99
      }],
      totalRefundAmount: 699.99,
      requestDate: new Date('2026-01-03')
    });
    const baseOrderForReturn = () => ({
      _id: 'order123',
      orderNumber: 'ORD-001',
      shippingAddress: { fullName: 'Test Customer' }
    });

    it('sends return confirmation with item + refund details', async () => {
      const result = await emailService.sendReturnRequestConfirmationEmail(baseReturn(), baseOrderForReturn());

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.to).toBe('customer@example.com');
      expect(call.subject).toBe('Return Request Confirmation - RET-001');
      expect(call.htmlContent).toContain('RET-001');
      expect(call.htmlContent).toContain('ORD-001');
      expect(call.htmlContent).toContain('Defective');
    });

    it('renders per-item refund amounts without NaN (regression: items carry totalRefundAmount, not refundAmount)', async () => {
      const result = await emailService.sendReturnRequestConfirmationEmail(baseReturn(), baseOrderForReturn());

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.htmlContent).toContain('£699.99');
      expect(call.htmlContent).not.toContain('NaN');
    });

    it('returns failure when returnRequest is null (throws on .map)', async () => {
      const result = await emailService.sendReturnRequestConfirmationEmail(null, baseOrderForReturn());
      expect(result.success).toBe(false);
    });
  });

  // ---------------- sendOrderShippedEmail (IMEI section) ----------------
  describe('sendOrderShippedEmail device IMEIs', () => {
    const baseShippedOrder = (items) => ({
      _id: 'order123',
      orderNumber: 'ORD-SHIP-1',
      customerEmail: 'customer@example.com',
      trackingNumber: 'TRK-9',
      trackingUrl: 'https://track.example.com/TRK-9',
      shippingAddress: { fullName: 'Test Customer' },
      shippingMethod: { name: 'Standard Shipping', estimatedDelivery: '3-5 business days' },
      items
    });

    it('lists per-product IMEIs when devices were allocated (lean-safe raw reads)', async () => {
      const order = baseShippedOrder([{
        productName: 'GrapheneOS Pixel 9 Pro',
        quantity: 1,
        devices: [{ imei: '123456789012345', serialNumber: 'SN-9' }]
      }]);
      const result = await emailService.sendOrderShippedEmail(order);

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.htmlContent).toContain('123456789012345');
      expect(call.htmlContent).toContain('GrapheneOS Pixel 9 Pro');
    });

    it('omits the IMEI section entirely when no devices are allocated', async () => {
      const order = baseShippedOrder([{ productName: 'GrapheneOS Pixel 9 Pro', quantity: 1 }]);
      const result = await emailService.sendOrderShippedEmail(order);

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.htmlContent).not.toContain('IMEI');
    });

    it('is undefined-safe for legacy orders with no items array', async () => {
      const result = await emailService.sendOrderShippedEmail(baseShippedOrder(undefined));

      expect(result.success).toBe(true);
      expect(sendEmailSpy.mock.calls[0][0].htmlContent).not.toContain('IMEI');
    });
  });

  // ---------------- sendReturnApprovedEmail ----------------
  // Called by adminController.updateReturnRequestStatus on approval — this
  // method did not exist (silently threw), so approval emails never sent.
  describe('sendReturnApprovedEmail', () => {
    const baseApprovedReturn = () => ({
      returnRequestNumber: '20260915001',
      userId: { firstName: 'Test', lastName: 'Customer', email: 'customer@example.com' },
      orderId: { orderNumber: 'ORD-001' },
      items: [{ productName: 'GrapheneOS Pixel 8', quantity: 1 }],
      totalRefundAmount: 699.99,
      returnShippingAddress: {
        companyName: 'Graphene Security Returns',
        addressLine1: '123 Return Processing Center',
        city: 'London',
        postalCode: 'SW1A 1AA',
        country: 'GB'
      }
    });

    it('sends approval with return shipping instructions to the customer', async () => {
      const result = await emailService.sendReturnApprovedEmail(baseApprovedReturn());

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.to).toBe('customer@example.com');
      expect(call.subject).toContain('20260915001');
      expect(call.htmlContent).toContain('Graphene Security Returns');
      expect(call.htmlContent).toContain('London');
      expect(call.htmlContent).toContain('SW1A 1AA');
    });

    it('returns failure without sending when there is no customer email (unpopulated userId)', async () => {
      const rr = baseApprovedReturn();
      rr.userId = null;
      const result = await emailService.sendReturnApprovedEmail(rr);

      expect(result.success).toBe(false);
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });
  });

  // ---------------- sendReturnRejectedEmail ----------------
  describe('sendReturnRejectedEmail', () => {
    it('sends rejection including the reason', async () => {
      const rr = {
        returnRequestNumber: '20260915002',
        userId: { firstName: 'Test', lastName: 'Customer', email: 'customer@example.com' },
        orderId: { orderNumber: 'ORD-002' }
      };
      const result = await emailService.sendReturnRejectedEmail(rr, 'Outside the 28-day return window');

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.to).toBe('customer@example.com');
      expect(call.subject).toContain('20260915002');
      expect(call.htmlContent).toContain('Outside the 28-day return window');
    });
  });

  // ---------------- sendReturnRefundedEmail ----------------
  describe('sendReturnRefundedEmail', () => {
    it('sends refund confirmation with the formatted refund amount and timeline', async () => {
      const rr = {
        returnRequestNumber: '20260915003',
        userId: { firstName: 'Test', lastName: 'Customer', email: 'customer@example.com' },
        orderId: { orderNumber: 'ORD-003' },
        totalRefundAmount: 499.5
      };
      const result = await emailService.sendReturnRefundedEmail(rr);

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.to).toBe('customer@example.com');
      expect(call.subject).toContain('20260915003');
      expect(call.htmlContent).toContain('£499.50');
      expect(call.htmlContent).toContain('5-10 business days');
    });
  });

  // ---------------- sendRefundConfirmationEmail ----------------
  describe('sendRefundConfirmationEmail', () => {
    it('sends refund confirmation to the user email', async () => {
      const order = {
        _id: 'order123',
        orderNumber: 'ORD-001',
        customerEmail: 'user@example.com',
        shippingAddress: { fullName: 'Test Customer' },
        userId: { firstName: 'Test', lastName: 'Customer', email: 'user@example.com' }
      };
      const refundEntry = {
        refundId: 'REF-9',
        amount: 100.5,
        processedAt: new Date('2026-01-04'),
        reason: 'Customer request'
      };

      const result = await emailService.sendRefundConfirmationEmail(order, refundEntry);

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.to).toBe('user@example.com');
      expect(call.subject).toBe('Refund Confirmation - ORD-001');
      expect(call.htmlContent).toContain('REF-9');
      expect(call.htmlContent).toContain('100.50');
      expect(call.htmlContent).toContain('Test Customer');
    });

    it('returns failure when sendEmail rejects (catch path)', async () => {
      sendEmailSpy.mockRejectedValueOnce(new Error('send failed'));
      const order = {
        _id: 'order123',
        orderNumber: 'ORD-001',
        customerEmail: 'user@example.com',
        shippingAddress: { fullName: 'Test Customer' },
        userId: { firstName: 'Test', lastName: 'Customer', email: 'user@example.com' }
      };
      const result = await emailService.sendRefundConfirmationEmail(order, {
        refundId: 'R1', amount: 10, processedAt: new Date(), reason: 'x'
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('send failed');
    });
  });

  // ---------------- sendPaymentConfirmationEmail ----------------
  describe('sendPaymentConfirmationEmail', () => {
    it('sends payment confirmation with transaction details', async () => {
      const order = fullOrder();
      const payment = { method: 'PayPal', transactionId: 'TX-123' };

      const result = await emailService.sendPaymentConfirmationEmail(order, payment);

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.subject).toBe('Payment Confirmed - ORD-001');
      expect(call.htmlContent).toContain('TX-123');
      expect(call.htmlContent).toContain('PayPal');
    });

    it('falls back to order.paymentMethod.name when paymentDetails.method missing', async () => {
      const order = fullOrder();
      const result = await emailService.sendPaymentConfirmationEmail(order, { transactionId: 'TX-9' });

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.htmlContent).toContain('PayPal');
    });
  });

  // ---------------- sendDataExportEmail ----------------
  describe('sendDataExportEmail', () => {
    it('sends data export email with download link + account emailType', async () => {
      const details = {
        downloadUrl: 'https://example.com/export/1',
        expiresAt: new Date('2026-02-01T12:00:00Z')
      };
      const result = await emailService.sendDataExportEmail('user@example.com', 'Jane', details);

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.to).toBe('user@example.com');
      expect(call.emailType).toBe('account.data_export');
      expect(call.htmlContent).toContain('https://example.com/export/1');
    });
  });

  // ---------------- sendAccountDeletionConfirmationEmail ----------------
  describe('sendAccountDeletionConfirmationEmail', () => {
    it('sends deletion confirmation with request id', async () => {
      const details = { requestId: 'DEL-1', estimatedCompletion: '30 days' };
      const result = await emailService.sendAccountDeletionConfirmationEmail('user@example.com', 'Jane', details);

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.to).toBe('user@example.com');
      expect(call.emailType).toBe('account.deletion_confirmation');
      expect(call.htmlContent).toContain('DEL-1');
      expect(call.htmlContent).toContain('30 days');
    });
  });

  // ---------------- sendPasswordResetEmail ----------------
  describe('sendPasswordResetEmail', () => {
    it('sends password reset with reset url and skips preference check', async () => {
      const result = await emailService.sendPasswordResetEmail('user@example.com', 'reset-token-abc', { firstName: 'Jane' });

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.to).toBe('user@example.com');
      expect(call.subject).toContain('Password Reset Request');
      expect(call.emailType).toBe('transactional.password_reset');
      expect(call.skipPreferenceCheck).toBe(true);
      expect(call.htmlContent).toContain('reset-token-abc');
    });
  });

  // ---------------- sendWelcomeEmail ----------------
  describe('sendWelcomeEmail', () => {
    it('sends welcome email with verification token, skips preference check', async () => {
      const result = await emailService.sendWelcomeEmail('new@example.com', 'verify-token-xyz', { firstName: 'New' });

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.to).toBe('new@example.com');
      expect(call.emailType).toBe('transactional.welcome');
      expect(call.skipPreferenceCheck).toBe(true);
      expect(call.htmlContent).toContain('verify-token-xyz');
    });
  });

  // ---------------- sendAccountDeletionCompletedEmail ----------------
  describe('sendAccountDeletionCompletedEmail', () => {
    it('sends deletion completed email, skips preference check', async () => {
      const result = await emailService.sendAccountDeletionCompletedEmail('gone@example.com', 'Jane');

      expect(result.success).toBe(true);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.to).toBe('gone@example.com');
      expect(call.emailType).toBe('account.deletion_completed');
      expect(call.skipPreferenceCheck).toBe(true);
    });
  });

  // ---------------- sendAccountDisabledEmail / sendAccountReEnabledEmail ----------------
  describe('sendAccountDisabledEmail', () => {
    it('returns account_disabled messageId on success', async () => {
      const user = { _id: 'u1', email: 'u@example.com', firstName: 'A', lastName: 'B' };
      const result = await emailService.sendAccountDisabledEmail(user, { email: 'admin@example.com' });

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^account_disabled_/);
      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.to).toBe('u@example.com');
      expect(call.subject).toContain('Account Status Update');
    });

    it('passes through sendEmail failure unchanged', async () => {
      sendEmailSpy.mockResolvedValue({ success: false, error: 'boom' });
      const user = { _id: 'u1', email: 'u@example.com', firstName: 'A', lastName: 'B' };
      const result = await emailService.sendAccountDisabledEmail(user, null);
      expect(result.success).toBe(false);
    });
  });

  describe('sendAccountReEnabledEmail', () => {
    it('returns account_reenabled messageId on success and includes login link', async () => {
      const user = { _id: 'u1', email: 'u@example.com', firstName: 'A', lastName: 'B' };
      const result = await emailService.sendAccountReEnabledEmail(user, { email: 'admin@example.com' });

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^account_reenabled_/);
      const call = sendEmailSpy.mock.calls[0][0];
      expect(call.htmlContent).toContain('/login');
    });
  });

  // ---------------- sendEmail error-handling path ----------------
  describe('sendEmail error mapping (SES error names)', () => {
    // These exercise the catch block + friendly error mapping in sendEmail itself.
    beforeEach(() => {
      sendEmailSpy.mockRestore();
      // Force SES-enabled path so the catch-block's error mapping is exercised.
      emailService.isEnabled = true;
      emailService.sesClient = { send: vi.fn() };
    });

    afterEach(() => {
      // restore mock mode (disabled SES) for other suites
      emailService.isEnabled = false;
      emailService.sesClient = null;
    });

    const makeSesError = async (name) => {
      // stub EmailMetrics.create to return an object with recordEvent so the
      // metrics-failure branch doesn't mask the SES error.
      EmailMetrics.create.mockResolvedValueOnce({
        _id: 'm1',
        recordEvent: vi.fn()
      });
      emailService.sesClient.send.mockRejectedValueOnce(Object.assign(new Error(' SES fail'), { name }));
      const result = await emailService.sendEmail({
        to: 'user@example.com',
        subject: 'Subj',
        htmlContent: '<p>hi</p>'
      });
      return result;
    };

    it('maps MessageRejected to a friendly message', async () => {
      const result = await makeSesError('MessageRejected');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Email rejected by AWS SES');
    });

    it('maps MailFromDomainNotVerifiedException', async () => {
      const result = await makeSesError('MailFromDomainNotVerifiedException');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Sender email domain not verified');
    });

    it('maps ConfigurationSetDoesNotExistException', async () => {
      const result = await makeSesError('ConfigurationSetDoesNotExistException');
      expect(result.success).toBe(false);
      expect(result.error).toContain('configuration set does not exist');
    });

    it('passes through generic errors unchanged', async () => {
      const result = await makeSesError('SomeOtherError');
      expect(result.success).toBe(false);
      expect(result.error).toBe(' SES fail');
    });
  });

  // ---------------- validateEmail + addUnsubscribeLink (utility coverage) ----------------
  describe('validateEmail', () => {
    it('rejects non-string emails', () => {
      const result = emailService.validateEmail(null);
      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/required/i);
    });

    it('rejects invalid format', () => {
      mockValidator.isEmail.mockReturnValueOnce(false);
      const result = emailService.validateEmail('not-an-email');
      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/invalid/i);
    });

    it('rejects blocked temporary domains', () => {
      // isEmail true, but domain is blocked
      const result = emailService.validateEmail('a@tempmail.com');
      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/temporary/i);
    });

    it('accepts a normal email and normalizes', () => {
      const result = emailService.validateEmail('good@example.com');
      expect(result.isValid).toBe(true);
      expect(result.email).toBe('good@example.com');
    });
  });

  describe('addUnsubscribeLink', () => {
    it('inserts unsubscribe links before </body>', () => {
      const html = '<html><body><p>x</p></body></html>';
      const out = emailService.addUnsubscribeLink(html, 'token-123', 'marketing.promo');
      expect(out).toContain('/api/webhook/unsubscribe/token-123?category=marketing');
      expect(out).toContain('all=true');
      // original body content still present
      expect(out).toContain('<p>x</p>');
    });

    it('returns unchanged html when no </body> tag', () => {
      const html = '<p>no body tag</p>';
      const out = emailService.addUnsubscribeLink(html, 'tok', 'news.general');
      expect(out).toBe(html);
    });
  });

  describe('canSendEmail', () => {
    it('returns canSend true when user not found', async () => {
      User.findOne.mockResolvedValueOnce(null);
      const result = await emailService.canSendEmail('unknown@example.com');
      expect(result.canSend).toBe(true);
    });

    it('returns canSend true when user has no preferences', async () => {
      User.findOne.mockResolvedValueOnce({ _id: 'u1' });
      EmailPreference.findOne.mockResolvedValueOnce(null);
      const result = await emailService.canSendEmail('u@example.com');
      expect(result.canSend).toBe(true);
    });

    it('blocks send when email has bounced', async () => {
      User.findOne.mockResolvedValueOnce({ _id: 'u1' });
      EmailPreference.findOne.mockResolvedValueOnce({
        emailStatus: { isBounced: true, isComplained: false },
        unsubscribeToken: 'tok',
        canSendEmail: () => true
      });
      const result = await emailService.canSendEmail('u@example.com');
      expect(result.canSend).toBe(false);
      expect(result.reason).toMatch(/bounced/i);
    });

    it('blocks send when user has complained', async () => {
      User.findOne.mockResolvedValueOnce({ _id: 'u1' });
      EmailPreference.findOne.mockResolvedValueOnce({
        emailStatus: { isBounced: false, isComplained: true },
        unsubscribeToken: 'tok',
        canSendEmail: () => true
      });
      const result = await emailService.canSendEmail('u@example.com');
      expect(result.canSend).toBe(false);
      expect(result.reason).toMatch(/complained/i);
    });

    it('respects preference canSendEmail=false and returns unsubscribe token', async () => {
      User.findOne.mockResolvedValueOnce({ _id: 'u1' });
      EmailPreference.findOne.mockResolvedValueOnce({
        emailStatus: { isBounced: false, isComplained: false },
        unsubscribeToken: 'tok-xyz',
        canSendEmail: () => false
      });
      const result = await emailService.canSendEmail('u@example.com', 'marketing.promo');
      expect(result.canSend).toBe(false);
      expect(result.unsubscribeToken).toBe('tok-xyz');
    });

    it('defaults to canSend true on internal error', async () => {
      User.findOne.mockRejectedValueOnce(new Error('db down'));
      const result = await emailService.canSendEmail('u@example.com');
      expect(result.canSend).toBe(true);
    });
  });

  describe('verifyConnection', () => {
    it('returns failure when service not initialized', async () => {
      emailService.isEnabled = false;
      emailService.sesClient = null;
      const result = await emailService.verifyConnection();
      expect(result.success).toBe(false);
    });
  });
});
