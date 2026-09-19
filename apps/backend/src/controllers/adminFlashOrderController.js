import FlashOrder from '../models/FlashOrder.js';
import logger, { logError } from '../utils/logger.js';
import { PO_BOX_ADDRESS } from './flashOrderController.js';
import mongoose from 'mongoose';
import { getPayPalClient } from './paymentController.js';
import emailService from '../services/emailService.js';

const REFUND_CATEGORIES = ['cancellation_before_flashing', 'device_unflashable'];
// Statuses from which a full (tier A/B) refund is permitted. Once flashing
// begins (Flashing_In_Progress/Shipped_Back) the service fee is
// non-refundable — the service is supplied to the customer's specification
// with their express consent (UK CCR 2013).
const REFUNDABLE_STATUSES = ['Paid', 'Device_Received', 'Cancelled'];
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Get all Flash Orders (admin only)
 * GET /api/admin/flash-orders
 */
export const getAllFlashOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      customerQuery,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = {};

    if (status && status !== 'all') {
      filter.orderStatus = status;
    }

    if (customerQuery) {
      filter.$or = [
        { customerEmail: { $regex: customerQuery, $options: 'i' } },
        { orderNumber: { $regex: customerQuery, $options: 'i' } },
        { 'returnAddress.fullName': { $regex: customerQuery, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Build sort
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [orders, total] = await Promise.all([
      FlashOrder.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      FlashOrder.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    logError(error, { context: 'get_all_flash_orders_admin' });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flash orders'
    });
  }
};

/**
 * Get Flash Order by ID (admin only)
 * GET /api/admin/flash-orders/:id
 */
export const getFlashOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await FlashOrder.findById(id).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Flash Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    logError(error, { context: 'get_flash_order_by_id_admin' });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flash order'
    });
  }
};

/**
 * Update Flash Order status (admin only)
 * PATCH /api/admin/flash-orders/:id/status
 */
export const updateFlashOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus, note, intakeConditionNotes } = req.body;

    const order = await FlashOrder.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Flash Order not found'
      });
    }

    // Validate order status
    const validOrderStatuses = ['Awaiting_Payment', 'Paid', 'Device_Received', 'Flashing_In_Progress', 'Shipped_Back', 'Cancelled', 'Refunded'];
    if (orderStatus && !validOrderStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid order status. Must be one of: ${validOrderStatuses.join(', ')}`
      });
    }

    // Validate payment status
    const validPaymentStatuses = ['Unpaid', 'Pending', 'Completed', 'Failed', 'Refunded'];
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`
      });
    }

    // Update status
    if (orderStatus) {
      order.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    // Add status history entry
    const statusToAdd = orderStatus || paymentStatus;
    if (statusToAdd) {
      order.statusHistory.push({
        status: statusToAdd,
        timestamp: new Date(),
        note: note || `Status updated to ${statusToAdd}`
      });
    }

    // Auto-populate PO Box when order is paid
    if (orderStatus === 'Paid' && paymentStatus === 'Completed' && !order.poBoxAddress) {
      order.poBoxAddress = PO_BOX_ADDRESS;
    }

    // Inbound inspection (chargeback paper trail): record the device's
    // condition when it is marked received, before any flashing work starts.
    let intakeRecorded = false;
    if (orderStatus === 'Device_Received' && intakeConditionNotes && intakeConditionNotes.trim()) {
      order.intakeInspection = {
        inspectedAt: new Date(),
        conditionNotes: intakeConditionNotes.trim(),
        inspectedBy: req.user?._id
      };
      intakeRecorded = true;
    }

    await order.save();

    // Email the customer their inspection outcome — never fails the update
    if (intakeRecorded) {
      try {
        await emailService.sendFlashServiceIntakeEmail(order);
      } catch (emailError) {
        logError(emailError, { context: 'flash_intake_email' });
      }
    }

    logger.info(`Flash Order status updated`, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus
    });

    res.json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        statusHistory: order.statusHistory
      }
    });

  } catch (error) {
    logError(error, { context: 'update_flash_order_status_admin' });
    res.status(500).json({
      success: false,
      error: 'Failed to update flash order status'
    });
  }
};

/**
 * Get Flash Order statistics (admin only)
 * GET /api/admin/flash-orders/stats
 */
