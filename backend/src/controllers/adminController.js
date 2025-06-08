import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import ReturnRequest from '../models/ReturnRequest.js';
import Category from '../models/Category.js';
import emailService from '../services/emailService.js';

// Admin login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    // Check if user account is disabled or inactive
    if (user.accountStatus === 'disabled' || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account has been deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' } // 8 hours for admin sessions
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          lastLoginAt: user.lastLoginAt
        },
        token
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
};

// Get dashboard metrics
export const getDashboardMetrics = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.setDate(now.getDate() - 7));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Reset now for subsequent calculations
    const currentDate = new Date();

    // Get order metrics
    const [
      totalOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      pendingOrders,
      awaitingShipmentOrders,
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      newCustomersToday,
      newCustomersWeek,
      newCustomersMonth
    ] = await Promise.all([
      // Total orders
      Order.countDocuments({}),
      
      // Today's orders
      Order.countDocuments({
        createdAt: { $gte: today }
      }),
      
      // This week's orders
      Order.countDocuments({
        createdAt: { $gte: thisWeek }
      }),
      
      // This month's orders
      Order.countDocuments({
        createdAt: { $gte: thisMonth }
      }),
      
      // Pending orders
      Order.countDocuments({
        status: { $in: ['pending', 'processing'] }
      }),
      
      // Orders awaiting shipment
      Order.countDocuments({
        status: 'awaiting_shipment'
      }),
      
      // Total revenue
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // Today's revenue
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: today },
            status: { $ne: 'cancelled' }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // This week's revenue
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: thisWeek },
            status: { $ne: 'cancelled' }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // This month's revenue
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: thisMonth },
            status: { $ne: 'cancelled' }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // New customers today
      User.countDocuments({
        role: 'customer',
        createdAt: { $gte: today }
      }),
      
      // New customers this week
      User.countDocuments({
        role: 'customer',
        createdAt: { $gte: thisWeek }
      }),
      
      // New customers this month
      User.countDocuments({
        role: 'customer',
        createdAt: { $gte: thisMonth }
      })
    ]);

    // Format the response
    const metrics = {
      orders: {
        total: totalOrders,
        today: todayOrders,
        week: weekOrders,
        month: monthOrders,
        pending: pendingOrders,
        awaitingShipment: awaitingShipmentOrders
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        today: todayRevenue[0]?.total || 0,
        week: weekRevenue[0]?.total || 0,
        month: monthRevenue[0]?.total || 0
      },
      customers: {
        newToday: newCustomersToday,
        newWeek: newCustomersWeek,
        newMonth: newCustomersMonth
      },
      lastUpdated: currentDate
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching dashboard metrics'
    });
  }
};

// Get admin profile
export const getAdminProfile = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching admin profile'
    });
  }
};

// Get single order details (admin only)
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate orderId
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    // Build aggregation pipeline to get comprehensive order details
    const pipeline = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(orderId)
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $addFields: {
          items: {
            $map: {
              input: '$items',
              as: 'item',
              in: {
                $mergeObjects: [
                  '$$item',
                  {
                    productDetails: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$productDetails',
                            cond: { $eq: ['$$this._id', '$$item.productId'] }
                          }
                        },
                        0
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          orderNumber: 1,
          status: 1,
          statusHistory: 1,
          totalAmount: 1,
          subtotalAmount: 1,
          shippingCost: 1,
          taxAmount: 1,
          discountAmount: 1,
          createdAt: 1,
          updatedAt: 1,
          paymentMethod: 1,
          paymentStatus: 1,
          paymentIntentId: 1,
          shippingAddress: 1,
          billingAddress: 1,
          shippingMethod: 1,
          trackingNumber: 1,
          trackingUrl: 1,
          items: {
            $map: {
              input: '$items',
              as: 'item',
              in: {
                _id: '$$item._id',
                productId: '$$item.productId',
                name: '$$item.name',
                slug: '$$item.slug',
                price: '$$item.price',
                quantity: '$$item.quantity',
                image: '$$item.image',
                lineTotal: '$$item.lineTotal',
                productDetails: {
                  currentName: '$$item.productDetails.name',
                  currentSlug: '$$item.productDetails.slug',
                  currentImage: '$$item.productDetails.image',
                  currentPrice: '$$item.productDetails.price'
                }
              }
            }
          },
          customer: {
            _id: '$customer._id',
            firstName: '$customer.firstName',
            lastName: '$customer.lastName',
            email: '$customer.email',
            phone: '$customer.phone'
          },
          refundStatus: 1,
          refundHistory: 1,
          notes: 1
        }
      }
    ];

    // Execute the query
    const orderResult = await Order.aggregate(pipeline);
    
    if (!orderResult || orderResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const order = orderResult[0];

    res.json({
      success: true,
      data: {
        order
      }
    });

  } catch (error) {
    console.error('Get order by ID error:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError' || error.message.includes('ObjectId')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while fetching order details'
    });
  }
};

