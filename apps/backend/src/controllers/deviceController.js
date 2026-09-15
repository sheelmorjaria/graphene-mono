import mongoose from 'mongoose';
import Device from '../models/Device.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import ReturnRequest from '../models/ReturnRequest.js';

// IMEI device tracking (return-fraud prevention).
// Lifecycle: receive (in_stock) → allocate to an order item (allocated) →
// ship (shipped) → return verification (returned / quarantined).
// All admin-only; routes live in routes/admin.js behind authenticate +
// requireRole('admin').

const IMEI_REGEX = /^\d{15}$/;

// Controller-internal error carrying an HTTP status out of a transaction
const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const respondWithError = (res, error, fallback = 'Internal server error') => {
  console.error('Device controller error:', error.message);
  res.status(error.statusCode || 500).json({ success: false, error: error.statusCode ? error.message : fallback });
};

// ---------------- list / detail ----------------

export const getAllDevices = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, imei, orderId, productId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (imei) filter.imei = imei.trim();
    if (orderId) filter.orderId = orderId;
    if (productId) filter.productId = productId;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const total = await Device.countDocuments(filter);
    const devices = await Device.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('-returnHistory')
      .populate('productId', 'name slug')
      .lean();

    res.json({
      success: true,
      data: {
        devices,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    respondWithError(res, error, 'Failed to fetch devices');
  }
};

export const getDeviceById = async (req, res) => {
  try {
    const { deviceId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(deviceId)) {
      return res.status(400).json({ success: false, error: 'Invalid device ID' });
    }

    const device = await Device.findById(deviceId)
      .populate('productId', 'name slug')
      .populate('orderId', 'orderNumber')
      .lean();

    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }

    res.json({ success: true, data: { device } });
  } catch (error) {
    respondWithError(res, error, 'Failed to fetch device');
  }
};

// ---------------- receive stock ----------------

export const receiveDevice = async (req, res) => {
  try {
    const { imei, serialNumber, productId, variationId, sku, productName } = req.body;

    if (!IMEI_REGEX.test(imei || '')) {
      return res.status(400).json({ success: false, error: 'IMEI must be exactly 15 digits' });
    }
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, error: 'A valid product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(400).json({ success: false, error: 'Product not found' });
    }

    const device = await Device.create({
      imei,
      serialNumber,
      productId,
      variationId,
      sku,
      productName: productName || product.name
    });

    res.status(201).json({
      success: true,
      message: `Device ${imei} received into stock`,
      data: { device }
    });
  } catch (error) {
    if (error.code === 11000 || /duplicate key/i.test(error.message || '')) {
      return res.status(409).json({ success: false, error: `A device with IMEI ${req.body?.imei} already exists` });
    }
    respondWithError(res, error, 'Failed to receive device');
  }
};

// ---------------- allocate to an order item (JIT one-scan flow) ----------------

export const allocateDeviceToOrder = async (req, res) => {
  let session = null;
  try {
    const { imei, orderId, orderItemId, serialNumber } = req.body;

    if (!IMEI_REGEX.test(imei || '')) {
      return res.status(400).json({ success: false, error: 'IMEI must be exactly 15 digits' });
    }
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, error: 'A valid order ID is required' });
    }
    if (!orderItemId) {
      return res.status(400).json({ success: false, error: 'Order item ID is required' });
    }

    session = await mongoose.startSession();
    let result;

    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw httpError(404, 'Order not found');

      const item = (order.items || []).find((i) => String(i._id) === String(orderItemId));
      if (!item) throw httpError(400, 'Order item not found on this order');
      if (!item.devices) item.devices = [];

      // Idempotent: this IMEI is already on this item — just report progress
      const alreadyOnItem = item.devices.some((d) => d.imei === imei);
      if (!alreadyOnItem && item.devices.length >= item.quantity) {
        throw httpError(400, 'All units for this order item are already allocated');
      }

      let device = await Device.findOne({ imei }).session(session);

      if (!device) {
        // JIT: the unit was bought for this order — create it from the item's
        // denormalised product data so the paper trail starts at the scan
        device = new Device({
          imei,
          serialNumber,
          productId: item.productId,
          productName: item.productName,
          variationId: item.variationId,
          sku: item.sku
        });
        await device.save({ session });
      } else {
        const sameOrder = device.orderId && String(device.orderId) === String(order._id);
        if (!sameOrder && device.status !== 'in_stock') {
          throw httpError(
            409,
            `IMEI ${imei} is not available (status: ${device.status}${device.orderNumber ? `, order ${device.orderNumber}` : ''})`
          );
        }
        if (!sameOrder && String(device.productId) !== String(item.productId)) {
          throw httpError(409, 'This device belongs to a different product than the order item');
        }
      }

      if (!alreadyOnItem) {
        device.status = 'allocated';
        device.orderId = order._id;
        device.orderItemId = String(item._id);
        device.orderNumber = order.orderNumber;
        device.allocatedAt = new Date();
        device.allocatedBy = req.user?._id;
        await device.save({ session });

        item.devices.push({
          deviceId: device._id,
          imei: device.imei,
          serialNumber: device.serialNumber || serialNumber,
          assignedBy: req.user?._id
        });
        await order.save({ session });
      }

      result = {
        device,
        itemAllocation: {
          itemId: String(item._id),
          allocated: item.devices.length,
          required: item.quantity
        }
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    respondWithError(res, error, 'Failed to allocate device');
  } finally {
    if (session) await session.endSession().catch(() => {});
  }
};

