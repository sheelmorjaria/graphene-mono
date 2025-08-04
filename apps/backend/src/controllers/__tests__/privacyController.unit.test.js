import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { requestDataExport, requestAccountDeletion } from '../privacyController.js';

// Mock dependencies
vi.mock('../../models/User.js', () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn()
  }
}));

vi.mock('../../models/Order.js', () => ({
  default: {
    find: vi.fn(),
    updateMany: vi.fn()
  }
}));

vi.mock('../../models/Cart.js', () => ({
  default: {
    find: vi.fn(),
    deleteMany: vi.fn()
  }
}));

vi.mock('../../models/DataExportRequest.js', () => ({
  default: {
    findActiveByUserId: vi.fn(),
    createRequest: vi.fn(),
    findOne: vi.fn()
  }
}));

vi.mock('../../models/AccountDeletionRequest.js', () => ({
  default: {
    findByUserId: vi.fn(),
    createRequest: vi.fn(),
    findOne: vi.fn()
  }
}));

vi.mock('../../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  },
  logError: vi.fn()
}));

vi.mock('../../services/emailService.js', () => ({
  sendDataExportEmail: vi.fn(),
  sendAccountDeletionConfirmationEmail: vi.fn(),
  sendAccountDeletionCompletedEmail: vi.fn()
}));

const User = (await import('../../models/User.js')).default;
const Order = (await import('../../models/Order.js')).default;
const Cart = (await import('../../models/Cart.js')).default;
const DataExportRequest = (await import('../../models/DataExportRequest.js')).default;
const AccountDeletionRequest = (await import('../../models/AccountDeletionRequest.js')).default;
const logger = (await import('../../utils/logger.js')).default;
const { logError } = await import('../../utils/logger.js');
const { sendDataExportEmail, sendAccountDeletionConfirmationEmail } = await import('../../services/emailService.js');

