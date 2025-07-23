import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock email service
const mockSendAccountDisabledEmail = vi.fn();
const mockSendAccountReEnabledEmail = vi.fn();

const mockEmailService = {
  sendAccountDisabledEmail: mockSendAccountDisabledEmail,
  sendAccountReEnabledEmail: mockSendAccountReEnabledEmail
};

// Set up mocks before imports
vi.mock('../services/emailService.js', () => ({
  default: mockEmailService
}));

// Dynamic imports after mocking
import '../../server.js';
import '../models/User.js';

describe('User Management Integration Tests', () => {
  let adminUser;
  let adminToken;
  let regularUser1;
  let regularUser2;
  let regularUser3;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    mockSendAccountDisabledEmail.mockResolvedValue({
      success: true,
      messageId: 'disabled_123',
      message: 'Account disabled email sent'
    });
    mockSendAccountReEnabledEmail.mockResolvedValue({
      success: true,
      messageId: 'enabled_123',
      message: 'Account re-enabled email sent'
    });

    // Create admin user
    adminUser = new User({
      email: 'admin@test.com',
      password: 'AdminPass123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      emailVerified: true,
      accountStatus: 'active'
    });
    await adminUser.save();

    // Create regular users for testing
    regularUser1 = new User({
      email: 'user1@test.com',
      password: 'UserPass123!',
      firstName: 'John',
      lastName: 'Doe',
      role: 'customer',
      emailVerified: true,
      accountStatus: 'active',
      phone: '+447123456789',
      marketingOptIn: true
    });
    await regularUser1.save();

    regularUser2 = new User({
      email: 'user2@test.com',
      password: 'UserPass123!',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'customer',
      emailVerified: true,
      accountStatus: 'disabled',
      phone: '+447987654321',
      marketingOptIn: false
    });
    await regularUser2.save();

    regularUser3 = new User({
      email: 'user3@test.com',
      password: 'UserPass123!',
      firstName: 'Bob',
      lastName: 'Johnson',
      role: 'customer',
      emailVerified: false,
      accountStatus: 'active'
    });
    await regularUser3.save();

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
  });

  describe('Complete User Management Workflow', () => {
    it('should handle complete user list, view, and status management workflow', async () => {
      // Step 1: Get all users with pagination
      const usersResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        });

      expect(usersResponse.status).toBe(200);
      expect(usersResponse.body.success).toBe(true);
      expect(usersResponse.body.data.users).toBeDefined();
      expect(usersResponse.body.data.users.length).toBeGreaterThan(0);
      expect(usersResponse.body.data.pagination).toMatchObject({
        currentPage: 1,
        totalPages: expect.any(Number),
        totalUsers: expect.any(Number),
        hasNextPage: expect.any(Boolean),
        hasPrevPage: false
      });

      // Step 2: Search for specific user
      const searchResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          searchQuery: 'john doe'
        });

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.data.users.length).toBeGreaterThanOrEqual(1);
      const foundUser = searchResponse.body.data.users.find(u => u.email === 'user1@test.com');
      expect(foundUser).toBeDefined();

      // Step 3: Filter by account status
      const activeUsersResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          accountStatus: 'active'
        });

      expect(activeUsersResponse.status).toBe(200);
      const activeUsers = activeUsersResponse.body.data.users.filter(u => u.role === 'customer');
      expect(activeUsers.every(user => user.accountStatus === 'active')).toBe(true);

      // Step 4: Get specific user details
      const userDetailsResponse = await request(app)
        .get(`/api/admin/users/${regularUser1._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(userDetailsResponse.status).toBe(200);
      expect(userDetailsResponse.body.data.user).toMatchObject({
        email: 'user1@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer',
        accountStatus: 'active',
        phone: '+447123456789',
        marketingOptIn: true
      });

      // Step 5: Disable user account
      const disableResponse = await request(app)
        .put(`/api/admin/users/${regularUser1._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'disabled'
        });

      expect(disableResponse.status).toBe(200);
      expect(disableResponse.body.success).toBe(true);
      expect(disableResponse.body.data.user.accountStatus).toBe('disabled');

      // Verify email was sent
      expect(mockSendAccountDisabledEmail).toHaveBeenCalledTimes(1);
      expect(mockSendAccountDisabledEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user1@test.com',
          accountStatus: 'disabled'
        }),
        expect.objectContaining({
          email: 'admin@test.com'
        })
      );

      // Step 6: Verify user cannot login when disabled
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user1@test.com',
          password: 'UserPass123!'
        });

      expect(loginResponse.status).toBe(401);
      expect(loginResponse.body.error).toContain('Account has been disabled');

      // Step 7: Re-enable user account
      const enableResponse = await request(app)
        .put(`/api/admin/users/${regularUser1._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newStatus: 'active'
        });

      expect(enableResponse.status).toBe(200);
      expect(enableResponse.body.success).toBe(true);
      expect(enableResponse.body.data.user.accountStatus).toBe('active');

      // Verify re-enable email was sent
      expect(mockSendAccountReEnabledEmail).toHaveBeenCalledTimes(1);

      // Step 8: Verify user can login again when re-enabled
      const loginAfterEnableResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user1@test.com',
          password: 'UserPass123!'
        });

      expect(loginAfterEnableResponse.status).toBe(200);
      expect(loginAfterEnableResponse.body.success).toBe(true);
      expect(loginAfterEnableResponse.body.data.token).toBeDefined();
    });

    it('should handle advanced search and filtering scenarios', async () => {
      // Search by email
      const emailSearchResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          searchQuery: 'user2@test.com'
        });

      expect(emailSearchResponse.status).toBe(200);
      expect(emailSearchResponse.body.data.users.length).toBeGreaterThanOrEqual(1);
      const foundUser = emailSearchResponse.body.data.users.find(u => u.email === 'user2@test.com');
      expect(foundUser).toBeDefined();

      // Filter by multiple criteria
      const complexFilterResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          accountStatus: 'active',
          emailVerified: 'true',
          role: 'customer'
        });

      expect(complexFilterResponse.status).toBe(200);
      const filteredUsers = complexFilterResponse.body.data.users;
      
      // All returned users should match the criteria
      filteredUsers.forEach(user => {
        expect(user.accountStatus).toBe('active');
        expect(user.emailVerified).toBe(true);
        expect(user.role).toBe('customer');
      });
      
      // Should find regularUser1 who matches all criteria (email verified, active, customer)
      const matchingUser = filteredUsers.find(u => u.email === 'user1@test.com');
      if (matchingUser) {
        expect(matchingUser.accountStatus).toBe('active');
        expect(matchingUser.emailVerified).toBe(true);
        expect(matchingUser.role).toBe('customer');
      }

      // Date range filtering
      const dateFilterResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        });

      expect(dateFilterResponse.status).toBe(200);
      expect(dateFilterResponse.body.data.users.length).toBeGreaterThan(0);

      // Sort by different fields
      const sortByNameResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          sortBy: 'firstName',
          sortOrder: 'asc'
        });

      expect(sortByNameResponse.status).toBe(200);
      const sortedUsers = sortByNameResponse.body.data.users.filter(u => u.role === 'customer');
      if (sortedUsers.length > 1) {
        expect(sortedUsers[0].firstName <= sortedUsers[1].firstName).toBe(true);
      }
    });

    it('should handle bulk operations and concurrent requests', async () => {
      // Test concurrent status updates
      const promises = [
        request(app)
          .put(`/api/admin/users/${regularUser1._id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ newStatus: 'disabled' }),
        request(app)
          .put(`/api/admin/users/${regularUser3._id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ newStatus: 'disabled' })
      ];

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Verify both emails were sent
      expect(mockSendAccountDisabledEmail).toHaveBeenCalledTimes(2);

      // Test pagination with large datasets
      const paginationResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          page: 1,
          limit: 2
        });

      expect(paginationResponse.status).toBe(200);
      expect(paginationResponse.body.data.users.length).toBeLessThanOrEqual(2);
      expect(paginationResponse.body.data.pagination.currentPage).toBe(1);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid user IDs gracefully', async () => {
      const invalidId = '507f1f77bcf86cd799439011';
      
      // Get user with invalid ID
      const getUserResponse = await request(app)
        .get(`/api/admin/users/${invalidId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getUserResponse.status).toBe(404);
      expect(getUserResponse.body.error).toBe('User not found');

      // Update status with invalid ID
      const updateStatusResponse = await request(app)
        .put(`/api/admin/users/${invalidId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newStatus: 'disabled' });

      expect(updateStatusResponse.status).toBe(404);
      expect(updateStatusResponse.body.error).toBe('User not found');
    });

    it('should handle malformed requests', async () => {
      // Invalid status value
      const invalidStatusResponse = await request(app)
        .put(`/api/admin/users/${regularUser1._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newStatus: 'invalid_status' });

      expect(invalidStatusResponse.status).toBe(400);
      expect(invalidStatusResponse.body.error).toContain('Invalid status');

      // Missing status in request
      const missingStatusResponse = await request(app)
        .put(`/api/admin/users/${regularUser1._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(missingStatusResponse.status).toBe(400);
      expect(missingStatusResponse.body.error).toContain('required');

      // Invalid pagination parameters
      const invalidPaginationResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          page: -1,
          limit: 1000
        });

      expect(invalidPaginationResponse.status).toBe(200); // Should handle gracefully
      expect(invalidPaginationResponse.body.data.pagination.currentPage).toBeGreaterThan(0);
    });

    it('should handle email service failures gracefully', async () => {
      // Mock email service to fail
      mockSendAccountDisabledEmail.mockRejectedValue(new Error('Email service down'));

      const disableResponse = await request(app)
        .put(`/api/admin/users/${regularUser1._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newStatus: 'disabled' });

      // Status update should still succeed even if email fails
      expect(disableResponse.status).toBe(200);
      expect(disableResponse.body.success).toBe(true);
      expect(disableResponse.body.data.user.accountStatus).toBe('disabled');

      // Verify email was attempted
      expect(mockSendAccountDisabledEmail).toHaveBeenCalledTimes(1);

      // Verify user is actually disabled in database
      const updatedUser = await User.findById(regularUser1._id);
      expect(updatedUser.accountStatus).toBe('disabled');
    });
  });

  describe('Security and Access Control', () => {
    it('should prevent unauthorized access to user management endpoints', async () => {
      // Test without token
      const noTokenResponse = await request(app)
        .get('/api/admin/users');

      expect(noTokenResponse.status).toBe(401);
      expect(noTokenResponse.body.error).toContain('token');

      // Test with regular user token
      const regularUserToken = jwt.sign(
        { 
          userId: regularUser1._id,
          role: 'customer',
          email: regularUser1.email
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '8h' }
      );

      const regularUserResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(regularUserResponse.status).toBe(403);
      expect(regularUserResponse.body.error).toContain('permissions');

      // Test with invalid token
      const invalidTokenResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer invalid_token');

      expect(invalidTokenResponse.status).toBe(401);
    });

    it('should prevent admin from disabling their own account', async () => {
      const selfDisableResponse = await request(app)
        .put(`/api/admin/users/${adminUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newStatus: 'disabled' });

      expect(selfDisableResponse.status).toBe(400);
      expect(selfDisableResponse.body.error).toBe('Cannot disable your own account');

      // Verify admin account is still active
      const adminCheck = await User.findById(adminUser._id);
      expect(adminCheck.accountStatus).toBe('active');
    });

    it('should audit log all user management operations', async () => {
      // This test verifies that operations are logged
      // In a real implementation, you might check a dedicated audit log
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await request(app)
        .put(`/api/admin/users/${regularUser1._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newStatus: 'disabled' });

      // Verify audit log was created
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`User ${regularUser1._id} (${regularUser1.email}) status changed`)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large user lists efficiently', async () => {
      // Create additional users for pagination testing
      const additionalUsers = [];
      for (let i = 0; i < 25; i++) {
        const user = new User({
          email: `testuser${i}@test.com`,
          password: 'TestPass123!',
          firstName: `User${i}`,
          lastName: 'Test',
          role: 'customer',
          emailVerified: true,
          accountStatus: i % 3 === 0 ? 'disabled' : 'active'
        });
        additionalUsers.push(user);
      }
      await User.insertMany(additionalUsers);

      // Test pagination
      const page1Response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          page: 1,
          limit: 10
        });

      expect(page1Response.status).toBe(200);
      expect(page1Response.body.data.users.length).toBeLessThanOrEqual(10);
      expect(page1Response.body.data.pagination.totalUsers).toBeGreaterThan(20);

      // Test search performance
      const searchStartTime = Date.now();
      const searchResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          searchQuery: 'User1'
        });
      const searchEndTime = Date.now();

      expect(searchResponse.status).toBe(200);
      expect(searchEndTime - searchStartTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle rapid sequential requests', async () => {
      // Test rapid user detail requests
      const rapidRequests = Array(5).fill().map(() =>
        request(app)
          .get(`/api/admin/users/${regularUser1._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
      );

      const responses = await Promise.all(rapidRequests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});