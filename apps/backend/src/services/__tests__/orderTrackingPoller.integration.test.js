import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import Order from '../../models/Order.js';
import emailService from '../emailService.js';
import { pollShippedOrders } from '../orderTrackingPoller.js';

// End-to-end against the in-memory replica set: a real shipped Order is
// advanced to delivered by a mocked Royal Mail API response, stamping
// deliveryDate (which the 28-day returns window depends on). emailService
// is mocked by the integration harness (setup.integration.js).

const baseEnv = { ...process.env };

const createShippedOrder = async () => {
  const order = new Order({
    orderNumber: `RM-${Date.now()}-${Math.floor(Math.random() * 1000)}`.slice(0, 20),
    customerEmail: 'rm-test@example.com',
    isGuest: true,
    status: 'shipped',
    paymentStatus: 'completed',
    trackingNumber: 'AB123456789GB',
    trackingUrl: 'https://www.royalmail.com/track',
    items: [{
      productId: new mongoose.Types.ObjectId(),
      productName: 'GrapheneOS Pixel 6',
      productSlug: 'grapheneos-pixel-6',
      quantity: 1,
      unitPrice: 240,
      totalPrice: 240
    }],
    subtotal: 240,
    tax: 0,
    shipping: 20.45,
    totalAmount: 260.45,
    shippingAddress: {
      fullName: 'Test Customer',
      addressLine1: '1 Test Street',
      city: 'London',
      stateProvince: 'England',
      postalCode: 'SW1A 1AA',
      country: 'GB'
    },
    billingAddress: {
      fullName: 'Test Customer',
      addressLine1: '1 Test Street',
      city: 'London',
      stateProvince: 'England',
      postalCode: 'SW1A 1AA',
      country: 'GB'
    },
    paymentMethod: { type: 'paypal', name: 'PayPal' },
    shippingMethod: { id: new mongoose.Types.ObjectId(), name: 'Royal Mail Special Delivery', cost: 20.45 }
  });
  return order.save();
};

describe('orderTrackingPoller integration', () => {
  const originalFetch = global.fetch;

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

  it('advances a shipped order to delivered with deliveryDate stamped and email sent', async () => {
    const created = await createShippedOrder();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        mailPieces: [{
          mailPieceId: created.trackingNumber,
          summary: {
            lastEventCode: 'EVKOP',
            lastEventName: 'Delivered',
            lastEventDateTime: '2026-09-21T14:32:00+00:00',
            summaryLine: 'Delivered on 21/09/2026'
          }
        }]
      })
    });

    const result = await pollShippedOrders();

    expect(result.advanced).toBeGreaterThanOrEqual(1);

    const updated = await Order.findById(created._id);
    expect(updated.status).toBe('delivered');
    expect(updated.deliveryDate).toBeInstanceOf(Date);
    expect(updated.deliveryDate.toISOString()).toBe('2026-09-21T14:32:00.000Z');
    expect(updated.statusHistory.at(-1).note).toContain('Auto-updated from Royal Mail tracking (EVKOP');
    expect(emailService.sendOrderDeliveredEmail).toHaveBeenCalled();
  });

  it('leaves the order untouched while Royal Mail still shows it in transit', async () => {
    const created = await createShippedOrder();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        mailPieces: [{
          mailPieceId: created.trackingNumber,
          summary: { lastEventCode: 'EVNMI', lastEventName: 'Forwarded - Mis-sort', statusCategory: 'IN TRANSIT' }
        }]
      })
    });

    await pollShippedOrders();

    const updated = await Order.findById(created._id);
    expect(updated.status).toBe('shipped');
    expect(updated.deliveryDate).toBeUndefined();
    expect(emailService.sendOrderDeliveredEmail).not.toHaveBeenCalled();
  });

  it('delivers the order through the intermediate out_for_delivery state', async () => {
    const created = await createShippedOrder();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        mailPieces: [{
          mailPieceId: created.trackingNumber,
          summary: { lastEventCode: 'EVDIR', lastEventName: 'Out for Delivery' }
        }]
      })
    });

    await pollShippedOrders();
    expect((await Order.findById(created._id)).status).toBe('out_for_delivery');
  });
});
