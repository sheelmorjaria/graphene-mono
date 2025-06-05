import { jest } from '@jest/globals';

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

  let consoleSpy;

  // Mock console.log to avoid cluttering test output
  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('sendAccountDisabledEmail', () => {
    it('should send account disabled email successfully', async () => {
      const result = await emailService.sendAccountDisabledEmail(mockUser, mockAdminUser);

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^account_disabled_\d+$/);
      expect(result.message).toBe('Account disabled email queued for delivery');

      // Verify email content was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        '📧 Account Disabled Email:',
        expect.stringContaining('test@user.com')
      );
    });

    it('should handle missing admin user gracefully', async () => {
      const result = await emailService.sendAccountDisabledEmail(mockUser, null);

      expect(result.success).toBe(true);
      expect(result.messageId).toMatch(/^account_disabled_\d+$/);
      expect(result.message).toBe('Account disabled email queued for delivery');
    });

    it('should include proper email content structure', async () => {
      await emailService.sendAccountDisabledEmail(mockUser, mockAdminUser);

      const loggedContent = consoleSpy.mock.calls.find(call => 
        call[0] === '📧 Account Disabled Email:'
      )[1];
      
      const emailContent = JSON.parse(loggedContent);

      expect(emailContent).toMatchObject({
        to: 'test@user.com',
        subject: 'Account Status Update - GrapheneOS Store',
        template: 'account-disabled',
        data: {
          customerName: 'Test User',
          email: 'test@user.com',
          disabledDate: expect.any(String),
          adminEmail: 'admin@test.com',
          supportEmail: 'support@grapheneos-store.com'
        }
      });
    });

    it('should handle email service errors gracefully', async () => {
      // Mock setTimeout to throw an error
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn().mockImplementation(() => {
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

      // Verify email content was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        '📧 Account Re-enabled Email:',
        expect.stringContaining('test@user.com')
      );
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

      await emailService.sendAccountReEnabledEmail(mockUser, mockAdminUser);

      const loggedContent = consoleSpy.mock.calls.find(call => 
        call[0] === '📧 Account Re-enabled Email:'
      )[1];
      
      const emailContent = JSON.parse(loggedContent);

      expect(emailContent).toMatchObject({
        to: 'test@user.com',
        subject: 'Account Re-enabled - GrapheneOS Store',
        template: 'account-re-enabled',
        data: {
          customerName: 'Test User',
          email: 'test@user.com',
          reEnabledDate: expect.any(String),
          adminEmail: 'admin@test.com',
          supportEmail: 'support@grapheneos-store.com',
          loginUrl: 'https://test-frontend.com/login'
        }
      });

      // Restore environment variable
      process.env.FRONTEND_URL = originalFrontendUrl;
    });

    it('should use default login URL when FRONTEND_URL is not set', async () => {
      // Ensure FRONTEND_URL is not set
      const originalFrontendUrl = process.env.FRONTEND_URL;
      delete process.env.FRONTEND_URL;

      await emailService.sendAccountReEnabledEmail(mockUser, mockAdminUser);

      const loggedContent = console.log.mock.calls.find(call => 
        call[0] === '📧 Account Re-enabled Email:'
      )[1];
      
      const emailContent = JSON.parse(loggedContent);

      expect(emailContent.data.loginUrl).toBe('https://grapheneos-store.com/login');

      // Restore environment variable
      process.env.FRONTEND_URL = originalFrontendUrl;
    });

    it('should handle email service errors gracefully', async () => {
      // Mock setTimeout to throw an error
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn().mockImplementation(() => {
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

      await emailService.sendAccountDisabledEmail(userWithLongName, mockAdminUser);

      const loggedContent = console.log.mock.calls.find(call => 
        call[0] === '📧 Account Disabled Email:'
      )[1];
      
      const emailContent = JSON.parse(loggedContent);
      expect(emailContent.data.customerName).toBe('Very Long First Name Very Long Last Name');
    });

    it('should format customer name correctly for re-enabled email', async () => {
      const userWithSpecialChars = {
        ...mockUser,
        firstName: 'José',
        lastName: 'García-López'
      };

      await emailService.sendAccountReEnabledEmail(userWithSpecialChars, mockAdminUser);

      const loggedContent = console.log.mock.calls.find(call => 
        call[0] === '📧 Account Re-enabled Email:'
      )[1];
      
      const emailContent = JSON.parse(loggedContent);
      expect(emailContent.data.customerName).toBe('José García-López');
    });

    it('should include current date in disabled email', async () => {
      const currentDate = new Date().toLocaleDateString();
      
      await emailService.sendAccountDisabledEmail(mockUser, mockAdminUser);

      const loggedContent = console.log.mock.calls.find(call => 
        call[0] === '📧 Account Disabled Email:'
      )[1];
      
      const emailContent = JSON.parse(loggedContent);
      expect(emailContent.data.disabledDate).toBe(currentDate);
    });

    it('should include current date in re-enabled email', async () => {
      const currentDate = new Date().toLocaleDateString();
      
      await emailService.sendAccountReEnabledEmail(mockUser, mockAdminUser);

      const loggedContent = console.log.mock.calls.find(call => 
        call[0] === '📧 Account Re-enabled Email:'
      )[1];
      
      const emailContent = JSON.parse(loggedContent);
      expect(emailContent.data.reEnabledDate).toBe(currentDate);
    });
  });
});