// Get all orders (admin only)
export const getAllOrders = async (req, res) => {
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

    // Build filter object
    const filter = {};

    // Filter by status
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999); // End of day
        filter.createdAt.$lte = endDateTime;
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Create aggregation pipeline
    let pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    // Filter by customer name/email if provided
    if (customerQuery) {
      pipeline.push({
        $match: {
          $or: [
            { 'customer.firstName': { $regex: customerQuery, $options: 'i' } },
            { 'customer.lastName': { $regex: customerQuery, $options: 'i' } },
            { 'customer.email': { $regex: customerQuery, $options: 'i' } },
            {
              $expr: {
                $regexMatch: {
                  input: { $concat: ['$customer.firstName', ' ', '$customer.lastName'] },
                  regex: customerQuery,
                  options: 'i'
                }
              }
            }
          ]
        }
      });
    }

    // Add sorting and pagination
    pipeline.push({ $sort: sort });

    // Get total count for pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Order.aggregate(countPipeline);
    const totalOrders = countResult[0]?.total || 0;

    // Add pagination to main pipeline
    pipeline.push(
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    // Add projection to format the response
    pipeline.push({
      $project: {
        _id: 1,
        orderNumber: 1,
        status: 1,
        totalAmount: 1,
        createdAt: 1,
        updatedAt: 1,
        paymentMethod: 1,
        shippingAddress: 1,
        items: 1,
        customer: {
          _id: '$customer._id',
          firstName: '$customer.firstName',
          lastName: '$customer.lastName',
          email: '$customer.email'
        }
      }
    });

    // Execute the query
    const orders = await Order.aggregate(pipeline);

    // Calculate pagination info
    const totalPages = Math.ceil(totalOrders / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching orders'
    });
  }
};

// Status transition validation
const getValidStatusTransitions = () => {
  return {
    'pending': ['processing', 'cancelled'],
    'processing': ['awaiting_shipment', 'shipped', 'cancelled'],
    'awaiting_shipment': ['shipped', 'cancelled'],
    'shipped': ['delivered', 'cancelled'],
    'delivered': ['refunded'],
    'cancelled': [],
    'refunded': []
  };
};

const isValidStatusTransition = (currentStatus, newStatus) => {
  const transitions = getValidStatusTransitions();
  return transitions[currentStatus]?.includes(newStatus) || false;
};

// Update order status (admin only)
export const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    const { orderId } = req.params;
    const { newStatus, trackingNumber, trackingUrl } = req.body;

    // Validate input
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        error: 'New status is required'
      });
    }

    // Validate orderId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }

    await session.withTransaction(async () => {
      // Find the order
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        throw new Error('Order not found');
      }

      // Validate status transition
      if (!isValidStatusTransition(order.status, newStatus)) {
        throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
      }

      // If status is 'shipped', validate tracking information
      if (newStatus === 'shipped') {
        if (!trackingNumber || !trackingUrl) {
          throw new Error('Tracking number and tracking URL are required for shipped status');
        }
        
        // Update tracking information
        order.trackingNumber = trackingNumber.trim();
        order.trackingUrl = trackingUrl.trim();
      }

      // If status is 'cancelled', handle stock restoration and refund
      if (newStatus === 'cancelled') {
        // Restore stock for each item
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stockQuantity: item.quantity } },
            { session }
          );
        }

        // TODO: Implement refund logic here
        // This would depend on the payment method used
        console.log(`TODO: Initiate refund for order ${order.orderNumber}`);
      }

      // Store old status for history
      const oldStatus = order.status;

      // Update order status
      order.status = newStatus;

      // Add to status history
      if (!order.statusHistory) {
        order.statusHistory = [];
      }

      order.statusHistory.push({
        status: newStatus,
        timestamp: new Date(),
        updatedBy: req.user._id,
        notes: `Status changed from ${oldStatus} to ${newStatus} by admin`
      });

      // Save the order
      await order.save({ session });
    });

    // Fetch updated order with full details for email
    const orderForEmail = await Order.findById(orderId)
      .populate('userId', 'firstName lastName email')
      .lean();

    // Send email notification based on status
    try {
      if (newStatus === 'shipped') {
        await emailService.sendOrderShippedEmail(orderForEmail);
      } else if (newStatus === 'delivered') {
        await emailService.sendOrderDeliveredEmail(orderForEmail);
      } else if (['processing', 'awaiting_shipment', 'cancelled', 'refunded'].includes(newStatus)) {
        const oldStatus = orderForEmail.statusHistory[orderForEmail.statusHistory.length - 2]?.status || 'unknown';
        await emailService.sendOrderStatusUpdateEmail(orderForEmail, newStatus, oldStatus);
      }
    } catch (emailError) {
      console.error('Error sending status update email:', emailError);
      // Don't fail the status update if email fails
    }

    res.json({
      success: true,
      message: `Order status updated to ${newStatus}`,
      data: {
        order: orderForEmail
      }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    
    // Handle specific error types
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Invalid status transition') || 
        error.message.includes('required')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while updating order status'
    });
  } finally {
    await session.endSession();
  }
};