export const getFlashOrderStats = async (req, res) => {
  try {
    const [
      totalOrders,
      awaitingPayment,
      paid,
      deviceReceived,
      flashingInProgress,
      shippedBack,
      cancelled,
      refunded
    ] = await Promise.all([
      FlashOrder.countDocuments(),
      FlashOrder.countDocuments({ orderStatus: 'Awaiting_Payment' }),
      FlashOrder.countDocuments({ orderStatus: 'Paid' }),
      FlashOrder.countDocuments({ orderStatus: 'Device_Received' }),
      FlashOrder.countDocuments({ orderStatus: 'Flashing_In_Progress' }),
      FlashOrder.countDocuments({ orderStatus: 'Shipped_Back' }),
      FlashOrder.countDocuments({ orderStatus: 'Cancelled' }),
      FlashOrder.countDocuments({ orderStatus: 'Refunded' })
    ]);

    // Calculate revenue from paid orders
    const paidOrders = await FlashOrder.find({
      paymentStatus: 'Completed'
    }).lean();
    const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

    res.json({
      success: true,
      data: {
        totalOrders,
        awaitingPayment,
        paid,
        deviceReceived,
        flashingInProgress,
        shippedBack,
        cancelled,
        refunded,
        totalRevenue
      }
    });

  } catch (error) {
    logError(error, { context: 'get_flash_order_stats_admin' });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flash order statistics'
    });
  }
};

/**
 * Refund a Flash Order (tiered policy, admin only)
 * POST /api/admin/flash-orders/:id/refund
 *
 * Amounts are SERVER-COMPUTED from the category — the client never supplies
 * money. Two-phase commit: a durable 'pending' claim is written before the
 * PayPal call (prevents concurrent double refunds), the gateway refund runs
 * outside the transaction, then the order is finalised. Once flashing has
 * begun the refund is refused (409) per the flash-service policy.
 */