describe('Privacy Controller - Unit Tests', () => {
  let req, res;
  let mockUser, mockExportRequest, mockDeletionRequest;

  beforeEach(() => {
    // Setup mock user
    mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      comparePassword: vi.fn()
    };

    // Setup mock export request
    mockExportRequest = {
      requestId: 'export_user123_123456789_abc123',
      save: vi.fn().mockResolvedValue(true),
      markAsProcessing: vi.fn().mockResolvedValue(true),
      markAsCompleted: vi.fn().mockResolvedValue(true),
      markAsFailed: vi.fn().mockResolvedValue(true)
    };

    // Setup mock deletion request
    mockDeletionRequest = {
      requestId: 'deletion_user123_123456789_def456',
      save: vi.fn().mockResolvedValue(true),
      markAsProcessing: vi.fn().mockResolvedValue(true),
      markAsCompleted: vi.fn().mockResolvedValue(true),
      markAsFailed: vi.fn().mockResolvedValue(true)
    };

    req = {
      user: mockUser,
      body: {},
      ip: '192.168.1.1',
      get: vi.fn().mockReturnValue('Mozilla/5.0 Test Browser')
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('requestDataExport', () => {
    it('should successfully create a data export request', async () => {
      // Arrange
      DataExportRequest.findActiveByUserId.mockResolvedValue([]);
      DataExportRequest.createRequest.mockReturnValue(mockExportRequest);

      // Act
      await requestDataExport(req, res);

      // Assert
      expect(DataExportRequest.findActiveByUserId).toHaveBeenCalledWith('user123');
      expect(DataExportRequest.createRequest).toHaveBeenCalledWith(
        'user123',
        '192.168.1.1',
        'Mozilla/5.0 Test Browser'
      );
      expect(mockExportRequest.save).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Data export requested', expect.objectContaining({
        userId: 'user123',
        userEmail: 'test@example.com',
        requestId: 'export_user123_123456789_abc123'
      }));
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Data export request received. You will receive an email with a download link when your data is ready.',
        data: {
          requestId: 'export_user123_123456789_abc123',
          estimatedTime: '24 hours'
        }
      });
    });

    it('should reject request if user already has active export request', async () => {
      // Arrange
      const existingRequest = {
        requestId: 'existing_export_123',
        status: 'pending',
        requestedAt: new Date()
      };
      DataExportRequest.findActiveByUserId.mockResolvedValue([existingRequest]);

      // Act
      await requestDataExport(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'You already have a pending data export request. Please wait for it to complete before requesting another.',
        data: {
          existingRequestId: 'existing_export_123',
          status: 'pending',
          requestedAt: existingRequest.requestedAt
        }
      });
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      DataExportRequest.findActiveByUserId.mockRejectedValue(error);

      // Act
      await requestDataExport(req, res);

      // Assert
      expect(logError).toHaveBeenCalledWith(error, expect.objectContaining({
        context: 'data_export_request',
        userId: 'user123',
        userEmail: 'test@example.com'
      }));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while processing data export request'
      });
    });
  });

  describe('requestAccountDeletion', () => {
    it('should successfully create an account deletion request', async () => {
      // Arrange
      req.body.password = 'validPassword';
      mockUser.comparePassword.mockResolvedValue(true);
      AccountDeletionRequest.findByUserId.mockResolvedValue([]);
      AccountDeletionRequest.createRequest.mockReturnValue(mockDeletionRequest);

      // Act
      await requestAccountDeletion(req, res);

      // Assert
      expect(mockUser.comparePassword).toHaveBeenCalledWith('validPassword');
      expect(AccountDeletionRequest.findByUserId).toHaveBeenCalledWith('user123');
      expect(AccountDeletionRequest.createRequest).toHaveBeenCalledWith(
        'user123',
        'test@example.com',
        'John Doe',
        '192.168.1.1',
        'Mozilla/5.0 Test Browser'
      );
      expect(mockDeletionRequest.save).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Account deletion requested', expect.objectContaining({
        userId: 'user123',
        userEmail: 'test@example.com',
        requestId: 'deletion_user123_123456789_def456'
      }));
      expect(sendAccountDeletionConfirmationEmail).toHaveBeenCalledWith(
        'test@example.com',
        'John',
        expect.objectContaining({
          requestId: 'deletion_user123_123456789_def456',
          estimatedCompletion: '7-30 days'
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Account deletion request received. You will receive a confirmation email and be logged out.',
        data: {
          requestId: 'deletion_user123_123456789_def456',
          estimatedTime: '7-30 days'
        }
      });
    });

    it('should reject request if password is missing', async () => {
      // Arrange
      req.body.password = '';

      // Act
      await requestAccountDeletion(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Password is required to confirm account deletion'
      });
    });

    it('should reject request if password is invalid', async () => {
      // Arrange
      req.body.password = 'wrongPassword';
      mockUser.comparePassword.mockResolvedValue(false);

      // Act
      await requestAccountDeletion(req, res);

      // Assert
      expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongPassword');
      expect(logger.warn).toHaveBeenCalledWith('Account deletion failed - invalid password', expect.objectContaining({
        userId: 'user123',
        userEmail: 'test@example.com'
      }));
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid password. Please check your password and try again.'
      });
    });

    it('should reject request if user already has pending deletion request', async () => {
      // Arrange
      req.body.password = 'validPassword';
      mockUser.comparePassword.mockResolvedValue(true);
      const pendingRequest = {
        requestId: 'existing_deletion_123',
        status: 'pending',
        requestedAt: new Date()
      };
      AccountDeletionRequest.findByUserId.mockResolvedValue([pendingRequest]);

      // Act
      await requestAccountDeletion(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'You already have a pending account deletion request.',
        data: {
          existingRequestId: 'existing_deletion_123',
          status: 'pending',
          requestedAt: pendingRequest.requestedAt
        }
      });
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      req.body.password = 'validPassword';
      const error = new Error('Database connection failed');
      mockUser.comparePassword.mockRejectedValue(error);

      // Act
      await requestAccountDeletion(req, res);

      // Assert
      expect(logError).toHaveBeenCalledWith(error, expect.objectContaining({
        context: 'account_deletion_request',
        userId: 'user123',
        userEmail: 'test@example.com'
      }));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while processing account deletion request'
      });
    });
  });
});