// ---------------- release (unallocate) ----------------

export const releaseDevice = async (req, res) => {
  let session = null;
  try {
    const { deviceId } = req.params;
    const { reason } = req.body;
    if (!mongoose.Types.ObjectId.isValid(deviceId)) {
      return res.status(400).json({ success: false, error: 'Invalid device ID' });
    }

    session = await mongoose.startSession();
    let device;

    await session.withTransaction(async () => {
      device = await Device.findById(deviceId).session(session);
      if (!device) throw httpError(404, 'Device not found');
      if (device.status !== 'allocated') {
        throw httpError(400, 'Only allocated devices can be released');
      }

      if (device.orderId) {
        const order = await Order.findById(device.orderId).session(session);
        const item = order && (order.items || []).find((i) => String(i._id) === String(device.orderItemId));
        if (item) {
          item.devices = (item.devices || []).filter((d) => String(d.deviceId) !== String(device._id));
          await order.save({ session });
        }
      }

      device.status = 'in_stock';
      device.orderId = null;
      device.orderItemId = undefined;
      device.orderNumber = undefined;
      device.allocatedAt = undefined;
      device.allocatedBy = undefined;
      if (reason) device.notes = reason;
      await device.save({ session });
    });

    res.json({ success: true, data: { device } });
  } catch (error) {
    respondWithError(res, error, 'Failed to release device');
  } finally {
    if (session) await session.endSession().catch(() => {});
  }
};

// ---------------- return verification ----------------

export const verifyReturnDevice = async (req, res) => {
  let session = null;
  try {
    const { returnRequestId } = req.params;
    const { imei } = req.body;

    if (!returnRequestId || !mongoose.Types.ObjectId.isValid(returnRequestId)) {
      return res.status(400).json({ success: false, error: 'A valid return request ID is required' });
    }
    if (!IMEI_REGEX.test(imei || '')) {
      return res.status(400).json({ success: false, error: 'IMEI must be exactly 15 digits' });
    }

    session = await mongoose.startSession();
    let payload;

    await session.withTransaction(async () => {
      const returnRequest = await ReturnRequest.findById(returnRequestId).session(session);
      if (!returnRequest) throw httpError(404, 'Return request not found');
      if (returnRequest.deviceVerification?.status === 'verified') {
        throw httpError(409, 'This return has already been fully verified');
      }

      const order = await Order.findById(returnRequest.orderId).session(session);
      const expectedImeis = (order?.items || []).flatMap((i) => (i.devices || []).map((d) => d.imei));

      const device = await Device.findOne({ imei }).session(session);
      const match = Boolean(
        device &&
        expectedImeis.includes(imei) &&
        device.orderId &&
        String(device.orderId) === String(returnRequest.orderId)
      );

      if (!returnRequest.deviceVerification) {
        returnRequest.deviceVerification = { status: 'not_started', scans: [] };
      }
      returnRequest.deviceVerification.scans.push({
        scannedImei: imei,
        deviceId: device?._id || null,
        match,
        expectedImeis,
        scannedBy: req.user?._id
      });

      if (match) {
        device.status = 'returned';
        device.returnHistory.push({
          returnRequestId: returnRequest._id,
          outcome: 'match',
          scannedImei: imei,
          expectedImeis,
          verifiedBy: req.user?._id
        });
        await device.save({ session });

        const matchedImeis = new Set(
          returnRequest.deviceVerification.scans.filter((s) => s.match).map((s) => s.scannedImei)
        );
        const allMatched = expectedImeis.length > 0 && expectedImeis.every((i) => matchedImeis.has(i));
        returnRequest.deviceVerification.status = allMatched ? 'verified' : 'in_progress';
        if (allMatched) {
          returnRequest.deviceVerification.completedAt = new Date();
        }
      } else {
        if (device) {
          device.status = 'quarantined';
          device.returnHistory.push({
            returnRequestId: returnRequest._id,
            outcome: 'mismatch',
            scannedImei: imei,
            expectedImeis,
            verifiedBy: req.user?._id
          });
          await device.save({ session });
        }

        returnRequest.deviceVerification.status = 'mismatch';
        const note = `[${new Date().toISOString()}] DEVICE VERIFICATION MISMATCH: scanned IMEI ${imei}` +
          `${device ? '' : ' (not in system)'} — expected [${expectedImeis.join(', ') || 'no shipment record'}]`;
        returnRequest.adminNotes = returnRequest.adminNotes
          ? `${returnRequest.adminNotes}\n\n${note}`
          : note;
      }

      await returnRequest.save({ session });

      payload = {
        result: match ? 'match' : 'mismatch',
        device: device
          ? { _id: device._id, imei: device.imei, status: device.status, productName: device.productName }
          : null,
        verification: returnRequest.deviceVerification,
        expectedImeis,
        message: match
          ? 'IMEI matches a device shipped on this order'
          : 'WARNING: returned IMEI does not match a device shipped on this order — refund blocked pending review'
      };
    });

    res.json({ success: true, data: payload });
  } catch (error) {
    respondWithError(res, error, 'Failed to verify device');
  } finally {
    if (session) await session.endSession().catch(() => {});
  }
};
