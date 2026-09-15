import { vi, describe, test, beforeEach, expect } from 'vitest';
import mongoose from 'mongoose';

// Explicit per-model mocks are MANDATORY here: the global setup.vitest.js
// mongoose auto-mock returns truthy-garbage for unknown models' findOne.
vi.mock('../../models/Device.js', () => ({
  default: Object.assign(vi.fn(), {
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    countDocuments: vi.fn(),
    create: vi.fn()
  })
}));

vi.mock('../../models/Order.js', () => ({
  default: Object.assign(vi.fn(), {
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    countDocuments: vi.fn()
  })
}));

vi.mock('../../models/ReturnRequest.js', () => ({
  default: Object.assign(vi.fn(), {
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    countDocuments: vi.fn()
  })
}));

vi.mock('../../models/Product.js', () => ({
  default: Object.assign(vi.fn(), {
    findById: vi.fn()
  })
}));

import {
  getAllDevices,
  getDeviceById,
  receiveDevice,
  allocateDeviceToOrder,
  releaseDevice,
  verifyReturnDevice
} from '../deviceController.js';

import Device from '../../models/Device.js';
import Order from '../../models/Order.js';
import ReturnRequest from '../../models/ReturnRequest.js';
import Product from '../../models/Product.js';

// Controller threads `.session(session)` onto transactional queries —
// mockImplementation returning a session-resolvable query per call.
const chainable = (data) => ({
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  populate: vi.fn().mockReturnThis(),
  lean: vi.fn().mockResolvedValue(data)
});

const sessionQuery = (value) => () => ({ session: vi.fn().mockResolvedValue(value) });