// Issue refund for an order
export const issueRefund = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const { refundAmount, refundReason } = req.body;
    const adminId = req.user._id;

    // Validate input
    if (!refundAmount || !refundReason) {
      return res.status(400).json({
        success: false,
        error: 'Refund amount and reason are required'
      });
    }

    if (typeof refundAmount !== 'number' || refundAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Refund amount must be a positive number'
      });
    }

    if (typeof refundReason !== 'string' || refundReason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Refund reason is required'
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }

    // Find the order
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if order is eligible for refund
    if (order.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot refund order with payment status: ' + order.paymentStatus
      });
    }

    // Calculate maximum refundable amount using the model method
    const maxRefundable = order.getMaxRefundableAmount();
    if (refundAmount > maxRefundable) {
      return res.status(400).json({
        success: false,
        error: `Refund amount (£${refundAmount.toFixed(2)}) exceeds maximum refundable amount (£${maxRefundable.toFixed(2)})`
      });
    }

    // Generate refund ID (in a real system, this would come from payment gateway)
    const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add refund to history
    const refundEntry = {
      refundId: refundId,
      amount: refundAmount,
      date: new Date(),
      reason: refundReason.trim(),
      adminUserId: adminId,
      status: 'succeeded' // In real system, this would be 'pending' initially
    };

    order.refundHistory.push(refundEntry);

    // Update refund status and amount
    const newTotalRefunded = (order.totalRefundedAmount || 0) + refundAmount;
    order.totalRefundedAmount = newTotalRefunded;
    
    if (newTotalRefunded >= order.totalAmount) {
      order.refundStatus = 'fully_refunded';
      order.paymentStatus = 'refunded';
      // Update order status to refunded if fully refunded
      if (order.status !== 'refunded') {
        order.status = 'refunded';
        order.statusHistory.push({
          status: 'refunded',
          timestamp: new Date(),
          updatedBy: adminId,
          notes: `Order fully refunded - £${refundAmount.toFixed(2)}: ${refundReason}`
        });
      }
    } else {
      order.refundStatus = 'partial_refunded';
    }

    // Save the order
    await order.save({ session });

    // Commit transaction
    await session.commitTransaction();

    // Fetch updated order for response
    const updatedOrder = await Order.findById(orderId)
      .populate('userId', 'firstName lastName email')
      .populate('refundHistory.adminUserId', 'firstName lastName email')
      .lean();

    // Send refund confirmation email
    try {
      await emailService.sendRefundConfirmationEmail(updatedOrder, refundEntry);
    } catch (emailError) {
      console.error('Error sending refund confirmation email:', emailError);
      // Don't fail the refund if email fails
    }

    res.json({
      success: true,
      message: `Refund of £${refundAmount.toFixed(2)} processed successfully`,
      data: {
        order: updatedOrder,
        refund: refundEntry
      }
    });

  } catch (error) {
    console.error('Issue refund error:', error);
    await session.abortTransaction();
    
    // Handle specific error types
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('refund amount') || 
        error.message.includes('required') ||
        error.message.includes('payment status')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while processing refund'
    });
  } finally {
    await session.endSession();
  }
};

// Get all return requests (admin only)
export const getAllReturnRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      customerQuery,
      startDate,
      endDate,
      sortBy = 'requestDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    // Filter by status
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.requestDate = {};
      if (startDate) {
        filter.requestDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999); // End of day
        filter.requestDate.$lte = endDateTime;
      }
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Create aggregation pipeline
    let pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order'
        }
      },
      {
        $unwind: {
          path: '$order',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    // Filter by customer name/email if provided
    if (customerQuery) {
      pipeline.push({
        $match: {
          $or: [
            { 'customer.firstName': { $regex: customerQuery, $options: 'i' } },
            { 'customer.lastName': { $regex: customerQuery, $options: 'i' } },
            { 'customer.email': { $regex: customerQuery, $options: 'i' } },
            {
              $expr: {
                $regexMatch: {
                  input: { $concat: ['$customer.firstName', ' ', '$customer.lastName'] },
                  regex: customerQuery,
                  options: 'i'
                }
              }
            }
          ]
        }
      });
    }

    // Add sorting and pagination
    pipeline.push({ $sort: sort });

    // Get total count for pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await ReturnRequest.aggregate(countPipeline);
    const totalReturnRequests = countResult[0]?.total || 0;

    // Add pagination to main pipeline
    pipeline.push(
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    // Add projection to format the response
    pipeline.push({
      $project: {
        _id: 1,
        returnRequestNumber: 1,
        status: 1,
        requestDate: 1,
        totalRefundAmount: 1,
        totalItemsCount: { $size: '$items' },
        customer: {
          _id: '$customer._id',
          firstName: '$customer.firstName',
          lastName: '$customer.lastName',
          email: '$customer.email'
        },
        order: {
          _id: '$order._id',
          orderNumber: '$order.orderNumber'
        }
      }
    });

    // Execute the query
    const returnRequests = await ReturnRequest.aggregate(pipeline);

    // Calculate pagination info
    const totalPages = Math.ceil(totalReturnRequests / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        returnRequests,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalReturnRequests,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all return requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching return requests'
    });
  }
};

