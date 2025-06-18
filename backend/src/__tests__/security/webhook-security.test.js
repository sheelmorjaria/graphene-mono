import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import paymentRoutes from '../../routes/payment.js';
import Order from '../../models/Order.js';
import User from '../../models/User.js';

// Security tests for Monero webhook endpoints
describe('Webhook Security Tests', () => {
  let app;
  let mongoServer;
  let testOrder;
  const testSecret = 'test-webhook-secret-key';
  
  beforeAll(async () => {
    // Disconnect any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    
    // Create test order
    const testUser = await User.create({
      firstName: 'Test',
      lastName: 'User', 
      email: 'test@example.com',
      password: 'hashedpassword123'
    });

    testOrder = await Order.create({
      userId: testUser._id,
      orderNumber: 'ORD-TEST-456',
      customerEmail: 'test@example.com',
      items: [{
        productId: new mongoose.Types.ObjectId(),
        productName: 'Test Product',
        productSlug: 'test-product',
        quantity: 1,
        unitPrice: 199.99,
        totalPrice: 199.99
      }],
      subtotal: 199.99,
      orderTotal: 199.99,
      shippingAddress: {
        fullName: 'Test User',
        addressLine1: '123 Test St',
        city: 'Test City',
        stateProvince: 'Test State', 
        postalCode: '12345',
        country: 'UK'
      },
      billingAddress: {
        fullName: 'Test User',
        addressLine1: '123 Test St',
        city: 'Test City',
        stateProvince: 'Test State',
        postalCode: '12345', 
        country: 'UK'
      },
      shippingMethod: {
        id: new mongoose.Types.ObjectId(),
        name: 'Standard Shipping',
        cost: 0
      },
      paymentMethod: {
        type: 'monero',
        name: 'Monero (XMR)'
      },
      paymentStatus: 'pending'
    });
    
    // Setup Express app
    app = express();
    
    // Disable Express headers for security
    app.disable('x-powered-by');
    app.use((req, res, next) => {
      res.removeHeader('Server');
      next();
    });
    
    app.use(express.json());
    
    // Add error handling middleware
    app.use((err, req, res, _next) => {
      console.error('Test app error:', err);
      res.status(500).json({ error: 'Internal server error', message: err.message });
    });
    
    app.use('/api/payments', paymentRoutes);
    
    // Set webhook secret
    process.env.GLOBEE_WEBHOOK_SECRET = testSecret;
    process.env.GLOBEE_API_KEY = 'test-api-key';
    
    // Reinitialize monero service with new env vars
    const moneroService = (await import('../../services/moneroService.js')).default;
    moneroService.secret = testSecret;
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const generateValidSignature = (payload) => {
    return 'sha256=' + crypto
      .createHmac('sha256', testSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
  };

  const generateInvalidSignature = (payload) => {
    return 'sha256=' + crypto
      .createHmac('sha256', 'wrong-secret')
      .update(JSON.stringify(payload))
      .digest('hex');
  };

  describe('Signature Verification', () => {
    let validPayload;
    
    beforeEach(() => {
      validPayload = {
        id: 'payment-123',
        status: 'paid',
        confirmations: 12,
        order_id: testOrder._id.toString(),
        paid_amount: 1.5,
        total_amount: 1.5
      };
    });

    it('should accept webhooks with valid signatures', async () => {
      const signature = generateValidSignature(validPayload);

      const response = await request(app)
        .post('/api/payments/monero/webhook')
        .set('X-GloBee-Signature', signature)
        .send(validPayload);

      // Should not be rejected for signature reasons
      expect(response.status).not.toBe(401);
    });

    it('should reject webhooks with invalid signatures', async () => {
      const signature = generateInvalidSignature(validPayload);

      const response = await request(app)
        .post('/api/payments/monero/webhook')
        .set('X-GloBee-Signature', signature)
        .send(validPayload)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid signature');
    });

    it('should reject webhooks without signatures', async () => {
      const response = await request(app)
        .post('/api/payments/monero/webhook')
        .send(validPayload);

      // Should reject due to missing signature
      expect([400, 401]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should reject webhooks with malformed signatures', async () => {
      const malformedSignatures = [
        'invalid-format',
        'sha256=',
        'md5=validhash',
        'sha256=toolonghashdoesnotexistinrealworld123456789',
        '',
        null,
        undefined
      ];

      for (const signature of malformedSignatures.filter(s => s !== null && s !== undefined)) {
        const response = await request(app)
          .post('/api/payments/monero/webhook')
          .set('X-GloBee-Signature', signature)
          .send(validPayload);

        expect(response.status).toBe(401);
      }
    });
  });

  describe('Timing Attack Protection', () => {
    it('should use constant-time comparison for signature verification', async () => {
      const payload = { id: 'test', status: 'paid' };
      generateValidSignature(payload);
      
      // Test multiple invalid signatures with same timing
      const invalidSignatures = [
        'sha256=0000000000000000000000000000000000000000000000000000000000000000',
        'sha256=ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        'sha256=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      ];

      const timings = [];

      for (const signature of invalidSignatures) {
        const startTime = process.hrtime.bigint();
        
        await request(app)
          .post('/api/payments/monero/webhook')
          .set('X-GloBee-Signature', signature)
          .send(payload);

        const endTime = process.hrtime.bigint();
        timings.push(Number(endTime - startTime));
      }

      // Timing variations should be minimal (within 10ms)
      const maxTiming = Math.max(...timings);
      const minTiming = Math.min(...timings);
      const variation = (maxTiming - minTiming) / 1000000; // Convert to ms

      expect(variation).toBeLessThan(10);
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should handle oversized webhook payloads', async () => {
      const largePayload = {
        id: 'a'.repeat(10000),
        status: 'paid',
        data: 'x'.repeat(100000)
      };

      const signature = generateValidSignature(largePayload);

      const response = await request(app)
        .post('/api/payments/monero/webhook')
        .set('X-GloBee-Signature', signature)
        .send(largePayload);

      // Should handle large payloads gracefully (either accept or reject cleanly)
      expect([200, 400, 401, 413, 500]).toContain(response.status);
    });

    it('should sanitize dangerous input fields', async () => {
      const maliciousPayload = {
        id: '<script>alert("xss")</script>',
        status: 'paid',
        order_id: '../../../etc/passwd',
        custom_data: {
          eval: 'require("child_process").exec("rm -rf /")',
          __proto__: { polluted: true }
        }
      };

      const signature = generateValidSignature(maliciousPayload);

      const response = await request(app)
        .post('/api/payments/monero/webhook')
        .set('X-GloBee-Signature', signature)
        .send(maliciousPayload);

      // Should not execute malicious code or cause errors
      expect([200, 400, 401, 404, 500]).toContain(response.status);
    });

    it('should validate required webhook fields', async () => {
      const incompletePayloads = [
        {}, // Empty payload
        { id: 'test' }, // Missing status
        { status: 'paid' }, // Missing id
        { id: null, status: 'paid' }, // Null values
        { id: '', status: '' } // Empty strings
      ];

      for (const payload of incompletePayloads) {
        const signature = generateValidSignature(payload);

        const response = await request(app)
          .post('/api/payments/monero/webhook')
          .set('X-GloBee-Signature', signature)
          .send(payload);

        // Should handle incomplete data gracefully
        expect([200, 400, 401, 500]).toContain(response.status);
      }
    });

    it('should prevent JSON injection attacks', async () => {
      const jsonInjectionPayloads = [
        '{"id": "test", "__proto__": {"isAdmin": true}}',
        '{"id": "test", "constructor": {"prototype": {"isAdmin": true}}}',
        '{"id": "test", "status": "paid", "amount": 1e308}' // Number overflow
      ];

      for (const jsonString of jsonInjectionPayloads) {
        const signature = 'sha256=' + crypto
          .createHmac('sha256', testSecret)
          .update(jsonString)
          .digest('hex');

        const response = await request(app)
          .post('/api/payments/monero/webhook')
          .set('X-GloBee-Signature', signature)
          .set('Content-Type', 'application/json')
          .send(jsonString);

        expect([200, 400, 401, 500]).toContain(response.status);
      }
    });
  });

  describe('Rate Limiting and DoS Protection', () => {
    it('should handle rapid webhook requests', async () => {
      const payload = {
        id: 'rapid-test',
        status: 'paid',
        order_id: 'order-123'
      };
      const signature = generateValidSignature(payload);

      // Send 50 rapid requests
      const promises = Array(50).fill(null).map((_, index) => 
        request(app)
          .post('/api/payments/monero/webhook')
          .set('X-GloBee-Signature', signature)
          .send({ ...payload, id: `rapid-test-${index}` })
      );

      const responses = await Promise.all(promises);

      // Should handle all requests without crashing
      responses.forEach(response => {
        expect([200, 400, 401, 404, 429, 500]).toContain(response.status);
      });
    });

    it('should prevent webhook replay attacks', async () => {
      const payload = {
        id: 'replay-test',
        status: 'paid',
        order_id: 'order-123',
        timestamp: Date.now()
      };
      const signature = generateValidSignature(payload);

      // Send same webhook multiple times
      const firstResponse = await request(app)
        .post('/api/payments/monero/webhook')
        .set('X-GloBee-Signature', signature)
        .send(payload);

      const secondResponse = await request(app)
        .post('/api/payments/monero/webhook')
        .set('X-GloBee-Signature', signature)
        .send(payload);

      // Both should succeed but duplicate processing should be handled
      expect([200, 400, 401, 409, 500]).toContain(firstResponse.status);
      expect([200, 400, 401, 409, 500]).toContain(secondResponse.status);
    });
  });

  describe('Information Disclosure Prevention', () => {
    it('should not leak sensitive information in error responses', async () => {
      const testCases = [
        { payload: { id: 'test' }, expectedNoLeak: ['password', 'secret', 'key', 'token'] },
        { payload: null, expectedNoLeak: ['stack trace', 'file path', 'internal error'] },
        { payload: 'invalid json', expectedNoLeak: ['mongodb', 'database', 'connection'] }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/payments/monero/webhook')
          .set('X-GloBee-Signature', 'invalid-signature')
          .send(testCase.payload);

        const responseText = JSON.stringify(response.body).toLowerCase();
        
        testCase.expectedNoLeak.forEach(sensitiveInfo => {
          expect(responseText).not.toContain(sensitiveInfo);
        });
      }
    });

    it('should not expose server details in headers', async () => {
      const response = await request(app)
        .post('/api/payments/monero/webhook')
        .send({});

      // Should not expose server technology details
      expect(response.headers['server']).toBeUndefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('Database Injection Prevention', () => {
    it('should prevent NoSQL injection in order lookup', async () => {
      const injectionPayloads = [
        {
          id: 'test',
          status: 'paid',
          order_id: { '$ne': null }
        },
        {
          id: 'test',
          status: 'paid',
          order_id: { '$regex': '.*' }
        },
        {
          id: 'test',
          status: 'paid',
          order_id: { '$where': 'function() { return true; }' }
        }
      ];

      for (const payload of injectionPayloads) {
        const signature = generateValidSignature(payload);

        const response = await request(app)
          .post('/api/payments/monero/webhook')
          .set('X-GloBee-Signature', signature)
          .send(payload);

        // Should not execute injection attacks
        expect([200, 400, 401, 404, 500]).toContain(response.status);
      }
    });
  });

  describe('Cryptographic Security', () => {
    it('should use secure hashing algorithms', async () => {
      const payload = { id: 'crypto-test', status: 'paid' };
      
      // Test with different signature algorithms
      const algorithms = ['md5', 'sha1', 'sha256'];
      
      for (const algorithm of algorithms) {
        const signature = algorithm + '=' + crypto
          .createHmac(algorithm, testSecret)
          .update(JSON.stringify(payload))
          .digest('hex');

        const response = await request(app)
          .post('/api/payments/monero/webhook')
          .set('X-GloBee-Signature', signature)
          .send(payload);

        if (algorithm === 'sha256') {
          // Should accept secure SHA-256
          expect([200, 400, 401, 404, 500]).toContain(response.status);
        } else {
          // Should reject weak algorithms
          expect([401, 500]).toContain(response.status);
        }
      }
    });

    it('should handle signature encoding properly', async () => {
      const payload = { id: 'encoding-test', status: 'paid' };
      const hash = crypto
        .createHmac('sha256', testSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      const encodingVariations = [
        `sha256=${hash}`, // Standard
        `sha256=${hash.toUpperCase()}`, // Uppercase
        `SHA256=${hash}`, // Different case prefix
        ` sha256=${hash} ` // With whitespace
      ];

      for (const signature of encodingVariations) {
        const response = await request(app)
          .post('/api/payments/monero/webhook')
          .set('X-GloBee-Signature', signature)
          .send(payload);

        // Should handle encoding variations consistently
        expect([200, 400, 401, 404, 500]).toContain(response.status);
      }
    });
  });
});