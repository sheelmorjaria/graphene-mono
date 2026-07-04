import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getEligibleReturnItems,
  submitReturnRequest,
  getUserReturnRequests,
  getReturnRequestDetails,
  formatReturnStatus,
  getReturnStatusColor,
  getReturnStatusColorClass,
  formatReturnDate,
  getDaysRemainingInReturnWindow,
  isOrderEligibleForReturn
} from '../returnService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to build a JSON fetch response
const jsonResponse = (data, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  json: async () => data
});

describe('returnService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getEligibleReturnItems', () => {
    it('throws when orderId is missing', async () => {
      await expect(getEligibleReturnItems('')).rejects.toThrow('Order ID is required');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('fetches eligible items for an order', async () => {
      const mockData = { success: true, items: [{ id: 'i1' }] };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockData));

      const result = await getEligibleReturnItems('order-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/user/orders/order-123/eligible-returns',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      );
      expect(result).toEqual(mockData);
    });

    it('throws on non-ok response with error field', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(
        { error: 'Order not found' },
        { ok: false, status: 404 }
      ));

      await expect(getEligibleReturnItems('order-123')).rejects.toThrow('Order not found');
    });

    it('throws default message when no error field', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 500 }));

      await expect(getEligibleReturnItems('order-123')).rejects.toThrow('Failed to fetch eligible return items');
    });
  });

  describe('submitReturnRequest', () => {
    it('throws when data is missing', async () => {
      await expect(submitReturnRequest(null)).rejects.toThrow('Return request data is required');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('posts the return request data', async () => {
      const payload = { orderId: 'o1', items: [], reason: 'defective' };
      const mockData = { success: true, returnId: 'r1' };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockData));

      const result = await submitReturnRequest(payload);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/user/returns/request',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify(payload)
        })
      );
      expect(result).toEqual(mockData);
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(
        { error: 'Cannot return' },
        { ok: false, status: 400 }
      ));

      await expect(submitReturnRequest({ orderId: 'o1' })).rejects.toThrow('Cannot return');
    });
  });

  describe('getUserReturnRequests', () => {
    it('fetches return requests without query params by default', async () => {
      const mockData = { success: true, returns: [] };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockData));

      const result = await getUserReturnRequests();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/user/returns',
        expect.objectContaining({ method: 'GET', credentials: 'include' })
      );
      expect(result).toEqual(mockData);
    });

    it('builds query string from provided params', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

      await getUserReturnRequests({ page: 2, limit: 10, status: 'approved', sortBy: 'date', sortOrder: 'desc' });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
      expect(url).toContain('status=approved');
      expect(url).toContain('sortBy=date');
      expect(url).toContain('sortOrder=desc');
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(
        { error: 'Forbidden' },
        { ok: false, status: 403 }
      ));

      await expect(getUserReturnRequests()).rejects.toThrow('Forbidden');
    });
  });

  describe('getReturnRequestDetails', () => {
    it('throws when returnRequestId is missing', async () => {
      await expect(getReturnRequestDetails('')).rejects.toThrow('Return request ID is required');
    });

    it('fetches details for a return request', async () => {
      const mockData = { success: true, returnRequest: { id: 'r1' } };
      mockFetch.mockResolvedValueOnce(jsonResponse(mockData));

      const result = await getReturnRequestDetails('r1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/user/returns/r1',
        expect.objectContaining({ method: 'GET', credentials: 'include' })
      );
      expect(result).toEqual(mockData);
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(
        { error: 'Not found' },
        { ok: false, status: 404 }
      ));

      await expect(getReturnRequestDetails('r1')).rejects.toThrow('Not found');
    });
  });

  describe('formatReturnStatus', () => {
    it('maps known statuses to display labels', () => {
      expect(formatReturnStatus('pending_review')).toBe('Pending Review');
      expect(formatReturnStatus('approved')).toBe('Approved');
      expect(formatReturnStatus('rejected')).toBe('Rejected');
      expect(formatReturnStatus('item_received')).toBe('Item Received');
      expect(formatReturnStatus('processing_refund')).toBe('Processing Refund');
      expect(formatReturnStatus('refunded')).toBe('Refunded');
      expect(formatReturnStatus('closed')).toBe('Closed');
    });

    it('returns the raw status for unknown values', () => {
      expect(formatReturnStatus('unknown_status')).toBe('unknown_status');
    });
  });

  describe('getReturnStatusColor', () => {
    it('returns hex colors for known statuses', () => {
      expect(getReturnStatusColor('pending_review')).toBe('#f59e0b');
      expect(getReturnStatusColor('approved')).toBe('#10b981');
      expect(getReturnStatusColor('rejected')).toBe('#ef4444');
      expect(getReturnStatusColor('item_received')).toBe('#3b82f6');
      expect(getReturnStatusColor('processing_refund')).toBe('#8b5cf6');
      expect(getReturnStatusColor('refunded')).toBe('#10b981');
      expect(getReturnStatusColor('closed')).toBe('#6b7280');
    });

    it('returns gray default for unknown status', () => {
      expect(getReturnStatusColor('mystery')).toBe('#6b7280');
    });
  });

  describe('getReturnStatusColorClass', () => {
    it('returns tailwind classes for known statuses', () => {
      expect(getReturnStatusColorClass('approved')).toBe('text-green-600 bg-green-50');
      expect(getReturnStatusColorClass('rejected')).toBe('text-red-600 bg-red-50');
      expect(getReturnStatusColorClass('closed')).toBe('text-gray-600 bg-gray-50');
    });

    it('returns gray default class for unknown status', () => {
      expect(getReturnStatusColorClass('mystery')).toBe('text-gray-600 bg-gray-50');
    });
  });

  describe('formatReturnDate', () => {
    it('formats an ISO date string into a locale string', () => {
      const out = formatReturnDate('2026-06-24T10:00:00Z');
      // en-GB long month + numeric year
      expect(out).toMatch(/2026/);
    });
  });

  describe('getDaysRemainingInReturnWindow', () => {
    it('returns 0 when delivery date is missing', () => {
      expect(getDaysRemainingInReturnWindow(null)).toBe(0);
    });

    it('returns positive days when within the window', () => {
      // delivered 5 days ago, default 30-day window -> ~25 days remaining
      const delivery = new Date();
      delivery.setDate(delivery.getDate() - 5);
      const days = getDaysRemainingInReturnWindow(delivery.toISOString());
      expect(days).toBeGreaterThan(15);
      expect(days).toBeLessThanOrEqual(25);
    });

    it('returns 0 when outside the window', () => {
      const delivery = new Date();
      delivery.setDate(delivery.getDate() - 60); // 60 days ago, past 30-day window
      expect(getDaysRemainingInReturnWindow(delivery.toISOString())).toBe(0);
    });

    it('respects a custom return window', () => {
      const delivery = new Date();
      delivery.setDate(delivery.getDate() - 12);
      // 14-day window -> ~2 days remaining
      expect(getDaysRemainingInReturnWindow(delivery.toISOString(), 14)).toBeLessThanOrEqual(2);
    });
  });

  describe('isOrderEligibleForReturn', () => {
    it('returns false for null order', () => {
      expect(isOrderEligibleForReturn(null)).toBe(false);
    });

    it('returns false when status is not delivered', () => {
      expect(isOrderEligibleForReturn({ status: 'shipped', deliveryDate: new Date().toISOString() })).toBe(false);
    });

    it('returns false when no delivery date', () => {
      expect(isOrderEligibleForReturn({ status: 'delivered' })).toBe(false);
    });

    it('returns false when outside return window', () => {
      const old = new Date();
      old.setDate(old.getDate() - 60);
      expect(isOrderEligibleForReturn({ status: 'delivered', deliveryDate: old.toISOString() })).toBe(false);
    });

    it('returns false when an active return request already exists', () => {
      const recent = new Date();
      recent.setDate(recent.getDate() - 5);
      expect(isOrderEligibleForReturn({
        status: 'delivered',
        deliveryDate: recent.toISOString(),
        hasReturnRequest: true
      })).toBe(false);
    });

    it('returns true when all conditions are met', () => {
      const recent = new Date();
      recent.setDate(recent.getDate() - 5);
      expect(isOrderEligibleForReturn({
        status: 'delivered',
        deliveryDate: recent.toISOString(),
        hasReturnRequest: false
      })).toBe(true);
    });
  });
});
