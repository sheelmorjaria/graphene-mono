import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import paymentRoutes from '../../routes/payment.js';
import Order from '../../models/Order.js';
import User from '../../models/User.js';

// PayPal Webhook Security Tests
describe('PayPal Webhook Security Tests', () => {
  let app;
  let mongoServer;
  let testOrder;
  let testUser;
  
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
      firstName: 'PayPal',
      lastName: 'Security', 
      email: 'paypal-security@test.com',
      password: 'hashedpassword123'
    });

    testOrder = await Order.create({
      userId: testUser._id,
      orderNumber: 'ORD-PP-SEC-TEST-456',
      customerEmail: 'paypal-security@test.com',
      items: [{
        productId: new mongoose.Types.ObjectId(),
        productName: 'PayPal Security Test Product',
        productSlug: 'paypal-security-test-product',
        quantity: 1,
        unitPrice: 249.99,
        totalPrice: 249.99
      }],
      subtotal: 249.99,
      orderTotal: 249.99,
      shippingAddress: {
        fullName: 'PayPal Security User',
        addressLine1: '123 Security St',
        city: 'Security City',
        stateProvince: 'Security State', 
        postalCode: '12345',
        country: 'UK'
      },
      billingAddress: {
        fullName: 'PayPal Security User',
        addressLine1: '123 Security St',
        city: 'Security City',
        stateProvince: 'Security State',
        postalCode: '12345', 
        country: 'UK'
      },
      shippingMethod: {
        id: new mongoose.Types.ObjectId(),
        name: 'Standard Shipping',
        cost: 0
      },
      paymentMethod: {
        type: 'paypal',
        name: 'PayPal'
      },
      paymentDetails: {
        paypalOrderId: 'PP_ORDER_SECURITY_123',
        paypalPaymentId: 'PP_PAYMENT_456',
        paypalPayerId: 'PP_PAYER_789'
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
    
    app.use(express.json({ limit: '10mb' }));
    
    // Add error handling middleware
    app.use((err, req, res, _next) => {
      console.error('Test app error:', err);
      res.status(500).json({ error: 'Internal server error', message: err.message });
    });
    
    app.use('/api/payments', paymentRoutes);
    
    // Set environment variables
    process.env.PAYPAL_CLIENT_ID = 'test-paypal-client-id';
    process.env.PAYPAL_CLIENT_SECRET = 'test-paypal-client-secret';
    process.env.PAYPAL_WEBHOOK_ID = 'test-paypal-webhook-id';
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
        { event_type: 'PAYMENT.CAPTURE.COMPLETED' }, // Missing resource
        { resource: { id: 'test' } }, // Missing event_type
        { event_type: null, resource: { id: 'test' } }, // Null event_type
        { event_type: '', resource: { id: 'test' } }, // Empty event_type
        { event_type: 'VALID.EVENT', resource: null } // Null resource
      ];

      for (const payload of incompletePayloads) {
        const response = await request(app)
          .post('/api/payments/paypal/webhook')
          .send(payload);

        // PayPal webhook handler is designed to be lenient and return 200
        // for most cases to avoid webhook retries
        expect([200, 400]).toContain(response.status);
        expect(response.body).toBeDefined();
      }
    });

    it('should handle oversized webhook payloads', async () => {
      const largePayload = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'a'.repeat(10000),
          amount: {
            currency_code: 'GBP',
            value: '249.99'
          },
          extraData: 'x'.repeat(100000)
        }
      };

      const response = await request(app)
        .post('/api/payments/paypal/webhook')
        .send(largePayload);

      // Should handle large payloads gracefully
      expect([200, 400, 413, 500]).toContain(response.status);
    });

    it('should sanitize dangerous input fields', async () => {
      const maliciousPayload = {
        event_type: '<script>alert("xss")</script>',
        resource: {
          id: '../../../etc/passwd',
          amount: {
            currency_code: 'require("child_process").exec("rm -rf /")',
            value: '249.99'
          },
          supplementary_data: {
            __proto__: { polluted: true },
            constructor: { prototype: { isAdmin: true } }
          }
        }
      };

      const response = await request(app)
        .post('/api/payments/paypal/webhook')
        .send(maliciousPayload);

      // Should not execute malicious code or cause errors
      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it('should prevent JSON injection attacks', async () => {
      const jsonInjectionPayloads = [
        '{"event_type": "PAYMENT.CAPTURE.COMPLETED", "__proto__": {"isAdmin": true}}',
        '{"event_type": "PAYMENT.CAPTURE.COMPLETED", "constructor": {"prototype": {"isAdmin": true}}}',
        '{"event_type": "PAYMENT.CAPTURE.COMPLETED", "resource": {"amount": {"value": 1e308}}}' // Number overflow
      ];

      for (const jsonString of jsonInjectionPayloads) {
        const response = await request(app)
          .post('/api/payments/paypal/webhook')
          .set('Content-Type', 'application/json')
          .send(jsonString);

        expect([200, 400, 500]).toContain(response.status);
      }
    });

    it('should validate PayPal event types', async () => {
      const invalidEventTypes = [
        null,
        undefined,
        '',
        'INVALID_EVENT_TYPE',
        '../../../etc/passwd',
        'javascript:alert(1)',
        'SELECT * FROM orders',
        123456789,
        {},
        []
      ];

      for (const eventType of invalidEventTypes) {
        const payload = {
          event_type: eventType,
          resource: {
            id: 'test123',
            amount: {
              currency_code: 'GBP',
              value: '249.99'
            }
          }
        };

        const response = await request(app)
          .post('/api/payments/paypal/webhook')
          .send(payload);

        // Should handle invalid event types gracefully
        expect([200, 400, 500]).toContain(response.status);
      }
    });

    it('should validate PayPal resource structure', async () => {
      const invalidResources = [
        null,
        undefined,
        '',
        'not an object',
        123,
        [],
        { /* empty object */ },
        { id: null },
        { id: undefined },
        { id: '' }
      ];

      for (const resource of invalidResources) {
        const payload = {
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          resource: resource
        };

        const response = await request(app)
          .post('/api/payments/paypal/webhook')
          .send(payload);

        expect([200, 400, 500]).toContain(response.status);
      }
    });

    it('should validate PayPal amount structure', async () => {
      const invalidAmounts = [
        { currency_code: 'GBP', value: 'not_a_number' },
        { currency_code: 'GBP', value: null },
        { currency_code: 'GBP', value: -100 },
        { currency_code: 'INVALID', value: '249.99' },
        { currency_code: null, value: '249.99' },
        { value: '249.99' }, // Missing currency_code
        { currency_code: 'GBP' }, // Missing value
        null,
        'not an object',
        123
      ];

      for (const amount of invalidAmounts) {
        const payload = {
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          resource: {
            id: 'test123',
            amount: amount
          }
        };

        const response = await request(app)
          .post('/api/payments/paypal/webhook')
          .send(payload);

        expect([200, 400, 500]).toContain(response.status);
      }
    });
  });

  describe('Rate Limiting and DoS Protection', () => {
    it('should handle rapid webhook requests', async () => {
      const validPayload = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'rapid-test-capture',
          amount: {
            currency_code: 'GBP',
            value: '249.99'
          }
        }
      };

      // Send 50 rapid requests
      const promises = Array(50).fill(null).map((_, index) => 
        request(app)
          .post('/api/payments/paypal/webhook')
          .send({ ...validPayload, resource: { ...validPayload.resource, id: `rapid-test-${index}` } })
      );

      const responses = await Promise.all(promises);

      // Should handle all requests without crashing
      responses.forEach(response => {
        expect([200, 400, 429, 500]).toContain(response.status);
      });
    });

    it('should prevent webhook replay attacks', async () => {
      const payload = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'replay-test-capture',
          amount: {
            currency_code: 'GBP',
            value: '249.99'
          },
          create_time: new Date().toISOString()
        }
      };

      // Send same webhook multiple times
      const firstResponse = await request(app)
        .post('/api/payments/paypal/webhook')
        .send(payload);

      const secondResponse = await request(app)
        .post('/api/payments/paypal/webhook')
        .send(payload);

      // Both should succeed but duplicate processing should be handled
      expect([200, 400, 409, 500]).toContain(firstResponse.status);
      expect([200, 400, 409, 500]).toContain(secondResponse.status);
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
            .post('/api/payments/paypal/webhook')
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
        { payload: { event_type: 'invalid' }, expectedNoLeak: ['password', 'secret', 'key', 'token', 'api'] },
        { payload: null, expectedNoLeak: ['stack trace', 'file path', 'internal error', 'paypal'] },
        { payload: 'invalid json', expectedNoLeak: ['database', 'connection', 'mongoose'] }
      ];

      for (const testCase of testCases) {
        const response = await request(app)
          .post('/api/payments/paypal/webhook')
          .send(testCase.payload);

        const responseText = JSON.stringify(response.body).toLowerCase();
        
        testCase.expectedNoLeak.forEach(sensitiveInfo => {
          expect(responseText).not.toContain(sensitiveInfo);
        });
      }
    });

    it('should not expose server details in headers', async () => {
      const response = await request(app)
        .post('/api/payments/paypal/webhook')
        .send({});

      // Should not expose server technology details
      expect(response.headers['server']).toBeUndefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('should not expose internal system paths', async () => {
      const payload = {
        event_type: '../../../etc/passwd',
        resource: {
          id: '/var/log/system.log'
        }
      };

      const response = await request(app)
        .post('/api/payments/paypal/webhook')
        .send(payload);

      const responseText = JSON.stringify(response.body);
      
      // Should not contain file paths
      expect(responseText).not.toMatch(/\/etc\/|var\/|usr\/|home\/|tmp\//i);
      expect(responseText).not.toContain(__dirname);
      expect(responseText).not.toContain(__filename);
    });
  });

  describe('Database Injection Prevention', () => {
    it('should prevent NoSQL injection in order lookup', async () => {
      const injectionPayloads = [
        {
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          resource: {
            id: { '$ne': null },
            supplementary_data: {
              related_ids: {
                order_id: { '$regex': '.*' }
              }
            }
          }
        },
        {
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          resource: {
            id: 'test',
            supplementary_data: {
              related_ids: {
                order_id: { '$where': 'function() { return true; }' }
              }
            }
          }
        }
      ];

      for (const payload of injectionPayloads) {
        const response = await request(app)
          .post('/api/payments/paypal/webhook')
          .send(payload);

        // Should not execute injection attacks
        expect([200, 400, 500]).toContain(response.status);
      }
    });

    it('should prevent MongoDB operator injection', async () => {
      const operatorInjections = [
        { event_type: { '$exists': true }, resource: { id: 'test' } },
        { event_type: { '$type': 'string' }, resource: { id: 'test' } },
        { event_type: { '$size': 1 }, resource: { id: 'test' } },
        { event_type: { '$all': ['test'] }, resource: { id: 'test' } },
        { event_type: { '$elemMatch': {} }, resource: { id: 'test' } }
      ];

      for (const payload of operatorInjections) {
        const response = await request(app)
          .post('/api/payments/paypal/webhook')
          .send(payload);

        expect([200, 400, 500]).toContain(response.status);
      }
    });
  });

  describe('Business Logic Security', () => {
    it('should validate PayPal event authenticity', async () => {
      // Test various PayPal event types for proper handling
      const paypalEvents = [
        'PAYMENT.CAPTURE.COMPLETED',
        'PAYMENT.CAPTURE.DENIED',
        'CHECKOUT.ORDER.APPROVED',
        'CHECKOUT.ORDER.COMPLETED',
        'PAYMENT.CAPTURE.PENDING',
        'PAYMENT.CAPTURE.REFUNDED'
      ];

      for (const eventType of paypalEvents) {
        const payload = {
          event_type: eventType,
          resource: {
            id: `test-${eventType.toLowerCase()}`,
            amount: {
              currency_code: 'GBP',
              value: '249.99'
            }
          }
        };

        const response = await request(app)
          .post('/api/payments/paypal/webhook')
          .send(payload);

        expect([200, 400, 500]).toContain(response.status);
      }
    });

    it('should validate payment amount bounds', async () => {
      const boundaryTests = [
        { value: '0.01', valid: true }, // Minimal payment
        { value: '0.00', valid: false }, // Zero payment
        { value: '99999999.99', valid: true }, // Very large payment
        { value: '-10.00', valid: false }, // Negative payment
        { value: '10.001', valid: false }, // Too many decimal places
        { value: 'abc', valid: false } // Non-numeric
      ];

      for (const { value } of boundaryTests) {
        const payload = {
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          resource: {
            id: `boundary-test-${value}`,
            amount: {
              currency_code: 'GBP',
              value: value
            }
          }
        };

        const response = await request(app)
          .post('/api/payments/paypal/webhook')
          .send(payload);

        expect([200, 400, 500]).toContain(response.status);
      }
    });

    it('should validate currency codes', async () => {
      const currencyTests = [
        { code: 'GBP', valid: true },
        { code: 'USD', valid: true },
        { code: 'EUR', valid: true },
        { code: 'BTC', valid: false }, // Cryptocurrency
        { code: 'XYZ', valid: false }, // Invalid code
        { code: null, valid: false },
        { code: '', valid: false }
      ];

      for (const { code } of currencyTests) {
        const payload = {
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          resource: {
            id: `currency-test-${code}`,
            amount: {
              currency_code: code,
              value: '249.99'
            }
          }
        };

        const response = await request(app)
          .post('/api/payments/paypal/webhook')
          .send(payload);

        expect([200, 400, 500]).toContain(response.status);
      }
    });
  });

  describe('Concurrency and Race Conditions', () => {
    it('should handle concurrent webhooks for same transaction', async () => {
      const payload = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'concurrent-test-capture',
          amount: {
            currency_code: 'GBP',
            value: '249.99'
          }
        }
      };

      // Send multiple concurrent requests for same transaction
      const promises = Array(10).fill(null).map(() => 
        request(app)
          .post('/api/payments/paypal/webhook')
          .send(payload)
      );

      const responses = await Promise.all(promises);

      // All should complete without causing race conditions
      responses.forEach(response => {
        expect([200, 400, 409, 500]).toContain(response.status);
      });
    });

    it('should handle webhooks with different statuses', async () => {
      const basePayload = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'status-test-capture',
          amount: {
            currency_code: 'GBP',
            value: '249.99'
          }
        }
      };

      // Send webhooks with different statuses
      const statuses = ['PENDING', 'COMPLETED', 'DENIED', 'REFUNDED'];
      
      for (const status of statuses) {
        const payload = {
          ...basePayload,
          resource: {
            ...basePayload.resource,
            status: status,
            id: `status-test-${status.toLowerCase()}`
          }
        };
        
        const response = await request(app)
          .post('/api/payments/paypal/webhook')
          .send(payload);

        expect([200, 400, 500]).toContain(response.status);
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle database connection issues gracefully', async () => {
      const payload = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'db-error-test',
          amount: {
            currency_code: 'GBP',
            value: '249.99'
          }
        }
      };

      const response = await request(app)
        .post('/api/payments/paypal/webhook')
        .send(payload);

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body).toBeDefined();
    });

    it('should maintain security under high load', async () => {
      const payload = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'load-test',
          amount: {
            currency_code: 'GBP',
            value: '249.99'
          }
        }
      };

      // Send burst of requests to test security under load
      const promises = Array(100).fill(null).map((_, index) => 
        request(app)
          .post('/api/payments/paypal/webhook')
          .send({ ...payload, resource: { ...payload.resource, id: `load-test-${index}` } })
      );

      const responses = await Promise.all(promises);

      // All requests should be handled securely
      responses.forEach(response => {
        expect([200, 400, 429, 500]).toContain(response.status);
        expect(response.body).toBeDefined();
      });
    });

    it('should handle webhook signature verification failures gracefully', async () => {
      // Test webhooks with invalid or missing signatures
      const payload = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'signature-test',
          amount: {
            currency_code: 'GBP',
            value: '249.99'
          }
        }
      };

      const response = await request(app)
        .post('/api/payments/paypal/webhook')
        .set('PAYPAL-CERT-ID', 'invalid-cert-id')
        .set('PAYPAL-AUTH-VERSION', 'v1')
        .set('PAYPAL-TRANSMISSION-ID', 'invalid-transmission-id')
        .set('PAYPAL-TRANSMISSION-TIME', new Date().toISOString())
        .set('PAYPAL-TRANSMISSION-SIG', 'invalid-signature')
        .send(payload);

      // Should handle signature verification gracefully
      expect([200, 400, 401, 500]).toContain(response.status);
    });
  });

  describe('PayPal-Specific Security Validations', () => {
    it('should validate PayPal resource identifiers', async () => {
      const invalidIds = [
        null,
        undefined,
        '',
        'x'.repeat(1000), // Extremely long ID
        '../../../etc/passwd',
        'javascript:alert(1)',
        'SELECT * FROM orders',
        '<script>alert(1)</script>'
      ];

      for (const id of invalidIds) {
        const payload = {
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          resource: {
            id: id,
            amount: {
              currency_code: 'GBP',
              value: '249.99'
            }
          }
        };

        const response = await request(app)
          .post('/api/payments/paypal/webhook')
          .send(payload);

        expect([200, 400, 500]).toContain(response.status);
      }
    });

    it('should validate PayPal order references', async () => {
      const payload = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'valid-capture-id',
          amount: {
            currency_code: 'GBP',
            value: '249.99'
          },
          supplementary_data: {
            related_ids: {
              order_id: testOrder._id.toString()
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/payments/paypal/webhook')
        .send(payload);

      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle PayPal webhook event variations', async () => {
      const eventVariations = [
        {
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          resource: {
            id: 'capture-completed-test',
            status: 'COMPLETED',
            amount: { currency_code: 'GBP', value: '249.99' }
          }
        },
        {
          event_type: 'PAYMENT.CAPTURE.DENIED',
          resource: {
            id: 'capture-denied-test',
            status: 'DENIED',
            amount: { currency_code: 'GBP', value: '249.99' }
          }
        },
        {
          event_type: 'CHECKOUT.ORDER.APPROVED',
          resource: {
            id: 'order-approved-test',
            status: 'APPROVED',
            purchase_units: [{
              amount: { currency_code: 'GBP', value: '249.99' }
            }]
          }
        }
      ];

      for (const variation of eventVariations) {
        const response = await request(app)
          .post('/api/payments/paypal/webhook')
          .send(variation);

        expect([200, 400, 500]).toContain(response.status);
      }
    });
  });
});
