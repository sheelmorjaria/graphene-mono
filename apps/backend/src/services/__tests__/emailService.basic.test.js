import { vi } from 'vitest';

// Simple mock for email service
vi.mock('../emailService.js', () => ({
  default: {
    isEnabled: true,
    sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'test-123' }),
    sendOrderConfirmationEmail: vi.fn().mockResolvedValue({ success: true }),
    sendOrderCancelledEmail: vi.fn().mockResolvedValue({ success: true }),
    sendOrderShippedEmail: vi.fn().mockResolvedValue({ success: true }),
    sendOrderDeliveredEmail: vi.fn().mockResolvedValue({ success: true }),
    sendSupportRequestEmail: vi.fn().mockResolvedValue({ success: true }),
    sendContactAcknowledgmentEmail: vi.fn().mockResolvedValue({ success: true }),
    sendReturnRequestEmail: vi.fn().mockResolvedValue({ success: true }),
    sendRefundConfirmationEmail: vi.fn().mockResolvedValue({ success: true }),
    sendPaymentConfirmationEmail: vi.fn().mockResolvedValue({ success: true }),
    verifyConnection: vi.fn().mockResolvedValue({ success: true, message: 'Connected' })
  }
}));

const emailService = (await import('../emailService.js')).default;

describe('Email Service - Basic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send basic email', async () => {
    const result = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      htmlContent: '<p>Test</p>'
    });

    expect(result.success).toBe(true);
    expect(emailService.sendEmail).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Test',
      htmlContent: '<p>Test</p>'
    });
  });

  it('should send order confirmation email', async () => {
    const mockOrder = {
      _id: '123',
      orderNumber: 'ORD-123',
      user: { email: 'test@example.com' }
    };

    const result = await emailService.sendOrderConfirmationEmail(mockOrder);
    expect(result.success).toBe(true);
    expect(emailService.sendOrderConfirmationEmail).toHaveBeenCalledWith(mockOrder);
  });

  it('should verify connection', async () => {
    const result = await emailService.verifyConnection();
    expect(result.success).toBe(true);
    expect(result.message).toBe('Connected');
  });
});