describe('Device Controller (unit)', () => {
  let req, res, session;

  const VALID_IMEI = '123456789012345';
  const OTHER_IMEI = '987654321054321';

  beforeEach(() => {
    vi.clearAllMocks();

    req = { params: {}, query: {}, body: {}, user: { _id: 'admin123' } };
    res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    session = {
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      abortTransaction: vi.fn(),
      endSession: vi.fn().mockResolvedValue(undefined),
      withTransaction: vi.fn().mockImplementation(async (fn) => fn(session))
    };
    mongoose.startSession = vi.fn().mockResolvedValue(session);
    mongoose.Types.ObjectId.isValid = vi.fn().mockImplementation((id) => {
      if (!id) return false;
      return /^[0-9a-fA-F]{24}$/.test(id.toString());
    });

    // Default constructor for `new Device(data)` → savable instance.
    // Must be a REGULAR function: arrow implementations are not
    // constructible, so `new Device(...)` would throw.
    Device.mockImplementation(function (data) {
      return {
        ...data,
        _id: 'device-instance-id',
        save: vi.fn().mockResolvedValue(true)
      };
    });
  });

  const orderFixture = ({ itemQty = 1, devices = [], itemId = 'aaaaaaaaaaaaaaaaaaaaaaaa' } = {}) => ({
    _id: 'bbbbbbbbbbbbbbbbbbbbbbbb',
    orderNumber: 'ORD-1-001',
    items: [{
      _id: itemId,
      productId: 'cccccccccccccccccccccccc',
      productName: 'GrapheneOS Pixel 9 Pro',
      variationId: 'dddddddddddddddddddddddd',
      sku: 'PIX-9PRO-256GB-OBSIDIAN-B',
      quantity: itemQty,
      devices,
      save: vi.fn()
    }],
    save: vi.fn().mockResolvedValue(true)
  });

  const deviceFixture = (overrides = {}) => ({
    _id: 'eeeeeeeeeeeeeeeeeeeeeeee',
    imei: VALID_IMEI,
    serialNumber: 'SN-1',
    productId: 'cccccccccccccccccccccccc',
    status: 'in_stock',
    orderId: null,
    orderItemId: null,
    returnHistory: [],
    save: vi.fn().mockResolvedValue(true),
    ...overrides
  });

  const returnFixture = (overrides = {}) => ({
    _id: 'ffffffffffffffffffffffff',
    orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb',
    adminNotes: '',
    deviceVerification: { status: 'not_started', scans: [] },
    save: vi.fn().mockResolvedValue(true),
    ...overrides
  });

  // ---------------- getAllDevices ----------------
  describe('getAllDevices', () => {
    test('returns paginated devices with filters applied', async () => {
      Device.countDocuments.mockResolvedValue(1);
      Device.find.mockReturnValue(chainable([{ imei: VALID_IMEI }]));

      req.query = { status: 'in_stock', imei: VALID_IMEI, page: '1', limit: '20' };
      await getAllDevices(req, res);

      expect(Device.countDocuments).toHaveBeenCalledWith({ status: 'in_stock', imei: VALID_IMEI });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          devices: [{ imei: VALID_IMEI }],
          pagination: expect.objectContaining({ total: 1 })
        })
      }));
    });

    test('returns 500 on query failure', async () => {
      Device.countDocuments.mockRejectedValue(new Error('db down'));
      await getAllDevices(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ---------------- getDeviceById ----------------
  describe('getDeviceById', () => {
    test('returns the device', async () => {
      req.params.deviceId = 'eeeeeeeeeeeeeeeeeeeeeeee';
      Device.findById.mockReturnValue(chainable({ imei: VALID_IMEI }));
      await getDeviceById(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { device: { imei: VALID_IMEI } }
      }));
    });

    test('400 on invalid id', async () => {
      req.params.deviceId = 'not-an-id';
      await getDeviceById(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('404 when not found', async () => {
      req.params.deviceId = 'eeeeeeeeeeeeeeeeeeeeeeee';
      Device.findById.mockReturnValue(chainable(null));
      await getDeviceById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------------- receiveDevice ----------------
  describe('receiveDevice', () => {
    test('creates a device with 201', async () => {
      Product.findById.mockResolvedValue({ _id: 'cccccccccccccccccccccccc', name: 'GrapheneOS Pixel 9 Pro' });
      Device.create.mockResolvedValue({ imei: VALID_IMEI, status: 'in_stock' });

      req.body = { imei: VALID_IMEI, productId: 'cccccccccccccccccccccccc' };
      await receiveDevice(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('400 when IMEI is not 15 digits', async () => {
      req.body = { imei: '1234', productId: 'cccccccccccccccccccccccc' };
      await receiveDevice(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(Device.create).not.toHaveBeenCalled();
    });

    test('400 when productId is missing/invalid', async () => {
      req.body = { imei: VALID_IMEI };
      await receiveDevice(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 when product not found', async () => {
      Product.findById.mockResolvedValue(null);
      req.body = { imei: VALID_IMEI, productId: 'cccccccccccccccccccccccc' };
      await receiveDevice(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('409 on duplicate IMEI (E11000)', async () => {
      Product.findById.mockResolvedValue({ _id: 'cccccccccccccccccccccccc' });
      Device.create.mockRejectedValue(Object.assign(new Error('E11000 duplicate key error'), { code: 11000 }));

      req.body = { imei: VALID_IMEI, productId: 'cccccccccccccccccccccccc' };
      await receiveDevice(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  // ---------------- allocateDeviceToOrder ----------------
  describe('allocateDeviceToOrder', () => {
    test('JIT flow: creates the device from the order item and allocates it', async () => {
      const order = orderFixture();
      Order.findById.mockImplementation(sessionQuery(order));
      Device.findOne.mockImplementation(sessionQuery(null));

      req.body = { imei: VALID_IMEI, orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb', orderItemId: 'aaaaaaaaaaaaaaaaaaaaaaaa' };
      await allocateDeviceToOrder(req, res);

      expect(Device).toHaveBeenCalled(); // new Device(...) built from item data
      expect(order.items[0].devices).toHaveLength(1);
      expect(order.items[0].devices[0].imei).toBe(VALID_IMEI);
      expect(order.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          itemAllocation: expect.objectContaining({ allocated: 1, required: 1 })
        })
      }));
    });

    test('allocates an existing in_stock device of the same product', async () => {
      const order = orderFixture();
      const device = deviceFixture();
      Order.findById.mockImplementation(sessionQuery(order));
      Device.findOne.mockImplementation(sessionQuery(device));

      req.body = { imei: VALID_IMEI, orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb', orderItemId: 'aaaaaaaaaaaaaaaaaaaaaaaa' };
      await allocateDeviceToOrder(req, res);

      expect(device.status).toBe('allocated');
      expect(device.orderId).toBe('bbbbbbbbbbbbbbbbbbbbbbbb');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('409 when the IMEI is allocated to a different order', async () => {
      Order.findById.mockImplementation(sessionQuery(orderFixture()));
      Device.findOne.mockImplementation(sessionQuery(deviceFixture({
        status: 'allocated',
        orderId: '999999999999999999999999',
        orderNumber: 'ORD-OTHER'
      })));

      req.body = { imei: VALID_IMEI, orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb', orderItemId: 'aaaaaaaaaaaaaaaaaaaaaaaa' };
      await allocateDeviceToOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    test('409 when the device belongs to a different product', async () => {
      Order.findById.mockImplementation(sessionQuery(orderFixture()));
      Device.findOne.mockImplementation(sessionQuery(deviceFixture({ productId: '111111111111111111111111' })));

      req.body = { imei: VALID_IMEI, orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb', orderItemId: 'aaaaaaaaaaaaaaaaaaaaaaaa' };
      await allocateDeviceToOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    test('400 when the item already has all units allocated', async () => {
      Order.findById.mockImplementation(sessionQuery(orderFixture({
        itemQty: 1,
        devices: [{ deviceId: 'eeeeeeeeeeeeeeeeeeeeeeee', imei: OTHER_IMEI }]
      })));
      Device.findOne.mockImplementation(sessionQuery(deviceFixture()));

      req.body = { imei: VALID_IMEI, orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb', orderItemId: 'aaaaaaaaaaaaaaaaaaaaaaaa' };
      await allocateDeviceToOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('400 when the orderItemId is not on the order', async () => {
      Order.findById.mockImplementation(sessionQuery(orderFixture()));

      req.body = { imei: VALID_IMEI, orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb', orderItemId: '000000000000000000000000' };
      await allocateDeviceToOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('404 when the order does not exist', async () => {
      Order.findById.mockImplementation(sessionQuery(null));
      req.body = { imei: VALID_IMEI, orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb', orderItemId: 'aaaaaaaaaaaaaaaaaaaaaaaa' };
      await allocateDeviceToOrder(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    test('idempotent when the IMEI is already allocated to this same item', async () => {
      Order.findById.mockImplementation(sessionQuery(orderFixture({
        itemQty: 2,
        devices: [{ deviceId: 'eeeeeeeeeeeeeeeeeeeeeeee', imei: VALID_IMEI }]
      })));
      Device.findOne.mockImplementation(sessionQuery(deviceFixture({
        status: 'allocated',
        orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb',
        orderItemId: 'aaaaaaaaaaaaaaaaaaaaaaaa'
      })));

      req.body = { imei: VALID_IMEI, orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb', orderItemId: 'aaaaaaaaaaaaaaaaaaaaaaaa' };
      await allocateDeviceToOrder(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  // ---------------- releaseDevice ----------------
  describe('releaseDevice', () => {
    test('releases an allocated device back to stock and clears the order snapshot', async () => {
      const order = orderFixture({
        devices: [{ deviceId: 'eeeeeeeeeeeeeeeeeeeeeeee', imei: VALID_IMEI }]
      });
      const device = deviceFixture({
        status: 'allocated',
        orderId: order._id,
        orderItemId: 'aaaaaaaaaaaaaaaaaaaaaaaa'
      });
      Order.findById.mockImplementation(sessionQuery(order));
      Device.findById.mockImplementation(sessionQuery(device));

      req.params.deviceId = 'eeeeeeeeeeeeeeeeeeeeeeee';
      await releaseDevice(req, res);

      expect(device.status).toBe('in_stock');
      expect(device.orderId).toBeNull();
      expect(order.items[0].devices).toHaveLength(0);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('400 when the device is not allocated', async () => {
      Device.findById.mockImplementation(sessionQuery(deviceFixture({ status: 'shipped' })));
      req.params.deviceId = 'eeeeeeeeeeeeeeeeeeeeeeee';
      await releaseDevice(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('404 when the device does not exist', async () => {
      Device.findById.mockImplementation(sessionQuery(null));
      req.params.deviceId = 'eeeeeeeeeeeeeeeeeeeeeeee';
      await releaseDevice(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ---------------- verifyReturnDevice ----------------
  describe('verifyReturnDevice', () => {
    const allocatedSnapshot = (imei) => [{ deviceId: 'eeeeeeeeeeeeeeeeeeeeeeee', imei }];

    test('match covering all expected IMEIs → verified; device returned', async () => {
      const rr = returnFixture();
      const device = deviceFixture({ status: 'shipped', orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb' });
      ReturnRequest.findById.mockImplementation(sessionQuery(rr));
      Order.findById.mockImplementation(sessionQuery(orderFixture({ devices: allocatedSnapshot(VALID_IMEI) })));
      Device.findOne.mockImplementation(sessionQuery(device));

      req.params.returnRequestId = 'ffffffffffffffffffffffff';
      req.body = { imei: VALID_IMEI };
      await verifyReturnDevice(req, res);

      expect(device.status).toBe('returned');
      expect(device.returnHistory).toHaveLength(1);
      expect(device.returnHistory[0].outcome).toBe('match');
      expect(rr.deviceVerification.status).toBe('verified');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ result: 'match' })
      }));
    });

    test('partial match (more expected than scanned) → in_progress', async () => {
      const rr = returnFixture();
      ReturnRequest.findById.mockImplementation(sessionQuery(rr));
      Order.findById.mockImplementation(sessionQuery(orderFixture({
        itemQty: 2,
        devices: [
          ...allocatedSnapshot(VALID_IMEI),
          { deviceId: 'dev2', imei: OTHER_IMEI }
        ]
      })));
      Device.findOne.mockImplementation(sessionQuery(deviceFixture({ status: 'shipped', orderId: 'bbbbbbbbbbbbbbbbbbbbbbbb' })));

      req.params.returnRequestId = 'ffffffffffffffffffffffff';
      req.body = { imei: VALID_IMEI };
      await verifyReturnDevice(req, res);

      expect(rr.deviceVerification.status).toBe('in_progress');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ result: 'match' })
      }));
    });

    test('mismatch (known device from another order) → quarantined + mismatch', async () => {
      const rr = returnFixture();
      const device = deviceFixture({
        imei: OTHER_IMEI,
        status: 'shipped',
        orderId: '999999999999999999999999'
      });
      ReturnRequest.findById.mockImplementation(sessionQuery(rr));
      Order.findById.mockImplementation(sessionQuery(orderFixture({ devices: allocatedSnapshot(VALID_IMEI) })));
      Device.findOne.mockImplementation(sessionQuery(device));

      req.params.returnRequestId = 'ffffffffffffffffffffffff';
      req.body = { imei: OTHER_IMEI };
      await verifyReturnDevice(req, res);

      expect(device.status).toBe('quarantined');
      expect(device.returnHistory[0].outcome).toBe('mismatch');
      expect(rr.deviceVerification.status).toBe('mismatch');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ result: 'mismatch' })
      }));
    });

    test('unknown IMEI (not in system) → mismatch with null deviceId, no device touched', async () => {
      const rr = returnFixture();
      ReturnRequest.findById.mockImplementation(sessionQuery(rr));
      Order.findById.mockImplementation(sessionQuery(orderFixture({ devices: allocatedSnapshot(VALID_IMEI) })));
      Device.findOne.mockImplementation(sessionQuery(null));

      req.params.returnRequestId = 'ffffffffffffffffffffffff';
      req.body = { imei: OTHER_IMEI };
      await verifyReturnDevice(req, res);

      expect(rr.deviceVerification.status).toBe('mismatch');
      expect(rr.deviceVerification.scans[0].deviceId).toBeNull();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ result: 'mismatch' })
      }));
    });

    test('409 when the return is already fully verified', async () => {
      ReturnRequest.findById.mockImplementation(sessionQuery(returnFixture({
        deviceVerification: { status: 'verified', scans: [] }
      })));

      req.params.returnRequestId = 'ffffffffffffffffffffffff';
      req.body = { imei: VALID_IMEI };
      await verifyReturnDevice(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    test('404 when the return request does not exist', async () => {
      ReturnRequest.findById.mockImplementation(sessionQuery(null));
      req.params.returnRequestId = 'ffffffffffffffffffffffff';
      req.body = { imei: VALID_IMEI };
      await verifyReturnDevice(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
