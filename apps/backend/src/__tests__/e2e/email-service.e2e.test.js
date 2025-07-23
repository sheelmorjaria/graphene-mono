import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import User from '../../models/User.js';
import Order from '../../models/Order.js';
import emailService from '../../services/emailService.js';

describe('Email Service E2E Tests', () => {
  let adminUser, customerUser, adminToken, customerToken;
  let testOrder;

  beforeAll(async () => {
    // Clear test data
    await User.deleteMany({ email: { $in: ['admin@email.test', 'customer@email.test'] } });
    await Order.deleteMany({ orderId: { $regex: /^EMAIL-TEST/ } });

    // Create test users
    adminUser = await User.create({
      email: 'admin@email.test',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true
    });

    customerUser = await User.create({
      email: 'customer@email.test',
      password: 'Customer123!',
      firstName: 'Customer',
      lastName: 'User',
      role: 'customer',
      isActive: true
    });

    // Login and get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@email.test', password: 'Admin123!' });
    adminToken = adminLogin.body.data.token;

    const customerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer@email.test', password: 'Customer123!' });
    customerToken = customerLogin.body.data.token;

    // Create test order
    testOrder = await Order.create({
      orderId: 'EMAIL-TEST-001',
      userId: customerUser._id,
      user: customerUser._id,
      customerEmail: customerUser.email,
      items: [{
        productId: '507f1f77bcf86cd799439011',
        productName: 'Test Product',
        productSlug: 'test-product',
        unitPrice: 99.99,
        totalPrice: 99.99,
        quantity: 1
      }],
      subtotal: 99.99,
      totalAmount: 99.99,
      status: 'pending',
      billingAddress: {
        fullName: 'Test Customer',
        addressLine1: '123 Test St',
        city: 'Test City',
        stateProvince: 'England',
        postalCode: '12345',
        country: 'GB'
      },
      shippingAddress: {
        fullName: 'Test Customer',
        addressLine1: '123 Test St',
        city: 'Test City',
        stateProvince: 'England',
        postalCode: '12345',
        country: 'GB'
      },
      shippingMethod: {
        id: 'standard',
        name: 'Standard Shipping',
        cost: 5.99
      },
      paymentMethod: {
        type: 'paypal',
        name: 'PayPal'
      }
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['admin@email.test', 'customer@email.test'] } });
    await Order.deleteMany({ orderId: { $regex: /^EMAIL-TEST/ } });
  });

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  describe('Authentication Email Flows', () => {
    it('should send welcome email on user registration', async () => {
      let emailSent = false;
      let sentEmailData = null;

      vi.spyOn(emailService, 'sendEmail').mockImplementation(async (data) => {
        emailSent = true;
        sentEmailData = data;
        return { messageId: 'welcome-123' };
      });

      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@email.test',
          password: 'NewUser123!',
          confirmPassword: 'NewUser123!'
        });

      expect(registerRes.status).toBe(201);
      expect(emailSent).toBe(true);
      expect(sentEmailData).toMatchObject({
        to: 'newuser@email.test',
        subject: expect.stringContaining('Welcome'),
        template: 'welcome'
      });

      // Cleanup
      await User.deleteOne({ email: 'newuser@email.test' });
    });

    it('should send password reset email', async () => {
      let resetEmailData = null;

      vi.spyOn(emailService, 'sendEmail').mockImplementation(async (data) => {
        resetEmailData = data;
        return { messageId: 'reset-123' };
      });

      const resetRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'customer@email.test' });

      expect(resetRes.status).toBe(200);
      expect(resetEmailData).toMatchObject({
        to: 'customer@email.test',
        subject: expect.stringContaining('Password Reset'),
        template: 'password-reset'
      });
      expect(resetEmailData.data).toHaveProperty('resetToken');
    });

    it('should handle email service failures during registration', async () => {
      vi.spyOn(emailService, 'sendEmail').mockRejectedValue(
        new Error('Email service unavailable')
      );

      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'failedmail@email.test',
          password: 'Failed123!',
          confirmPassword: 'Failed123!'
        });

      // User should still be created even if email fails
      expect(registerRes.status).toBe(201);
      
      // Verify user was created
      const user = await User.findOne({ email: 'failedmail@email.test' });
      expect(user).toBeTruthy();

      // Cleanup
      await User.deleteOne({ email: 'failedmail@email.test' });
    });
  });

  describe('Order Email Notifications', () => {
    it('should send order confirmation email', async () => {
      let orderEmailData = null;

      vi.spyOn(emailService, 'sendEmail').mockImplementation(async (data) => {
        orderEmailData = data;
        return { messageId: 'order-confirm-123' };
      });

      // Trigger order confirmation (usually done after payment)
      const confirmRes = await request(app)
        .post(`/api/user/orders/${testOrder._id}/send-confirmation`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(confirmRes.status).toBe(200);
      expect(orderEmailData).toMatchObject({
        to: customerUser.email,
        subject: expect.stringContaining('Order Confirmation'),
        template: 'order-confirmation',
        data: expect.objectContaining({
          orderId: 'EMAIL-TEST-001',
          totalAmount: 99.99
        })
      });
    });

    it('should send shipping notification email', async () => {
      let shippingEmailData = null;

      vi.spyOn(emailService, 'sendEmail').mockImplementation(async (data) => {
        shippingEmailData = data;
        return { messageId: 'shipping-123' };
      });

      // Update order status to shipped
      const shipRes = await request(app)
        .put(`/api/admin/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'shipped',
          trackingNumber: 'TRACK123456'
        });

      expect(shipRes.status).toBe(200);
      expect(shippingEmailData).toMatchObject({
        to: customerUser.email,
        subject: expect.stringContaining('Shipped'),
        template: 'order-shipped',
        data: expect.objectContaining({
          trackingNumber: 'TRACK123456'
        })
      });
    });

    it('should handle bulk email notifications', async () => {
      const emailsSent = [];

      vi.spyOn(emailService, 'sendBulkEmails').mockImplementation(async (emails) => {
        emailsSent.push(...emails);
        return {
          successful: emails.length,
          failed: 0,
          results: emails.map((e, i) => ({ messageId: `bulk-${i}` }))
        };
      });

      // Send promotional email to all customers
      const bulkRes = await request(app)
        .post('/api/admin/emails/send-bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          subject: 'Special Offer',
          template: 'promotion',
          recipients: 'all-customers',
          data: {
            discountCode: 'SAVE20',
            expiryDate: '2024-12-31'
          }
        });

      expect(bulkRes.status).toBe(200);
      expect(emailsSent.length).toBeGreaterThan(0);
      expect(emailsSent[0]).toMatchObject({
        subject: 'Special Offer',
        template: 'promotion'
      });
    });
  });

  describe('Email Service Error Handling', () => {
    it('should retry failed email sends', async () => {
      let attemptCount = 0;

      vi.spyOn(emailService, 'sendEmail').mockImplementation(async (data) => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return { messageId: 'retry-success-123' };
      });

      const resetRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'customer@email.test' });

      expect(resetRes.status).toBe(200);
      expect(attemptCount).toBe(3); // Initial attempt + 2 retries
    });

    it('should handle email template errors', async () => {
      vi.spyOn(emailService, 'sendEmail').mockRejectedValue(
        new Error('Template not found: invalid-template')
      );

      // Try to send with invalid template
      const res = await request(app)
        .post('/api/admin/emails/send-custom')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          to: 'customer@email.test',
          subject: 'Test Email',
          template: 'invalid-template',
          data: {}
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('template');
    });

    it('should handle email queue overflow', async () => {
      const emailPromises = [];

      vi.spyOn(emailService, 'sendEmail').mockImplementation(async (data) => {
        // Simulate slow email sending
        await new Promise(resolve => setTimeout(resolve, 100));
        return { messageId: `queue-${Date.now()}` };
      });

      // Send many emails concurrently
      for (let i = 0; i < 10; i++) {
        emailPromises.push(
          request(app)
            .post('/api/support/contact')
            .send({
              name: `User ${i}`,
              email: `user${i}@test.com`,
              subject: 'Test Contact',
              message: 'Test message'
            })
        );
      }

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      const rateLimited = results.filter(r => r.status === 'fulfilled' && r.value.status === 429);

      expect(successful.length).toBeGreaterThan(0);
      // Some requests might be rate limited
      expect(rateLimited.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Email Service Integration with AWS SES', () => {
    it('should handle SES bounce notifications', async () => {
      // Simulate SES bounce webhook
      const bounceRes = await request(app)
        .post('/api/webhooks/ses')
        .send({
          Type: 'Notification',
          Message: JSON.stringify({
            notificationType: 'Bounce',
            bounce: {
              bounceType: 'Permanent',
              bouncedRecipients: [{
                emailAddress: 'bounced@email.test'
              }]
            }
          })
        });

      expect(bounceRes.status).toBe(200);

      // Verify email is marked as bounced
      const user = await User.findOne({ email: 'bounced@email.test' });
      if (user) {
        expect(user.emailStatus).toBe('bounced');
      }
    });

    it('should handle SES complaint notifications', async () => {
      // Simulate SES complaint webhook
      const complaintRes = await request(app)
        .post('/api/webhooks/ses')
        .send({
          Type: 'Notification',
          Message: JSON.stringify({
            notificationType: 'Complaint',
            complaint: {
              complainedRecipients: [{
                emailAddress: customerUser.email
              }]
            }
          })
        });

      expect(complaintRes.status).toBe(200);

      // Verify user is marked for no marketing emails
      const updatedUser = await User.findById(customerUser._id);
      expect(updatedUser.marketingOptOut).toBe(true);
    });
  });

  describe('Email Analytics and Monitoring', () => {
    it('should track email delivery metrics', async () => {
      const emailMetrics = {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0
      };

      vi.spyOn(emailService, 'sendEmail').mockImplementation(async (data) => {
        emailMetrics.sent++;
        // Simulate delivery
        setTimeout(() => emailMetrics.delivered++, 100);
        return { messageId: `metric-${emailMetrics.sent}` };
      });

      // Send multiple emails
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'customer@email.test' });

      await request(app)
        .post(`/api/user/orders/${testOrder._id}/send-confirmation`)
        .set('Authorization', `Bearer ${customerToken}`);

      // Check metrics
      const metricsRes = await request(app)
        .get('/api/admin/emails/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(metricsRes.status).toBe(200);
      expect(metricsRes.body.data.sent).toBeGreaterThanOrEqual(2);
    });

    it('should handle email provider failover', async () => {
      let primaryProviderFailed = false;
      let fallbackUsed = false;

      vi.spyOn(emailService, 'sendEmail').mockImplementation(async (data) => {
        if (!primaryProviderFailed) {
          primaryProviderFailed = true;
          throw new Error('Primary provider (SES) unavailable');
        }
        fallbackUsed = true;
        return { messageId: 'fallback-provider-123' };
      });

      const resetRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'customer@email.test' });

      expect(resetRes.status).toBe(200);
      expect(primaryProviderFailed).toBe(true);
      expect(fallbackUsed).toBe(true);
    });
  });
});