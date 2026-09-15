import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import Order from '../Order.js';

// Per-item device snapshots — the tamper-proof record of WHICH physical
// unit (IMEI) was allocated to which order line, used by the shipped email
// and return verification.
describe('Order Model — item devices', () => {

  beforeEach(async () => {
    await Order.deleteMany({});
  });

  afterEach(async () => {
    await Order.deleteMany({});
  });

  const getValidOrderData = () => ({
    userId: new mongoose.Types.ObjectId(),
    customerEmail: `devices-${Date.now()}-${Math.random()}@example.com`,
    status: 'processing',
    items: [{
      productId: new mongoose.Types.ObjectId(),
      productName: 'GrapheneOS Pixel 9 Pro',
      productSlug: 'grapheneos-pixel-9-pro',
      quantity: 2,
      unitPrice: 999.99,
      totalPrice: 1999.98
    }],
    subtotal: 1999.98,
    tax: 0,
    shipping: 15.00,
    shippingAddress: {
      fullName: 'John Doe',
      addressLine1: '123 Main St',
      city: 'New York',
      stateProvince: 'NY',
      postalCode: '10001',
      country: 'United States'
    },
    billingAddress: {
      fullName: 'John Doe',
      addressLine1: '123 Main St',
      city: 'New York',
      stateProvince: 'NY',
      postalCode: '10001',
      country: 'United States'
    },
    shippingMethod: {
      id: new mongoose.Types.ObjectId(),
      name: 'Standard Shipping',
      cost: 15.00,
      estimatedDelivery: '3-5 business days'
    },
    paymentMethod: { type: 'paypal', name: 'PayPal' }
  });

  it('persists device snapshots on order items', async () => {
    const deviceId = new mongoose.Types.ObjectId();
    const data = getValidOrderData();
    data.items[0].devices = [{
      deviceId,
      imei: '123456789012345',
      serialNumber: 'SN-1',
      assignedBy: new mongoose.Types.ObjectId()
    }];

    const saved = await Order.create(data);
    const item = saved.items[0];

    expect(item.devices).toHaveLength(1);
    expect(item.devices[0].deviceId.toString()).toBe(deviceId.toString());
    expect(item.devices[0].imei).toBe('123456789012345');
    expect(item.devices[0].assignedAt).toBeDefined();
  });

  it('requires deviceId and imei on a device snapshot', async () => {
    const data = getValidOrderData();
    data.items[0].devices = [{ serialNumber: 'SN-1' }];

    await expect(Order.create(data)).rejects.toThrow();
  });

  it('allows awaiting_shipment in statusHistory (regression: enum gap threw on transition)', async () => {
    // order.status includes awaiting_shipment, but statusHistory.status used
    // to omit it — pushing the transition rejected the save with a
    // ValidationError inside admin status-update transactions.
    const order = await Order.create(getValidOrderData());
    order.status = 'awaiting_shipment';
    order.statusHistory.push({ status: 'awaiting_shipment', timestamp: new Date() });

    const saved = await order.save();
    expect(saved.status).toBe('awaiting_shipment');
    expect(saved.statusHistory.some((h) => h.status === 'awaiting_shipment')).toBe(true);
  });
});
