import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Dependencies mocked at module level so the poller's orchestration is
// tested in isolation; the Royal Mail client's own fetch is faked per test.
vi.mock('../../models/Order.js', () => ({
  default: { find: vi.fn() }
}));
vi.mock('../emailService.js', () => ({
  default: { sendOrderDeliveredEmail: vi.fn().mockResolvedValue({ success: true }) }
}));
vi.mock('../../controllers/adminController.js', () => ({
  // Real transition subset the poller relies on
  isValidStatusTransition: vi.fn((current, next) => {
    const transitions = {
      shipped: ['out_for_delivery', 'delivered', 'cancelled'],
      out_for_delivery: ['delivered', 'cancelled']
    };
    return transitions[current]?.includes(next) || false;
  })
}));

import { pollShippedOrders } from '../orderTrackingPoller.js';
import Order from '../../models/Order.js';
import emailService from '../emailService.js';

const deliveredSummary = {
  lastEventCode: 'EVKOP',
  lastEventName: 'Delivered',
  lastEventDateTime: '2026-09-21T14:32:00+00:00',
  summaryLine: 'Delivered on 21/09/2026'
};
const outForDeliverySummary = { lastEventCode: 'EVDIR', lastEventName: 'Out for Delivery' };

const makeOrder = (overrides = {}) => ({
  orderNumber: 'ORD-TEST-1',
  status: 'shipped',
  trackingNumber: 'AB123456789GB',
  statusHistory: [{ status: 'shipped', timestamp: new Date(), note: 'Status updated' }],
  save: vi.fn().mockResolvedValue(undefined),
  ...overrides
});

const rmResponse = (summary) => ({
  ok: true,
  json: async () => ({ mailPieces: [{ mailPieceId: 'AB123456789GB', summary }] })
});

describe('pollShippedOrders', () => {
  const originalFetch = global.fetch;
  const baseEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ROYAL_MAIL_API_CLIENT_ID = 'test-id';
    process.env.ROYAL_MAIL_API_CLIENT_SECRET = 'test-secret';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.ROYAL_MAIL_API_CLIENT_ID = baseEnv.ROYAL_MAIL_API_CLIENT_ID;
    process.env.ROYAL_MAIL_API_CLIENT_SECRET = baseEnv.ROYAL_MAIL_API_CLIENT_SECRET;
  });

  it('skips without querying when Royal Mail credentials are not configured', async () => {
    delete process.env.ROYAL_MAIL_API_CLIENT_SECRET;
    const result = await pollShippedOrders();
    expect(result).toEqual({ skipped: 'not-configured' });
    expect(Order.find).not.toHaveBeenCalled();
  });

  it('advances a shipped order to delivered, stamps deliveryDate, patches the history note, and emails', async () => {
    const order = makeOrder();
    Order.find.mockReturnValue({
      sort: () => ({ limit: async () => [order] })
    });
    global.fetch = vi.fn().mockResolvedValue(rmResponse(deliveredSummary));

    const result = await pollShippedOrders();

    expect(result).toEqual({ checked: 1, advanced: 1, errors: 0 });
    expect(order.status).toBe('delivered');
    expect(order.deliveryDate).toBeInstanceOf(Date);
    expect(order.deliveryDate.toISOString()).toBe('2026-09-21T14:32:00.000Z');
    const lastNote = order.statusHistory[order.statusHistory.length - 1].note;
    expect(lastNote).toContain('Auto-updated from Royal Mail tracking (EVKOP Delivered)');
    expect(emailService.sendOrderDeliveredEmail).toHaveBeenCalledWith(order);
  });

  it('advances shipped → out_for_delivery with NO email (parity with the manual path)', async () => {
    const order = makeOrder();
    Order.find.mockReturnValue({
      sort: () => ({ limit: async () => [order] })
    });
    global.fetch = vi.fn().mockResolvedValue(rmResponse(outForDeliverySummary));

    const result = await pollShippedOrders();

    expect(result.advanced).toBe(1);
    expect(order.status).toBe('out_for_delivery');
    expect(order.deliveryDate).toBeUndefined();
    expect(emailService.sendOrderDeliveredEmail).not.toHaveBeenCalled();
  });

  it('advances out_for_delivery → delivered', async () => {
    const order = makeOrder({ status: 'out_for_delivery' });
    Order.find.mockReturnValue({
      sort: () => ({ limit: async () => [order] })
    });
    global.fetch = vi.fn().mockResolvedValue(rmResponse(deliveredSummary));

    await pollShippedOrders();

    expect(order.status).toBe('delivered');
    expect(order.deliveryDate).toBeInstanceOf(Date);
  });

  it('leaves the order untouched when Royal Mail returns an error/untrackable response', async () => {
    const order = makeOrder();
    Order.find.mockReturnValue({
      sort: () => ({ limit: async () => [order] })
    });
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    const result = await pollShippedOrders();

    expect(result).toEqual({ checked: 1, advanced: 0, errors: 0 });
    expect(order.status).toBe('shipped');
    expect(order.save).not.toHaveBeenCalled();
  });

  it('continues past a failing order and still advances the next one', async () => {
    const failing = makeOrder({ orderNumber: 'ORD-FAIL', trackingNumber: 'FAIL1' });
    failing.save = vi.fn().mockRejectedValue(new Error('write error'));
    const healthy = makeOrder({ orderNumber: 'ORD-OK' });
    Order.find.mockReturnValue({
      sort: () => ({ limit: async () => [failing, healthy] })
    });
    global.fetch = vi.fn().mockResolvedValue(rmResponse(deliveredSummary));

    const result = await pollShippedOrders();

    expect(result).toEqual({ checked: 2, advanced: 1, errors: 1 });
    expect(healthy.status).toBe('delivered');
  });

  it('does not regress when the event matches the current status (already out for delivery)', async () => {
    const order = makeOrder({ status: 'out_for_delivery' });
    Order.find.mockReturnValue({
      sort: () => ({ limit: async () => [order] })
    });
    global.fetch = vi.fn().mockResolvedValue(rmResponse(outForDeliverySummary));

    const result = await pollShippedOrders();

    expect(result.advanced).toBe(0);
    expect(order.save).not.toHaveBeenCalled();
  });
});
