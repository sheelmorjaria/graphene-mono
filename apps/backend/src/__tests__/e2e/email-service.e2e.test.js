import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import User from '../../models/User.js';
// The e2e harness (src/test/setup.e2e.js) module-mocks the email service.
// Importing the named exports here gives us the mock fns, so we can assert
// the real HTTP flows actually trigger the right emails.
import {
  sendWelcomeEmail,
  sendPasswordResetEmail
} from '../../services/emailService.js';

describe('Email Service E2E Tests', () => {
  // NOTE: the e2e harness wipes all collections in beforeEach, so users must
  // be seeded inside each test (not beforeAll).
  let customerUser;

  const seedCustomer = async () => {
    customerUser = await User.create({
      email: 'customer@email.test',
      password: 'Customer123!',
      firstName: 'Customer',
      lastName: 'User',
      role: 'customer',
      emailVerified: true,
      accountStatus: 'active'
    });
  };

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@email\.test$/ } });
  });

  describe('Authentication Email Flows', () => {
    it('should send welcome email on user registration', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@email.test',
          password: 'NewUser123!',
          confirmPassword: 'NewUser123!',
          firstName: 'New',
          lastName: 'User'
        });

      expect(registerRes.status).toBe(201);

      expect(sendWelcomeEmail).toHaveBeenCalledTimes(1);
      const [email, token, nameContext] = sendWelcomeEmail.mock.calls[0];
      expect(email).toBe('newuser@email.test');
      expect(token).toEqual(expect.any(String));
      expect(token.length).toBeGreaterThan(20); // hashed verification token
      expect(nameContext).toMatchObject({ firstName: 'New', lastName: 'User' });

      await User.deleteOne({ email: 'newuser@email.test' });
    });

    it('should reject registration with missing names (no email sent)', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'noname@email.test',
          password: 'NewUser123!',
          confirmPassword: 'NewUser123!'
        });

      expect(registerRes.status).toBe(400);
      expect(sendWelcomeEmail).not.toHaveBeenCalled();

      const user = await User.findOne({ email: 'noname@email.test' });
      expect(user).toBeNull();
    });

    it('should still create the user when the welcome email fails', async () => {
      sendWelcomeEmail.mockRejectedValueOnce(new Error('Email service unavailable'));

      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'failedmail@email.test',
          password: 'Failed123!',
          confirmPassword: 'Failed123!',
          firstName: 'Failed',
          lastName: 'Mail'
        });

      // Email failure is non-fatal — the account must still be created
      expect(registerRes.status).toBe(201);

      const user = await User.findOne({ email: 'failedmail@email.test' });
      expect(user).toBeTruthy();

      await User.deleteOne({ email: 'failedmail@email.test' });
    });

    it('should send password reset email for a known account', async () => {
      await seedCustomer();

      const resetRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'customer@email.test' });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body).toHaveProperty(
        'message',
        expect.stringContaining('password reset')
      );

      expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      const [email, token, nameContext] = sendPasswordResetEmail.mock.calls[0];
      expect(email).toBe('customer@email.test');
      expect(token).toEqual(expect.any(String));
      expect(token.length).toBeGreaterThan(20); // hashed reset token
      expect(nameContext).toMatchObject({
        firstName: customerUser.firstName,
        lastName: customerUser.lastName
      });
    });

    it('should not reveal whether an email exists (anti-enumeration)', async () => {
      const resetRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nobody@email.test' });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body).toHaveProperty(
        'message',
        expect.stringContaining('If an account exists')
      );
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });
});
