import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import ReturnRequest from '../ReturnRequest.js';

// Device verification state on a return request: the admin scans the
// returned phone's IMEI and the result (match/mismatch vs what was shipped)
// is recorded here. A mismatch here is one of the two refund-block signals.
describe('ReturnRequest Model — deviceVerification', () => {

  beforeEach(async () => {
    await ReturnRequest.deleteMany({});
  });

  afterEach(async () => {
    await ReturnRequest.deleteMany({});
  });

  const getValidReturnData = () => ({
    userId: new mongoose.Types.ObjectId(),
    orderId: new mongoose.Types.ObjectId(),
    customerEmail: `returns-${Date.now()}-${Math.random()}@example.com`,
    orderNumber: 'ORD-123-456',
    items: [{
      productId: new mongoose.Types.ObjectId(),
      productName: 'GrapheneOS Pixel 9 Pro',
      productSlug: 'grapheneos-pixel-9-pro',
      quantity: 1,
      unitPrice: 999.99,
      totalRefundAmount: 999.99,
      reason: 'changed_mind'
    }],
    totalRefundAmount: 999.99
  });

  it('defaults deviceVerification.status to not_started', async () => {
    const saved = await ReturnRequest.create(getValidReturnData());

    expect(saved.deviceVerification.status).toBe('not_started');
    expect(saved.deviceVerification.scans).toEqual([]);
  });

  it('persists scans, including unknown-IMEI scans with null deviceId', async () => {
    const data = getValidReturnData();
    data.deviceVerification = {
      status: 'mismatch',
      scans: [{
        scannedImei: '999999999999999',
        deviceId: null,
        match: false,
        expectedImeis: ['123456789012345'],
        scannedBy: new mongoose.Types.ObjectId()
      }],
      completedAt: new Date()
    };

    const saved = await ReturnRequest.create(data);

    expect(saved.deviceVerification.status).toBe('mismatch');
    expect(saved.deviceVerification.scans).toHaveLength(1);
    expect(saved.deviceVerification.scans[0].deviceId).toBeNull();
    expect(saved.deviceVerification.scans[0].match).toBe(false);
    expect(saved.deviceVerification.completedAt).toBeDefined();
  });

  it('rejects an invalid deviceVerification status', async () => {
    const data = getValidReturnData();
    data.deviceVerification = { status: 'maybe' };

    await expect(ReturnRequest.create(data)).rejects.toThrow(/deviceVerification status/i);
  });
});
