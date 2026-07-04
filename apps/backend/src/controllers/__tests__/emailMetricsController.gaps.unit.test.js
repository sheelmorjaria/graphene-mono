import { vi, describe, test, beforeEach, expect } from 'vitest';

// Mock the EmailMetrics model including static analysis methods used by the controller.
vi.mock('../../models/EmailMetrics.js', () => {
  const EmailMetrics = Object.assign(vi.fn(), {
    getDeliveryStats: vi.fn(),
    getEngagementStats: vi.fn(),
    getEmailTypeStats: vi.fn(),
    getTopPerformingEmails: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    countDocuments: vi.fn()
  });
  return { default: EmailMetrics };
});

import {
  getDeliveryStats,
  getEngagementStats,
  getEmailTypeStats,
  getRecentEmails,
  getFailedEmails,
  getEmailDetails,
  getDashboardSummary
} from '../emailMetricsController.js';

import EmailMetrics from '../../models/EmailMetrics.js';

// Chainable query builder for find().sort().skip().limit().select()
const chainableSelect = (data) => ({
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  select: vi.fn().mockResolvedValue(data)
});

const chainableFindOne = (data) => ({
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  select: vi.fn().mockResolvedValue(data)
});

describe('Email Metrics Controller - Coverage Gap Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { params: {}, query: {} };
    res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
  });

  // ---------------- getDeliveryStats ----------------
  describe('getDeliveryStats', () => {
    test('happy path with explicit dates', async () => {
      const stats = { total: 10, delivered: 8 };
      EmailMetrics.getDeliveryStats.mockResolvedValue(stats);
      req.query = { startDate: '2024-01-01', endDate: '2024-12-31' };

      await getDeliveryStats(req, res);

      expect(EmailMetrics.getDeliveryStats).toHaveBeenCalledWith(expect.any(Date), expect.any(Date));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, stats }));
    });

    test('uses defaults when dates omitted', async () => {
      EmailMetrics.getDeliveryStats.mockResolvedValue({});
      await getDeliveryStats(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        period: expect.objectContaining({ start: expect.any(String), end: expect.any(String) })
      }));
    });

    test('error: returns 500', async () => {
      EmailMetrics.getDeliveryStats.mockRejectedValue(new Error('fail'));
      await getDeliveryStats(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Unable to fetch delivery statistics' });
    });
  });

  // ---------------- getEngagementStats ----------------
  describe('getEngagementStats', () => {
    test('happy path', async () => {
      const stats = { opens: 5 };
      EmailMetrics.getEngagementStats.mockResolvedValue(stats);
      req.query = { startDate: '2024-01-01', endDate: '2024-12-31' };
      await getEngagementStats(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, stats }));
    });

    test('error: returns 500', async () => {
      EmailMetrics.getEngagementStats.mockRejectedValue(new Error('fail'));
      await getEngagementStats(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- getEmailTypeStats ----------------
  describe('getEmailTypeStats', () => {
    test('happy path', async () => {
      const stats = [{ type: 'order', count: 3 }];
      EmailMetrics.getEmailTypeStats.mockResolvedValue(stats);
      await getEmailTypeStats(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, emailTypes: stats }));
    });

    test('error: returns 500', async () => {
      EmailMetrics.getEmailTypeStats.mockRejectedValue(new Error('fail'));
      await getEmailTypeStats(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- getRecentEmails ----------------
  describe('getRecentEmails', () => {
    test('happy path with filters', async () => {
      const emails = [{ messageId: 'm1' }];
      EmailMetrics.find.mockReturnValue(chainableSelect(emails));
      EmailMetrics.countDocuments.mockResolvedValue(1);
      req.query = { status: 'delivered', emailType: 'order', recipient: 'test', page: 2, limit: 10 };

      await getRecentEmails(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        emails,
        pagination: expect.objectContaining({ page: 2, limit: 10, total: 1 })
      }));
    });

    test('uses default page/limit', async () => {
      EmailMetrics.find.mockReturnValue(chainableSelect([]));
      EmailMetrics.countDocuments.mockResolvedValue(0);
      await getRecentEmails(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('error: returns 500', async () => {
      EmailMetrics.find.mockReturnValue(chainableSelect(null));
      EmailMetrics.countDocuments.mockRejectedValue(new Error('fail'));
      await getRecentEmails(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- getFailedEmails ----------------
  describe('getFailedEmails', () => {
    test('happy path', async () => {
      const emails = [{ messageId: 'm1', status: 'failed' }];
      EmailMetrics.find.mockReturnValue(chainableSelect(emails));
      EmailMetrics.countDocuments.mockResolvedValue(1);
      req.query = { page: 1, limit: 5 };

      await getFailedEmails(req, res);

      const filter = EmailMetrics.find.mock.calls[0][0];
      expect(filter.$or).toEqual(expect.arrayContaining([
        { status: 'failed' }, { status: 'bounced' }, { status: 'complained' }
      ]));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, emails }));
    });

    test('error: returns 500', async () => {
      EmailMetrics.countDocuments.mockRejectedValue(new Error('fail'));
      await getFailedEmails(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- getEmailDetails ----------------
  describe('getEmailDetails', () => {
    test('happy path', async () => {
      const email = { _id: '507f1f77bcf86cd799439011', messageId: 'm1' };
      EmailMetrics.findById.mockResolvedValue(email);
      req.params.id = '507f1f77bcf86cd799439011';
      await getEmailDetails(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, email }));
    });

    test('returns 404 when not found', async () => {
      EmailMetrics.findById.mockResolvedValue(null);
      req.params.id = '507f1f77bcf86cd799439011';
      await getEmailDetails(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Email not found' });
    });

    test('error: returns 500', async () => {
      EmailMetrics.findById.mockRejectedValue(new Error('fail'));
      req.params.id = '507f1f77bcf86cd799439011';
      await getEmailDetails(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- getDashboardSummary ----------------
  describe('getDashboardSummary', () => {
    test('happy path', async () => {
      EmailMetrics.getDeliveryStats.mockResolvedValue({ total: 5 });
      EmailMetrics.getTopPerformingEmails.mockResolvedValue([{ type: 'order' }]);
      EmailMetrics.find.mockReturnValue(chainableFindOne([{ messageId: 'm1' }]));

      await getDashboardSummary(req, res);

      expect(EmailMetrics.getDeliveryStats).toHaveBeenCalledTimes(3);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        summary: expect.objectContaining({
          today: { total: 5 },
          thisWeek: { total: 5 },
          thisMonth: { total: 5 },
          topPerformingEmails: [{ type: 'order' }],
          recentFailures: [{ messageId: 'm1' }]
        })
      }));
    });

    test('error: returns 500', async () => {
      EmailMetrics.getDeliveryStats.mockRejectedValue(new Error('fail'));
      await getDashboardSummary(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Unable to fetch dashboard summary' });
    });
  });
});
