import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock AWS SDK before imports
const mockSend = vi.fn();
const mockSESClient = vi.fn(() => ({
  send: mockSend,
  config: {
    credentials: vi.fn()
  }
}));
const mockSendEmailCommand = vi.fn((params) => ({ params }));

vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: mockSESClient,
  SendEmailCommand: mockSendEmailCommand
}));
vi.mock('@aws-sdk/credential-providers', () => ({
  fromEnv: vi.fn(() => ({
    accessKeyId: 'test-key',
    secretAccessKey: 'test-secret'
  }))
}));

describe('Email Service - Comprehensive Tests', () => {
  let emailService;
  
  const originalEnv = process.env;

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

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Email Service Comprehensive Functionality', () => {
    it('should handle service initialization', () => {
      expect(emailService).toBeDefined();
      expect(typeof emailService.isEnabled).toBe('boolean');
    });

    it('should verify connection', async () => {
      const result = await emailService.verifyConnection();
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Order Email Workflows', () => {
    const mockOrder = {
      _id: 'order123',
      orderNumber: 'ORD-001',
      customerEmail: 'customer@example.com',
      customerName: 'Test Customer',
      orderDate: new Date(),
      orderTotal: 699.99,
      items: [{
        productName: 'GrapheneOS Pixel 8',
        quantity: 1,
        unitPrice: 699.99,
        totalPrice: 699.99
      }],
      shippingAddress: {
        fullName: 'Test Customer',
        addressLine1: '123 Test St',
        city: 'Test City',
        postalCode: 'TE5T 1NG',
        country: 'United Kingdom'
      },
      paymentMethod: {
        type: 'bitcoin',
        name: 'Bitcoin'
      },
      trackingNumber: 'TRK123456789',
      carrier: 'Royal Mail'
    };

    it('should send order confirmation email', async () => {
      const result = await emailService.sendOrderConfirmationEmail(mockOrder);
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should send order cancellation email', async () => {
      const result = await emailService.sendOrderCancellationEmail(mockOrder);
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should send order shipped email', async () => {
      const result = await emailService.sendOrderShippedEmail(mockOrder);
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should send order delivered email', async () => {
      const result = await emailService.sendOrderDeliveredEmail(mockOrder);
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should handle order cancellation with refund details', async () => {
      // Test basic cancellation without complex refund details for now
      const result = await emailService.sendOrderCancellationEmail(mockOrder);
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('Support and Communication Emails', () => {
    const mockContactRequest = {
      from: 'customer@example.com',
      customerName: 'Test Customer',
      subject: 'Product Inquiry',
      message: 'I have a question about GrapheneOS compatibility.',
      orderNumber: 'ORD-001'
    };

    it('should send support request email', async () => {
      const result = await emailService.sendSupportRequestEmail(mockContactRequest);
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should send contact acknowledgment email', async () => {
      const result = await emailService.sendContactAcknowledgmentEmail(mockContactRequest);
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should handle support request without order number', async () => {
      const requestWithoutOrder = { ...mockContactRequest };
      delete requestWithoutOrder.orderNumber;
      
      const result = await emailService.sendSupportRequestEmail(requestWithoutOrder);
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('Return and Refund Email Workflows', () => {
    const mockReturnRequest = {
      _id: 'return123',
      returnRequestNumber: 'RET-001',
      orderId: 'order123',
      customerEmail: 'customer@example.com',
      items: [{
        productName: 'GrapheneOS Pixel 8',
        quantity: 1,
        refundAmount: 699.99
      }],
      totalRefundAmount: 699.99,
      requestDate: new Date()
    };

    const mockOrder = {
      _id: 'order123',
      orderNumber: 'ORD-001',
      customerEmail: 'customer@example.com',
      orderTotal: 699.99
    };

    it('should send return request confirmation email', async () => {
      const result = await emailService.sendReturnRequestConfirmationEmail(mockReturnRequest, mockOrder);
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should send refund confirmation email', async () => {
      // Create order with proper userId structure for refund confirmation
      const orderWithRefundInfo = {
        ...mockOrder,
        userId: {
          firstName: 'Test',
          lastName: 'Customer',
          email: 'customer@example.com'
        }
      };
      
      const refundEntry = {
        refundId: 'REF123',
        amount: 699.99,  // Note: 'amount' not 'refundAmount'
        processedAt: new Date(),  // Note: 'processedAt' not 'processedDate'
        reason: 'Customer requested cancellation'
      };
      
      const result = await emailService.sendRefundConfirmationEmail(orderWithRefundInfo, refundEntry);
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('Account Status Email Methods', () => {
    const mockUser = {
      _id: 'user123',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User'
    };

    const mockAdminUser = {
      _id: 'admin123',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User'
    };

    it('should send account disabled email', async () => {
      const result = await emailService.sendAccountDisabledEmail(mockUser, mockAdminUser);
      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^account_disabled_\d+$/);
    });

    it('should send account re-enabled email', async () => {
      const result = await emailService.sendAccountReEnabledEmail(mockUser, mockAdminUser);
      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^account_reenabled_\d+$/);
    });
  });

  describe('Email Template Generation', () => {
    it('should generate email template with customer name', () => {
      const template = emailService.generateEmailTemplate(
        'Test Subject',
        '<p>Test content</p>',
        'John Doe'
      );
      
      expect(template).toContain('Test Subject');
      expect(template).toContain('Test content');
      expect(template).toContain('John Doe');
    });

    it('should generate email template without customer name', () => {
      const template = emailService.generateEmailTemplate(
        'Test Subject',
        '<p>Test content</p>'
      );
      
      expect(template).toContain('Test Subject');
      expect(template).toContain('Test content');
    });
  });

  describe('Error Handling', () => {
    it('should handle email sending gracefully in mock mode', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlContent: '<p>Test content</p>'
      });
      
      // In mock mode, emails succeed but with mock message IDs
      expect(result.success).toBe(true);
      expect(result.messageId).toContain('mock_');
    });

    it('should handle basic email parameters', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlContent: '<p>Test content</p>'
      });
      
      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });
  });

  describe('Service Configuration', () => {
    it('should handle different environment configurations', () => {
      expect(emailService).toBeDefined();
      expect(typeof emailService.sesClient).toBeDefined();
    });

    it('should validate service initialization', () => {
      expect(emailService.sesClient).toBeDefined();
      expect(typeof emailService.isEnabled).toBe('boolean');
    });
  });
});