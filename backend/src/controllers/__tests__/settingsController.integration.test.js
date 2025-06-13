import request from 'supertest';
import app from '../../../server.js';
import User from '../../models/User.js';
import GeneralSettings from '../../models/GeneralSettings.js';
import TaxRate from '../../models/TaxRate.js';
import PaymentGateway from '../../models/PaymentGateway.js';
import ShippingMethod from '../../models/ShippingMethod.js';
import jwt from 'jsonwebtoken';

describe('Settings Controller Integration Tests', () => {
  let adminUser;
  let adminToken;

  beforeEach(async () => {
    // Create admin user
    adminUser = new User({
      email: 'admin@test.com',
      password: 'hashedPassword123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      emailVerified: true,
      isActive: true
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

  describe('General Settings', () => {
    test('GET /api/admin/settings/general should return general settings', async () => {
      const response = await request(app)
        .get('/api/admin/settings/general')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('PUT /api/admin/settings/general should update general settings', async () => {
      const settingsData = {
        storeName: 'GrapheneOS Store',
        storeEmail: 'store@example.com',
        storePhone: '+1234567890',
        defaultCurrency: 'GBP',
        defaultLanguage: 'en',
        storeAddress: {
          street: '123 Privacy Street',
          city: 'London',
          country: 'GB'
        }
      };

      const response = await request(app)
        .put('/api/admin/settings/general')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(settingsData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.storeName).toBe(settingsData.storeName);
    });

    test('PUT /api/admin/settings/general should validate required fields', async () => {
      const invalidData = {
        storeName: '', // Empty required field
        storeEmail: 'invalid-email', // Invalid email
        defaultCurrency: 'INVALID' // Invalid currency
      };

      const response = await request(app)
        .put('/api/admin/settings/general')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });
  });

  describe('Shipping Settings', () => {
    test('GET /api/admin/settings/shipping should return shipping methods', async () => {
      const response = await request(app)
        .get('/api/admin/settings/shipping')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.shippingMethods)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    test('POST /api/admin/settings/shipping should create shipping method', async () => {
      const shippingData = {
        name: 'Express Delivery',
        code: 'EXPRESS_DELIVERY',
        description: 'Fast delivery service',
        baseCost: 15.99,
        estimatedDeliveryDays: {
          min: 1,
          max: 2
        },
        isActive: true,
        criteria: {
          maxWeight: 50000 // in grams
        },
        supportedCountries: ['GB', 'IE']
      };

      const response = await request(app)
        .post('/api/admin/settings/shipping')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(shippingData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(shippingData.name);
      expect(response.body.data.baseCost).toBe(shippingData.baseCost);
    });

    test('PUT /api/admin/settings/shipping/:methodId should update shipping method', async () => {
      // First create a shipping method
      const shippingMethod = new ShippingMethod({
        name: 'Standard Delivery',
        code: 'STANDARD_DELIVERY',
        description: 'Regular delivery service',
        baseCost: 5.99,
        estimatedDeliveryDays: {
          min: 3,
          max: 5
        },
        isActive: true
      });
      await shippingMethod.save();

      const updateData = {
        name: 'Updated Standard Delivery',
        baseCost: 7.99
      };

      const response = await request(app)
        .put(`/api/admin/settings/shipping/${shippingMethod._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.baseCost).toBe(updateData.baseCost);
    });

    test('DELETE /api/admin/settings/shipping/:methodId should delete shipping method', async () => {
      // First create a shipping method
      const shippingMethod = new ShippingMethod({
        name: 'Test Delivery',
        code: 'TEST_DELIVERY',
        description: 'Test delivery service',
        baseCost: 10.99,
        estimatedDeliveryDays: {
          min: 2,
          max: 3
        },
        isActive: true
      });
      await shippingMethod.save();

      const response = await request(app)
        .delete(`/api/admin/settings/shipping/${shippingMethod._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deactivated');

      // Verify it's actually deactivated
      const deactivatedMethod = await ShippingMethod.findById(shippingMethod._id);
      expect(deactivatedMethod.isActive).toBe(false);
    });
  });

  describe('Tax Settings', () => {
    test('GET /api/admin/settings/taxes should return tax rates', async () => {
      const response = await request(app)
        .get('/api/admin/settings/taxes')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.taxRates)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    test('POST /api/admin/settings/taxes should create tax rate', async () => {
      const taxData = {
        name: 'UK VAT',
        region: 'England',
        country: 'GB',
        rate: 20.0,
        type: 'VAT',
        calculationMethod: 'inclusive',
        isActive: true,
        effectiveFrom: new Date()
      };

      const response = await request(app)
        .post('/api/admin/settings/taxes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(taxData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(taxData.name);
      expect(response.body.data.rate).toBe(taxData.rate);
    });

    test('PUT /api/admin/settings/taxes/:taxRateId should update tax rate', async () => {
      // First create a tax rate
      const taxRate = new TaxRate({
        name: 'Test VAT',
        region: 'Scotland',
        country: 'GB',
        rate: 15.0,
        type: 'VAT',
        calculationMethod: 'inclusive',
        isActive: true
      });
      await taxRate.save();

      const updateData = {
        name: 'Updated VAT',
        rate: 18.0
      };

      const response = await request(app)
        .put(`/api/admin/settings/taxes/${taxRate._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.rate).toBe(updateData.rate);
    });

    test('DELETE /api/admin/settings/taxes/:taxRateId should delete tax rate', async () => {
      // First create a tax rate
      const taxRate = new TaxRate({
        name: 'Test Tax',
        region: 'Wales',
        country: 'GB',
        rate: 10.0,
        type: 'VAT',
        calculationMethod: 'exclusive',
        isActive: true
      });
      await taxRate.save();

      const response = await request(app)
        .delete(`/api/admin/settings/taxes/${taxRate._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deactivated');

      // Verify it's actually deactivated
      const deactivatedTax = await TaxRate.findById(taxRate._id);
      expect(deactivatedTax.isActive).toBe(false);
    });
  });

  describe('Payment Settings', () => {
    test('GET /api/admin/settings/payments should return payment gateways', async () => {
      const response = await request(app)
        .get('/api/admin/settings/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.paymentGateways)).toBe(true);
    });

    test('POST /api/admin/settings/payments should create payment gateway', async () => {
      const paymentData = {
        name: 'PayPal',
        code: 'PAYPAL',
        type: 'digital_wallet',
        provider: 'paypal',
        displayName: 'PayPal',
        isEnabled: true,
        supportedCurrencies: ['GBP', 'USD', 'EUR'],
        supportedCountries: ['GB', 'US', 'DE'],
        configuration: {
          apiKey: 'test-api-key',
          apiSecret: 'test-secret',
          environment: 'sandbox'
        },
        fees: {
          fixed: 0.30,
          percentage: 2.9
        }
      };

      const response = await request(app)
        .post('/api/admin/settings/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(paymentData.name);
      // Check the actual config structure from the model
      expect(response.body.data.config).toBeDefined();
      // The API keys are stored in different fields in the config object
      expect(response.body.data.config.paypalClientId).toBeDefined();
    });

    test('PUT /api/admin/settings/payments/:gatewayId should update payment gateway', async () => {
      // First create a payment gateway
      const gateway = new PaymentGateway({
        name: 'Test Gateway',
        code: 'TEST_GATEWAY',
        type: 'credit_card',
        provider: 'other',
        displayName: 'Test Gateway',
        isEnabled: true,
        supportedCurrencies: ['GBP'],
        supportedCountries: ['GB'],
        configuration: {
          apiKey: 'old-key',
          apiSecret: 'old-secret'
        }
      });
      await gateway.save();

      const updateData = {
        name: 'Updated Test Gateway'
      };

      const response = await request(app)
        .put(`/api/admin/settings/payments/${gateway._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
    });

    test('PUT /api/admin/settings/payments/:gatewayId/toggle should toggle payment gateway', async () => {
      // First create a payment gateway
      const gateway = new PaymentGateway({
        name: 'Toggle Test',
        code: 'TOGGLE_TEST',
        type: 'credit_card',
        provider: 'other',
        displayName: 'Toggle Test',
        isEnabled: true,
        supportedCurrencies: ['GBP'],
        supportedCountries: ['GB'],
        configuration: {}
      });
      await gateway.save();

      const response = await request(app)
        .put(`/api/admin/settings/payments/${gateway._id}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ enabled: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isEnabled).toBe(false); // Should be toggled to false
    });
  });

  describe('Authentication and Authorization', () => {
    test('Should require authentication for all settings endpoints', async () => {
      await request(app)
        .get('/api/admin/settings/general')
        .expect(401);

      await request(app)
        .put('/api/admin/settings/general')
        .send({})
        .expect(401);

      await request(app)
        .get('/api/admin/settings/shipping')
        .expect(401);

      await request(app)
        .get('/api/admin/settings/taxes')
        .expect(401);

      await request(app)
        .get('/api/admin/settings/payments')
        .expect(401);
    });

    test('Should require admin role for settings endpoints', async () => {
      // Create non-admin user
      const regularUser = new User({
        email: 'user@test.com',
        password: 'password123',
        firstName: 'Regular',
        lastName: 'User',
        role: 'customer',
        emailVerified: true,
        isActive: true
      });
      await regularUser.save();

      const userToken = jwt.sign(
        { 
          userId: regularUser._id,
          role: regularUser.role,
          email: regularUser.email
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '8h' }
      );

      await request(app)
        .get('/api/admin/settings/general')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      await request(app)
        .get('/api/admin/settings/shipping')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    test('Should reject invalid tokens', async () => {
      await request(app)
        .get('/api/admin/settings/general')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});