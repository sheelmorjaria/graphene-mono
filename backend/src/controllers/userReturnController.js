import ReturnRequest from '../models/ReturnRequest.js';
import Order from '../models/Order.js';
import emailService from '../services/emailService.js';
import mongoose from 'mongoose';

// Get user's return requests with pagination
export const getUserReturnRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Parse pagination and sorting parameters
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 return requests per page
    const sortBy = req.query.sortBy || 'requestDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const status = req.query.status;

    // Validate sortBy parameter to prevent injection
    const allowedSortFields = ['requestDate', 'status', 'totalRefundAmount', 'returnRequestNumber'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'requestDate';

    // Build filter
    const filter = { userId };
    if (status) {
      filter.status = status;
    }

    // Get return requests with pagination
    const returnRequests = await ReturnRequest.find(filter)
      .populate('orderId', 'orderNumber orderDate')
      .sort({ [validSortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    // Get total count for pagination
    const total = await ReturnRequest.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    // Format response
    const formattedReturnRequests = returnRequests.map(returnRequest => ({
      id: returnRequest._id,
      returnRequestNumber: returnRequest.returnRequestNumber,
      formattedRequestNumber: returnRequest.formattedRequestNumber,
      orderNumber: returnRequest.orderNumber,
      orderId: returnRequest.orderId?._id,
      status: returnRequest.status,
      formattedStatus: returnRequest.getFormattedStatus(),
      totalRefundAmount: returnRequest.totalRefundAmount,
      totalItemsCount: returnRequest.totalItemsCount,
      requestDate: returnRequest.requestDate,
      createdAt: returnRequest.createdAt,
      updatedAt: returnRequest.updatedAt
    }));

    res.json({
      success: true,
      data: formattedReturnRequests,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    });

  } catch (error) {
    console.error('Get return requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while fetching return requests'
    });
  }
};

// Get detailed information for a specific return request
export const getReturnRequestDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const { returnRequestId } = req.params;

    // Validate returnRequestId
    if (!mongoose.Types.ObjectId.isValid(returnRequestId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid return request ID'
      });
    }

    // Find the return request and verify ownership
    const returnRequest = await ReturnRequest.findOne({
      _id: returnRequestId,
      userId
    }).populate('orderId', 'orderNumber orderDate deliveryDate shippingAddress');

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        error: 'Return request not found'
      });
    }

    // Format response
    const formattedReturnRequest = {
      id: returnRequest._id,
      returnRequestNumber: returnRequest.returnRequestNumber,
      formattedRequestNumber: returnRequest.formattedRequestNumber,
      orderNumber: returnRequest.orderNumber,
      orderId: returnRequest.orderId?._id,
      status: returnRequest.status,
      formattedStatus: returnRequest.getFormattedStatus(),
      totalRefundAmount: returnRequest.totalRefundAmount,
      totalItemsCount: returnRequest.totalItemsCount,
      requestDate: returnRequest.requestDate,
      approvedDate: returnRequest.approvedDate,
      itemReceivedDate: returnRequest.itemReceivedDate,
      refundProcessedDate: returnRequest.refundProcessedDate,
      items: returnRequest.items,
      images: returnRequest.images,
      returnShippingAddress: returnRequest.returnShippingAddress,
      adminNotes: returnRequest.adminNotes,
      refundId: returnRequest.refundId,
      refundStatus: returnRequest.refundStatus,
      returnWindow: returnRequest.returnWindow,
      isWithinReturnWindow: returnRequest.isWithinReturnWindow,
      order: returnRequest.orderId,
      createdAt: returnRequest.createdAt,
      updatedAt: returnRequest.updatedAt
    };

    res.json({
      success: true,
      data: {
        returnRequest: formattedReturnRequest
      }
    });

  } catch (error) {
    console.error('Get return request details error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while fetching return request details'
    });
  }
};

// Submit a return request
export const submitReturnRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { orderId, items, images = [] } = req.body;

    // Validate required fields
    if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Order ID and items are required'
      });
    }

    // Validate orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID'
      });
    }

    // Find the order and verify ownership
    const order = await Order.findOne({
      _id: orderId,
      customerEmail: req.user.email
    }).session(session);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Re-verify order eligibility (security check)
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Only delivered orders are eligible for returns'
      });
    }

    if (!order.deliveryDate) {
      return res.status(400).json({
        success: false,
        error: 'Unable to determine delivery date for this order'
      });
    }

    // Check return window
    const returnWindow = 30;
    const deliveryDate = new Date(order.deliveryDate);
    const returnWindowEnd = new Date(deliveryDate);
    returnWindowEnd.setDate(returnWindowEnd.getDate() + returnWindow);

    if (new Date() > returnWindowEnd) {
      return res.status(400).json({
        success: false,
        error: 'The 30-day return window has expired for this order'
      });
    }

    if (order.hasReturnRequest) {
      return res.status(400).json({
        success: false,
        error: 'A return request has already been submitted for this order'
      });
    }

    // Validate return items
    const validatedItems = [];
    for (const returnItem of items) {
      const { productId, quantity, reason, reasonDescription = '' } = returnItem;

      // Find the item in the original order
      const orderItem = order.items.find(item => 
        item.productId.toString() === productId
      );

      if (!orderItem) {
        return res.status(400).json({
          success: false,
          error: `Product ${productId} not found in this order`
        });
      }

      // Validate quantity
      if (!quantity || quantity < 1 || quantity > orderItem.quantity) {
        return res.status(400).json({
          success: false,
          error: `Invalid quantity for product ${orderItem.productName}`
        });
      }

      // Validate reason
      const validReasons = [
        'damaged_received', 'wrong_item_sent', 'not_as_described',
        'changed_mind', 'wrong_size', 'quality_issues', 'defective_item', 'other'
      ];
      if (!reason || !validReasons.includes(reason)) {
        return res.status(400).json({
          success: false,
          error: `Invalid return reason for product ${orderItem.productName}`
        });
      }

      validatedItems.push({
        productId: orderItem.productId,
        productName: orderItem.productName,
        productSlug: orderItem.productSlug,
        quantity: parseInt(quantity),
        unitPrice: orderItem.unitPrice,
        totalRefundAmount: orderItem.unitPrice * parseInt(quantity),
        reason,
        reasonDescription: reasonDescription.substring(0, 500) // Limit description length
      });
    }

    // Create return request
    const returnRequest = new ReturnRequest({
      orderId: order._id,
      orderNumber: order.orderNumber,
      userId,
      customerEmail: req.user.email,
      items: validatedItems,
      images: images.map(img => ({
        url: img.url || '',
        description: img.description || ''
      })),
      returnWindow,
      isWithinReturnWindow: true
    });

    await returnRequest.save({ session });

    // Update order to indicate it has a return request
    order.hasReturnRequest = true;
    order.returnRequestIds.push(returnRequest._id);
    await order.save({ session });

    await session.commitTransaction();

    // Send return request confirmation email
    try {
      await emailService.sendReturnRequestConfirmationEmail(returnRequest, order);
    } catch (emailError) {
      console.error('Failed to send return request confirmation email:', emailError);
      // Don't fail the entire operation if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Return request submitted successfully',
      data: {
        returnRequestId: returnRequest._id,
        returnRequestNumber: returnRequest.returnRequestNumber,
        formattedRequestNumber: returnRequest.formattedRequestNumber,
        status: returnRequest.status,
        totalRefundAmount: returnRequest.totalRefundAmount,
        totalItemsCount: returnRequest.totalItemsCount
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Submit return request error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid return request data: ' + error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error occurred while submitting return request'
    });
  } finally {
    session.endSession();
  }
};