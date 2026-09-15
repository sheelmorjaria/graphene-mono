import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import Device from '../Device.js';

// Physical-unit tracking for return-fraud prevention. The IMEI is the
// immutable identity of a unit across its whole lifecycle
// (in_stock → allocated → shipped → returned / quarantined).
describe('Device Model', () => {

  beforeEach(async () => {
    await Device.deleteMany({});
  });

  afterEach(async () => {
    await Device.deleteMany({});
  });

  const getValidDeviceData = () => ({
    imei: '123456789012345',
    serialNumber: 'SN-ABC-123',
    productId: new mongoose.Types.ObjectId(),
    productName: 'GrapheneOS Pixel 9 Pro',
    variationId: new mongoose.Types.ObjectId().toString(),
    sku: 'PIX-9PRO-256GB-OBSIDIAN-B'
  });

  it('saves a valid device with default status and timestamps', async () => {
    const device = new Device(getValidDeviceData());
    const saved = await device.save();

    expect(saved._id).toBeDefined();
    expect(saved.status).toBe('in_stock');
    expect(saved.orderId).toBeNull();
    expect(saved.returnHistory).toEqual([]);
    expect(saved.createdAt).toBeDefined();
    expect(saved.updatedAt).toBeDefined();
  });

  it('rejects an IMEI that is not exactly 15 digits', async () => {
    const tooShort = new Device({ ...getValidDeviceData(), imei: '12345678901234' });
    await expect(tooShort.save()).rejects.toThrow(/15-digit/);

    const nonDigit = new Device({ ...getValidDeviceData(), imei: '12345678901234a' });
    await expect(nonDigit.save()).rejects.toThrow(/15-digit/);
  });

  it('requires imei and productId', async () => {
    const noImei = new Device({ ...getValidDeviceData(), imei: undefined });
    await expect(noImei.save()).rejects.toThrow(/IMEI is required/);

    const noProduct = new Device({ ...getValidDeviceData(), productId: undefined });
    await expect(noProduct.save()).rejects.toThrow(/Product ID is required/);
  });

  it('enforces IMEI uniqueness (duplicate save rejects)', async () => {
    await Device.create(getValidDeviceData());

    const duplicate = new Device({
      ...getValidDeviceData(),
      productId: new mongoose.Types.ObjectId()
    });
    // Unique may surface as E11000 from the collection index or as a
    // duplicated-key ValidationError depending on the driver version.
    await expect(duplicate.save()).rejects.toThrow();
    const count = await Device.countDocuments({ imei: getValidDeviceData().imei });
    expect(count).toBe(1);
  });

  it('rejects an invalid status', async () => {
    const badStatus = new Device({ ...getValidDeviceData(), status: 'lost' });
    await expect(badStatus.save()).rejects.toThrow(/status/i);
  });

  it('persists allocation and shipment fields', async () => {
    const orderId = new mongoose.Types.ObjectId();
    const orderItemId = new mongoose.Types.ObjectId().toString();
    const adminId = new mongoose.Types.ObjectId();
    const saved = await Device.create({
      ...getValidDeviceData(),
      status: 'shipped',
      orderId,
      orderItemId,
      orderNumber: 'ORD-123-456',
      allocatedAt: new Date(),
      allocatedBy: adminId,
      shippedAt: new Date()
    });

    expect(saved.orderId.toString()).toBe(orderId.toString());
    expect(saved.orderItemId).toBe(orderItemId);
    expect(saved.orderNumber).toBe('ORD-123-456');
    expect(saved.shippedAt).toBeDefined();
  });

  it('persists return history entries and rejects an invalid outcome', async () => {
    const returnRequestId = new mongoose.Types.ObjectId();
    const saved = await Device.create({
      ...getValidDeviceData(),
      status: 'quarantined',
      returnHistory: [{
        returnRequestId,
        outcome: 'mismatch',
        scannedImei: '999999999999999',
        expectedImeis: [getValidDeviceData().imei],
        verifiedBy: new mongoose.Types.ObjectId(),
        verifiedAt: new Date()
      }]
    });

    expect(saved.returnHistory).toHaveLength(1);
    expect(saved.returnHistory[0].outcome).toBe('mismatch');
    expect(saved.returnHistory[0].scannedImei).toBe('999999999999999');

    const badOutcome = new Device({
      ...getValidDeviceData(),
      imei: '111111111111111',
      returnHistory: [{ returnRequestId, outcome: 'shrugged' }]
    });
    await expect(badOutcome.save()).rejects.toThrow(/outcome/i);
  });
});
