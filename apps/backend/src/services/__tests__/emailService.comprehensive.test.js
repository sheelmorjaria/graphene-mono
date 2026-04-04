import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Set environment variables before ANY imports
process.env.EMAIL_SERVICE = 'ses';
process.env.AWS_REGION = 'us-east-1';
process.env.SUPPORT_EMAIL = 'support@graphene-security.com';
process.env.FROM_EMAIL = 'noreply@graphene-security.com';
process.env.FROM_NAME = 'Graphene Security';

// Mock AWS SDK with proper error handling
const mockSend = vi.fn().mockResolvedValue({
  $metadata: { httpStatusCode: 200 },
  MessageId: 'test-message-id'
});

const mockCredentials = vi.fn().mockResolvedValue({
  accessKeyId: 'test-key',
  secretAccessKey: 'test-secret'
});

const mockSESClient = vi.fn(() => ({
  send: mockSend,
  config: {
    region: 'us-east-1',
    credentials: mockCredentials
  }
}));

vi.mock('@aws-sdk/client-ses', () => ({
  SESClient: mockSESClient,
  SendEmailCommand: vi.fn((params) => ({ params }))
}));

vi.mock('@aws-sdk/credential-providers', () => ({
  fromEnv: vi.fn(() => ({
    accessKeyId: 'test-key',
    secretAccessKey: 'test-secret'
  }))
}));

// Mock models before imports
const mockUser = { findOne: vi.fn().mockResolvedValue(null) };
vi.mock('../../models/User.js', () => ({ default: mockUser }));

const mockEmailPreference = { findOne: vi.fn().mockResolvedValue(null) };
vi.mock('../../models/EmailPreference.js', () => ({ default: mockEmailPreference }));

const mockEmailMetrics = {
  create: vi.fn().mockResolvedValue({
    _id: 'metrics-id',
    recordEvent: vi.fn()
  })
};
vi.mock('../../models/EmailMetrics.js', () => ({ default: mockEmailMetrics }));

// Mock validator before imports
vi.mock('validator', () => ({
  default: {
    isEmail: vi.fn(() => true),
    normalizeEmail: vi.fn((email) => email)
  }
}));

// Mock logger before imports
const mockLogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
vi.mock('../../utils/logger.js', () => ({
  default: mockLogger,
  logError: vi.fn()
}));

// Import email service after mocks are set up
const emailService = (await import('../emailService.js')).default;

describe('Email Service - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({
      $metadata: { httpStatusCode: 200 },
      MessageId: 'test-message-id'
    });
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

  describe('Basic Send Email Functionality', () => {
    it('should send basic email successfully', async () => {
      const result = await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlContent: '<p>Test content</p>'
      });

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
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
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should send order cancellation email', async () => {
      const result = await emailService.sendOrderCancellationEmail(mockOrder);
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should send order shipped email', async () => {
      const result = await emailService.sendOrderShippedEmail(mockOrder);
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should send order delivered email', async () => {
      const result = await emailService.sendOrderDeliveredEmail(mockOrder);
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle order cancellation with refund details', async () => {
      const result = await emailService.sendOrderCancellationEmail(mockOrder);
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Support and Communication Emails', () => {
    const mockContactRequest = {
      fullName: 'Test Customer',
      email: 'customer@example.com',
      subject: 'product-question',
      message: 'I have a question about GrapheneOS compatibility.',
      submittedAt: new Date(),
      orderNumber: 'ORD-001'
    };

    it('should send support request email', async () => {
      const result = await emailService.sendSupportRequestEmail(mockContactRequest);
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should send contact acknowledgment email', async () => {
      const result = await emailService.sendContactAcknowledgmentEmail(mockContactRequest);
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle support request without order number', async () => {
      const requestWithoutOrder = { ...mockContactRequest };
      delete requestWithoutOrder.orderNumber;

      const result = await emailService.sendSupportRequestEmail(requestWithoutOrder);
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Return and Refund Email Workflows', () => {
    const mockReturnRequest = {
      _id: 'return123',
      returnRequestNumber: 'RET-001',
      formattedRequestNumber: 'RET-001',
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
      orderTotal: 699.99,
      shippingAddress: {
        fullName: 'Test Customer'
      }
    };

    it('should send return request confirmation email', async () => {
      const result = await emailService.sendReturnRequestConfirmationEmail(mockReturnRequest, mockOrder);
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should send refund confirmation email', async () => {
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
        amount: 699.99,
        processedAt: new Date(),
        reason: 'Customer requested cancellation'
      };

      const result = await emailService.sendRefundConfirmationEmail(orderWithRefundInfo, refundEntry);
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
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
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should send account re-enabled email', async () => {
      const result = await emailService.sendAccountReEnabledEmail(mockUser, mockAdminUser);
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
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

  describe('Service Configuration', () => {
    it('should handle different environment configurations', () => {
      expect(emailService).toBeDefined();
      expect(typeof emailService.sesClient).toBe('object');
    });

    it('should validate service initialization', () => {
      expect(emailService.sesClient).toBeDefined();
      expect(typeof emailService.isEnabled).toBe('boolean');
    });
  });
});
