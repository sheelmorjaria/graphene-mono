import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../../app.js';
import User from '../../models/User.js';

// Comprehensive Error Handling E2E Tests — asserts the REAL error responses
// produced by the auth middleware, validators, and the global errorHandler.
const JWT_KEY = process.env.JWT_SECRET || 'your-secret-key';

describe('Comprehensive Error Handling E2E Tests', () => {
  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@error\.test$/ } });
  });

  describe('Authentication Errors', () => {
    it('should reject requests without a token', async () => {
      const res = await request(app).get('/api/user/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Access denied. No token provided.');
    });

    it('should reject malformed tokens', async () => {
      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer not-a-real-jwt');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid token.');
    });

    it('should reject expired tokens', async () => {
      const token = jwt.sign(
        { userId: new mongoose.Types.ObjectId() },
        JWT_KEY,
        { expiresIn: '-10s' } // already expired
      );

      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Token has expired.');
    });

    it('should reject tokens whose user no longer exists', async () => {
      const token = jwt.sign(
        { userId: new mongoose.Types.ObjectId() }, // no such user
        JWT_KEY,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid token. User not found.');
    });
  });

  describe('Routing and Payload Errors', () => {
    it('should return 404 JSON for unknown routes', async () => {
      const res = await request(app).get('/api/definitely-not-a-route');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Not Found');
    });

    it('should reject malformed JSON bodies with 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"broken json');

      expect(res.status).toBe(400);
    });

    it('should return a combined message for multiple missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({}); // missing email, password, firstName, lastName

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/required/i);
    });
  });

  describe('Business Errors', () => {
    it('should return 409 when registering an existing email', async () => {
      const payload = {
        email: 'existing@error.test',
        password: 'Existing123!',
        confirmPassword: 'Existing123!',
        firstName: 'Existing',
        lastName: 'User'
      };

      const first = await request(app).post('/api/auth/register').send(payload);
      expect(first.status).toBe(201);

      const duplicate = await request(app).post('/api/auth/register').send(payload);
      expect(duplicate.status).toBe(409);
      expect(duplicate.body.success).toBe(false);
      expect(duplicate.body.error).toBe('An account with this email already exists');
    });
  });
});