// Get single return request details (admin only)
export const getReturnRequestById = async (req, res) => {
  try {
    const { returnRequestId } = req.params;

    // Validate returnRequestId
    if (!returnRequestId) {
      return res.status(400).json({
        success: false,
        error: 'Return request ID is required'
      });
    }

    // Validate returnRequestId format
    if (!mongoose.Types.ObjectId.isValid(returnRequestId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid return request ID format'
      });
    }

    // Build aggregation pipeline to get comprehensive return request details
    const pipeline = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(returnRequestId)
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order'
        }
      },
      {
        $unwind: {
          path: '$order',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'processedBy',
          foreignField: '_id',
          as: 'processedByUser'
        }
      },
      {
        $unwind: {
          path: '$processedByUser',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          returnRequestNumber: 1,
          status: 1,
          requestDate: 1,
          approvedDate: 1,
          itemReceivedDate: 1,
          refundProcessedDate: 1,
          totalRefundAmount: 1,
          items: 1,
          images: 1,
          returnShippingAddress: 1,
          adminNotes: 1,
          refundId: 1,
          refundStatus: 1,
          returnWindow: 1,
          isWithinReturnWindow: 1,
          createdAt: 1,
          updatedAt: 1,
          customer: {
            _id: '$customer._id',
            firstName: '$customer.firstName',
            lastName: '$customer.lastName',
            email: '$customer.email',
            phone: '$customer.phone'
          },
          order: {
            _id: '$order._id',
            orderNumber: '$order.orderNumber',
            createdAt: '$order.createdAt',
            totalAmount: '$order.totalAmount',
            status: '$order.status'
          },
          processedBy: {
            _id: '$processedByUser._id',
            firstName: '$processedByUser.firstName',
            lastName: '$processedByUser.lastName',
            email: '$processedByUser.email'
          }
        }
      }
    ];

    // Execute the query
    const returnRequestResult = await ReturnRequest.aggregate(pipeline);
    
    if (!returnRequestResult || returnRequestResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Return request not found'
      });
    }

    const returnRequest = returnRequestResult[0];

    res.json({
      success: true,
      data: {
        returnRequest
      }
    });

  } catch (error) {
    console.error('Get return request by ID error:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError' || error.message.includes('ObjectId')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid return request ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while fetching return request details'
    });
  }
};

// Update return request status (admin only)
export const updateReturnRequestStatus = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    const { returnRequestId } = req.params;
    const { newStatus, rejectionReason, adminNotes } = req.body;
    const adminId = req.user._id;

    // Validate input
    if (!returnRequestId) {
      return res.status(400).json({
        success: false,
        error: 'Return request ID is required'
      });
    }

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        error: 'New status is required'
      });
    }

    // Validate returnRequestId format
    if (!mongoose.Types.ObjectId.isValid(returnRequestId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid return request ID format'
      });
    }

    // Validate status value
    const validStatuses = ['pending_review', 'approved', 'rejected', 'item_received', 'processing_refund', 'refunded', 'closed'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    // If status is 'rejected', rejection reason is required
    if (newStatus === 'rejected' && (!rejectionReason || rejectionReason.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required when rejecting a return request'
      });
    }

    await session.withTransaction(async () => {
      // Find the return request
      const returnRequest = await ReturnRequest.findById(returnRequestId).session(session);
      if (!returnRequest) {
        throw new Error('Return request not found');
      }

      // Store old status
      const oldStatus = returnRequest.status;

      // Update return request status
      returnRequest.status = newStatus;
      returnRequest.processedBy = adminId;

      // Set timestamps based on status
      if (newStatus === 'approved' && !returnRequest.approvedDate) {
        returnRequest.approvedDate = new Date();
      } else if (newStatus === 'item_received' && !returnRequest.itemReceivedDate) {
        returnRequest.itemReceivedDate = new Date();
      } else if (newStatus === 'refunded' && !returnRequest.refundProcessedDate) {
        returnRequest.refundProcessedDate = new Date();
      }

      // Update admin notes if provided
      if (adminNotes) {
        const currentTime = new Date().toISOString();
        const adminNote = `[${currentTime}] Status changed to ${newStatus}: ${adminNotes}`;
        returnRequest.adminNotes = returnRequest.adminNotes 
          ? `${returnRequest.adminNotes}\n\n${adminNote}`
          : adminNote;
      }

      // If rejected, add rejection reason to admin notes
      if (newStatus === 'rejected' && rejectionReason) {
        const currentTime = new Date().toISOString();
        const rejectionNote = `[${currentTime}] Rejection reason: ${rejectionReason}`;
        returnRequest.adminNotes = returnRequest.adminNotes 
          ? `${returnRequest.adminNotes}\n\n${rejectionNote}`
          : rejectionNote;
      }

      // Save the return request
      await returnRequest.save({ session });
    });

    // Fetch updated return request with full details for email
    const returnRequestForEmail = await ReturnRequest.findById(returnRequestId)
      .populate('userId', 'firstName lastName email')
      .populate('orderId', 'orderNumber totalAmount')
      .lean();

    // Send email notification based on status
    try {
      if (newStatus === 'approved') {
        await emailService.sendReturnApprovedEmail(returnRequestForEmail);
      } else if (newStatus === 'rejected') {
        await emailService.sendReturnRejectedEmail(returnRequestForEmail, rejectionReason);
      } else if (newStatus === 'refunded') {
        await emailService.sendReturnRefundedEmail(returnRequestForEmail);
      }
    } catch (emailError) {
      console.error('Error sending return status update email:', emailError);
      // Don't fail the status update if email fails
    }

    res.json({
      success: true,
      message: `Return request status updated to ${newStatus}`,
      data: {
        returnRequest: returnRequestForEmail
      }
    });

  } catch (error) {
    console.error('Update return request status error:', error);
    
    // Handle specific error types
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('required') || 
        error.message.includes('Invalid')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while updating return request status'
    });
  } finally {
    await session.endSession();
  }
};

