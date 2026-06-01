import FlashOrder from '../models/FlashOrder.js';
import logger, { logError } from '../utils/logger.js';

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
    const { orderStatus, paymentStatus, note } = req.body;

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
      order.poBoxAddress = {
        street: 'PO Box 12345',
        city: 'London',
        postalCode: 'E1 6AN',
        country: 'United Kingdom',
        instructions: 'Include your order number on the package. Wrap device in bubble wrap and use a sturdy box.'
      };
    }

    await order.save();

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
