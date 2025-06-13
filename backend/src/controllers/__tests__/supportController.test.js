import { describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../server.js';
import Order from '../../models/Order.js';

describe('Support Controller', () => {
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

    describe('Successful submissions', () => {
      it('should submit contact form with valid data', async () => {
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

      it('should handle all valid subject types', async () => {
        const validSubjects = ['order-inquiry', 'product-question', 'technical-issue', 'other'];

        for (const subject of validSubjects) {
          const contactData = { ...validContactData, subject };
          
          const response = await request(app)
            .post('/api/support/contact')
            .send(contactData)
            .expect(200);

          expect(response.body.success).toBe(true);
        }
      });

      it('should handle contact form with order number', async () => {
        // Create a test order
        const testOrder = new Order({
          orderNumber: 'ORD-12345',
          customerEmail: 'john@example.com',
          orderDate: new Date(),
          status: 'pending',
          totalAmount: 599.99,
          items: [{
            productId: new mongoose.Types.ObjectId(),
            name: 'Google Pixel 8',
            price: 599.99,
            quantity: 1
          }],
          shippingAddress: {
            fullName: 'John Doe',
            addressLine1: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'GB'
          },
          billingAddress: {
            fullName: 'John Doe',
            addressLine1: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'GB'
          },
          paymentMethod: {
            id: 'test-payment',
            name: 'Test Payment',
            type: 'paypal'
          },
          paymentStatus: 'pending',
          shippingMethod: {
            id: 'standard',
            name: 'Standard Shipping',
            cost: 5.99
          }
        });
        await testOrder.save();

        const contactDataWithOrder = {
          ...validContactData,
          orderNumber: 'ORD-12345'
        };

        const response = await request(app)
          .post('/api/support/contact')
          .send(contactDataWithOrder)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('Validation errors', () => {
      it('should reject submission with missing required fields', async () => {
        const response = await request(app)
          .post('/api/support/contact')
          .send({})
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Validation failed',
          errors: expect.arrayContaining([
            'Full name is required',
            'Email is required',
            'Subject is required',
            'Message is required'
          ])
        });
      });

      it('should reject submission with invalid email format', async () => {
        const invalidData = {
          ...validContactData,
          email: 'invalid-email-format'
        };

        const response = await request(app)
          .post('/api/support/contact')
          .send(invalidData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Validation failed',
          errors: expect.arrayContaining(['Please enter a valid email address'])
        });
      });

      it('should reject submission with invalid subject', async () => {
        const invalidData = {
          ...validContactData,
          subject: 'invalid-subject'
        };

        const response = await request(app)
          .post('/api/support/contact')
          .send(invalidData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Validation failed',
          errors: expect.arrayContaining(['Please select a valid subject'])
        });
      });

      it('should reject submission with empty message', async () => {
        const invalidData = {
          ...validContactData,
          message: '   '  // whitespace only
        };

        const response = await request(app)
          .post('/api/support/contact')
          .send(invalidData)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          message: 'Validation failed',
          errors: expect.arrayContaining(['Message is required'])
        });
      });
    });

    describe('Input sanitization', () => {
      it('should handle HTML input safely', async () => {
        const dataWithHTML = {
          fullName: '<script>alert("xss")</script>John Doe',
          email: 'john@example.com',
          subject: 'product-question',
          message: '<img src=x onerror=alert("xss")>This is a test message'
        };

        const response = await request(app)
          .post('/api/support/contact')
          .send(dataWithHTML)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('should trim whitespace from input fields', async () => {
        const dataWithWhitespace = {
          fullName: '  John Doe  ',
          email: '  john@example.com  ',
          subject: 'product-question',
          orderNumber: '  ORD-123  ',
          message: '  This is a test message  '
        };

        const response = await request(app)
          .post('/api/support/contact')
          .send(dataWithWhitespace)
          .expect(200);

        expect(response.body.success).toBe(true);
      });
    });

    describe('Rate limiting', () => {
      it('should enforce rate limiting after multiple submissions', async () => {
        // Make multiple rapid requests to trigger rate limiting
        const requests = [];
        for (let i = 0; i < 6; i++) {
          requests.push(
            request(app)
              .post('/api/support/contact')
              .send(validContactData)
          );
        }

        const responses = await Promise.all(requests);

        // First 5 should succeed, 6th should be rate limited
        expect(responses.slice(0, 5).every(res => res.status === 200)).toBe(true);
        expect(responses[5].status).toBe(429);
        expect(responses[5].body).toMatchObject({
          success: false,
          message: expect.stringContaining('Too many contact form submissions')
        });
      });
    });
  });
});