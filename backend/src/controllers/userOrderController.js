import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import ShippingMethod from '../models/ShippingMethod.js';
import Stripe from 'stripe';
import mongoose from 'mongoose';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fake_key_for_testing');

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
    });

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
            productImage: item.productImage,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          })),
          subtotal: order.subtotal,
          tax: order.tax,
          shipping: order.shipping,
          discount: order.discount || 0,
          discountCode: order.discountCode,
          totalAmount: order.totalAmount,
          shippingAddress: order.shippingAddress,
          billingAddress: order.billingAddress,
          shippingMethod: order.shippingMethod,
          paymentMethod: order.paymentMethod,
          paymentMethodDisplay: order.getPaymentMethodDisplay(),
          paymentDetails: order.paymentDetails,
          paymentStatus: order.paymentStatus,
          trackingNumber: order.trackingNumber,
          trackingUrl: order.trackingUrl,
          statusHistory: order.statusHistory || [],
          notes: order.notes,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
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

// Helper function to find or create cart
const findOrCreateCart = async (req) => {
  const userId = req.user?._id;
  
  if (userId) {
    // Authenticated user
    let cart = await Cart.findByUserId(userId);
    if (!cart) {
      throw new Error('Cart not found');
    }
    return cart;
  } else {
    // Guest user
    const sessionId = req.cookies.cartSessionId;
    if (!sessionId) {
      throw new Error('No cart session found');
    }
    
    let cart = await Cart.findBySessionId(sessionId);
    if (!cart) {
      throw new Error('Cart not found');
    }
    return cart;
  }
};

// Place order endpoint
export const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.startTransaction();
    
    const {
      shippingAddress,
      billingAddress,
      shippingMethodId,
      paymentIntentId,
      useSameAsShipping = true
    } = req.body;

    // Validate required fields
    if (!shippingAddress || !shippingMethodId || !paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: 'Shipping address, shipping method, and payment intent are required'
      });
    }

    // Get user's cart
    let cart;
    try {
      cart = await findOrCreateCart(req);
    } catch (cartError) {
      return res.status(400).json({
        success: false,
        error: cartError.message
      });
    }
    
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty'
      });
    }

    // Verify payment intent with Stripe
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({
          success: false,
          error: 'Payment has not been completed successfully'
        });
      }
    } catch (stripeError) {
      console.error('Stripe payment intent verification error:', stripeError);
      return res.status(400).json({
        success: false,
        error: 'Invalid payment intent'
      });
    }

    // Verify all cart items are still available and get current prices
    const productIds = cart.items.map(item => item.productId);
    const products = await Product.find({ 
      _id: { $in: productIds },
      isActive: true 
    }).session(session);

    if (products.length !== productIds.length) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Some products in cart are no longer available'
      });
    }

    // Create product lookup map
    const productMap = new Map();
    products.forEach(product => {
      productMap.set(product._id.toString(), product);
    });

    // Validate stock and calculate totals with current prices
    let cartTotal = 0;
    const orderItems = [];

    for (const cartItem of cart.items) {
      const product = productMap.get(cartItem.productId.toString());
      
      if (!product) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: `Product ${cartItem.productId} not found`
        });
      }

      // Check stock availability
      if (product.stockQuantity < cartItem.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for product ${product.name}. Available: ${product.stockQuantity}, Requested: ${cartItem.quantity}`
        });
      }

      const itemTotal = product.price * cartItem.quantity;
      cartTotal += itemTotal;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.images?.[0] || null,
        quantity: cartItem.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal
      });

      // Decrement stock quantity
      await Product.findByIdAndUpdate(
        product._id,
        { $inc: { stockQuantity: -cartItem.quantity } },
        { session }
      );
    }

    // Get and validate shipping method
    const shippingMethod = await ShippingMethod.findOne({ 
      _id: shippingMethodId, 
      isActive: true 
    }).session(session);

    if (!shippingMethod) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Invalid shipping method'
      });
    }

    // Calculate shipping cost
    const cartData = {
      items: orderItems,
      totalValue: cartTotal
    };

    const shippingCalculation = shippingMethod.calculateCost(cartData, shippingAddress);
    if (shippingCalculation === null) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Shipping method not available for this cart and address'
      });
    }

    const shippingCost = shippingCalculation.cost;
    const orderTotal = cartTotal + shippingCost;

    // Verify order total matches payment intent amount (in pence)
    const expectedAmountInPence = Math.round(orderTotal * 100);
    if (paymentIntent.amount !== expectedAmountInPence) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Payment amount does not match order total'
      });
    }

    // Extract payment method details from Stripe
    let paymentMethodDetails = {
      type: 'card',
      name: 'Credit or Debit Card'
    };
    
    let paymentDetails = {
      paymentIntentId: paymentIntent.id
    };

    // Get payment method details from Stripe if available
    if (paymentIntent.payment_method) {
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
        if (paymentMethod.card) {
          paymentDetails.cardBrand = paymentMethod.card.brand;
          paymentDetails.last4 = paymentMethod.card.last4;
        }
      } catch (pmError) {
        console.warn('Could not retrieve payment method details:', pmError);
      }
    }

    // Create the order
    const newOrder = new Order({
      userId: req.user._id,
      customerEmail: req.user.email,
      items: orderItems,
      subtotal: cartTotal,
      tax: 0, // Tax calculation can be added later
      shipping: shippingCost,
      totalAmount: orderTotal,
      discount: 0, // Discount handling can be added later
      shippingAddress: {
        fullName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        stateProvince: shippingAddress.stateProvince,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        phoneNumber: shippingAddress.phoneNumber
      },
      billingAddress: useSameAsShipping ? {
        fullName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        stateProvince: shippingAddress.stateProvince,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        phoneNumber: shippingAddress.phoneNumber
      } : {
        fullName: `${billingAddress.firstName} ${billingAddress.lastName}`,
        addressLine1: billingAddress.addressLine1,
        addressLine2: billingAddress.addressLine2,
        city: billingAddress.city,
        stateProvince: billingAddress.stateProvince,
        postalCode: billingAddress.postalCode,
        country: billingAddress.country,
        phoneNumber: billingAddress.phoneNumber
      },
      shippingMethod: {
        id: shippingMethod._id,
        name: shippingMethod.name,
        cost: shippingCost,
        estimatedDelivery: shippingMethod.estimatedDelivery
      },
      paymentMethod: paymentMethodDetails,
      paymentDetails: paymentDetails,
      paymentStatus: 'completed',
      status: 'processing'
    });

    await newOrder.save({ session });

    // Clear the user's cart
    if (req.user._id) {
      await Cart.findOneAndUpdate(
        { userId: req.user._id },
        { items: [] },
        { session }
      );
    } else if (req.cookies.cartSessionId) {
      await Cart.findOneAndUpdate(
        { sessionId: req.cookies.cartSessionId },
        { items: [] },
        { session }
      );
    }

    // Commit the transaction
    await session.commitTransaction();

    // TODO: Send order confirmation email
    console.log(`Order ${newOrder.orderNumber} placed successfully for user ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: {
        orderId: newOrder._id,
        orderNumber: newOrder.orderNumber,
        orderTotal: orderTotal,
        estimatedDelivery: shippingMethod.estimatedDelivery
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Place order error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid order data: ' + error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error occurred while placing order'
    });
  } finally {
    session.endSession();
  }
};