// Get all products with filtering, searching, sorting, and pagination
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      searchQuery = '',
      category = '',
      status = '',
      minPrice = '',
      maxPrice = '',
      stockStatus = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    // Search by name or SKU
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { sku: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by status - exclude archived by default unless specifically requested
    if (status) {
      query.status = status;
    } else {
      // By default, exclude archived products
      query.status = { $ne: 'archived' };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Filter by stock status
    if (stockStatus) {
      switch (stockStatus) {
        case 'in_stock':
          query.stockQuantity = { $gt: 0 };
          break;
        case 'out_of_stock':
          query.stockQuantity = 0;
          break;
        case 'low_stock':
          // Define low stock threshold (e.g., less than 10)
          query.stockQuantity = { $gt: 0, $lte: 10 };
          break;
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('name sku price stockQuantity status category images createdAt updatedAt')
        .lean(),
      Product.countDocuments(query)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching products'
    });
  }
};

// Get single product by ID (for admin edit)
export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    // Fetch product with populated category
    const product = await Product.findById(productId)
      .populate('category', 'name slug')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: { product }
    });

  } catch (error) {
    console.error('Get product by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while fetching product'
    });
  }
};

// Create new product
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      sku,
      shortDescription,
      longDescription,
      price,
      salePrice,
      stockQuantity,
      lowStockThreshold,
      category,
      tags,
      status,
      condition,
      stockStatus
    } = req.body;

    // Validate required fields
    if (!name || !sku || !price || stockQuantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Name, SKU, price, and stock quantity are required'
      });
    }

    // Validate SKU uniqueness
    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        error: 'SKU already exists. Please use a unique SKU.'
      });
    }

    // Validate category if provided
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category ID'
        });
      }
    }

    // Generate slug if not provided
    let productSlug = slug;
    if (!productSlug) {
      productSlug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Ensure slug uniqueness
    let slugCounter = 1;
    let finalSlug = productSlug;
    while (await Product.findOne({ slug: finalSlug })) {
      finalSlug = `${productSlug}-${slugCounter}`;
      slugCounter++;
    }

    // Process tags if provided
    let processedTags = [];
    if (tags) {
      if (typeof tags === 'string') {
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (Array.isArray(tags)) {
        processedTags = tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
      }
    }

    // Create product data
    const productData = {
      name: name.trim(),
      slug: finalSlug,
      sku: sku.trim().toUpperCase(),
      shortDescription: shortDescription?.trim() || '',
      longDescription: longDescription?.trim() || '',
      price: parseFloat(price),
      stockQuantity: parseInt(stockQuantity),
      condition: condition || 'new',
      status: status || 'draft',
      tags: processedTags
    };

    // Add optional fields
    if (salePrice) productData.salePrice = parseFloat(salePrice);
    if (lowStockThreshold !== undefined) productData.lowStockThreshold = parseInt(lowStockThreshold);
    if (category) productData.category = category;
    if (stockStatus) productData.stockStatus = stockStatus;

    // Handle image uploads
    if (req.body.processedImages && req.body.processedImages.length > 0) {
      productData.images = req.body.processedImages;
    } else {
      productData.images = [];
    }

    // Create the product
    const product = new Product(productData);
    await product.save();

    // Populate category for response
    await product.populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product }
    });

  } catch (error) {
    console.error('Create product error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while creating product'
    });
  }
};

