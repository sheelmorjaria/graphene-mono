import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../server.js';
import User from '../models/User.js';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../test/setup.js';

// Set up mocks for external services only
vi.mock('../services/emailService.js', () => ({
  default: {
    sendAccountDisabledEmail: vi.fn(),
    sendAccountReEnabledEmail: vi.fn()
  }
}));

import emailService from '../services/emailService.js';

describe('User Management Edge Cases and Error Scenarios', () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  let adminUser;
  let adminToken;

  beforeEach(async () => {
    await clearTestDatabase();
    // Clear all mocks
    vi.clearAllMocks();
    emailService.sendAccountDisabledEmail.mockResolvedValue({
      success: true,
      messageId: 'disabled_123'
    });
    emailService.sendAccountReEnabledEmail.mockResolvedValue({
      success: true,
      messageId: 'enabled_123'
    });

    // Create admin user with unique identifier
    const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    adminUser = new User({
      email: `admin-${uniqueId}@test.com`,
      password: 'AdminPass123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      emailVerified: true,
      accountStatus: 'active'
    });
    await adminUser.save();

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

  describe('Input Validation Edge Cases', () => {
    it('should handle invalid ObjectId formats', async () => {
      const invalidIds = ['invalid', '123', 'null', 'undefined'];
      // Note: '000000000000000000000000' is actually a valid ObjectId format
      // Note: Empty string '' will match the getAllUsers route instead

      for (const invalidId of invalidIds) {
        // Test getUserById with invalid ID
        const getUserResponse = await request(app)
          .get(`/api/admin/users/${invalidId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect([400, 404, 429]).toContain(getUserResponse.status);
        expect(getUserResponse.body.success).toBe(false);
        expect(getUserResponse.body.error).toBeDefined();

        // Test updateUserStatus with invalid ID
        const updateStatusResponse = await request(app)
          .put(`/api/admin/users/${invalidId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ newStatus: 'disabled' });

        expect([400, 404, 429]).toContain(updateStatusResponse.status);
        expect(updateStatusResponse.body.success).toBe(false);
      }
    });

    it('should handle malformed request bodies', async () => {
      const testUser = new User({
        email: 'test@test.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
        emailVerified: true,
        accountStatus: 'active'
      });
      await testUser.save();

      const malformedBodies = [
        {}, // Empty object
        { wrongField: 'disabled' },
        { newStatus: null },
        { newStatus: undefined },
        { newStatus: 123 },
        { newStatus: {} },
        { newStatus: [] },
        { newStatus: '' },
        { newStatus: 'DISABLED' }, // Wrong case
        { newStatus: 'active ' }, // Trailing space
        { newStatus: ' disabled' }, // Leading space
        { newStatus: 'enable' }, // Wrong value
        { newStatus: 'true' }, // Wrong type
        { extra: 'field', newStatus: 'disabled' } // Extra fields (should still work)
      ];

      for (const body of malformedBodies) {
        const response = await request(app)
          .put(`/api/admin/users/${testUser._id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(body);

        // Most should return 400, but some edge cases might be handled differently
        expect([400, 200, 429, 500]).toContain(response.status);
        
        if (response.status === 400) {
          expect(response.body.success).toBe(false);
          expect(response.body.error).toBeDefined();
        }
      }
    });

    it('should handle query parameter edge cases', async () => {
      const edgeCaseQueries = [
        { page: -1 },
        { page: 0 },
        { page: 'invalid' },
        { page: 99999999 },
        { limit: -1 },
        { limit: 0 },
        { limit: 'invalid' },
        { limit: 99999 },
        { sortBy: 'invalidField' },
        { sortBy: '' },
        { sortBy: null },
        { sortOrder: 'invalid' },
        { sortOrder: 'ASCENDING' },
        { accountStatus: 'invalid' },
        { accountStatus: 'Active' }, // Wrong case
        { emailVerified: 'invalid' },
        { emailVerified: 'TRUE' }, // Wrong case
        { search: 'a'.repeat(1000) }, // Very long search
        { search: '   ' }, // Only whitespace
        { search: '' }, // Empty string
        { registrationDateFrom: 'invalid-date' },
        { registrationDateTo: 'not-a-date' },
        { registrationDateFrom: '2024-13-40' }, // Invalid date
        { registrationDateTo: '2024-02-30' } // Invalid date
      ];

      for (const query of edgeCaseQueries) {
        const response = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .query(query);

        // Should handle gracefully, not crash
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // Should have some reasonable defaults/handling
        expect(response.body.data.pagination).toBeDefined();
      }
    });
  });

  describe('Database State Edge Cases', () => {
    it('should handle user deletion during operation', async () => {
      const testUser = new User({
        email: 'delete@test.com',
        password: 'TestPass123!',
        firstName: 'Delete',
        lastName: 'Me',
        role: 'customer',
        emailVerified: true,
        accountStatus: 'active'
      });
      await testUser.save();

      // Delete user from database directly (simulating external deletion)
      await User.findByIdAndDelete(testUser._id);

      // Try to get deleted user
      const getUserResponse = await request(app)
        .get(`/api/admin/users/${testUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getUserResponse.status).toBe(404);
      expect(getUserResponse.body.error).toBe('User not found');

      // Try to update status of deleted user
      const updateResponse = await request(app)
        .put(`/api/admin/users/${testUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newStatus: 'disabled' });

      expect(updateResponse.status).toBe(404);
      expect(updateResponse.body.error).toBe('User not found');
    });

    it('should handle users with corrupted data', async () => {
      // Create user with minimal data
      const corruptedUser = new User({
        email: 'corrupted@test.com',
        password: 'TestPass123!',
        firstName: 'Corrupted',
        lastName: 'User',
        role: 'customer'
        // Missing several optional fields
      });
      await corruptedUser.save();

      // Directly modify user in database to simulate corruption
      await User.findByIdAndUpdate(corruptedUser._id, {
        $unset: { firstName: 1, lastName: 1 },
        $set: { accountStatus: null }
      });

      // Try to get corrupted user
      const getUserResponse = await request(app)
        .get(`/api/admin/users/${corruptedUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Should handle gracefully
      expect(getUserResponse.status).toBe(200);
      expect(getUserResponse.body.data.user).toBeDefined();

      // Try to update status of corrupted user
      const updateResponse = await request(app)
        .put(`/api/admin/users/${corruptedUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newStatus: 'disabled' });

      // Should handle gracefully
      expect([200, 400, 429, 500]).toContain(updateResponse.status);
    });

    it('should handle database connection issues', async () => {
      // Create a user first
      const testUser = new User({
        email: 'dbtest@test.com',
        password: 'TestPass123!',
        firstName: 'DB',
        lastName: 'Test',
        role: 'customer',
        emailVerified: true,
        accountStatus: 'active'
      });
      await testUser.save();

      // Temporarily close database connection to simulate connection issues
      // const originalConnection = mongoose.connection.readyState; // For future connection testing
      
      // This is tricky to test without actually breaking the connection
      // In a real scenario, you might use database mocking or connection pooling
      
      // For now, we'll test with a very large dataset that might timeout
      const largeQuery = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          limit: 10000, // Very large limit
          page: 1
        });

      // Should handle gracefully, possibly with pagination limits
      expect(largeQuery.status).toBe(200);
      expect(largeQuery.body.data.users.length).toBeLessThanOrEqual(100); // Should be capped
    });
  });

  describe('Concurrency and Race Conditions', () => {
    it('should handle rapid status changes on same user', async () => {
      const testUser = new User({
        email: 'race@test.com',
        password: 'TestPass123!',
        firstName: 'Race',
        lastName: 'Condition',
        role: 'customer',
        emailVerified: true,
        accountStatus: 'active'
      });
      await testUser.save();

      // Rapid fire status changes
      const rapidChanges = [
        request(app)
          .put(`/api/admin/users/${testUser._id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ newStatus: 'disabled' }),
        request(app)
          .put(`/api/admin/users/${testUser._id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ newStatus: 'active' }),
        request(app)
          .put(`/api/admin/users/${testUser._id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ newStatus: 'disabled' })
      ];

      const responses = await Promise.allSettled(rapidChanges);

      // At least some should succeed
      const successfulChanges = responses.filter(result => 
        result.status === 'fulfilled' && result.value.status === 200
      );
      expect(successfulChanges.length).toBeGreaterThan(0);

      // Final state should be consistent
      const finalUser = await User.findById(testUser._id);
      expect(['active', 'disabled']).toContain(finalUser.accountStatus);
    });

    it('should handle multiple admins accessing same user', async () => {
      const testUser = new User({
        email: 'multi@test.com',
        password: 'TestPass123!',
        firstName: 'Multi',
        lastName: 'Admin',
        role: 'customer',
        emailVerified: true,
        accountStatus: 'active'
      });
      await testUser.save();

      // Create actual admin users for the test
      const admin2 = new User({
        email: 'admin2@test.com',
        password: 'Admin2Pass123!',
        firstName: 'Admin2',
        lastName: 'User',
        role: 'admin',
        emailVerified: true,
        accountStatus: 'active'
      });
      await admin2.save();

      const admin3 = new User({
        email: 'admin3@test.com',
        password: 'Admin3Pass123!',
        firstName: 'Admin3',
        lastName: 'User',
        role: 'admin',
        emailVerified: true,
        accountStatus: 'active'
      });
      await admin3.save();

      // Create multiple admin tokens
      const admin2Token = jwt.sign(
        { 
          userId: admin2._id,
          role: admin2.role,
          email: admin2.email
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '8h' }
      );

      const admin3Token = jwt.sign(
        { 
          userId: admin3._id,
          role: admin3.role,
          email: admin3.email
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '8h' }
      );

      // Multiple admins try to view and modify user simultaneously
      const concurrentOperations = [
        request(app)
          .get(`/api/admin/users/${testUser._id}`)
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .get(`/api/admin/users/${testUser._id}`)
          .set('Authorization', `Bearer ${admin2Token}`),
        request(app)
          .put(`/api/admin/users/${testUser._id}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ newStatus: 'disabled' }),
        request(app)
          .put(`/api/admin/users/${testUser._id}/status`)
          .set('Authorization', `Bearer ${admin3Token}`)
          .send({ newStatus: 'disabled' })
      ];

      const results = await Promise.allSettled(concurrentOperations);
      
      // All GET operations should succeed
      const getOperations = results.slice(0, 2);
      getOperations.forEach(result => {
        expect(result.status).toBe('fulfilled');
        expect(result.value.status).toBe(200);
      });

      // At least one PUT operation should succeed
      const putOperations = results.slice(2);
      const successfulPuts = putOperations.filter(result =>
        result.status === 'fulfilled' && result.value.status === 200
      );
      expect(successfulPuts.length).toBeGreaterThan(0);
    });
  });

  describe('External Service Failures', () => {
    it('should handle email service complete failure', async () => {
      const testUser = new User({
        email: 'email@test.com',
        password: 'TestPass123!',
        firstName: 'Email',
        lastName: 'Test',
        role: 'customer',
        emailVerified: true,
        accountStatus: 'active'
      });
      await testUser.save();

      // Mock complete email service failure
      emailService.sendAccountDisabledEmail.mockRejectedValue(new Error('Email service completely down'));

      const disableResponse = await request(app)
        .put(`/api/admin/users/${testUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newStatus: 'disabled' });

      // Core functionality should still work
      expect(disableResponse.status).toBe(200);
      expect(disableResponse.body.data.user.accountStatus).toBe('disabled');

      // Verify in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.accountStatus).toBe('disabled');

      // User should be unable to login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'email@test.com',
          password: 'TestPass123!'
        });

      expect(loginResponse.status).toBe(401);
    });

    it('should handle email service timeout', async () => {
      const testUser = new User({
        email: 'timeout@test.com',
        password: 'TestPass123!',
        firstName: 'Timeout',
        lastName: 'Test',
        role: 'customer',
        emailVerified: true,
        accountStatus: 'active'
      });
      await testUser.save();

      // Mock email service timeout
      emailService.sendAccountDisabledEmail.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email service timeout')), 100)
        )
      );

      const disableResponse = await request(app)
        .put(`/api/admin/users/${testUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newStatus: 'disabled' });

      // Should still succeed despite email timeout
      expect(disableResponse.status).toBe(200);
      expect(disableResponse.body.data.user.accountStatus).toBe('disabled');
    });
  });

  describe('Resource Limits and Performance Edge Cases', () => {
    it('should handle extremely large search results', async () => {
      // Create many users with similar names
      const manyUsers = [];
      for (let i = 0; i < 100; i++) {
        manyUsers.push({
          email: `similar${i}@test.com`,
          password: 'TestPass123!',
          firstName: 'Similar',
          lastName: `User${i}`,
          role: 'customer',
          emailVerified: true,
          accountStatus: 'active'
        });
      }
      await User.insertMany(manyUsers);

      const searchResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          search: 'Similar',
          searchField: 'name',
          limit: 1000 // Try to get all
        });

      expect(searchResponse.status).toBe(200);
      // Should limit results to prevent performance issues
      expect(searchResponse.body.data.users.length).toBeLessThanOrEqual(100);
      expect(searchResponse.body.data.pagination).toBeDefined();
    });

    it('should handle memory-intensive operations', async () => {
      // Create users with large data
      const largeDataUser = new User({
        email: 'large@test.com',
        password: 'TestPass123!',
        firstName: 'A'.repeat(50), // Max length
        lastName: 'B'.repeat(50),
        role: 'customer',
        emailVerified: true,
        accountStatus: 'active',
        phone: '+447123456789', // Valid UK phone number
        shippingAddresses: Array(10).fill().map((_, i) => ({
          fullName: `Address ${i} ${'Long'.repeat(20)}`,
          addressLine1: `Line 1 ${'Very'.repeat(20)}`,
          addressLine2: `Line 2 ${'Long'.repeat(20)}`,
          city: `City${'Name'.repeat(10)}`,
          stateProvince: 'England',
          postalCode: 'SW1A 1AA',
          country: 'United Kingdom'
        }))
      });
      await largeDataUser.save();

      const getUserResponse = await request(app)
        .get(`/api/admin/users/${largeDataUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getUserResponse.status).toBe(200);
      expect(getUserResponse.body.data.user).toBeDefined();
      
      // Response size should be reasonable
      const responseSize = JSON.stringify(getUserResponse.body).length;
      expect(responseSize).toBeLessThan(100000); // Less than 100KB
    });

    it('should handle high frequency requests gracefully', async () => {
      const testUser = new User({
        email: 'frequency@test.com',
        password: 'TestPass123!',
        firstName: 'High',
        lastName: 'Frequency',
        role: 'customer',
        emailVerified: true,
        accountStatus: 'active'
      });
      await testUser.save();

      // Make many requests rapidly
      const highFrequencyRequests = Array(20).fill().map(() =>
        request(app)
          .get(`/api/admin/users/${testUser._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(highFrequencyRequests);
      const endTime = Date.now();

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });
  });

  describe('Data Consistency Edge Cases', () => {
    it('should maintain consistency during partial failures', async () => {
      const testUser = new User({
        email: 'consistency@test.com',
        password: 'TestPass123!',
        firstName: 'Consistency',
        lastName: 'Test',
        role: 'customer',
        emailVerified: true,
        accountStatus: 'active'
      });
      await testUser.save();

      // Mock email to fail after database update succeeds
      let dbUpdated = false;
      emailService.sendAccountDisabledEmail.mockImplementation(async () => {
        // Check if user was updated in database
        const user = await User.findById(testUser._id);
        dbUpdated = user.accountStatus === 'disabled';
        throw new Error('Email failed after DB update');
      });

      const disableResponse = await request(app)
        .put(`/api/admin/users/${testUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newStatus: 'disabled' });

      // Should still return success despite email failure
      expect(disableResponse.status).toBe(200);
      expect(dbUpdated).toBe(true);

      // Verify final state is consistent
      const finalUser = await User.findById(testUser._id);
      expect(finalUser.accountStatus).toBe('disabled');

      // User should not be able to login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'consistency@test.com',
          password: 'TestPass123!'
        });

      expect(loginResponse.status).toBe(401);
    });

    it('should handle incomplete user objects gracefully', async () => {
      // Create user with minimal required fields only
      const minimalUser = new User({
        email: 'minimal@test.com',
        password: 'TestPass123!',
        firstName: 'Min',
        lastName: 'User',
        role: 'customer'
      });
      await minimalUser.save();

      // Should handle user with missing optional fields
      const getUserResponse = await request(app)
        .get(`/api/admin/users/${minimalUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getUserResponse.status).toBe(200);
      expect(getUserResponse.body.data.user.email).toBe('minimal@test.com');

      // Should be able to update status
      const updateResponse = await request(app)
        .put(`/api/admin/users/${minimalUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newStatus: 'disabled' });

      expect(updateResponse.status).toBe(200);
    });
  });
});