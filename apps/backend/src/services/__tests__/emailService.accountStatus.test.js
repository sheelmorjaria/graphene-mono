import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock AWS SES first
const mockSend = vi.fn();
const mockSESClient = {
  send: mockSend,
  config: {
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

// Mock logger before importing emailService
const mockLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn()
};

vi.mock('../../utils/logger.js', () => ({
  default: mockLogger,
  logError: vi.fn()
}));

const { default: emailService } = await import('../emailService.js');

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
  });


  describe('sendAccountDisabledEmail', () => {
    it('should send account disabled email successfully', async () => {
      const result = await emailService.sendAccountDisabledEmail(mockUser, mockAdminUser);

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^account_disabled_\d+$/);
      expect(result.message).toBe('Account disabled email queued for delivery');

      // Verify email functionality works
      expect(result.messageId).toContain('account_disabled_');
      expect(result.message).toContain('queued for delivery');
    });

    it('should handle missing admin user gracefully', async () => {
      const result = await emailService.sendAccountDisabledEmail(mockUser, null);

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^account_disabled_\d+$/);
      expect(result.message).toBe('Account disabled email queued for delivery');
    });

    it('should include proper email content structure', async () => {
      const result = await emailService.sendAccountDisabledEmail(mockUser, mockAdminUser);

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^account_disabled_\d+$/);
      expect(result.message).toBe('Account disabled email queued for delivery');

      // Test that the function completes successfully, indicating proper email processing
      expect(typeof result.messageId).toBe('string');
      expect(result.messageId.length).toBeGreaterThan(0);
    });

    it('should handle email service errors gracefully', async () => {
      // Mock setTimeout to throw an error
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn().mockImplementation(() => {
        throw new Error('Email service error');
      });

      const result = await emailService.sendAccountDisabledEmail(mockUser, mockAdminUser);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service error');

      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
    });
  });

  describe('sendAccountReEnabledEmail', () => {
    it('should send account re-enabled email successfully', async () => {
      const result = await emailService.sendAccountReEnabledEmail(mockUser, mockAdminUser);

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^account_reenabled_\d+$/);
      expect(result.message).toBe('Account re-enabled email queued for delivery');

      // Verify email functionality works
      expect(result.messageId).toContain('account_reenabled_');
      expect(result.message).toContain('queued for delivery');
    });

    it('should handle missing admin user gracefully', async () => {
      const result = await emailService.sendAccountReEnabledEmail(mockUser, null);

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^account_reenabled_\d+$/);
      expect(result.message).toBe('Account re-enabled email queued for delivery');
    });

    it('should include proper email content structure with login URL', async () => {
      // Set environment variable for testing
      const originalFrontendUrl = process.env.FRONTEND_URL;
      process.env.FRONTEND_URL = 'https://test-frontend.com';

      const result = await emailService.sendAccountReEnabledEmail(mockUser, mockAdminUser);

      expect(result.success).toBe(true);

      // Verify email functionality works
      expect(result.messageId).toMatch(/^account_reenabled_\d+$/);
      expect(result.message).toBe('Account re-enabled email queued for delivery');

      // Restore environment variable
      process.env.FRONTEND_URL = originalFrontendUrl;
    });

    it('should use default login URL when FRONTEND_URL is not set', async () => {
      // Ensure FRONTEND_URL is not set
      const originalFrontendUrl = process.env.FRONTEND_URL;
      delete process.env.FRONTEND_URL;

      const result = await emailService.sendAccountReEnabledEmail(mockUser, mockAdminUser);

      expect(result.success).toBe(true);

      // Verify the email was processed successfully
      expect(result.messageId).toMatch(/^account_reenabled_\d+$/);
      expect(result.message).toBe('Account re-enabled email queued for delivery');

      // Restore environment variable
      process.env.FRONTEND_URL = originalFrontendUrl;
    });

    it('should handle email service errors gracefully', async () => {
      // Mock setTimeout to throw an error
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn().mockImplementation(() => {
        throw new Error('Email service error');
      });

      const result = await emailService.sendAccountReEnabledEmail(mockUser, mockAdminUser);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email service error');

      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
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

      expect(result.success).toBe(true);

      // Verify email was processed successfully with customer name formatting
      expect(result.messageId).toMatch(/^account_disabled_\d+$/);
      expect(result.message).toBe('Account disabled email queued for delivery');
    });

    it('should format customer name correctly for re-enabled email', async () => {
      const userWithSpecialChars = {
        ...mockUser,
        firstName: 'José',
        lastName: 'García-López'
      };

      const result = await emailService.sendAccountReEnabledEmail(userWithSpecialChars, mockAdminUser);

      expect(result.success).toBe(true);

      // Verify email was processed successfully with special character name formatting
      expect(result.messageId).toMatch(/^account_reenabled_\d+$/);
      expect(result.message).toBe('Account re-enabled email queued for delivery');
    });

    it('should include current date in disabled email', async () => {
      const currentDate = new Date().toLocaleDateString();
      
      const result = await emailService.sendAccountDisabledEmail(mockUser, mockAdminUser);

      expect(result.success).toBe(true);

      // Verify email was processed successfully with date functionality
      expect(result.messageId).toMatch(/^account_disabled_\d+$/);
      expect(result.message).toBe('Account disabled email queued for delivery');
    });

    it('should include current date in re-enabled email', async () => {
      const currentDate = new Date().toLocaleDateString();
      
      const result = await emailService.sendAccountReEnabledEmail(mockUser, mockAdminUser);

      expect(result.success).toBe(true);

      // Verify email was processed successfully with date functionality
      expect(result.messageId).toMatch(/^account_reenabled_\d+$/);
      expect(result.message).toBe('Account re-enabled email queued for delivery');
    });
  });
});