// Update existing product
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      name,
      slug,
      sku,
      shortDescription,
      longDescription,
      price,
      salePrice,
      stockQuantity,
      lowStockThreshold,
      category,
      tags,
      status,
      condition,
      stockStatus
    } = req.body;

    // Validate productId
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    // Find existing product
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Validate required fields
    if (!name || !sku || !price || stockQuantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Name, SKU, price, and stock quantity are required'
      });
    }

    // Validate SKU uniqueness (excluding current product)
    if (sku !== existingProduct.sku) {
      const duplicateProduct = await Product.findOne({ 
        sku, 
        _id: { $ne: productId } 
      });
      if (duplicateProduct) {
        return res.status(400).json({
          success: false,
          error: 'SKU already exists. Please use a unique SKU.'
        });
      }
    }

    // Validate category if provided
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category ID'
        });
      }
    }

    // Generate slug if changed
    let finalSlug = slug || existingProduct.slug;
    if (slug && slug !== existingProduct.slug) {
      // Ensure slug uniqueness
      let slugCounter = 1;
      let tempSlug = slug;
      while (await Product.findOne({ slug: tempSlug, _id: { $ne: productId } })) {
        tempSlug = `${slug}-${slugCounter}`;
        slugCounter++;
      }
      finalSlug = tempSlug;
    }

    // Process tags if provided
    let processedTags = existingProduct.tags || [];
    if (tags !== undefined) {
      processedTags = [];
      if (tags) {
        if (typeof tags === 'string') {
          processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        } else if (Array.isArray(tags)) {
          processedTags = tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
        }
      }
    }

    // Update product data
    const updateData = {
      name: name.trim(),
      slug: finalSlug,
      sku: sku.trim().toUpperCase(),
      shortDescription: shortDescription?.trim() || '',
      longDescription: longDescription?.trim() || '',
      price: parseFloat(price),
      stockQuantity: parseInt(stockQuantity),
      condition: condition || existingProduct.condition,
      status: status || existingProduct.status,
      tags: processedTags,
      updatedAt: new Date()
    };

    // Add optional fields
    if (salePrice !== undefined) {
      updateData.salePrice = salePrice ? parseFloat(salePrice) : null;
    }
    if (lowStockThreshold !== undefined) {
      updateData.lowStockThreshold = lowStockThreshold ? parseInt(lowStockThreshold) : null;
    }
    if (category !== undefined) {
      updateData.category = category || null;
    }
    if (stockStatus) {
      updateData.stockStatus = stockStatus;
    }

    // Handle image uploads
    if (req.body.processedImages && req.body.processedImages.length > 0) {
      // For updates, we can either replace all images or append new ones
      // For now, we'll replace all images with the new uploads
      updateData.images = req.body.processedImages;
    }

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    // Audit log (basic implementation)
    console.log(`Product ${productId} updated by admin user ${req.user.userId} at ${new Date()}`);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product: updatedProduct }
    });

  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while updating product'
    });
  }
};

// ===== Category Management Functions =====

// Get all categories
export const getCategories = async (req, res) => {
  try {
    // Fetch all categories with parent information
    const categories = await Category.find()
      .populate('parentId', 'name slug')
      .sort({ name: 1 })
      .lean();

    // Add product count for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Category.getProductCount(category._id);
        return {
          ...category,
          productCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        categories: categoriesWithCounts
      }
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching categories'
    });
  }
};

// Get single category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Category ID is required'
      });
    }

    const category = await Category.findById(categoryId)
      .populate('parentId', 'name slug')
      .lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Add product count
    const productCount = await Category.getProductCount(categoryId);

    res.json({
      success: true,
      data: {
        category: {
          ...category,
          productCount
        }
      }
    });

  } catch (error) {
    console.error('Get category by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while fetching category'
    });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const { name, slug, description, parentId } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    // Validate parent category if provided
    if (parentId) {
      const parentCategory = await Category.findById(parentId);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parent category ID'
        });
      }
    }

    // Generate slug if not provided or use provided slug
    let finalSlug = slug ? slug.trim() : await Category.generateSlug(name.trim());
    
    // Ensure slug uniqueness if provided
    if (slug && slug.trim()) {
      const existingCategory = await Category.findOne({ slug: finalSlug });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: 'Category slug already exists. Please use a unique slug.'
        });
      }
    }

    // Create category data
    const categoryData = {
      name: name.trim(),
      slug: finalSlug,
      description: description?.trim() || '',
      parentId: parentId || null
    };

    // Create the category
    const category = new Category(categoryData);
    await category.save();

    // Populate parent for response
    await category.populate('parentId', 'name slug');

    // Audit log
    console.log(`Category ${category._id} created by admin user ${req.user.userId} at ${new Date()}`);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category }
    });

  } catch (error) {
    console.error('Create category error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Category with this slug already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while creating category'
    });
  }
};

