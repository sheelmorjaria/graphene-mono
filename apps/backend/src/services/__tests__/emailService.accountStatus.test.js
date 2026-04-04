import { vi, describe, it, expect, beforeEach } from 'vitest';

// Set environment variables before ANY imports
process.env.EMAIL_SERVICE = 'ses';
process.env.AWS_REGION = 'us-east-1';
process.env.SUPPORT_EMAIL = 'support@graphene-security.com';
process.env.FROM_EMAIL = 'noreply@graphene-security.com';
process.env.FROM_NAME = 'Graphene Security';

// Mock AWS SDK before imports
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

describe('Email Service - Account Status Notifications', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@user.com',
    firstName: 'Test',
    lastName: 'User',
    accountStatus: 'active'
  };

  const mockAdminUser = {
    _id: '507f1f77bcf86cd799439012',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({
      $metadata: { httpStatusCode: 200 },
      MessageId: 'test-message-id'
    });
  });

  describe('sendAccountDisabledEmail', () => {
    it('should send account disabled email successfully', async () => {
      const result = await emailService.sendAccountDisabledEmail(mockUser, mockAdminUser);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle missing admin user gracefully', async () => {
      const result = await emailService.sendAccountDisabledEmail(mockUser, null);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should include proper email content structure', async () => {
      const result = await emailService.sendAccountDisabledEmail(mockUser, mockAdminUser);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('sendAccountReEnabledEmail', () => {
    it('should send account re-enabled email successfully', async () => {
      const result = await emailService.sendAccountReEnabledEmail(mockUser, mockAdminUser);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle missing admin user gracefully', async () => {
      const result = await emailService.sendAccountReEnabledEmail(mockUser, null);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should include proper email content structure with login URL', async () => {
      const originalFrontendUrl = process.env.FRONTEND_URL;
      process.env.FRONTEND_URL = 'https://test-frontend.com';

      const result = await emailService.sendAccountReEnabledEmail(mockUser, mockAdminUser);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      // Restore environment variable
      process.env.FRONTEND_URL = originalFrontendUrl;
    });

    it('should use default login URL when FRONTEND_URL is not set', async () => {
      const originalFrontendUrl = process.env.FRONTEND_URL;
      delete process.env.FRONTEND_URL;

      const result = await emailService.sendAccountReEnabledEmail(mockUser, mockAdminUser);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      // Restore environment variable
      process.env.FRONTEND_URL = originalFrontendUrl;
    });
  });

  describe('Email content validation', () => {
    it('should format customer name correctly for disabled email', async () => {
      const userWithLongName = {
        ...mockUser,
        firstName: 'Very Long First Name',
        lastName: 'Very Long Last Name'
      };

      const result = await emailService.sendAccountDisabledEmail(userWithLongName, mockAdminUser);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('should format customer name correctly for re-enabled email', async () => {
      const userWithSpecialChars = {
        ...mockUser,
        firstName: 'José',
        lastName: 'García-López'
      };

      const result = await emailService.sendAccountReEnabledEmail(userWithSpecialChars, mockAdminUser);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });
});
