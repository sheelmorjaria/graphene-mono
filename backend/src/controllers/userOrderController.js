import Order from '../models/Order.js';

// Get user's order history with pagination
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id; // Set by authentication middleware
    
    // Parse pagination and sorting parameters
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 orders per page
    const sortBy = req.query.sortBy || 'orderDate';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Validate sortBy parameter to prevent injection
    const allowedSortFields = ['orderDate', 'totalAmount', 'status', 'orderNumber'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'orderDate';

    // Get orders with pagination
    const orders = await Order.findByUser(userId, {
      page,
      limit,
      sortBy: validSortBy,
      sortOrder
    });

    // Get total count for pagination
    const totalOrders = await Order.countByUser(userId);
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      success: true,
      data: {
        orders: orders.map(order => ({
          _id: order._id,
          orderNumber: order.orderNumber,
          orderDate: order.orderDate,
          totalAmount: order.totalAmount,
          status: order.status,
          statusDisplay: order.getStatusDisplay(),
          formattedDate: order.getFormattedDate(),
          itemCount: order.items ? order.items.length : 0
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while fetching orders'
    });
  }
};

// Get detailed order information by order ID
export const getUserOrderDetails = async (req, res) => {
  try {
    const userId = req.user._id; // Set by authentication middleware
    const { orderId } = req.params;

    // Validate order ID format
    if (!orderId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }

    // Find order by ID and ensure it belongs to the authenticated user
    const order = await Order.findOne({ 
      _id: orderId, 
      userId 
    }).populate('items.productId', 'name slug images');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          orderDate: order.orderDate,
          status: order.status,
          statusDisplay: order.getStatusDisplay(),
          formattedDate: order.getFormattedDate(),
          customerEmail: order.customerEmail,
          items: order.items.map(item => ({
            _id: item._id,
            productId: item.productId,
            productName: item.productName,
            productSlug: item.productSlug,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          })),
          subtotal: order.subtotal,
          tax: order.tax,
          shipping: order.shipping,
          totalAmount: order.totalAmount,
          shippingAddress: order.shippingAddress,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          notes: order.notes
        }
      }
    });

  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while fetching order details'
    });
  }
};