// Update existing category
export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, slug, description, parentId } = req.body;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Category ID is required'
      });
    }

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }

    // Check if category exists
    const existingCategory = await Category.findById(categoryId);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Validate parent category if provided
    if (parentId) {
      const parentCategory = await Category.findById(parentId);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parent category ID'
        });
      }

      // Check for circular dependency
      const hasCircularDep = await Category.checkCircularDependency(categoryId, parentId);
      if (hasCircularDep) {
        return res.status(400).json({
          success: false,
          error: 'Cannot set parent category: this would create a circular dependency'
        });
      }
    }

    // Handle slug
    let finalSlug = existingCategory.slug;
    if (slug !== undefined) {
      if (slug.trim()) {
        finalSlug = slug.trim();
        // Check slug uniqueness (excluding current category)
        const duplicateSlug = await Category.findOne({ 
          slug: finalSlug, 
          _id: { $ne: categoryId } 
        });
        if (duplicateSlug) {
          return res.status(400).json({
            success: false,
            error: 'Category slug already exists. Please use a unique slug.'
          });
        }
      } else {
        // Generate new slug from updated name
        finalSlug = await Category.generateSlug(name.trim(), categoryId);
      }
    }

    // Update category data
    const updateData = {
      name: name.trim(),
      slug: finalSlug,
      description: description !== undefined ? (description?.trim() || '') : existingCategory.description,
      parentId: parentId !== undefined ? (parentId || null) : existingCategory.parentId,
      updatedAt: new Date()
    };

    // Update the category
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      updateData,
      { new: true, runValidators: true }
    ).populate('parentId', 'name slug');

    // Audit log
    console.log(`Category ${categoryId} updated by admin user ${req.user.userId} at ${new Date()}`);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category: updatedCategory }
    });

  } catch (error) {
    console.error('Update category error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID format'
      });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Category with this slug already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while updating category'
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Category ID is required'
      });
    }

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Check for associated products
    const productCount = await Category.getProductCount(categoryId);
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category. It has ${productCount} associated product(s). Please reassign products to another category first.`
      });
    }

    // Check for child categories
    const childCategories = await Category.getChildren(categoryId);
    if (childCategories.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category. It has ${childCategories.length} child categor${childCategories.length === 1 ? 'y' : 'ies'}. Please reassign or delete child categories first.`
      });
    }

    // Delete the category
    await Category.findByIdAndDelete(categoryId);

    // Audit log
    console.log(`Category ${categoryId} (${category.name}) deleted by admin user ${req.user.userId} at ${new Date()}`);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while deleting category'
    });
  }
};

// ===== User Management Functions =====

// Get all users with filtering, searching, sorting, and pagination
export const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      searchQuery = '',
      accountStatus = '',
      emailVerified = '',
      role = '',
      startDate = '',
      endDate = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    // Search by name or email
    if (searchQuery) {
      query.$or = [
        { firstName: { $regex: searchQuery, $options: 'i' } },
        { lastName: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ['$firstName', ' ', '$lastName'] },
              regex: searchQuery,
              options: 'i'
            }
          }
        }
      ];
    }

    // Filter by account status
    if (accountStatus) {
      query.accountStatus = accountStatus;
    }

    // Filter by email verification status
    if (emailVerified) {
      query.emailVerified = emailVerified === 'true';
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by registration date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999); // End of day
        query.createdAt.$lte = endDateTime;
      }
    }

    // Calculate pagination with validation
    const validatedPage = Math.max(1, parseInt(page) || 1);
    const validatedLimit = Math.min(Math.max(1, parseInt(limit) || 20), 100); // Limit max to 100
    const skip = (validatedPage - 1) * validatedLimit;

    // Build sort object with validation
    const validSortFields = ['createdAt', 'firstName', 'lastName', 'email', 'accountStatus', 'emailVerified', 'role'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
    
    const sort = {};
    sort[safeSortBy] = safeSortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const [users, totalCount] = await Promise.all([
      User.find(query)
        .sort(sort)
        .skip(skip)
        .limit(validatedLimit)
        .select('-password -emailVerificationToken -passwordResetToken -__v')
        .lean(),
      User.countDocuments(query)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / validatedLimit);
    const hasNextPage = validatedPage < totalPages;
    const hasPrevPage = validatedPage > 1;

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: validatedPage,
          totalPages,
          totalUsers: totalCount,
          usersPerPage: validatedLimit,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching users'
    });
  }
};

