import AegisOrder from '../models/AegisOrder.js';
import logger, { logError } from '../utils/logger.js';
import mongoose from 'mongoose';
import { getPayPalClient } from './paymentController.js';
import emailService from '../services/emailService.js';

const VALID_ORDER_STATUSES = ['Awaiting_Payment', 'Paid', 'Fulfilled', 'Cancelled', 'Refunded'];
const VALID_PAYMENT_STATUSES = ['Unpaid', 'Pending', 'Completed', 'Failed', 'Refunded'];
// Refundable only before the licence has been delivered — once Fulfilled the
// digital product is in the customer's hands and is not returnable.
const REFUNDABLE_STATUSES = ['Paid', 'Cancelled'];
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Get all Aegis Orders (admin only)
 * GET /api/admin/aegis-orders
 */
export const getAllAegisOrders = async (req, res) => {
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
        { pixelModel: { $regex: customerQuery, $options: 'i' } }
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

    const [orders, total] = await Promise.all([
      AegisOrder.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AegisOrder.countDocuments(filter)
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
    logError(error, { context: 'get_all_aegis_orders_admin' });
    res.status(500).json({ success: false, error: 'Failed to fetch Aegis orders' });
  }
};

/**
 * Get Aegis Order by ID (admin only)
 * GET /api/admin/aegis-orders/:id
 */
export const getAegisOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await AegisOrder.findById(id).lean();

    if (!order) {
      return res.status(404).json({ success: false, error: 'Aegis Order not found' });
    }

    res.json({ success: true, data: order });

  } catch (error) {
    logError(error, { context: 'get_aegis_order_by_id_admin' });
    res.status(500).json({ success: false, error: 'Failed to fetch Aegis order' });
  }
};

/**
 * Update Aegis Order status (admin only)
 * PATCH /api/admin/aegis-orders/:id/status
 * Marking an order Fulfilled is the licence-delivery action.
 */
export const updateAegisOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus, note } = req.body;

    const order = await AegisOrder.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Aegis Order not found' });
    }

    if (orderStatus && !VALID_ORDER_STATUSES.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid order status. Must be one of: ${VALID_ORDER_STATUSES.join(', ')}`
      });
    }

    if (paymentStatus && !VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid payment status. Must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`
      });
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    const statusToAdd = orderStatus || paymentStatus;
    if (statusToAdd) {
      order.statusHistory.push({
        status: statusToAdd,
        timestamp: new Date(),
        note: note || `Status updated to ${statusToAdd}`
      });
    }

    await order.save();

    logger.info(`Aegis Order status updated`, {
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
    logError(error, { context: 'update_aegis_order_status_admin' });
    res.status(500).json({ success: false, error: 'Failed to update Aegis order status' });
  }
};

/**
 * Get Aegis Order statistics (admin only)
 * GET /api/admin/aegis-orders/stats
 */
export const getAegisOrderStats = async (req, res) => {
  try {
    const [
      totalOrders,
      awaitingPayment,
      paid,
      fulfilled,
      cancelled,
      refunded
    ] = await Promise.all([
      AegisOrder.countDocuments(),
      AegisOrder.countDocuments({ orderStatus: 'Awaiting_Payment' }),
      AegisOrder.countDocuments({ orderStatus: 'Paid' }),
      AegisOrder.countDocuments({ orderStatus: 'Fulfilled' }),
      AegisOrder.countDocuments({ orderStatus: 'Cancelled' }),
      AegisOrder.countDocuments({ orderStatus: 'Refunded' })
    ]);

    // Revenue from completed payments, net of refunds
    const [paidOrders, refundedOrders] = await Promise.all([
      AegisOrder.find({ paymentStatus: 'Completed' }).select('amountGbp').lean(),
      AegisOrder.find({ paymentStatus: 'Refunded' }).select('amountGbp').lean()
    ]);
    const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.amountGbp || 0), 0);
    const netRevenue = totalRevenue - refundedOrders.reduce((sum, order) => sum + (order.amountGbp || 0), 0);

    res.json({
      success: true,
      data: {
        totalOrders,
        awaitingPayment,
        paid,
        fulfilled,
        cancelled,
        refunded,
        totalRevenue: round2(totalRevenue),
        netRevenue: round2(netRevenue)
      }
    });

  } catch (error) {
    logError(error, { context: 'get_aegis_order_stats_admin' });
    res.status(500).json({ success: false, error: 'Failed to fetch Aegis order statistics' });
  }
};