export const refundFlashOrder = async (req, res) => {
  const { id } = req.params;
  const { reason, category = 'cancellation_before_flashing' } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, error: 'Invalid Flash Order ID format' });
  }
  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    return res.status(400).json({ success: false, error: 'A refund reason is required' });
  }
  if (!REFUND_CATEGORIES.includes(category)) {
    return res.status(400).json({ success: false, error: `Refund category must be one of: ${REFUND_CATEGORIES.join(', ')}` });
  }

  // ---------------- Phase A: guards + durable claim ----------------
  let session = null;
  let order;
  let captureId;
  let refundAmount;
  let refundRequestId;

  try {
    session = await mongoose.startSession();
    session.startTransaction();

    order = await FlashOrder.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'Flash Order not found' });
    }

    if (order.paymentStatus === 'Refunded') {
      await session.abortTransaction();
      return res.status(409).json({ success: false, error: 'This Flash Order has already been refunded' });
    }
    if (order.paymentStatus !== 'Completed') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: `Cannot refund an order with payment status: ${order.paymentStatus}` });
    }

    if (['Flashing_In_Progress', 'Shipped_Back'].includes(order.orderStatus)) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        error: 'Not refundable: the flashing service has begun. Under the flash-service policy the service is supplied to your specification with your express consent, so the service fee is non-refundable once flashing starts.'
      });
    }
    if (!REFUNDABLE_STATUSES.includes(order.orderStatus)) {
      await session.abortTransaction();
      return res.status(409).json({ success: false, error: `Not refundable from status: ${order.orderStatus}` });
    }

    captureId = order.paymentDetails?.paypalTransactionId || order.paymentDetails?.paypalPaymentId;
    if (!captureId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'No PayPal capture found for this order. Issue the refund manually in the PayPal dashboard, then record it against the order.'
      });
    }

    // Tier A (cancel before flashing) refunds the full total; tier B
    // (device unflashable) refunds the total minus return shipping.
    refundAmount = category === 'device_unflashable'
      ? round2((order.totalPrice || 0) - (order.returnShipping || 0))
      : round2(order.totalPrice || 0);
    if (refundAmount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'Computed refund amount is not positive' });
    }
    refundRequestId = `flash_refund_${order._id}_${Date.now()}`;

    // Atomic claim: only one pending refund may exist — a concurrent request
    // fails here instead of double-refunding at the gateway.
    const claimed = await FlashOrder.findOneAndUpdate(
      { _id: order._id, paymentStatus: 'Completed', 'refundHistory.status': { $ne: 'pending' } },
      {
        $push: {
          refundHistory: {
            refundId: `pending_${Date.now()}`,
            amount: refundAmount,
            date: new Date(),
            reason: reason.trim(),
            category,
            adminUserId: req.user?._id,
            status: 'pending'
          }
        }
      },
      { session }
    );
    if (!claimed) {
      await session.abortTransaction();
      return res.status(409).json({ success: false, error: 'A refund is already in progress for this order' });
    }

    await session.commitTransaction();
  } catch (error) {
    logError(error, { context: 'flash_refund_claim' });
    if (session && session.transaction?.isActive) {
      await session.abortTransaction().catch(() => {});
    }
    return res.status(500).json({ success: false, error: 'Failed to begin refund' });
  } finally {
    if (session) await session.endSession().catch(() => {});
  }

  // ---------------- Phase B: gateway refund (no transaction) ----------------
  const paypalClient = getPayPalClient();
  let gatewayRefund;
  const markClaimFailed = async () => {
    try {
      await FlashOrder.updateOne(
        { _id: id, 'refundHistory.status': 'pending' },
        { $set: { 'refundHistory.$.status': 'failed' } }
      );
    } catch (markError) {
      logError(markError, { context: 'flash_refund_claim_mark_failed' });
    }
  };

  if (!paypalClient) {
    await markClaimFailed();
    return res.status(502).json({
      success: false,
      error: 'PayPal refund processing is not available. Nothing was refunded — try again shortly.'
    });
  }

  try {
    const response = await paypalClient.paymentsController.refundCapturedPayment({
      captureId,
      paypalRequestId: refundRequestId,
      body: { amount: { value: refundAmount.toFixed(2), currencyCode: 'GBP' } }
    });
    gatewayRefund = response?.result ?? response ?? {};
  } catch (paypalError) {
    logError(paypalError, { context: 'flash_refund_paypal' });
    await markClaimFailed();
    return res.status(502).json({
      success: false,
      error: 'PayPal refund failed — nothing was recorded here. Verify the refund status in the PayPal dashboard before retrying.'
    });
  }

  if (gatewayRefund.status !== 'COMPLETED' && gatewayRefund.status !== 'PENDING') {
    await markClaimFailed();
    return res.status(502).json({
      success: false,
      error: `PayPal refund returned unexpected status "${gatewayRefund.status}" — nothing was recorded. Verify in the PayPal dashboard.`
    });
  }

  // ---------------- Phase C: finalise ----------------
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const finalOrder = await FlashOrder.findById(id).session(session);
    if (!finalOrder) throw new Error('Order vanished during refund finalisation');

    const claim = [...(finalOrder.refundHistory || [])].reverse().find((entry) => entry.status === 'pending');
    if (claim) {
      claim.status = 'succeeded';
      claim.refundId = gatewayRefund.id || refundRequestId;
    }

    finalOrder.totalRefundedAmount = refundAmount;
    finalOrder.paymentStatus = 'Refunded';
    finalOrder.orderStatus = 'Refunded';
    finalOrder.statusHistory.push({
      status: 'Refunded',
      timestamp: new Date(),
      note: `Full refund of £${refundAmount.toFixed(2)} issued via PayPal — ${reason.trim()}`.slice(0, 200)
    });

    await finalOrder.save({ session });
    await session.commitTransaction();

    logger.info('Flash Order refunded', {
      orderId: finalOrder._id,
      orderNumber: finalOrder.orderNumber,
      amount: refundAmount,
      category,
      refundId: gatewayRefund.id || refundRequestId
    });

    // Customer email — never fails the refund
    try {
      await emailService.sendFlashServiceRefundEmail(finalOrder, claim || { amount: refundAmount, reason: reason.trim(), category, refundId: gatewayRefund.id || refundRequestId });
    } catch (emailError) {
      logError(emailError, { context: 'flash_refund_email' });
    }

    return res.json({
      success: true,
      message: `Refund of £${refundAmount.toFixed(2)} processed successfully`,
      data: { order: finalOrder, refund: claim || null }
    });

  } catch (error) {
    logError(error, { context: 'flash_refund_finalise' });
    if (session && session.transaction?.isActive) {
      await session.abortTransaction().catch(() => {});
    }
    return res.status(502).json({
      success: false,
      error: 'PayPal refunded the customer but recording the refund failed. Check the PayPal dashboard and the order history, then correct manually if needed.'
    });
  } finally {
    if (session) await session.endSession().catch(() => {});
  }
};
