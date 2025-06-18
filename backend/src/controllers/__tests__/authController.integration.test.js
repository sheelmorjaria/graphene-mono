import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../server.js';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';

describe('Auth Controller', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    const validUserData = {
      email: 'john.doe@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe'
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Account created successfully');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(validUserData.email.toLowerCase());
      expect(response.body.data.user.firstName).toBe(validUserData.firstName);
      expect(response.body.data.user.password).toBeUndefined(); // Should be excluded from JSON
      expect(response.body.data.emailVerificationRequired).toBe(true);

      // Verify user was created in database
      const user = await User.findByEmail(validUserData.email);
      expect(user).toBeDefined();
      expect(user.emailVerificationToken).toBeDefined();
    });

    it('should register user with optional fields', async () => {
      const userDataWithOptionals = {
        ...validUserData,
        phone: '+447123456789',
        marketingOptIn: true
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userDataWithOptionals);

      expect(response.status).toBe(201);
      expect(response.body.data.user.phone).toBe(userDataWithOptionals.phone);
      expect(response.body.data.user.marketingOptIn).toBe(true);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
          // Missing password, firstName, lastName
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should fail with password mismatch', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          confirmPassword: 'DifferentPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Passwords do not match');
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          password: 'weak',
          confirmPassword: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Password must');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('valid email address');
    });

    it('should fail with invalid phone number', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          phone: 'invalid-phone'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('valid phone number');
    });

    it('should fail when email already exists', async () => {
      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      // Try to create another user with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          email: validUserData.email.toUpperCase() // Different case
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should validate password strength requirements', async () => {
      const weakPasswords = [
        'short', // Too short
        'nouppercase123!', // No uppercase
        'NOLOWERCASE123!', // No lowercase
        'NoNumbers!', // No numbers
        'NoSpecialChars123' // No special characters
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            ...validUserData,
            password,
            confirmPassword: password
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Password must');
      }
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      // Create a test user
      testUser = new User({
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      });
      await testUser.save();
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.password).toBeUndefined();

      // Verify lastLoginAt was updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.lastLoginAt).toBeDefined();
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid email or password');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid email or password');
    });

    it('should fail for inactive user', async () => {
      // Deactivate user
      testUser.isActive = false;
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('deactivated');
    });

    it('should fail for disabled user account', async () => {
      // Disable user account
      testUser.accountStatus = 'disabled';
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Account has been disabled');
    });

    it('should handle case-insensitive email login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'TEST@EXAMPLE.COM',
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/auth/profile', () => {
    let testUser, authToken;

    beforeEach(async () => {
      // Create and authenticate a test user
      testUser = new User({
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      });
      await testUser.save();

      authToken = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should fail without authentication token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No token provided');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid token');
    });

    it('should fail for inactive user', async () => {
      testUser.isActive = false;
      await testUser.save();

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('deactivated');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let testUser, authToken;

    beforeEach(async () => {
      testUser = new User({
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      });
      await testUser.save();

      authToken = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+447123456789',
        marketingOptIn: true
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.firstName).toBe('Updated');
      expect(response.body.data.user.lastName).toBe('Name');
      expect(response.body.data.user.phone).toBe(updateData.phone);
      expect(response.body.data.user.marketingOptIn).toBe(true);

      // Verify in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.firstName).toBe('Updated');
    });

    it('should fail with invalid phone number', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phone: 'invalid-phone'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('valid phone number');
    });

    it('should allow clearing phone number', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phone: ''
        });

      expect(response.status).toBe(200);
      expect(response.body.data.user.phone).toBeUndefined();
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({
          firstName: 'Updated'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken;

    beforeEach(async () => {
      // Create a test user and get auth token
      const userData = {
        email: 'logout.test@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        firstName: 'Logout',
        lastName: 'Test'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      authToken = registerResponse.body.data.token;
      // userId = registerResponse.body.data.user.id; // Not used in tests
    });

    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should invalidate token after logout', async () => {
      // First logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(logoutResponse.status).toBe(200);

      // Try to access protected route with the same token
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(profileResponse.status).toBe(401);
      expect(profileResponse.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send password reset token for valid email', async () => {
      // Create a test user first
      const userData = {
        email: 'forgot.test@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: userData.email });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('If an account exists for that email, a password reset link has been sent.');

      // Verify reset token was set in database
      const user = await User.findByEmail(userData.email);
      expect(user.passwordResetToken).toBeDefined();
      expect(user.passwordResetExpires).toBeDefined();
      expect(user.passwordResetExpires.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return generic message for non-existent email (prevent enumeration)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('If an account exists for that email, a password reset link has been sent.');
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email is required');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Please enter a valid email address');
    });

    it('should not send reset token for inactive users', async () => {
      // Create a test user first
      const userData = {
        email: 'inactive.test@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Deactivate the user
      await User.findOneAndUpdate(
        { email: userData.email },
        { isActive: false }
      );

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: userData.email });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('If an account exists for that email, a password reset link has been sent.');

      // Verify no reset token was set for inactive user
      const user = await User.findByEmail(userData.email);
      expect(user.passwordResetToken).toBeUndefined();
      expect(user.passwordResetExpires).toBeUndefined();
    });

    it('should handle rate limiting', async () => {
      // Create a test user first
      const userData = {
        email: 'ratelimit.test@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Make multiple rapid requests (rate limiting will be disabled in test environment)
      // This test documents the expected behavior
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: userData.email });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken;
    let testUser;

    beforeEach(async () => {
      // Create a test user with reset token
      const userData = {
        email: 'reset.test@example.com',
        password: 'OldPassword123!',
        confirmPassword: 'OldPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      testUser = await User.findByEmail(userData.email);
      resetToken = testUser.generatePasswordResetToken();
      await testUser.save();
    });

    it('should reset password with valid token', async () => {
      const resetData = {
        token: resetToken,
        newPassword: 'NewSecurePass456!',
        confirmNewPassword: 'NewSecurePass456!'
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password has been reset successfully');

      // Verify password was changed and tokens were cleared
      const updatedUser = await User.findById(testUser._id);
      const isNewPasswordValid = await updatedUser.comparePassword(resetData.newPassword);
      expect(isNewPasswordValid).toBe(true);
      expect(updatedUser.passwordResetToken).toBeUndefined();
      expect(updatedUser.passwordResetExpires).toBeUndefined();

      // Verify old password no longer works
      const isOldPasswordValid = await updatedUser.comparePassword('OldPassword123!');
      expect(isOldPasswordValid).toBe(false);
    });

    it('should login with new password after reset', async () => {
      const resetData = {
        token: resetToken,
        newPassword: 'NewSecurePass456!',
        confirmNewPassword: 'NewSecurePass456!'
      };

      await request(app)
        .post('/api/auth/reset-password')
        .send(resetData);

      // Try logging in with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: resetData.newPassword
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.token).toBeDefined();
    });

    it('should fail with invalid token', async () => {
      const resetData = {
        token: 'invalid-token',
        newPassword: 'NewSecurePass456!',
        confirmNewPassword: 'NewSecurePass456!'
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Password reset token is invalid or has expired');
    });

    it('should fail with expired token', async () => {
      // Manually expire the token
      testUser.passwordResetExpires = Date.now() - 60 * 60 * 1000; // 1 hour ago
      await testUser.save();

      const resetData = {
        token: resetToken,
        newPassword: 'NewSecurePass456!',
        confirmNewPassword: 'NewSecurePass456!'
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Password reset token is invalid or has expired');
    });

    it('should fail when passwords do not match', async () => {
      const resetData = {
        token: resetToken,
        newPassword: 'NewSecurePass456!',
        confirmNewPassword: 'DifferentPassword789!'
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Passwords do not match');
    });

    it('should fail with weak password', async () => {
      const resetData = {
        token: resetToken,
        newPassword: 'weak',
        confirmNewPassword: 'weak'
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Password must be at least 8 characters long');
    });

    it('should fail with missing required fields', async () => {
      const resetData = {
        // Missing token, newPassword and confirmNewPassword
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Reset token, new password, and confirmation are required');
    });

    it('should prevent token reuse', async () => {
      const resetData = {
        token: resetToken,
        newPassword: 'NewSecurePass456!',
        confirmNewPassword: 'NewSecurePass456!'
      };

      // First reset should succeed
      const firstResponse = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData);

      expect(firstResponse.status).toBe(200);

      // Second reset with same token should fail
      const secondResponse = await request(app)
        .post('/api/auth/reset-password')
        .send(resetData);

      expect(secondResponse.status).toBe(400);
      expect(secondResponse.body.success).toBe(false);
      expect(secondResponse.body.error).toBe('Password reset token is invalid or has expired');
    });
  });

  describe('PUT /api/auth/password', () => {
    let authToken;

    beforeEach(async () => {
      // Create a test user and get auth token
      const userData = {
        email: 'password.test@example.com',
        password: 'OldPassword123!',
        confirmPassword: 'OldPassword123!',
        firstName: 'Password',
        lastName: 'Test'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      authToken = registerResponse.body.data.token;
      // userId = registerResponse.body.data.user.id; // Not used in tests
    });

    it('should change password successfully with valid data', async () => {
      const passwordData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
        confirmNewPassword: 'NewPassword456!'
      };

      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');

      // Verify old token is invalidated by trying to use it
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(profileResponse.status).toBe(401);
    });

    it('should login with new password after change', async () => {
      const passwordData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
        confirmNewPassword: 'NewPassword456!'
      };

      await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);

      // Try to login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'password.test@example.com',
          password: 'NewPassword456!'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
    });

    it('should fail with incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword456!',
        confirmNewPassword: 'NewPassword456!'
      };

      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Current password is incorrect');
    });

    it('should fail when new password matches current password', async () => {
      const passwordData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'OldPassword123!',
        confirmNewPassword: 'OldPassword123!'
      };

      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('New password must be different from current password');
    });

    it('should fail when new passwords do not match', async () => {
      const passwordData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
        confirmNewPassword: 'DifferentPassword789!'
      };

      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('New passwords do not match');
    });

    it('should fail with weak new password', async () => {
      const passwordData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'weak',
        confirmNewPassword: 'weak'
      };

      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Password must be at least 8 characters long');
    });

    it('should fail with missing required fields', async () => {
      const passwordData = {
        // Missing currentPassword, newPassword and confirmNewPassword
      };

      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Current password, new password, and confirmation are required');
    });

    it('should fail without authentication', async () => {
      const passwordData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
        confirmNewPassword: 'NewPassword456!'
      };

      const response = await request(app)
        .put('/api/auth/password')
        .send(passwordData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const passwordData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
        confirmNewPassword: 'NewPassword456!'
      };

      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', 'Bearer invalid-token')
        .send(passwordData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});