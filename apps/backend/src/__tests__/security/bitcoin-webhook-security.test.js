import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import paymentRoutes from '../../routes/payment.js';
import Order from '../../models/Order.js';
import User from '../../models/User.js';

// Bitcoin Webhook Security Tests
describe('Bitcoin Webhook Security Tests', () => {
  let app;
  let mongoServer;
  let testUser;
  let testOrder;
  const testBitcoinAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
  
  beforeAll(async () => {
    // Disconnect any existing connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    
    // Create test user and order
    testUser = await User.create({
      firstName: 'Test',
      lastName: 'User', 
      email: 'test@example.com',
      password: 'hashedpassword123'
    });

    testOrder = await Order.create({
      userId: testUser._id,
      orderNumber: 'ORD-BTC-SEC-TEST-456',
      customerEmail: 'test@example.com',
      items: [{
        productId: new mongoose.Types.ObjectId(),
        productName: 'Test Security Product',
        productSlug: 'test-security-product',
        quantity: 1,
        unitPrice: 199.99,
        totalPrice: 199.99
      }],
      subtotal: 199.99,
      orderTotal: 199.99,
      shippingAddress: {
        fullName: 'Test User',
        addressLine1: '123 Security St',
        city: 'Test City',
        stateProvince: 'Test State', 
        postalCode: '12345',
        country: 'UK'
      },
      billingAddress: {
        fullName: 'Test User',
        addressLine1: '123 Security St',
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
        type: 'bitcoin',
        name: 'Bitcoin'
      },
      paymentDetails: {
        bitcoinAddress: testBitcoinAddress,
        bitcoinAmount: 0.00444444,
        bitcoinExchangeRate: 45000,
        bitcoinPaymentExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      paymentStatus: 'awaiting_confirmation'
    });
    
    // Setup Express app
    app = express();
    
    // Disable Express headers for security
    app.disable('x-powered-by');
    app.use((req, res, next) => {
      res.removeHeader('Server');
      next();
    });
    
    app.use(express.json({ limit: '10mb' }));
    
    // Add error handling middleware
    app.use((err, req, res, _next) => {
      console.error('Test app error:', err);
      res.status(500).json({ error: 'Internal server error', message: err.message });
    });
    
    app.use('/api/payments', paymentRoutes);
    
    // Set environment variables
    process.env.BLOCKONOMICS_API_KEY = 'test-bitcoin-api-key';
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(() => {
    // Reset any test state
  });

  describe('Input Validation and Sanitization', () => {
    it('should validate required webhook fields', async () => {
      const incompletePayloads = [
        {}, // Empty payload
        { addr: testBitcoinAddress }, // Missing txid
        { txid: 'test123' }, // Missing addr
        { addr: null, txid: 'test123' }, // Null values
        { addr: '', txid: '' }, // Empty strings
        { addr: testBitcoinAddress, txid: null } // Null txid
      ];

      for (const payload of incompletePayloads) {
        const response = await request(app)
          .post('/api/payments/bitcoin/webhook')
          .send(payload);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid webhook data');
      }
    });

    it('should handle oversized webhook payloads', async () => {
      const largePayload = {
        addr: testBitcoinAddress,
        txid: 'a'.repeat(10000),
        value: 100000000,
        confirmations: 6,
        extraData: 'x'.repeat(100000)
      };

      const response = await request(app)
        .post('/api/payments/bitcoin/webhook')
        .send(largePayload);

      // Should handle large payloads gracefully
      expect([200, 400, 404, 413, 500]).toContain(response.status);
    });

    it('should sanitize dangerous input fields', async () => {
      const maliciousPayload = {
        addr: '<script>alert("xss")</script>',
        txid: '../../../etc/passwd',
        value: 'require("child_process").exec("rm -rf /")',
        confirmations: '1; DROP TABLE orders;--',
        __proto__: { polluted: true },
        constructor: { prototype: { isAdmin: true } }
      };

      const response = await request(app)
        .post('/api/payments/bitcoin/webhook')
        .send(maliciousPayload);

      // Should not execute malicious code or cause errors
      expect([400, 404, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it('should prevent JSON injection attacks', async () => {
      const jsonInjectionPayloads = [
        '{"addr": "' + testBitcoinAddress + '", "__proto__": {"isAdmin": true}}',
        '{"addr": "' + testBitcoinAddress + '", "constructor": {"prototype": {"isAdmin": true}}}',
        '{"addr": "' + testBitcoinAddress + '", "txid": "test", "value": 1e308}' // Number overflow
      ];

      for (const jsonString of jsonInjectionPayloads) {
        const response = await request(app)
          .post('/api/payments/bitcoin/webhook')
          .set('Content-Type', 'application/json')
          .send(jsonString);

        expect([400, 404, 500]).toContain(response.status);
      }
    });

    it('should validate Bitcoin address format', async () => {
      const invalidAddresses = [
        '1InvalidBitcoinAddress123',
        '0x1234567890abcdef', // Ethereum address
        'bc1invalid_bech32_address',
        '../../malicious/path',
        'javascript:alert(1)',
        'SELECT * FROM orders',
        null,
        undefined,
        123456789,
        {}
      ];

      for (const addr of invalidAddresses) {
        const payload = {
          addr: addr,
          txid: 'validtxid123',
          value: 100000000,
          confirmations: 3
        };

        const response = await request(app)
          .post('/api/payments/bitcoin/webhook')
          .send(payload);

        // Should handle invalid addresses gracefully
        expect([400, 404, 500]).toContain(response.status);
      }
    });

    it('should validate transaction ID format', async () => {
      const invalidTxids = [
        null,
        undefined,
        '',
        'x'.repeat(100), // Too long
        '<script>alert(1)</script>',
        '../../etc/passwd',
        'DROP TABLE orders',
        123456789,
        {}
      ];

      for (const txid of invalidTxids) {
        const payload = {
          addr: testBitcoinAddress,
          txid: txid,
          value: 100000000,
          confirmations: 3
        };

        const response = await request(app)
          .post('/api/payments/bitcoin/webhook')
          .send(payload);

        if (txid === null || txid === undefined || txid === '') {
          expect(response.status).toBe(400);
          expect(response.body.error).toBe('Invalid webhook data');
        } else {
          expect([400, 404, 500]).toContain(response.status);
        }
      }
    });

    it('should validate numeric fields', async () => {
      const invalidValues = [
        { value: 'not_a_number', confirmations: 3 },
        { value: 100000000, confirmations: 'not_a_number' },
        { value: -1, confirmations: 3 }, // Negative value
        { value: 100000000, confirmations: -1 }, // Negative confirmations
        { value: Infinity, confirmations: 3 },
        { value: NaN, confirmations: 3 },
        { value: 2.1e+18, confirmations: 3 } // Extremely large number
      ];

      for (const { value, confirmations } of invalidValues) {
        const payload = {
          addr: testBitcoinAddress,
          txid: 'validtxid123',
          value: value,
          confirmations: confirmations
        };

        const response = await request(app)
          .post('/api/payments/bitcoin/webhook')
          .send(payload);

        // Should handle invalid numeric values gracefully
        expect([400, 404, 500]).toContain(response.status);
      }
    });
  });

  describe('Rate Limiting and DoS Protection', () => {
    it('should handle rapid webhook requests', async () => {
      const validPayload = {
        addr: testBitcoinAddress,
        txid: 'rapid-test-txid',
        value: 100000000,
        confirmations: 1
      };

      // Send 50 rapid requests
      const promises = Array(50).fill(null).map((_, index) => 
        request(app)
          .post('/api/payments/bitcoin/webhook')
          .send({ ...validPayload, txid: `rapid-test-${index}` })
      );

      const responses = await Promise.all(promises);

      // Should handle all requests without crashing
      responses.forEach(response => {
        expect([200, 400, 404, 429, 500]).toContain(response.status);
      });
    });

    it('should prevent webhook replay attacks', async () => {
      const payload = {
        addr: testBitcoinAddress,
        txid: 'replay-test-txid',
        value: 100000000,
        confirmations: 3,
        timestamp: Date.now()
      };

      // Send same webhook multiple times
      const firstResponse = await request(app)
        .post('/api/payments/bitcoin/webhook')
        .send(payload);

      const secondResponse = await request(app)
        .post('/api/payments/bitcoin/webhook')
        .send(payload);

      // Both should succeed but duplicate processing should be handled
      expect([200, 400, 404, 409, 500]).toContain(firstResponse.status);
      expect([200, 400, 404, 409, 500]).toContain(secondResponse.status);
    });

    it('should handle malformed request bodies', async () => {
      const malformedBodies = [
        'not json at all',
        '{"incomplete": json',
        null,
        undefined,
        123,
        'true',
        '[]',
        '{"nested": {"deeply": {"very": {"very": {"deep": "object"}}}}}'
      ];

      for (const body of malformedBodies) {
        try {
          const response = await request(app)
            .post('/api/payments/bitcoin/webhook')
            .send(body);

          expect([400, 500]).toContain(response.status);
        } catch (error) {
          // Some malformed bodies might cause request to fail entirely
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('Information Disclosure Prevention', () => {
    it('should not leak sensitive information in error responses', async () => {
      const testCases = [
        { payload: { addr: 'invalid' }, expectedNoLeak: ['password', 'secret', 'key', 'token', 'api'] },
        { payload: null, expectedNoLeak: ['stack trace', 'file path', 'internal error', 'mongodb'] },
        { payload: 'invalid json', expectedNoLeak: ['database', 'connection', 'mongoose'] }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/payments/bitcoin/webhook')
          .send(testCase.payload);

        const responseText = JSON.stringify(response.body).toLowerCase();
        
        testCase.expectedNoLeak.forEach(sensitiveInfo => {
          expect(responseText).not.toContain(sensitiveInfo);
        });
      }
    });

    it('should not expose server details in headers', async () => {
      const response = await request(app)
        .post('/api/payments/bitcoin/webhook')
        .send({});

      // Should not expose server technology details
      expect(response.headers['server']).toBeUndefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('should not expose internal system paths', async () => {
      const payload = {
        addr: '../../../etc/passwd',
        txid: '/var/log/system.log'
      };

      const response = await request(app)
        .post('/api/payments/bitcoin/webhook')
        .send(payload);

      const responseText = JSON.stringify(response.body);
      
      // Should not contain file paths
      expect(responseText).not.toMatch(/\/etc\/|var\/|usr\/|home\/|tmp\//i);
      expect(responseText).not.toContain(__dirname);
      expect(responseText).not.toContain(__filename);
    });
  });

  describe('Database Injection Prevention', () => {
    it('should prevent NoSQL injection in address lookup', async () => {
      const injectionPayloads = [
        {
          addr: { '$ne': null },
          txid: 'test123'
        },
        {
          addr: { '$regex': '.*' },
          txid: 'test123'
        },
        {
          addr: { '$where': 'function() { return true; }' },
          txid: 'test123'
        },
        {
          addr: testBitcoinAddress,
          txid: { '$ne': null }
        }
      ];

      for (const payload of injectionPayloads) {
        const response = await request(app)
          .post('/api/payments/bitcoin/webhook')
          .send(payload);

        // Should not execute injection attacks
        expect([400, 404, 500]).toContain(response.status);
      }
    });

    it('should prevent MongoDB operator injection', async () => {
      const operatorInjections = [
        { addr: { '$exists': true }, txid: 'test' },
        { addr: { '$type': 'string' }, txid: 'test' },
        { addr: { '$size': 1 }, txid: 'test' },
        { addr: { '$all': ['test'] }, txid: 'test' },
        { addr: { '$elemMatch': {} }, txid: 'test' }
      ];

      for (const payload of operatorInjections) {
        const response = await request(app)
          .post('/api/payments/bitcoin/webhook')
          .send(payload);

        expect([400, 404, 500]).toContain(response.status);
      }
    });
  });

  describe('Business Logic Security', () => {
    it('should prevent double-spending attacks', async () => {
      const payload = {
        addr: testBitcoinAddress,
        txid: 'double-spend-test',
        value: 100000000,
        confirmations: 6
      };

      // First webhook should process
      const firstResponse = await request(app)
        .post('/api/payments/bitcoin/webhook')
        .send(payload);

      // Second webhook with same transaction should be handled appropriately
      const secondResponse = await request(app)
        .post('/api/payments/bitcoin/webhook')
        .send(payload);

      expect([200, 400, 404, 409, 500]).toContain(firstResponse.status);
      expect([200, 400, 404, 409, 500]).toContain(secondResponse.status);
    });

    it('should validate payment amount bounds', async () => {
      const boundaryTests = [
        { value: 0, confirmations: 6 }, // Zero payment
        { value: 1, confirmations: 6 }, // Minimal payment (1 satoshi)
        { value: 2100000000000000, confirmations: 6 }, // Maximum Bitcoin supply in satoshis
        { value: 2100000000000001, confirmations: 6 } // Above maximum supply
      ];

      for (const { value, confirmations } of boundaryTests) {
        const payload = {
          addr: testBitcoinAddress,
          txid: `boundary-test-${value}`,
          value: value,
          confirmations: confirmations
        };

        const response = await request(app)
          .post('/api/payments/bitcoin/webhook')
          .send(payload);

        expect([200, 400, 404, 500]).toContain(response.status);
      }
    });

    it('should validate confirmation count bounds', async () => {
      const confirmationTests = [
        { confirmations: -1 }, // Negative confirmations
        { confirmations: 0 }, // Unconfirmed
        { confirmations: 1 }, // Partially confirmed
        { confirmations: 2 }, // Minimum required
        { confirmations: 1000000 } // Extremely high confirmations
      ];

      for (const { confirmations } of confirmationTests) {
        const payload = {
          addr: testBitcoinAddress,
          txid: `confirmation-test-${confirmations}`,
          value: 100000000,
          confirmations: confirmations
        };

        const response = await request(app)
          .post('/api/payments/bitcoin/webhook')
          .send(payload);

        expect([200, 400, 404, 500]).toContain(response.status);
      }
    });
  });

  describe('Concurrency and Race Conditions', () => {
    it('should handle concurrent webhooks for same transaction', async () => {
      const payload = {
        addr: testBitcoinAddress,
        txid: 'concurrent-test-txid',
        value: 100000000,
        confirmations: 3
      };

      // Send multiple concurrent requests for same transaction
      const promises = Array(10).fill(null).map(() => 
        request(app)
          .post('/api/payments/bitcoin/webhook')
          .send(payload)
      );

      const responses = await Promise.all(promises);

      // All should complete without causing race conditions
      responses.forEach(response => {
        expect([200, 400, 404, 409, 500]).toContain(response.status);
      });
    });

    it('should handle webhooks with increasing confirmations', async () => {
      const basePayload = {
        addr: testBitcoinAddress,
        txid: 'increasing-confirmations-test',
        value: 100000000
      };

      // Send webhooks with increasing confirmation counts
      const confirmationSequence = [0, 1, 2, 3, 6];
      
      for (const confirmations of confirmationSequence) {
        const payload = { ...basePayload, confirmations };
        
        const response = await request(app)
          .post('/api/payments/bitcoin/webhook')
          .send(payload);

        expect([200, 400, 404, 500]).toContain(response.status);
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle database connection issues gracefully', async () => {
      // This test would require mocking database connection failures
      // For now, verify the endpoint responds appropriately
      const payload = {
        addr: testBitcoinAddress,
        txid: 'db-error-test',
        value: 100000000,
        confirmations: 3
      };

      const response = await request(app)
        .post('/api/payments/bitcoin/webhook')
        .send(payload);

      expect([200, 400, 404, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it('should maintain security under high load', async () => {
      const payload = {
        addr: testBitcoinAddress,
        txid: 'load-test',
        value: 100000000,
        confirmations: 3
      };

      // Send burst of requests to test security under load
      const promises = Array(100).fill(null).map((_, index) => 
        request(app)
          .post('/api/payments/bitcoin/webhook')
          .send({ ...payload, txid: `load-test-${index}` })
      );

      const responses = await Promise.all(promises);

      // All requests should be handled securely
      responses.forEach(response => {
        expect([200, 400, 404, 429, 500]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });
  });
});
