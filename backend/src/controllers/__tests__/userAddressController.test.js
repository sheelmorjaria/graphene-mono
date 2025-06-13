import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../server.js';
import User from '../../models/User.js';
import jwt from 'jsonwebtoken';

describe('User Address Controller', () => {
  // Using global test setup for MongoDB connection

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('GET /api/user/addresses', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      // Create a test user with some addresses
      const userData = {
        email: 'address.test@example.com',
        password: 'TestPassword123!',
        firstName: 'Address',
        lastName: 'Test',
        shippingAddresses: [
          {
            fullName: 'John Doe',
            addressLine1: '123 Main St',
            addressLine2: 'Apt 4B',
            city: 'New York',
            stateProvince: 'NY',
            postalCode: '10001',
            country: 'United States',
            phoneNumber: '+1 (555) 123-4567',
            isDefault: true
          },
          {
            fullName: 'John Doe',
            addressLine1: '456 Oak Ave',
            city: 'Los Angeles',
            stateProvince: 'CA',
            postalCode: '90210',
            country: 'United States',
            phoneNumber: '+1 (555) 987-6543',
            isDefault: false
          }
        ]
      };

      const user = new User(userData);
      await user.save();
      userId = user._id;
      authToken = jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key');
    });

    it('should get all user addresses', async () => {
      const response = await request(app)
        .get('/api/user/addresses')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.addresses).toHaveLength(2);
      
      const firstAddress = response.body.data.addresses.find(addr => addr.isDefault);
      expect(firstAddress.fullName).toBe('John Doe');
      expect(firstAddress.addressLine1).toBe('123 Main St');
      expect(firstAddress.city).toBe('New York');
      expect(firstAddress.isDefault).toBe(true);
    });

    it('should return empty array for user with no addresses', async () => {
      // Create user without addresses
      const userData = {
        email: 'noaddress.test@example.com',
        password: 'TestPassword123!',
        firstName: 'No',
        lastName: 'Address'
      };

      const user = new User(userData);
      await user.save();
      const newAuthToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your-secret-key');

      const response = await request(app)
        .get('/api/user/addresses')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.addresses).toHaveLength(0);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/user/addresses');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/user/addresses', () => {
    let authToken;
    let userId;

    beforeEach(async () => {
      const userData = {
        email: 'address.test@example.com',
        password: 'TestPassword123!',
        firstName: 'Address',
        lastName: 'Test'
      };

      const user = new User(userData);
      await user.save();
      userId = user._id;
      authToken = jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key');
    });

    const validAddress = {
      fullName: 'Jane Smith',
      addressLine1: '789 Pine St',
      addressLine2: 'Unit 12',
      city: 'Chicago',
      stateProvince: 'IL',
      postalCode: '60601',
      country: 'United States',
      phoneNumber: '+1 (555) 555-5555'
    };

    it('should add a new address successfully', async () => {
      const response = await request(app)
        .post('/api/user/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAddress);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Address added successfully');
      expect(response.body.data.address.fullName).toBe('Jane Smith');
      expect(response.body.data.address._id).toBeDefined();

      // Verify address was saved to database
      const user = await User.findById(userId);
      expect(user.shippingAddresses).toHaveLength(1);
      expect(user.shippingAddresses[0].fullName).toBe('Jane Smith');
    });

    it('should set first address as default automatically', async () => {
      const response = await request(app)
        .post('/api/user/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAddress);

      expect(response.status).toBe(201);
      expect(response.body.data.address.isDefault).toBe(true);
    });

    it('should not set subsequent addresses as default', async () => {
      // Add first address
      await request(app)
        .post('/api/user/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validAddress);

      // Add second address
      const secondAddress = {
        ...validAddress,
        fullName: 'Bob Johnson',
        addressLine1: '321 Elm St'
      };

      const response = await request(app)
        .post('/api/user/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(secondAddress);

      expect(response.status).toBe(201);
      expect(response.body.data.address.isDefault).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const incompleteAddress = {
        fullName: 'Jane Smith',
        // Missing required fields
        city: 'Chicago'
      };

      const response = await request(app)
        .post('/api/user/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteAddress);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should fail with invalid phone number format', async () => {
      const invalidPhoneAddress = {
        ...validAddress,
        phoneNumber: 'invalid-phone'
      };

      const response = await request(app)
        .post('/api/user/addresses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPhoneAddress);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('valid phone number');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/user/addresses')
        .send(validAddress);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/user/addresses/:addressId', () => {
    let authToken;
    let userId;
    let addressId;

    beforeEach(async () => {
      const userData = {
        email: 'address.test@example.com',
        password: 'TestPassword123!',
        firstName: 'Address',
        lastName: 'Test',
        shippingAddresses: [{
          fullName: 'Original Name',
          addressLine1: '123 Original St',
          city: 'Original City',
          stateProvince: 'CA',
          postalCode: '12345',
          country: 'United States',
          isDefault: true
        }]
      };

      const user = new User(userData);
      await user.save();
      userId = user._id;
      addressId = user.shippingAddresses[0]._id;
      authToken = jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key');
    });

    it('should update an address successfully', async () => {
      const updatedData = {
        fullName: 'Updated Name',
        addressLine1: '456 Updated St',
        addressLine2: 'Suite 100',
        city: 'Updated City',
        stateProvince: 'NY',
        postalCode: '54321',
        country: 'United States',
        phoneNumber: '+1 (555) 999-8888'
      };

      const response = await request(app)
        .put(`/api/user/addresses/${addressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Address updated successfully');
      expect(response.body.data.address.fullName).toBe('Updated Name');
      expect(response.body.data.address.city).toBe('Updated City');

      // Verify update in database
      const user = await User.findById(userId);
      const address = user.shippingAddresses.id(addressId);
      expect(address.fullName).toBe('Updated Name');
      expect(address.addressLine2).toBe('Suite 100');
    });

    it('should fail with invalid address ID', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`/api/user/addresses/${invalidId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Test',
          addressLine1: '123 Test St',
          city: 'Test City',
          stateProvince: 'CA',
          postalCode: '12345',
          country: 'US'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Address not found');
    });

    it('should fail with validation errors', async () => {
      const invalidData = {
        fullName: '',  // Empty required field
        phoneNumber: 'invalid-phone'
      };

      const response = await request(app)
        .put(`/api/user/addresses/${addressId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/api/user/addresses/${addressId}`)
        .send({
          fullName: 'Test',
          addressLine1: '123 Test St',
          city: 'Test City',
          stateProvince: 'CA',
          postalCode: '12345',
          country: 'US'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/user/addresses/:addressId', () => {
    let authToken;
    let userId;
    let addressId;

    beforeEach(async () => {
      const userData = {
        email: 'address.test@example.com',
        password: 'TestPassword123!',
        firstName: 'Address',
        lastName: 'Test',
        shippingAddresses: [
          {
            fullName: 'First Address',
            addressLine1: '123 First St',
            city: 'First City',
            stateProvince: 'CA',
            postalCode: '12345',
            country: 'United States',
            isDefault: true
          },
          {
            fullName: 'Second Address',
            addressLine1: '456 Second St',
            city: 'Second City',
            stateProvince: 'NY',
            postalCode: '54321',
            country: 'United States',
            isDefault: false
          }
        ]
      };

      const user = new User(userData);
      await user.save();
      userId = user._id;
      addressId = user.shippingAddresses[1]._id; // Non-default address
      authToken = jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key');
    });

    it('should delete an address successfully', async () => {
      const response = await request(app)
        .delete(`/api/user/addresses/${addressId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Address deleted successfully');

      // Verify deletion in database
      const user = await User.findById(userId);
      expect(user.shippingAddresses).toHaveLength(1);
      expect(user.shippingAddresses[0].fullName).toBe('First Address');
    });

    it('should promote another address to default when deleting default address', async () => {
      // Delete the default address
      const defaultAddressId = (await User.findById(userId)).shippingAddresses.find(addr => addr.isDefault)._id;
      
      const response = await request(app)
        .delete(`/api/user/addresses/${defaultAddressId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify another address became default
      const user = await User.findById(userId);
      expect(user.shippingAddresses).toHaveLength(1);
      expect(user.shippingAddresses[0].isDefault).toBe(true);
      expect(user.shippingAddresses[0].fullName).toBe('Second Address');
    });

    it('should fail with invalid address ID', async () => {
      const invalidId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/api/user/addresses/${invalidId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Address not found');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/user/addresses/${addressId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});