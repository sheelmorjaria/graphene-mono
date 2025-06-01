import Order from '../models/Order.js';
import mongoose from 'mongoose';

// Update order status (Admin/Internal use only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, trackingUrl, note } = req.body;

    // Validate orderId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }

    // Validate required status field
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    // Validate status against enum values
    const validStatuses = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Update order fields
    const statusChanged = order.status !== status;
    order.status = status;

    // Update tracking information if provided
    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber;
    }
    if (trackingUrl !== undefined) {
      order.trackingUrl = trackingUrl;
    }

    // Save the order (this will trigger pre-save middleware)
    const updatedOrder = await order.save();

    // If a custom note was provided and status changed, update the latest status history entry
    if (statusChanged && note && updatedOrder.statusHistory.length > 0) {
      const latestEntry = updatedOrder.statusHistory[updatedOrder.statusHistory.length - 1];
      latestEntry.note = note;
      await updatedOrder.save();
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        order: {
          _id: updatedOrder._id,
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status,
          statusDisplay: updatedOrder.getStatusDisplay(),
          trackingNumber: updatedOrder.trackingNumber,
          trackingUrl: updatedOrder.trackingUrl,
          statusHistory: updatedOrder.statusHistory,
          updatedAt: updatedOrder.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: `Validation error: ${validationErrors.join(', ')}`
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get order details for internal use
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate orderId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }

    // Find the order with full details
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          userId: order.userId,
          customerEmail: order.customerEmail,
          status: order.status,
          statusDisplay: order.getStatusDisplay(),
          statusHistory: order.statusHistory,
          items: order.items,
          subtotal: order.subtotal,
          tax: order.tax,
          shipping: order.shipping,
          totalAmount: order.totalAmount,
          shippingAddress: order.shippingAddress,
          billingAddress: order.billingAddress,
          shippingMethod: order.shippingMethod,
          paymentMethod: order.paymentMethod,
          paymentDetails: order.paymentDetails,
          paymentStatus: order.paymentStatus,
          trackingNumber: order.trackingNumber || null,
          trackingUrl: order.trackingUrl || null,
          notes: order.notes,
          orderDate: order.orderDate,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get all orders with filtering and pagination (Admin use)
export const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      userId,
      orderNumber,
      sortBy = 'orderDate',
      sortOrder = 'desc'
    } = req.query;

    // Build query filter
    const filter = {};
    if (status) filter.status = status;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) filter.userId = userId;
    if (orderNumber) filter.orderNumber = { $regex: orderNumber, $options: 'i' };

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const maxLimit = Math.min(parseInt(limit), 100); // Cap at 100

    // Sort order
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(maxLimit)
        .select('orderNumber userId customerEmail status orderDate totalAmount trackingNumber'),
      Order.countDocuments(filter)
    ]);

    // Format orders for response
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      customerEmail: order.customerEmail,
      status: order.status,
      statusDisplay: order.getStatusDisplay(),
      orderDate: order.orderDate,
      totalAmount: order.totalAmount,
      trackingNumber: order.trackingNumber,
      hasTracking: !!order.trackingNumber
    }));

    // Pagination info
    const totalPages = Math.ceil(totalOrders / maxLimit);
    const pagination = {
      currentPage: parseInt(page),
      totalPages,
      totalOrders,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1,
      limit: maxLimit
    };

    res.status(200).json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination
      }
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};