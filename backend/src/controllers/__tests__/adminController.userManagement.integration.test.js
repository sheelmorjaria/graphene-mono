import { vi, describe, it, test, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock email service
const mockSendAccountDisabledEmail = vi.fn();
const mockSendAccountReEnabledEmail = vi.fn();

// const mockEmailService = {
//   sendAccountDisabledEmail: mockSendAccountDisabledEmail,
//   sendAccountReEnabledEmail: mockSendAccountReEnabledEmail
// };

// Dynamic imports - mocking will be handled in beforeEach
import app from '../../../server.js';
import User from '../../models/User.js';
import emailService from '../../services/emailService.js';
import { createValidUserData } from '../../test/helpers/testData.js';

describe('Admin Controller - User Management', () => {
  let adminUser;
  let adminToken;
  let testUser;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Mock email service methods
    vi.spyOn(emailService, 'sendAccountDisabledEmail').mockImplementation(mockSendAccountDisabledEmail);
    vi.spyOn(emailService, 'sendAccountReEnabledEmail').mockImplementation(mockSendAccountReEnabledEmail);

    // Create admin user
    adminUser = new User(createValidUserData({
      email: 'admin@test.com',
      password: 'password123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      emailVerified: true,
      accountStatus: 'active'
    }));
    await adminUser.save();

    // Create test user
    testUser = new User(createValidUserData({
      email: 'test@user.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'customer',
      emailVerified: true,
      accountStatus: 'active'
    }));
    await testUser.save();

    // Generate admin token
    adminToken = jwt.sign(
      { 
        userId: adminUser._id,
        role: adminUser.role,
        email: adminUser.email
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );

    // Mock email service responses
    mockSendAccountDisabledEmail.mockResolvedValue({
      success: true,
      messageId: 'mock_disabled_123',
      message: 'Account disabled email queued for delivery'
    });

    mockSendAccountReEnabledEmail.mockResolvedValue({
      success: true,
      messageId: 'mock_enabled_123',
      message: 'Account re-enabled email queued for delivery'
    });
  });

  describe('PUT /api/admin/users/:userId/status', () => {
    it('should disable user account and send email notification', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'disabled'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User account disabled successfully');
      expect(response.body.data.user.accountStatus).toBe('disabled');

      // Verify email service was called
      expect(mockSendAccountDisabledEmail).toHaveBeenCalledTimes(1);
      expect(mockSendAccountDisabledEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@user.com',
          firstName: 'Test',
          lastName: 'User',
          accountStatus: 'disabled'
        }),
        expect.objectContaining({
          email: 'admin@test.com',
          firstName: 'Admin',
          lastName: 'User'
        })
      );

      // Verify user status in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.accountStatus).toBe('disabled');
    });

    it('should re-enable user account and send email notification', async () => {
      // First disable the user
      testUser.accountStatus = 'disabled';
      await testUser.save();

      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'active'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User account enabled successfully');
      expect(response.body.data.user.accountStatus).toBe('active');

      // Verify email service was called
      expect(mockSendAccountReEnabledEmail).toHaveBeenCalledTimes(1);
      expect(mockSendAccountReEnabledEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@user.com',
          firstName: 'Test',
          lastName: 'User',
          accountStatus: 'active'
        }),
        expect.objectContaining({
          email: 'admin@test.com',
          firstName: 'Admin',
          lastName: 'User'
        })
      );

      // Verify user status in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.accountStatus).toBe('active');
    });

    it('should continue status update even if email sending fails', async () => {
      // Mock email service to fail
      mockSendAccountDisabledEmail.mockRejectedValue(new Error('Email service error'));

      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'disabled'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User account disabled successfully');

      // Verify email service was called but failed
      expect(mockSendAccountDisabledEmail).toHaveBeenCalledTimes(1);

      // Verify user status was still updated despite email failure
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.accountStatus).toBe('disabled');
    });

    it('should return error when trying to disable invalid user ID', async () => {
      const invalidUserId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/admin/users/${invalidUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'disabled'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User not found');

      // Verify email service was not called
      expect(mockSendAccountDisabledEmail).not.toHaveBeenCalled();
      expect(mockSendAccountReEnabledEmail).not.toHaveBeenCalled();
    });

    it('should return error when admin tries to disable their own account', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${adminUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'disabled'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot disable your own account');

      // Verify email service was not called
      expect(mockSendAccountDisabledEmail).not.toHaveBeenCalled();
    });

    it('should return error when status is already the same', async () => {
      // User is already active by default
      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'active'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User account is already active');

      // Verify email service was not called
      expect(mockSendAccountReEnabledEmail).not.toHaveBeenCalled();
    });

    it('should return error for invalid status value', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'invalid_status'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid status. Must be "active" or "disabled"');

      // Verify email service was not called
      expect(mockSendAccountDisabledEmail).not.toHaveBeenCalled();
      expect(mockSendAccountReEnabledEmail).not.toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/status`)
        .send({
          newStatus: 'disabled'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied. No token provided.');
    });

    it('should require admin role', async () => {
      // Create a regular user token
      const regularUser = new User({
        email: 'regular@user.com',
        password: 'password123',
        firstName: 'Regular',
        lastName: 'User',
        role: 'customer',
        emailVerified: true
      });
      await regularUser.save();

      const regularToken = jwt.sign(
        { 
          userId: regularUser._id,
          role: regularUser.role,
          email: regularUser.email
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '8h' }
      );

      const response = await request(app)
        .put(`/api/admin/users/${testUser._id}/status`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          newStatus: 'disabled'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient permissions.');
    });
  });

  describe('GET /api/admin/users', () => {
    it('should get all users with proper pagination', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('GET /api/admin/users/:userId', () => {
    it('should get user details by ID', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        email: 'test@user.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
        accountStatus: 'active'
      });
    });
  });
});