// Get single user by ID (admin only)
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Fetch user excluding sensitive data
    const user = await User.findById(userId)
      .select('-password -emailVerificationToken -passwordResetToken -__v')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get additional user statistics
    const [orderCount, totalSpent] = await Promise.all([
      Order.countDocuments({ userId: userId }),
      Order.aggregate([
        { 
          $match: { 
            userId: new mongoose.Types.ObjectId(userId),
            status: { $ne: 'cancelled' }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    const userWithStats = {
      ...user,
      orderCount,
      totalSpent: totalSpent[0]?.total || 0
    };

    res.json({
      success: true,
      data: { user: userWithStats }
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while fetching user'
    });
  }
};

// Update user account status (admin only)
export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newStatus } = req.body;
    const adminId = req.user._id;

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Validate newStatus
    if (!newStatus) {
      return res.status(400).json({
        success: false,
        error: 'New status is required'
      });
    }

    if (!['active', 'disabled'].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "active" or "disabled"'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent admin from disabling themselves
    if (user._id.toString() === adminId.toString() && newStatus === 'disabled') {
      return res.status(400).json({
        success: false,
        error: 'Cannot disable your own account'
      });
    }

    // Check if status is already the same
    if (user.accountStatus === newStatus) {
      return res.status(400).json({
        success: false,
        error: `User account is already ${newStatus}`
      });
    }

    const oldStatus = user.accountStatus;

    // Update user status
    user.accountStatus = newStatus;
    await user.save();

    // Audit log
    console.log(`User ${userId} (${user.email}) status changed from ${oldStatus} to ${newStatus} by admin user ${adminId} at ${new Date()}`);

    // Send email notification
    try {
      const adminUser = await User.findById(adminId);
      
      if (newStatus === 'disabled') {
        await emailService.sendAccountDisabledEmail(user, adminUser);
      } else if (newStatus === 'active') {
        await emailService.sendAccountReEnabledEmail(user, adminUser);
      }
    } catch (emailError) {
      console.error('Error sending status change email:', emailError);
      // Don't fail the status update if email fails
    }

    res.json({
      success: true,
      message: `User account ${newStatus === 'disabled' ? 'disabled' : 'enabled'} successfully`,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          accountStatus: user.accountStatus,
          updatedAt: user.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while updating user status'
    });
  }
};

// Delete product (soft delete - archive)
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check if product is already archived
    if (product.isArchived()) {
      return res.status(400).json({
        success: false,
        error: 'Product is already archived'
      });
    }

    // Perform soft delete (archive the product)
    await product.softDelete();

    // Audit log
    console.log(`Product ${productId} (${product.name}) archived by admin user ${req.user.userId} at ${new Date()}`);

    res.json({
      success: true,
      message: 'Product archived successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error while archiving product'
    });
  }
};

// Sales Report
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include entire end date

    // Aggregate sales data
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$grandTotal' }
        }
      }
    ]);

    const result = salesData[0] || {
      totalRevenue: 0,
      orderCount: 0,
      averageOrderValue: 0
    };

    res.json({
      success: true,
      totalRevenue: result.totalRevenue,
      orderCount: result.orderCount,
      averageOrderValue: result.averageOrderValue
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while generating sales report'
    });
  }
};

// Product Performance Report
export const getProductPerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get top selling products
    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $ne: 'cancelled' }
        }
      },
      { $unwind: '$cartItems' },
      {
        $group: {
          _id: '$cartItems.product',
          quantitySold: { $sum: '$cartItems.quantity' },
          revenue: { $sum: { $multiply: ['$cartItems.price', '$cartItems.quantity'] } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $project: {
          _id: 1,
          name: '$productInfo.name',
          quantitySold: 1,
          revenue: 1
        }
      }
    ]);

    // Get low stock products
    const lowStockThreshold = 10;
    const lowStockProducts = await Product.find({
      stockQuantity: { $gt: 0, $lte: lowStockThreshold },
      isActive: true
    })
      .select('name sku stockQuantity')
      .sort({ stockQuantity: 1 })
      .limit(10);

    res.json({
      success: true,
      topProducts,
      lowStockProducts
    });
  } catch (error) {
    console.error('Get product performance report error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while generating product performance report'
    });
  }
};

// Customer Report
export const getCustomerReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Count new customers
    const newCustomerCount = await User.countDocuments({
      createdAt: { $gte: start, $lte: end },
      role: 'customer'
    });

    res.json({
      success: true,
      newCustomerCount
    });
  } catch (error) {
    console.error('Get customer report error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while generating customer report'
    });
  }
};

// Inventory Summary Report
export const getInventoryReport = async (req, res) => {
  try {
    const lowStockThreshold = 10;

    // Count products by stock status
    const [inStock, outOfStock, lowStock] = await Promise.all([
      Product.countDocuments({ stockQuantity: { $gt: lowStockThreshold }, isActive: true }),
      Product.countDocuments({ stockQuantity: 0, isActive: true }),
      Product.countDocuments({ stockQuantity: { $gt: 0, $lte: lowStockThreshold }, isActive: true })
    ]);

    // Get low stock products list
    const lowStockProducts = await Product.find({
      stockQuantity: { $gt: 0, $lte: lowStockThreshold },
      isActive: true
    })
      .select('name sku stockQuantity')
      .sort({ stockQuantity: 1 });

    res.json({
      success: true,
      inStockCount: inStock,
      outOfStockCount: outOfStock,
      lowStockCount: lowStock,
      lowStockProducts
    });
  } catch (error) {
    console.error('Get inventory report error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while generating inventory report'
    });
  }
};