/**
 * Refund an Aegis Order (full amount only, admin only)
 * POST /api/admin/aegis-orders/:id/refund
 *
 * The amount is SERVER-COMPUTED (the full £99) — the client never supplies
 * money. Two-phase commit mirrors the flash flow: a durable 'pending' claim
 * is written before the PayPal call, the gateway refund runs outside the
 * transaction, then the order is finalised. Once the licence is Fulfilled
 * the refund is refused (409).
 */
export const refundAegisOrder = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, error: 'Invalid Aegis Order ID format' });
  }
  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    return res.status(400).json({ success: false, error: 'A refund reason is required' });
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

    order = await AegisOrder.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'Aegis Order not found' });
    }

    if (order.paymentStatus === 'Refunded') {
      await session.abortTransaction();
      return res.status(409).json({ success: false, error: 'This Aegis Order has already been refunded' });
    }
    if (order.paymentStatus !== 'Completed') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: `Cannot refund an order with payment status: ${order.paymentStatus}` });
    }

    if (order.orderStatus === 'Fulfilled') {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        error: 'Not refundable: the licence has already been delivered. Refund manually via PayPal if you choose to make an exception, then record it against the order.'
      });
    }
    if (!REFUNDABLE_STATUSES.includes(order.orderStatus)) {
      await session.abortTransaction();
      return res.status(409).json({ success: false, error: `Not refundable from status: ${order.orderStatus}` });
    }

    captureId = order.paymentDetails?.paypalTransactionId;
    if (!captureId) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'No PayPal capture found for this order. Issue the refund manually in the PayPal dashboard, then record it against the order.'
      });
    }

    refundAmount = round2(order.amountGbp || 0);
    if (refundAmount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, error: 'Computed refund amount is not positive' });
    }
    refundRequestId = `aegis_refund_${order._id}_${Date.now()}`;

    // Atomic claim: only one pending refund may exist — a concurrent request
    // fails here instead of double-refunding at the gateway.
    const claimed = await AegisOrder.findOneAndUpdate(
      { _id: order._id, paymentStatus: 'Completed', 'refundHistory.status': { $ne: 'pending' } },
      {
        $push: {
          refundHistory: {
            refundId: `pending_${Date.now()}`,
            amount: refundAmount,
            date: new Date(),
            reason: reason.trim(),
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
    logError(error, { context: 'aegis_refund_claim' });
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
      await AegisOrder.updateOne(
        { _id: id, 'refundHistory.status': 'pending' },
        { $set: { 'refundHistory.$.status': 'failed' } }
      );
    } catch (markError) {
      logError(markError, { context: 'aegis_refund_claim_mark_failed' });
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
    logError(paypalError, { context: 'aegis_refund_paypal' });
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

    const finalOrder = await AegisOrder.findById(id).session(session);
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

    logger.info('Aegis Order refunded', {
      orderId: finalOrder._id,
      orderNumber: finalOrder.orderNumber,
      amount: refundAmount,
      refundId: gatewayRefund.id || refundRequestId
    });

    // Customer email — never fails the refund
    try {
      await emailService.sendAegisRefundEmail(finalOrder, claim || { amount: refundAmount, reason: reason.trim(), refundId: gatewayRefund.id || refundRequestId });
    } catch (emailError) {
      logError(emailError, { context: 'aegis_refund_email' });
    }

    return res.json({
      success: true,
      message: `Refund of £${refundAmount.toFixed(2)} processed successfully`,
      data: { order: finalOrder, refund: claim || null }
    });

  } catch (error) {
    logError(error, { context: 'aegis_refund_finalise' });
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
