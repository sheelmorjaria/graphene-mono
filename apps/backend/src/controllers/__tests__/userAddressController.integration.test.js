import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import userRoutes from '../../routes/user.js';
import User from '../../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Mount the REAL user routes. user.js applies `authenticate` router-wide, so
// valid Bearer tokens + real users are required for the address endpoints.
const app = express();
app.use(express.json());
app.use('/api/user', userRoutes);

const validAddress = (overrides = {}) => ({
  fullName: 'Jane Doe',
  addressLine1: '10 Downing Street',
  addressLine2: '',
  city: 'London',
  stateProvince: 'Greater London',
  postalCode: 'SW1A 2AA',
  country: 'United Kingdom',
  phoneNumber: '+44 20 7946 0958',
  ...overrides
});

describe('User Address Controller - Integration Tests', () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Harness wipes all collections between tests; seed a fresh user + token.
    testUser = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.address@example.com',
      password: 'password123' // hashed by the User pre-save hook
    });

    authToken = jwt.sign({ userId: testUser._id }, JWT_SECRET, { expiresIn: '1h' });

    // Re-fetch the user fresh from the DB so each test starts with an empty
    // shippingAddresses array.
    testUser = await User.findById(testUser._id);
  });

  describe('Authentication', () => {
    it('returns 401 when no token is provided', async () => {
      const response = await request(app).get('/api/user/addresses').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/no token provided/i);
    });

    it('returns 401 for an invalid token', async () => {
      const response = await request(app)
        .get('/api/user/addresses')
        .set('Authorization', 'Bearer not-a-real-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/user/addresses', () => {
    it('returns an empty list for a user with no addresses', async () => {
      const response = await request(app)
        .get('/api/user/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.addresses).toEqual([]);
    });

    it('returns the addresses stored on the user document', async () => {
      testUser.shippingAddresses.push(validAddress());
      await testUser.save();

      const response = await request(app)
        .get('/api/user/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.addresses).toHaveLength(1);
      expect(response.body.data.addresses[0].fullName).toBe('Jane Doe');
      expect(response.body.data.addresses[0].city).toBe('London');
    });
  });

  describe('POST /api/user/addresses', () => {
    it('returns 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/user/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ fullName: 'Jane Doe' }) // missing many required fields
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/are required/i);
    });

    it('returns 400 for an invalid phone number', async () => {
      const response = await request(app)
        .post('/api/user/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAddress({ phoneNumber: 'not-a-phone' }))
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/valid phone number/i);
    });

    it('creates an address and marks the first one as default', async () => {
      const response = await request(app)
        .post('/api/user/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAddress())
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/added successfully/i);
      expect(response.body.data.address).toBeTruthy();
      expect(response.body.data.address.fullName).toBe('Jane Doe');
      // First address is automatically the default.
      expect(response.body.data.address.isDefault).toBe(true);

      // Persisted on the user.
      const reloaded = await User.findById(testUser._id);
      expect(reloaded.shippingAddresses).toHaveLength(1);
      expect(reloaded.shippingAddresses[0].isDefault).toBe(true);
    });

    it('does not mark a subsequent address as default', async () => {
      // Seed one default address first (isDefault set inline on construction).
      const first = testUser.shippingAddresses.create(validAddress({ fullName: 'First Person' }));
      first.isDefault = true;
      testUser.shippingAddresses.push(first);
      await testUser.save();

      const response = await request(app)
        .post('/api/user/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAddress({ fullName: 'Second Person' }))
        .expect(201);

      expect(response.body.data.address.isDefault).toBe(false);

      const reloaded = await User.findById(testUser._id);
      expect(reloaded.shippingAddresses).toHaveLength(2);
      expect(reloaded.shippingAddresses[0].isDefault).toBe(true);
      expect(reloaded.shippingAddresses[1].isDefault).toBe(false);
    });
  });

  describe('PUT /api/user/addresses/:addressId', () => {
    it('returns 404 when the address does not exist', async () => {
      const ghostId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/user/addresses/${ghostId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAddress())
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/address not found/i);
    });

    it('returns 400 when required fields are missing on update', async () => {
      testUser.shippingAddresses.push(validAddress());
      await testUser.save();
      const addressId = testUser.shippingAddresses[0]._id;

      const response = await request(app)
        .put(`/api/user/addresses/${addressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ fullName: 'New Name' }) // missing required fields
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/are required/i);
    });

    it('updates an existing address', async () => {
      testUser.shippingAddresses.push(validAddress());
      await testUser.save();
      const addressId = testUser.shippingAddresses[0]._id;

      const response = await request(app)
        .put(`/api/user/addresses/${addressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAddress({ city: 'Manchester', postalCode: 'M1 1AE' }))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/updated successfully/i);
      expect(response.body.data.address.city).toBe('Manchester');
      expect(response.body.data.address.postalCode).toBe('M1 1AE');

      const reloaded = await User.findById(testUser._id);
      expect(reloaded.shippingAddresses[0].city).toBe('Manchester');
    });
    it('returns 400 for an invalid phone number on update', async () => {
      testUser.shippingAddresses.push(validAddress());
      await testUser.save();
      const addressId = testUser.shippingAddresses[0]._id;

      const response = await request(app)
        .put(`/api/user/addresses/${addressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAddress({ phoneNumber: '000!!!' }))
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/valid phone number/i);
    });
  });

  describe('DELETE /api/user/addresses/:addressId', () => {
    it('returns 404 when the address does not exist', async () => {
      const ghostId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/user/addresses/${ghostId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toMatch(/address not found/i);
    });

    it('deletes the address', async () => {
      testUser.shippingAddresses.push(validAddress());
      await testUser.save();
      const addressId = testUser.shippingAddresses[0]._id;

      const response = await request(app)
        .delete(`/api/user/addresses/${addressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(/deleted successfully/i);

      const reloaded = await User.findById(testUser._id);
      expect(reloaded.shippingAddresses).toHaveLength(0);
    });

    it('promotes the next address to default when the default is deleted', async () => {
      // Seed two addresses: first default, second non-default.
      const first = testUser.shippingAddresses.create(validAddress({ fullName: 'Default One' }));
      first.isDefault = true;
      testUser.shippingAddresses.push(first);
      const second = testUser.shippingAddresses.create(validAddress({ fullName: 'Second One' }));
      second.isDefault = false;
      testUser.shippingAddresses.push(second);
      await testUser.save();

      const defaultId = testUser.shippingAddresses[0]._id;

      await request(app)
        .delete(`/api/user/addresses/${defaultId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const reloaded = await User.findById(testUser._id);
      expect(reloaded.shippingAddresses).toHaveLength(1);
      expect(reloaded.shippingAddresses[0].fullName).toBe('Second One');
      // The remaining address was promoted to default.
      expect(reloaded.shippingAddresses[0].isDefault).toBe(true);
    });
  });
});
