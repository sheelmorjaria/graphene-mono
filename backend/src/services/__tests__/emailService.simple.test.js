import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock AWS SDK before importing
const mockSend = vi.fn();
const mockSESClient = {
  send: mockSend,
  config: {
    region: 'us-east-1',
    credentials: vi.fn()
  }
};

vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: vi.fn(() => mockSESClient),
  SendEmailCommand: vi.fn((input) => ({ input }))
}));

vi.mock('@aws-sdk/credential-providers', () => ({
  fromEnv: vi.fn(() => ({
    accessKeyId: 'test-key',
    secretAccessKey: 'test-secret'
  }))
}));

describe('Email Service - Core Functionality', () => {
  let emailService;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    mockSend.mockResolvedValue({
      $metadata: { httpStatusCode: 200 },
      MessageId: 'test-message-id'
    });

    // Import email service after mocks are set up
    const emailServiceModule = await import('../emailService.js');
    emailService = emailServiceModule.default;
  });

  describe('Service Initialization', () => {
    it('should initialize with default configuration', async () => {
      expect(emailService).toBeDefined();
    });

    it('should have isEnabled property', () => {
      expect(typeof emailService.isEnabled).toBe('boolean');
    });

    it('should have required methods', () => {
      expect(typeof emailService.sendEmail).toBe('function');
      expect(typeof emailService.verifyConnection).toBe('function');
    });
  });

  describe('Send Email Functionality', () => {
    it('should send email successfully', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlContent: '<p>Test HTML message</p>'
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should handle multiple recipients', async () => {
      const result = await emailService.sendEmail({
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Test Subject',
        htmlContent: '<p>Test HTML message</p>'
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should handle text content', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        textContent: 'Test message'
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should handle both HTML and text content', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlContent: '<p>Test HTML message</p>',
        textContent: 'Test message'
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should handle custom from address', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlContent: '<p>Test HTML message</p>',
        from: 'custom@example.com'
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('Connection Verification', () => {
    it('should verify connection successfully', async () => {
      const result = await emailService.verifyConnection();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Specialized Email Methods', () => {
    const mockOrder = {
      _id: 'order123',
      orderNumber: 'ORD-001',
      customerEmail: 'customer@example.com',
      customerName: 'Test Customer',
      orderDate: new Date(),
      items: [{
        productName: 'GrapheneOS Pixel 7',
        quantity: 1,
        unitPrice: 599.99,
        totalPrice: 599.99
      }],
      totalAmount: 599.99,
      orderTotal: 599.99,
      shippingAddress: {
        fullName: 'Test Customer',
        addressLine1: '123 Test St',
        city: 'Test City',
        postalCode: 'TE5T 1NG',
        country: 'United Kingdom'
      },
      paymentMethod: {
        type: 'paypal',
        name: 'PayPal'
      }
    };

    it('should send order confirmation email', async () => {
      const result = await emailService.sendOrderConfirmationEmail(mockOrder);
      if (!result.success) {
        console.log('Order confirmation error:', result.error);
      }
      expect(result.success).toBe(true);
    });

    it('should send order cancellation email', async () => {
      const result = await emailService.sendOrderCancellationEmail(mockOrder);
      expect(result.success).toBe(true);
    });

    it('should send order shipped email', async () => {
      const result = await emailService.sendOrderShippedEmail(mockOrder);
      expect(result.success).toBe(true);
    });

    it('should send order delivered email', async () => {
      const result = await emailService.sendOrderDeliveredEmail(mockOrder);
      expect(result.success).toBe(true);
    });
  });

  describe('Support and Contact Email Methods', () => {
    const mockContactRequest = {
      from: 'customer@example.com',
      subject: 'Test Subject',
      message: 'Test message'
    };

    it('should send support request email', async () => {
      const result = await emailService.sendSupportRequestEmail(mockContactRequest);
      expect(result.success).toBe(true);
    });

    it('should send contact acknowledgment email', async () => {
      const result = await emailService.sendContactAcknowledgmentEmail(mockContactRequest);
      expect(result.success).toBe(true);
    });
  });
});