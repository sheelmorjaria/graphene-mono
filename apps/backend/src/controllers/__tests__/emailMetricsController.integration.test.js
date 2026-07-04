import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import adminRoutes from '../../routes/admin.js';
import User from '../../models/User.js';
import EmailMetrics from '../../models/EmailMetrics.js';

/**
 * Integration tests for emailMetricsController.
 *
 * The email-metrics endpoints are mounted inside routes/admin.js, which applies
 * the REAL `authenticate` + `requireRole('admin')` middleware. So requests must
 * carry a valid Bearer token (signed with `process.env.JWT_SECRET ||
 * 'your-secret-key'`) for an existing, active admin user.
 *
 * Real EmailMetrics documents are seeded each test; the controllers' aggregation
 * statics (getDeliveryStats / getEngagementStats / getEmailTypeStats /
 * getTopPerformingEmails) run against the real in-memory Mongo.
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function signToken(user) {
  return jwt.sign({ userId: user._id }, JWT_SECRET);
}

describe('Email Metrics Controller (integration)', () => {
  let app;
  let adminUser;
  let adminToken;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await EmailMetrics.deleteMany({});

    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@metrics.test',
      password: 'password123',
      role: 'admin',
      isActive: true
    });
    adminToken = signToken(adminUser);
  });

  /** Build a single EmailMetrics doc with sensible defaults. */
  async function createEmail(overrides = {}) {
    const base = {
      messageId: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      emailType: 'order_confirmation',
      recipient: 'customer@example.com',
      subject: 'Your order confirmation',
      status: 'delivered'
    };
    return EmailMetrics.create({ ...base, ...overrides });
  }

  // ---------------- auth guard ----------------
  describe('authentication', () => {
    it('rejects requests without a token (401)', async () => {
      const res = await request(app).get('/api/admin/email-metrics/recent');
      expect(res.status).toBe(401);
    });

    it('rejects non-admin users (403)', async () => {
      const customer = await User.create({
        firstName: 'Cust',
        lastName: 'Omer',
        email: 'cust@metrics.test',
        password: 'password123',
        role: 'customer',
        isActive: true
      });
      const token = signToken(customer);
      const res = await request(app)
        .get('/api/admin/email-metrics/recent')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });

  // ---------------- GET /delivery-stats ----------------
  describe('GET /api/admin/email-metrics/delivery-stats', () => {
    it('returns delivery stats with default 30-day window', async () => {
      await createEmail({ status: 'delivered' });
      await createEmail({ status: 'bounced' });
      await createEmail({ status: 'failed' });

      const res = await request(app)
        .get('/api/admin/email-metrics/delivery-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.period).toEqual(
        expect.objectContaining({ start: expect.any(String), end: expect.any(String) })
      );
      expect(res.body.stats.total).toBe(3);
      expect(res.body.stats.delivered).toBe(1);
      expect(res.body.stats.bounced).toBe(1);
      expect(res.body.stats.failed).toBe(1);
      expect(Number(res.body.stats.deliveryRate)).toBeCloseTo(33.33, 1);
    });

    it('honours an explicit date range', async () => {
      // One recent, one far in the past
      await createEmail({ status: 'delivered' });
      await createEmail({
        status: 'delivered',
        sentAt: new Date('2020-01-01')
      });

      const start = new Date(Date.now() - 60 * 1000).toISOString();
      const end = new Date(Date.now() + 60 * 1000).toISOString();
      const res = await request(app)
        .get(`/api/admin/email-metrics/delivery-stats?startDate=${start}&endDate=${end}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stats.total).toBe(1);
    });

    it('returns zeros when there is no data', async () => {
      const res = await request(app)
        .get('/api/admin/email-metrics/delivery-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stats.total).toBe(0);
    });
  });

  // ---------------- GET /engagement-stats ----------------
  describe('GET /api/admin/email-metrics/engagement-stats', () => {
    it('returns engagement aggregates', async () => {
      await createEmail({
        engagement: { opened: true, openCount: 2, clicked: true, clickCount: 1 }
      });
      await createEmail({ engagement: { opened: false } });

      const res = await request(app)
        .get('/api/admin/email-metrics/engagement-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats.totalSent).toBe(2);
      expect(res.body.stats.totalOpened).toBe(1);
      expect(res.body.stats.totalClicked).toBe(1);
      expect(Number(res.body.stats.openRate)).toBeCloseTo(50, 1);
    });

    it('returns an empty-state object when no emails exist', async () => {
      const res = await request(app)
        .get('/api/admin/email-metrics/engagement-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stats).toEqual(
        expect.objectContaining({ totalSent: 0, openRate: '0.00' })
      );
    });
  });

  // ---------------- GET /type-stats ----------------
  describe('GET /api/admin/email-metrics/type-stats', () => {
    it('groups delivery/open/click rates by email type', async () => {
      await createEmail({ emailType: 'order_confirmation', status: 'delivered' });
      await createEmail({ emailType: 'order_confirmation', status: 'delivered' });
      await createEmail({ emailType: 'password_reset', status: 'bounced' });

      const res = await request(app)
        .get('/api/admin/email-metrics/type-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.emailTypes)).toBe(true);
      const oc = res.body.emailTypes.find((e) => e.emailType === 'order_confirmation');
      expect(oc.count).toBe(2);
      expect(oc.delivered).toBe(2);
      const pr = res.body.emailTypes.find((e) => e.emailType === 'password_reset');
      expect(pr.count).toBe(1);
    });
  });

  // ---------------- GET /recent ----------------
  describe('GET /api/admin/email-metrics/recent', () => {
    it('returns recent emails sorted newest-first with pagination', async () => {
      const old = await createEmail({
        subject: 'Old',
        sentAt: new Date(Date.now() - 10 * 60 * 1000)
      });
      const newest = await createEmail({ subject: 'Newest' });

      const res = await request(app)
        .get('/api/admin/email-metrics/recent')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.emails).toHaveLength(2);
      expect(res.body.emails[0].subject).toBe('Newest');
      expect(res.body.pagination).toEqual(
        expect.objectContaining({ page: 1, limit: 50, total: 2 })
      );
    });

    it('filters by status', async () => {
      await createEmail({ status: 'delivered' });
      await createEmail({ status: 'bounced' });

      const res = await request(app)
        .get('/api/admin/email-metrics/recent?status=bounced')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.emails).toHaveLength(1);
      expect(res.body.emails[0].status).toBe('bounced');
    });

    it('filters by emailType', async () => {
      await createEmail({ emailType: 'order_confirmation' });
      await createEmail({ emailType: 'password_reset' });

      const res = await request(app)
        .get('/api/admin/email-metrics/recent?emailType=password_reset')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.emails).toHaveLength(1);
      expect(res.body.emails[0].emailType).toBe('password_reset');
    });

    it('filters by recipient (case-insensitive regex)', async () => {
      await createEmail({ recipient: 'Alice@Example.com' });
      await createEmail({ recipient: 'bob@elsewhere.com' });

      const res = await request(app)
        .get('/api/admin/email-metrics/recent?recipient=alice')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.emails).toHaveLength(1);
      expect(res.body.emails[0].recipient).toBe('Alice@Example.com');
    });
  });

  // ---------------- GET /failed ----------------
  describe('GET /api/admin/email-metrics/failed', () => {
    it('returns only failed/bounced/complained emails', async () => {
      await createEmail({ status: 'delivered' });
      await createEmail({ status: 'failed' });
      await createEmail({ status: 'bounced' });
      await createEmail({ status: 'complained' });

      const res = await request(app)
        .get('/api/admin/email-metrics/failed')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.emails).toHaveLength(3);
      for (const email of res.body.emails) {
        expect(['failed', 'bounced', 'complained']).toContain(email.status);
      }
      expect(res.body.pagination.total).toBe(3);
    });
  });

  // ---------------- GET /dashboard ----------------
  describe('GET /api/admin/email-metrics/dashboard', () => {
    it('returns a multi-period dashboard summary', async () => {
      await createEmail({ status: 'delivered' });
      await createEmail({
        status: 'failed',
        engagement: { clicked: true, clickCount: 3 }
      });

      const res = await request(app)
        .get('/api/admin/email-metrics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary).toEqual(
        expect.objectContaining({
          today: expect.any(Object),
          thisWeek: expect.any(Object),
          thisMonth: expect.any(Object),
          topPerformingEmails: expect.any(Array),
          recentFailures: expect.any(Array)
        })
      );
      // The failed email should appear in recentFailures
      expect(res.body.summary.recentFailures.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ---------------- GET /:id ----------------
  describe('GET /api/admin/email-metrics/:id', () => {
    it('returns a single email by id', async () => {
      const email = await createEmail({ subject: 'Find me' });
      const res = await request(app)
        .get(`/api/admin/email-metrics/${email._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.email._id).toBe(String(email._id));
      expect(res.body.email.subject).toBe('Find me');
    });

    it('returns 404 for a non-existent id', async () => {
      const { default: mongoose } = await import('mongoose');
      const id = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/admin/email-metrics/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found/i);
    });
  });
});
