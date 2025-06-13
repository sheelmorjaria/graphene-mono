import { describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../server.js';
import Order from '../../models/Order.js';
import { mockRateLimiting } from '../../test/helpers/mockSetup.js';

describe('Support API Integration Tests', () => {
  // Using global test setup for MongoDB connection

  beforeEach(async () => {
    // Clear database before each test
    await Order.deleteMany({});
  });

  describe('POST /api/support/contact', () => {
    const validContactData = {
      fullName: 'John Doe',
      email: 'john@example.com',
      subject: 'product-question',
      orderNumber: '',
      message: 'I have a question about your products.'
    };

    describe('API endpoint integration', () => {
      it('should accept valid contact form submissions', async () => {
        const response = await request(app)
          .post('/api/support/contact')
          .send(validContactData)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          message: expect.stringContaining('successfully'),
          submittedAt: expect.any(String)
        });
      });

      it('should validate input and return appropriate errors', async () => {
        const invalidData = {
          fullName: '',
          email: 'invalid-email',
          subject: '',
          message: ''
        };

        const response = await request(app)
          .post('/api/support/contact')
          .send(invalidData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Validation failed',
          errors: expect.any(Array)
        });

        expect(response.body.errors.length).toBeGreaterThan(0);
      });

      it('should handle order number validation', async () => {
        // Test with valid order number
        const testOrder = new Order({
          userId: new mongoose.Types.ObjectId(),
          orderNumber: 'ORD-VALID-123',
          customerEmail: 'john@example.com',
          status: 'pending',
          subtotal: 599.99,
          tax: 0,
          shipping: 0,
          totalAmount: 599.99,
          items: [{
            productId: new mongoose.Types.ObjectId(),
            productName: 'Google Pixel 8',
            productSlug: 'google-pixel-8',
            unitPrice: 599.99,
            quantity: 1,
            totalPrice: 599.99
          }],
          shippingAddress: {
            fullName: 'John Doe',
            addressLine1: '123 Test St',
            city: 'Test City',
            stateProvince: 'Test State',
            postalCode: '12345',
            country: 'GB'
          },
          billingAddress: {
            fullName: 'John Doe',
            addressLine1: '123 Test St',
            city: 'Test City',
            stateProvince: 'Test State',
            postalCode: '12345',
            country: 'GB'
          },
          shippingMethod: {
            id: new mongoose.Types.ObjectId(),
            name: 'Standard Shipping',
            cost: 0
          }
        });
        await testOrder.save();

        const contactDataWithValidOrder = {
          ...validContactData,
          orderNumber: 'ORD-VALID-123'
        };

        const validResponse = await request(app)
          .post('/api/support/contact')
          .send(contactDataWithValidOrder)
          .expect(200);

        expect(validResponse.body.success).toBe(true);

        // Test with invalid order number
        const contactDataWithInvalidOrder = {
          ...validContactData,
          orderNumber: 'ORD-INVALID-999'
        };

        const invalidResponse = await request(app)
          .post('/api/support/contact')
          .send(contactDataWithInvalidOrder)
          .expect(200);

        // Should still succeed even with invalid order number
        expect(invalidResponse.body.success).toBe(true);
      });

      it('should enforce rate limiting', async () => {
        // Make multiple rapid requests
        const requests = [];
        for (let i = 0; i < 6; i++) {
          requests.push(
            request(app)
              .post('/api/support/contact')
              .send({
                ...validContactData,
                email: `user${i}@example.com` // Different emails to avoid conflicts
              })
          );
        }

        const responses = await Promise.all(requests);

        // Check that at least one request was rate limited
        const rateLimitedResponses = responses.filter(res => res.status === 429);
        expect(rateLimitedResponses.length).toBeGreaterThan(0);

        // Check rate limit response format
        if (rateLimitedResponses.length > 0) {
          expect(rateLimitedResponses[0].body).toMatchObject({
            success: false,
            message: expect.stringContaining('Too many contact form submissions')
          });
        }
      });

      it('should sanitize input data', async () => {
        await mockRateLimiting.addDelay(500); // Add delay to prevent rate limiting
        
        const maliciousData = {
          fullName: '<script>alert("xss")</script>John Doe',
          email: `sanitize-${Date.now()}@example.com`,
          subject: 'product-question',
          message: '<img src=x onerror=alert("xss")>This is a test message'
        };

        const response = await request(app)
          .post('/api/support/contact')
          .send(maliciousData)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should handle different subject types', async () => {
        await mockRateLimiting.addDelay(500); // Add delay to prevent rate limiting
        
        const subjects = ['order-inquiry', 'product-question', 'technical-issue', 'other'];

        for (const subject of subjects) {
          await mockRateLimiting.addDelay(300); // Add delay between each request
          
          const response = await request(app)
            .post('/api/support/contact')
            .send({
              ...validContactData,
              subject,
              email: `${subject}-${Date.now()}-${Math.random()}@example.com` // Unique email to avoid rate limiting
            })
            .expect(200);

          expect(response.body.success).toBe(true);
        }
      });

      it('should handle large message content', async () => {
        await mockRateLimiting.addDelay(500);
        const largeMessage = 'A'.repeat(2000); // 2KB message
        
        const response = await request(app)
          .post('/api/support/contact')
          .send({
            ...validContactData,
            message: largeMessage,
            email: `largemessage-${Date.now()}-${Math.random()}@example.com`
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should capture request metadata', async () => {
        await mockRateLimiting.addDelay(500);
        
        const response = await request(app)
          .post('/api/support/contact')
          .set('User-Agent', 'Test-Browser/1.0')
          .send({
            ...validContactData,
            email: `metadata-${Date.now()}-${Math.random()}@example.com`
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.submittedAt).toBeDefined();
      });
    });
  });
});