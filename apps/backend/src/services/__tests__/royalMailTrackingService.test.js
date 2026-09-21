import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isRoyalMailConfigured,
  mapRoyalMailStatus,
  fetchTrackingSummary
} from '../royalMailTrackingService.js';

// Royal Mail Tracking V2 mapping + client. Response shape verified against
// the Tracking V2 API docs (mailPieces[0].summary with lastEventCode etc.).

const baseEnv = { ...process.env };

describe('royalMailTrackingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ROYAL_MAIL_API_CLIENT_ID = 'test-client-id';
    process.env.ROYAL_MAIL_API_CLIENT_SECRET = 'test-client-secret';
  });

  afterEach(() => {
    process.env.ROYAL_MAIL_API_CLIENT_ID = baseEnv.ROYAL_MAIL_API_CLIENT_ID;
    process.env.ROYAL_MAIL_API_CLIENT_SECRET = baseEnv.ROYAL_MAIL_API_CLIENT_SECRET;
    delete process.env.ROYAL_MAIL_API_BASE;
  });

  describe('isRoyalMailConfigured', () => {
    it('is true when both credentials are set', () => {
      expect(isRoyalMailConfigured()).toBe(true);
    });

    it('is false when either credential is missing', () => {
      delete process.env.ROYAL_MAIL_API_CLIENT_SECRET;
      expect(isRoyalMailConfigured()).toBe(false);
    });
  });

  describe('mapRoyalMailStatus', () => {
    it.each(['EVKOP', 'EVKSP', 'EVKDN', 'EVKLC', 'EVPLC'])(
      'maps delivered-class event code %s to delivered',
      (code) => {
        expect(mapRoyalMailStatus({ lastEventCode: code, lastEventName: 'Delivered' })).toBe('delivered');
      }
    );

    it('maps "Out for Delivery" in lastEventName to out_for_delivery (case-insensitive)', () => {
      expect(
        mapRoyalMailStatus({ lastEventCode: 'EVDIR', lastEventName: 'Out for Delivery' })
      ).toBe('out_for_delivery');
    });

    it('maps the phrase in statusDescription too', () => {
      expect(
        mapRoyalMailStatus({ lastEventCode: 'EVDIR', lastEventName: 'Steps completed', statusDescription: 'Your item is out for delivery' })
      ).toBe('out_for_delivery');
    });

    it('returns null for in-transit events', () => {
      expect(
        mapRoyalMailStatus({ lastEventCode: 'EVNMI', lastEventName: 'Forwarded - Mis-sort', statusCategory: 'IN TRANSIT' })
      ).toBeNull();
    });

    it('returns null for a missing summary', () => {
      expect(mapRoyalMailStatus(null)).toBeNull();
    });
  });

  describe('fetchTrackingSummary', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('returns null without calling the API when not configured', async () => {
      delete process.env.ROYAL_MAIL_API_CLIENT_SECRET;
      global.fetch = vi.fn();
      expect(await fetchTrackingSummary('AB123456789GB')).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('calls the summary endpoint with IBM auth headers and returns the summary', async () => {
      const summary = { lastEventCode: 'EVKOP', lastEventName: 'Delivered', summaryLine: 'Delivered' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ mailPieces: [{ mailPieceId: 'AB123456789GB', summary }] })
      });

      const result = await fetchTrackingSummary('AB123456789GB');

      const [url, options] = global.fetch.mock.calls[0];
      expect(url).toContain('https://api.royalmail.net/mailpieces/v2/summary?mailPieceId=AB123456789GB');
      expect(options.headers['X-IBM-Client-Id']).toBe('test-client-id');
      expect(options.headers['X-IBM-Client-Secret']).toBe('test-client-secret');
      expect(result).toEqual(summary);
    });

    it('honours ROYAL_MAIL_API_BASE override', async () => {
      process.env.ROYAL_MAIL_API_BASE = 'http://localhost:9999/mailpieces/v2';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ mailPieces: [{ summary: { lastEventCode: 'EVKOP' } }] })
      });

      await fetchTrackingSummary('X1');
      expect(global.fetch.mock.calls[0][0]).toContain('http://localhost:9999/mailpieces/v2/summary');
    });

    it('returns null on a non-ok response (never throws)', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
      expect(await fetchTrackingSummary('UNKNOWN')).toBeNull();
    });

    it('returns null when fetch rejects', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('network down'));
      expect(await fetchTrackingSummary('X1')).toBeNull();
    });

    it('returns null when the payload has no mail piece summary', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ mailPieces: [] }) });
      expect(await fetchTrackingSummary('X1')).toBeNull();
    });
  });
});
