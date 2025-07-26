import mongoose from 'mongoose';
import { Client, Environment } from '@paypal/paypal-server-sdk';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import bitcoinService from '../services/bitcoinService.js';
import moneroService from '../services/moneroService.js';
import logger, { logError, logPaymentEvent } from '../utils/logger.js';

// Helper function to get PayPal client dynamically (for better testability)
const getPayPalClient = () => {
  const paypalClientId = process.env.PAYPAL_CLIENT_ID;
  const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!paypalClientId || !paypalClientSecret) {
    return null;
  }
  
  try {
    const paypalEnvironment = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
    const environment = paypalEnvironment === 'live' ? Environment.Production : Environment.Sandbox;
    return new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: paypalClientId,
        oAuthClientSecret: paypalClientSecret
      },
      environment: environment
    });
  } catch (error) {
    logError(error, { context: 'paypal_client_initialization' });
    return null;
  }
};

// Helper function to find or create cart
const findOrCreateCart = async (req) => {
  const userId = req.user?._id;
  
  if (userId) {
    // Authenticated user
    let cart = await Cart.findByUserId(userId);
    if (!cart) {
      cart = new Cart({ userId });
      await cart.save();
    }
    return cart;
  } else {
    // Guest user
    const sessionId = req.cookies.cartSessionId;
    if (!sessionId) {
      throw new Error('No cart session found');
    }
    
    const cart = await Cart.findBySessionId(sessionId);
    if (!cart) {
      throw new Error('Cart not found');
    }
    return cart;
  }
};




// Get available payment methods
export const getPaymentMethods = async (req, res) => {
  try {
    // Check PayPal availability dynamically
    const paypalClient = getPayPalClient();
    const paymentMethods = [
      {
        id: 'paypal',
        type: 'paypal',
        name: 'PayPal',
        description: 'Pay with your PayPal account',
        icon: 'paypal',
        enabled: !!paypalClient
      },
      {
        id: 'bitcoin',
        type: 'bitcoin',
        name: 'Bitcoin',
        description: 'Pay with Bitcoin - private and secure',
        icon: 'bitcoin',
        enabled: true
      },
      {
        id: 'monero',
        type: 'monero',
        name: 'Monero',
        description: 'Pay with Monero - private and untraceable',
        icon: 'monero',
        enabled: true
      }
    ];

    res.json({
      success: true,
      data: {
        paymentMethods: paymentMethods.filter(method => method.enabled)
      }
    });

  } catch (error) {
    logError(error, { context: 'paypal_payment_methods' });
    res.status(500).json({
      success: false,
      error: 'Server error occurred while fetching payment methods'
    });
  }
};

// Create PayPal order
export const createPayPalOrder = async (req, res) => {
  try {
    const { shippingAddress, shippingMethodId } = req.body;

    // Get PayPal client
    const paypalClient = getPayPalClient();
    if (!paypalClient) {
      return res.status(500).json({
        success: false,
        error: 'PayPal payment processing is not available'
      });
    }

    // Validate required fields
    if (!shippingAddress || !shippingMethodId) {
      return res.status(400).json({
        success: false,
        error: 'Shipping address and shipping method are required'
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

    // Calculate order total
    const productIds = cart.items.map(item => item.productId);
    const products = await Product.find({ 
      _id: { $in: productIds },
      isActive: true 
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Some products in cart are no longer available'
      });
    }

    // Create product lookup map and calculate total
    const productMap = new Map();
    products.forEach(product => {
      productMap.set(product._id.toString(), product);
    });

    let cartTotal = 0;
    const cartItems = [];

    for (const cartItem of cart.items) {
      const product = productMap.get(cartItem.productId.toString());
      
      if (!product) {
        return res.status(400).json({
          success: false,
          error: `Product ${cartItem.productId} not found`
        });
      }

      if (product.stockQuantity < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for product ${product.name}`
        });
      }

      const itemTotal = product.price * cartItem.quantity;
      cartTotal += itemTotal;

      cartItems.push({
        productId: product._id,
        name: product.name,
        quantity: cartItem.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal
      });
    }

    // Calculate shipping cost
    const ShippingMethod = (await import('../models/ShippingMethod.js')).default;
    const shippingMethod = await ShippingMethod.findOne({ 
      _id: shippingMethodId, 
      isActive: true 
    });

    if (!shippingMethod) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shipping method'
      });
    }

    const calculation = shippingMethod.calculateCost({ items: cartItems, totalValue: cartTotal }, shippingAddress);
    if (calculation === null) {
      return res.status(400).json({
        success: false,
        error: 'Shipping method not available for this cart and address'
      });
    }

    const shippingCost = calculation.cost;
    const orderTotal = cartTotal + shippingCost;

    // Create PayPal order request
    const orderRequest = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'GBP',
          value: orderTotal.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: 'GBP',
              value: cartTotal.toFixed(2)
            },
            shipping: {
              currency_code: 'GBP',
              value: shippingCost.toFixed(2)
            }
          }
        },
        items: cartItems.map(item => ({
          name: item.name,
          unit_amount: {
            currency_code: 'GBP',
            value: item.unitPrice.toFixed(2)
          },
          quantity: item.quantity.toString()
        })),
        shipping: {
          name: {
            full_name: `${shippingAddress.firstName} ${shippingAddress.lastName}`
          },
          address: {
            address_line_1: shippingAddress.addressLine1,
            address_line_2: shippingAddress.addressLine2 || '',
            admin_area_2: shippingAddress.city,
            admin_area_1: shippingAddress.stateProvince,
            postal_code: shippingAddress.postalCode,
            country_code: shippingAddress.country === 'UK' ? 'GB' : shippingAddress.country
          }
        }
      }],
      application_context: {
        brand_name: 'Graphene Security',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout`
      }
    };

    // Create PayPal order
    let paypalOrder;
    try {
      const ordersController = paypalClient.ordersController;
      paypalOrder = await ordersController.ordersCreate({
        body: orderRequest
      });
    } catch (paypalError) {
      // Handle PayPal API specific errors
      logError(paypalError, { context: 'paypal_api_error', orderRequest });
      return res.status(503).json({
        success: false,
        error: 'PayPal service is temporarily unavailable. Please try again later or use an alternative payment method.',
        alternatives: ['bitcoin', 'monero']
      });
    }

    res.json({
      success: true,
      data: {
        paypalOrderId: paypalOrder.result.id,
        orderSummary: {
          cartTotal: cartTotal,
          shippingCost: shippingCost,
          orderTotal: orderTotal,
          currency: 'GBP',
          items: cartItems,
          shippingMethod: {
            id: shippingMethod._id,
            name: shippingMethod.name,
            cost: shippingCost
          },
          shippingAddress: shippingAddress
        },
        approvalUrl: paypalOrder.result.links.find(link => link.rel === 'approve')?.href
      }
    });

  } catch (error) {
    logError(error, { context: 'paypal_order_creation', cartId: req.body.cartId });
    res.status(500).json({
      success: false,
      error: 'Server error occurred while creating PayPal order'
    });
  }
};

// Capture PayPal payment
export const capturePayPalPayment = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    const { paypalOrderId, payerId } = req.body;

    if (!paypalOrderId) {
      return res.status(400).json({
        success: false,
        error: 'PayPal order ID is required'
      });
    }

    // Get PayPal client
    const paypalClient = getPayPalClient();
    if (!paypalClient) {
      return res.status(500).json({
        success: false,
        error: 'PayPal payment processing is not available'
      });
    }

    // Capture the PayPal payment
    const ordersController = paypalClient.ordersController;
    const captureResponse = await ordersController.ordersCapture({
      id: paypalOrderId
    });

    if (captureResponse.result.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'PayPal payment capture failed'
      });
    }

    // Extract payment details
    const paymentDetails = captureResponse.result;
    const purchaseUnit = paymentDetails.purchase_units?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];

    if (!capture) {
      return res.status(400).json({
        success: false,
        error: 'PayPal payment capture information not found'
      });
    }

    await session.withTransaction(async () => {
      // Get user's cart to create order
      let cart;
      try {
        cart = await findOrCreateCart(req);
      } catch (cartError) {
        throw new Error(cartError.message);
      }
      
      if (!cart || !cart.items || cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Get shipping info from PayPal response or cart metadata
      // Note: In a real implementation, you'd store this info when creating the PayPal order
      const shippingInfo = purchaseUnit?.shipping || {};
      
      // Create order in database
      const orderData = {
        userId: req.user?._id || cart.userId,
        customerEmail: req.user?.email || paymentDetails.payer?.email_address,
        items: cart.items.map(item => ({
          productId: item.productId,
          productName: item.productName || 'Product',
          productSlug: item.productSlug || 'product',
          quantity: item.quantity,
          unitPrice: item.unitPrice || item.price,
          totalPrice: (item.unitPrice || item.price) * item.quantity
        })),
        subtotal: parseFloat(purchaseUnit.amount.breakdown?.item_total?.value || 0),
        shipping: parseFloat(purchaseUnit.amount.breakdown?.shipping?.value || 0),
        tax: parseFloat(purchaseUnit.amount.breakdown?.tax_total?.value || 0),
        totalAmount: parseFloat(purchaseUnit.amount.value),
        paymentMethod: {
          type: 'paypal',
          name: 'PayPal'
        },
        paymentDetails: {
          paypalOrderId: paypalOrderId,
          paypalPaymentId: capture.id,
          paypalPayerId: payerId,
          paypalTransactionId: capture.id,
          paypalPayerEmail: paymentDetails.payer?.email_address,
          transactionId: capture.id
        },
        paymentStatus: 'completed',
        status: 'processing',
        shippingAddress: {
          fullName: shippingInfo.name?.full_name || `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || 'Customer',
          addressLine1: shippingInfo.address?.address_line_1 || 'Address Line 1',
          addressLine2: shippingInfo.address?.address_line_2 || '',
          city: shippingInfo.address?.admin_area_2 || 'City',
          stateProvince: shippingInfo.address?.admin_area_1 || 'State',
          postalCode: shippingInfo.address?.postal_code || '00000',
          country: shippingInfo.address?.country_code || 'GB',
          phoneNumber: req.user?.phone || ''
        },
        billingAddress: {
          fullName: shippingInfo.name?.full_name || `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || 'Customer',
          addressLine1: shippingInfo.address?.address_line_1 || 'Address Line 1',
          addressLine2: shippingInfo.address?.address_line_2 || '',
          city: shippingInfo.address?.admin_area_2 || 'City',
          stateProvince: shippingInfo.address?.admin_area_1 || 'State',
          postalCode: shippingInfo.address?.postal_code || '00000',
          country: shippingInfo.address?.country_code || 'GB',
          phoneNumber: req.user?.phone || ''
        },
        shippingMethod: {
          id: new mongoose.Types.ObjectId(), // Default shipping method
          name: 'Standard Shipping',
          cost: parseFloat(purchaseUnit.amount.breakdown?.shipping?.value || 0)
        }
      };


      const order = new Order(orderData);
      
      // Generate order number
      const orderCount = await Order.countDocuments({});
      order.orderNumber = `ORD${Date.now()}${(orderCount + 1).toString().padStart(4, '0')}`;
      
      await order.save({ session });


      // Clear the cart after successful order creation
      await cart.clearCart({ session });

      return order;
    });

    // Fetch the created order for response
    const newOrder = await Order.findOne({ 
      'paymentDetails.paypalOrderId': paypalOrderId 
    }).lean();

    res.json({
      success: true,
      data: {
        orderId: newOrder?._id,
        orderNumber: newOrder?.orderNumber,
        amount: parseFloat(purchaseUnit.amount.value),
        paymentMethod: 'paypal',
        paymentDetails: captureResponse.result,
        status: 'captured'
      }
    });

  } catch (error) {
    logError(error, { context: 'paypal_payment_capture', orderId: req.params.orderId });
    res.status(500).json({
      success: false,
      error: error.message || 'Server error occurred while capturing PayPal payment'
    });
  } finally {
    await session.endSession();
  }
};

// PayPal webhook handler
export const handlePayPalWebhook = async (req, res) => {
  try {
    const webhookEvent = req.body;
    const eventType = webhookEvent.event_type;

    logPaymentEvent('paypal_webhook_received', { eventType });

    switch (eventType) {
    case 'PAYMENT.CAPTURE.COMPLETED':
      await handlePaymentCaptureCompleted(webhookEvent);
      break;
      
    case 'PAYMENT.CAPTURE.DENIED':
      await handlePaymentCaptureDenied(webhookEvent);
      break;
      
    case 'CHECKOUT.ORDER.APPROVED':
      await handleOrderApproved(webhookEvent);
      break;
      
    default:
      logger.warn(`Unhandled PayPal webhook event: ${eventType}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logError(error, { context: 'paypal_webhook_processing' });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Helper functions for PayPal webhook events
const handlePaymentCaptureCompleted = async (webhookEvent) => {
  try {
    const resource = webhookEvent.resource;
    const orderId = resource.supplementary_data?.related_ids?.order_id;
    
    logPaymentEvent('paypal_payment_captured', { orderId });
    
    // TODO: Update order status in database
    // This will be implemented when we have Order model updates
    
  } catch (error) {
    logError(error, { context: 'paypal_capture_completed_handler', orderId });
  }
};

const handlePaymentCaptureDenied = async (webhookEvent) => {
  try {
    const resource = webhookEvent.resource;
    const orderId = resource.supplementary_data?.related_ids?.order_id;
    
    logPaymentEvent('paypal_payment_denied', { orderId });
    
    // TODO: Update order status in database
    
  } catch (error) {
    logError(error, { context: 'paypal_capture_denied_handler', orderId });
  }
};

const handleOrderApproved = async (webhookEvent) => {
  try {
    const resource = webhookEvent.resource;
    const orderId = resource.id;
    
    logPaymentEvent('paypal_order_approved', { orderId });
    
    // TODO: Update order status in database
    
  } catch (error) {
    logError(error, { context: 'paypal_order_approved_handler', orderId });
  }
};

// Bitcoin payment endpoints

// Initialize Bitcoin payment
export const initializeBitcoinPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Order ID format'
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

    // Check if order is in correct state for Bitcoin payment
    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Order is not in pending payment state (current: ${order.paymentStatus})`
      });
    }

    // Additional validation to prevent 500 errors
    if (!order.totalAmount || order.totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order amount'
      });
    }

    if (order.paymentMethod && order.paymentMethod.type !== 'bitcoin') {
      return res.status(400).json({
        success: false,
        error: `Order payment method is not Bitcoin (current: ${order.paymentMethod.type})`
      });
    }

    // Create Bitcoin payment data
    const bitcoinPaymentData = await bitcoinService.createBitcoinPayment(order.totalAmount);

    // Update order with Bitcoin payment details
    order.paymentMethod = {
      type: 'bitcoin',
      name: 'Bitcoin'
    };
    
    Object.assign(order.paymentDetails, bitcoinPaymentData);
    order.paymentStatus = 'awaiting_confirmation';
    
    await order.save();

    logPaymentEvent('bitcoin_payment_initialized', { orderId,
      address: bitcoinPaymentData.bitcoinAddress,
      amount: bitcoinPaymentData.bitcoinAmount,
      expiry: bitcoinPaymentData.bitcoinPaymentExpiry
    });

    res.json({
      success: true,
      data: {
        bitcoinAddress: bitcoinPaymentData.bitcoinAddress,
        bitcoinAmount: bitcoinPaymentData.bitcoinAmount,
        exchangeRate: bitcoinPaymentData.bitcoinExchangeRate,
        exchangeRateTimestamp: bitcoinPaymentData.bitcoinExchangeRateTimestamp,
        paymentExpiry: bitcoinPaymentData.bitcoinPaymentExpiry,
        orderTotal: order.totalAmount,
        currency: 'GBP'
      }
    });

  } catch (error) {
    logError(error, { 
      context: 'bitcoin_payment_initialization', 
      orderId: req.body.orderId,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack
    });
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Failed to initialize Bitcoin payment';
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Invalid order data';
      statusCode = 400;
    } else if (error.message?.includes('CoinGecko') || error.message?.includes('exchange rate')) {
      errorMessage = 'Currency exchange service temporarily unavailable';
      statusCode = 503;
    } else if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      errorMessage = 'Request timeout - please try again';
      statusCode = 503;
    } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('network')) {
      errorMessage = 'Network connectivity issue - please try again';
      statusCode = 503;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      ...(process.env.NODE_ENV !== 'production' && { 
        details: error.message,
        type: error.name 
      })
    });
  }
};

// Get Bitcoin payment status
export const getBitcoinPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Order ID format'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.paymentMethod.type !== 'bitcoin') {
      return res.status(400).json({
        success: false,
        error: 'Order is not a Bitcoin payment'
      });
    }

    const {
      bitcoinAddress,
      bitcoinAmount,
      bitcoinExchangeRate,
      bitcoinConfirmations,
      bitcoinAmountReceived,
      bitcoinTransactionHash,
      bitcoinPaymentExpiry
    } = order.paymentDetails;

    // Check if payment is expired
    const isExpired = bitcoinService.isPaymentExpired(bitcoinPaymentExpiry);
    if (isExpired && order.paymentStatus === 'awaiting_confirmation') {
      order.paymentStatus = 'expired';
      await order.save();
    }

    res.json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        bitcoinAddress,
        bitcoinAmount,
        bitcoinAmountReceived: bitcoinAmountReceived || 0,
        bitcoinConfirmations: bitcoinConfirmations || 0,
        bitcoinTransactionHash,
        exchangeRate: bitcoinExchangeRate,
        paymentExpiry: bitcoinPaymentExpiry,
        isExpired,
        isConfirmed: bitcoinService.isPaymentConfirmed(bitcoinConfirmations || 0),
        requiresConfirmations: 2
      }
    });

  } catch (error) {
    logError(error, { context: 'bitcoin_payment_status', orderId: req.params.orderId });
    res.status(500).json({
      success: false,
      error: 'Failed to get Bitcoin payment status'
    });
  }
};

// Blockonomics webhook handler
export const handleBlockonomicsWebhook = async (req, res) => {
  try {
    // Blockonomics can send webhooks as GET with query params or POST with body
    // Extract data from query params (GET) or body (POST)
    const isGet = req.method === 'GET';
    const webhookData = isGet ? req.query : req.body;
    
    // Verify webhook signature if configured (only for POST requests)
    if (!isGet) {
      const signature = req.headers['x-signature'] || req.headers['x-blockonomics-signature'];
      
      // Get Bitcoin gateway configuration
      const PaymentGateway = (await import('../models/PaymentGateway.js')).default;
      const bitcoinGateway = await PaymentGateway.findOne({ provider: 'bitcoin' });
      
      if (bitcoinGateway?.config?.bitcoinWebhookSecret && signature) {
        // Verify signature using HMAC
        const crypto = await import('crypto');
        const payload = JSON.stringify(req.body);
        const expectedSignature = crypto.default
          .createHmac('sha256', bitcoinGateway.config.bitcoinWebhookSecret)
          .update(payload)
          .digest('hex');
          
        if (signature !== expectedSignature) {
          logger.warn('Invalid Bitcoin webhook signature');
          return res.status(401).json({
            success: false,
            message: 'Invalid webhook signature'
          });
        }
      }
    }
    
    // Extract webhook parameters
    const { addr, value, txid, confirmations, status } = webhookData;
    
    // Blockonomics uses 'status' parameter to indicate confirmation level
    // status=0: Unconfirmed (0 confirmations)
    // status=1: Partially Confirmed (1 confirmation)
    // status=2: Confirmed (2+ confirmations)
    const actualConfirmations = confirmations || (status ? parseInt(status) : 0);

    logPaymentEvent('blockonomics_webhook_received', {
      address: addr,
      value,
      txid,
      confirmations: actualConfirmations,
      status: status || 0,
      method: isGet ? 'GET' : 'POST'
    });

    if (!addr || !txid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook data'
      });
    }

    // Find order by Bitcoin address
    const order = await Order.findOne({
      'paymentDetails.bitcoinAddress': addr,
      'paymentMethod.type': 'bitcoin'
    });

    if (!order) {
      logger.warn(`No order found for Bitcoin address: ${addr}`);
      return res.status(404).json({
        success: false,
        error: 'Order not found for this Bitcoin address'
      });
    }

    let session = null;
    let useTransaction = false;
    
    try {
      // Try to start session for transaction support
      try {
        session = await mongoose.startSession();
        useTransaction = true;
      } catch (sessionError) {
        console.log('MongoDB sessions not available, continuing without transactions');
        useTransaction = false;
      }
      
      if (useTransaction) {
        try {
          session.startTransaction();
        } catch (txError) {
          console.log('MongoDB transactions not available, continuing without transactions');
          useTransaction = false;
        }
      }
      // Convert satoshis to BTC
      const amountReceived = bitcoinService.satoshisToBtc(value);
      const expectedAmount = order.paymentDetails.bitcoinAmount;

      // Update payment details
      order.paymentDetails.bitcoinAmountReceived = amountReceived;
      order.paymentDetails.bitcoinConfirmations = actualConfirmations;
      order.paymentDetails.bitcoinTransactionHash = txid;

      // Check if payment is expired
      if (bitcoinService.isPaymentExpired(order.paymentDetails.bitcoinPaymentExpiry)) {
        order.paymentStatus = 'expired';
        logPaymentEvent('bitcoin_payment_expired', { orderId: order._id });
      }
      // Check if payment is sufficient
      else if (!bitcoinService.isPaymentSufficient(amountReceived, expectedAmount)) {
        order.paymentStatus = 'underpaid';
        logPaymentEvent('bitcoin_payment_underpaid', { orderId: order._id, received: amountReceived, expected: expectedAmount });
      }
      // Check if payment is confirmed (2+ confirmations)
      else if (bitcoinService.isPaymentConfirmed(actualConfirmations)) {
        order.paymentStatus = 'completed';
        order.status = 'processing'; // Move order to processing
        logPaymentEvent('bitcoin_payment_confirmed', { orderId: order._id, confirmations: actualConfirmations });
        
        // Create payment record when payment is confirmed
        const Payment = (await import('../models/Payment.js')).default;
        await Payment.create({
          order: order._id,
          orderId: order._id.toString(),
          paymentId: `BTC-${txid.substring(0, 8)}`,
          user: order.userId,
          userId: order.userId.toString(),
          customerEmail: order.customerEmail,
          amount: order.totalAmount,
          currency: 'GBP',
          method: 'bitcoin',
          paymentMethod: 'bitcoin',
          orderNumber: order.orderNumber,
          status: 'completed',
          transactionId: txid,
          gatewayResponse: {
            address: addr,
            amountReceived,
            confirmations,
            transactionHash: txid
          }
        });
      }
      // Payment received but not yet confirmed
      else {
        order.paymentStatus = 'awaiting_confirmation';
        logPaymentEvent('bitcoin_payment_pending', { orderId: order._id, confirmations: actualConfirmations, required: 2 });
      }

      // Save order
      await order.save();
      
      if (useTransaction && session) {
        await session.commitTransaction();
      }

      logPaymentEvent('bitcoin_payment_updated', { orderId: order._id,
        status: order.paymentStatus,
        confirmations: actualConfirmations,
        amountReceived
      });

      res.status(200).json({ 
        success: true,
        received: true 
      });

    } catch (error) {
      if (useTransaction && session) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (session) {
        try {
          await session.endSession();
        } catch (endError) {
          console.log('Failed to end session:', endError.message);
        }
      }
    }

  } catch (error) {
    logError(error, { context: 'blockonomics_webhook_processing' });
    console.error('Webhook error details:', error.message, error.stack);
    
    // For debugging in development/testing - return detailed error
    if (process.env.NODE_ENV !== 'production') {
      res.status(500).json({
        success: false,
        error: 'Webhook processing failed',
        details: error.message,
        stack: error.stack
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Webhook processing failed'
      });
    }
  }
};

// Create Monero payment
export const createMoneroPayment = async (req, res) => {
  let session = null;
  let useTransaction = false;
  
  try {
    // Try to start session for transaction support (production with replica sets)
    try {
      session = await mongoose.startSession();
      useTransaction = true;
    } catch (sessionError) {
      // Session not supported (standalone MongoDB or test environment)
      console.log('MongoDB sessions not available, continuing without transactions');
      useTransaction = false;
    }
    
    const { orderId, shippingAddress, billingAddress, shippingMethodId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    // Validate orderId format if not 'new'
    if (orderId !== 'new' && !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }

    // Execute main logic with or without transactions
    const executeMainLogic = async () => {
      // Get user's cart to create order if orderId is 'new'
      let order;
      
      if (orderId === 'new') {
        // Create new order from cart
        let cart;
        try {
          cart = await findOrCreateCart(req);
        } catch (cartError) {
          throw new Error(cartError.message);
        }
        
        if (!cart || !cart.items || cart.items.length === 0) {
          throw new Error('Cart is empty');
        }

        // Calculate totals
        const subtotal = cart.totalAmount;

        // Calculate shipping cost (simplified)
        const shippingCost = 10.00; // Default shipping cost
        const totalAmount = subtotal + shippingCost;

        // Get Monero exchange rate and calculate XMR amount
        const { xmrAmount, exchangeRate, validUntil } = await moneroService.convertGbpToXmr(totalAmount);

        // Create order data
        const orderData = {
          userId: req.user?._id || cart.userId,
          customerEmail: req.user?.email || req.body.customerEmail,
          items: cart.items.map(item => ({
            productId: item.productId,
            productName: item.productName || 'Product',
            productSlug: item.productSlug || 'product',
            quantity: item.quantity,
            unitPrice: item.unitPrice || item.price,
            totalPrice: (item.unitPrice || item.price) * item.quantity
          })),
          subtotal: subtotal,
          shipping: shippingCost,
          tax: 0,
          totalAmount: totalAmount,
          paymentMethod: {
            type: 'monero',
            name: 'Monero (XMR)'
          },
          paymentDetails: {
            xmrAmount: xmrAmount,
            exchangeRate: exchangeRate,
            exchangeRateValidUntil: validUntil,
            paymentWindow: moneroService.getPaymentWindowHours(),
            requiredConfirmations: moneroService.getRequiredConfirmations()
          },
          paymentStatus: 'pending',
          status: 'pending',
          shippingAddress: shippingAddress || {},
          billingAddress: billingAddress || {},
          shippingMethod: {
            id: shippingMethodId || new mongoose.Types.ObjectId(),
            name: 'Standard Shipping',
            cost: shippingCost
          }
        };


        order = new Order(orderData);
        
        // Generate order number
        const orderCount = await Order.countDocuments({});
        order.orderNumber = `ORD${Date.now()}${(orderCount + 1).toString().padStart(4, '0')}`;
        
        // Save with session if available, otherwise without
        if (useTransaction && session) {
          await order.save({ session });
        } else {
          await order.save();
        }

        // Clear the cart after successful order creation
        cart.clearCart();
        if (useTransaction && session) {
          await cart.save({ session });
        } else {
          await cart.save();
        }
      } else {
        // Get existing order
        order = await Order.findById(orderId);
        if (!order) {
          throw new Error('Order not found');
        }

        // Recalculate XMR amount with current rate if needed
        const { xmrAmount, exchangeRate, validUntil } = await moneroService.convertGbpToXmr(order.totalAmount);
        
        // Update payment details
        order.paymentDetails = {
          ...order.paymentDetails,
          xmrAmount: xmrAmount,
          exchangeRate: exchangeRate,
          exchangeRateValidUntil: validUntil
        };
        
        // Save with session if available, otherwise without
        if (useTransaction && session) {
          await order.save({ session });
        } else {
          await order.save();
        }
      }

      // Create Monero payment request via NowPayments (previously GloBee)
      const paymentRequest = await moneroService.createPaymentRequest({
        orderId: order._id.toString(),
        amount: order.totalAmount, // Use GBP amount for NowPayments
        currency: 'GBP',
        customerEmail: order.customerEmail
      });

      // Update order with NowPayments details (maintain backward compatibility)
      order.paymentDetails = {
        ...order.paymentDetails,
        paymentProviderId: paymentRequest.paymentId, // New field for NowPayments
        globeePaymentId: paymentRequest.paymentId, // Legacy field for compatibility
        moneroAddress: paymentRequest.address,
        paymentUrl: paymentRequest.paymentUrl,
        expirationTime: paymentRequest.expirationTime,
        xmrAmount: paymentRequest.amount // Update with actual XMR amount from NowPayments
      };
      
      // Save with session if available, otherwise without
      if (useTransaction && session) {
        await order.save({ session });
      } else {
        await order.save();
      }

      return order;
    };

    // Execute main logic with or without transaction
    let order;
    if (useTransaction && session) {
      try {
        order = await session.withTransaction(executeMainLogic);
      } catch (transactionError) {
        // If transaction fails (e.g., standalone MongoDB), fallback to non-transaction
        if (transactionError.message?.includes('Transaction') || transactionError.message?.includes('replica set')) {
          console.log('Transaction not supported, executing without transaction');
          order = await executeMainLogic();
        } else {
          throw transactionError;
        }
      }
    } else {
      order = await executeMainLogic();
    }

    // Fetch the created/updated order for response
    const finalOrder = await Order.findById(order._id).lean();

    // Generate payment URI for backward compatibility
    const paymentUri = `monero:${finalOrder.paymentDetails.moneroAddress}?amount=${finalOrder.paymentDetails.xmrAmount}`;

    res.json({
      success: true,
      data: {
        orderId: finalOrder._id,
        orderNumber: finalOrder.orderNumber,
        paymentId: finalOrder.paymentDetails.paymentProviderId, // Include paymentId for test compatibility
        address: finalOrder.paymentDetails.moneroAddress, // Include address property expected by tests
        moneroAddress: finalOrder.paymentDetails.moneroAddress,
        amount: finalOrder.paymentDetails.xmrAmount, // Include amount property expected by tests
        xmrAmount: finalOrder.paymentDetails.xmrAmount,
        currency: 'XMR', // Include currency property expected by tests
        exchangeRate: finalOrder.paymentDetails.exchangeRate,
        validUntil: finalOrder.paymentDetails.exchangeRateValidUntil,
        expiresAt: finalOrder.paymentDetails.expirationTime, // Include expiresAt property expected by tests
        paymentUrl: finalOrder.paymentDetails.paymentUrl,
        paymentUri: paymentUri, // Include paymentUri property expected by tests
        expirationTime: finalOrder.paymentDetails.expirationTime,
        status: 'pending', // Include status property expected by tests
        requiredConfirmations: finalOrder.paymentDetails.requiredConfirmations,
        paymentWindowHours: finalOrder.paymentDetails.paymentWindow
      }
    });

  } catch (error) {
    logError(error, { context: 'monero_payment_creation', cartId: req.body.cartId });
    
    // Handle specific error cases
    if (error.message === 'Order not found') {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    } else if (error.message === 'Cart is empty') {
      res.status(400).json({
        success: false,
        error: 'Cart is empty'
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || 'Server error occurred while creating Monero payment'
      });
    }
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// Check Monero payment status
export const checkMoneroPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.paymentMethod.type !== 'monero') {
      return res.status(400).json({
        success: false,
        error: 'Order is not a Monero payment'
      });
    }

    // Check if we have a payment provider ID (NowPayments or legacy GloBee)
    const paymentId = order.paymentDetails.paymentProviderId || order.paymentDetails.globeePaymentId;
    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: 'No Monero payment request found'
      });
    }

    // Get current status from NowPayments (previously GloBee)
    const paymentStatus = await moneroService.getPaymentStatus(paymentId);

    res.json({
      success: true,
      data: {
        orderId: order._id,
        paymentStatus: paymentStatus.status,
        confirmations: paymentStatus.confirmations,
        paidAmount: paymentStatus.paid_amount,
        transactionHash: paymentStatus.transaction_hash,
        isExpired: order.paymentDetails.expirationTime ? new Date() > new Date(order.paymentDetails.expirationTime) : false,
        requiredConfirmations: moneroService.getRequiredConfirmations()
      }
    });

  } catch (error) {
    logError(error, { context: 'monero_payment_status', orderId: req.params.orderId });
    res.status(500).json({
      success: false,
      error: 'Server error occurred while checking payment status'
    });
  }
};

// GloBee webhook handler for Monero payments
export const handleMoneroWebhook = async (req, res) => {
  let session = null;
  let useTransaction = false;
  
  try {
    // Try to start session for transaction support
    try {
      session = await mongoose.startSession();
      useTransaction = true;
    } catch (sessionError) {
      console.log('MongoDB sessions not available, continuing without transactions');
      useTransaction = false;
    }

    // NowPayments uses x-nowpayments-sig header (previously x-globee-signature)
    const signature = req.headers['x-nowpayments-sig'] || req.headers['x-globee-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!moneroService.verifyWebhookSignature(payload, signature)) {
      logger.warn('Invalid NowPayments webhook signature');
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    logPaymentEvent('nowpayments_webhook_received', req.body);

    const webhookData = moneroService.processWebhookNotification(req.body);
    
    if (!webhookData.orderId) {
      logger.warn('No order ID in NowPayments webhook');
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook data'
      });
    }

    // Execute main logic with or without transaction
    const executeWebhookLogic = async () => {
      const order = await Order.findById(webhookData.orderId);
      
      if (!order) {
        throw new Error(`Order ${webhookData.orderId} not found`);
      }

      // Update payment details
      order.paymentDetails = {
        ...(order.paymentDetails || {}),
        confirmations: webhookData.confirmations,
        paidAmount: webhookData.paidAmount,
        transactionHash: webhookData.transactionHash,
        lastWebhookUpdate: new Date()
      };

      // Update payment status based on webhook data
      if (webhookData.status === 'confirmed') {
        order.paymentStatus = 'completed';
        logPaymentEvent('monero_payment_confirmed', { orderId: order._id, confirmations: webhookData.confirmations });
      } else if (webhookData.status === 'partially_confirmed') {
        order.paymentStatus = 'awaiting_confirmation';
        logPaymentEvent('monero_payment_partial', { orderId: order._id, confirmations: webhookData.confirmations, required: moneroService.getRequiredConfirmations() });
      } else if (webhookData.status === 'underpaid') {
        order.paymentStatus = 'underpaid';
        logPaymentEvent('monero_payment_underpaid', { orderId: order._id, received: webhookData.paidAmount, expected: webhookData.totalAmount });
      } else if (webhookData.status === 'failed') {
        order.paymentStatus = 'failed';
        logPaymentEvent('monero_payment_failed', { orderId: order._id });
      }

      await order.save();

      logPaymentEvent('monero_payment_updated', { orderId: order._id,
        status: order.paymentStatus,
        confirmations: webhookData.confirmations,
        paidAmount: webhookData.paidAmount
      });

      return order;
    };

    if (useTransaction && session) {
      try {
        await session.withTransaction(executeWebhookLogic);
      } catch (transactionError) {
        if (transactionError.message?.includes('Transaction') || transactionError.message?.includes('replica set')) {
          console.log('Transaction not supported, executing without transaction');
          await executeWebhookLogic();
        } else {
          throw transactionError;
        }
      }
    } else {
      await executeWebhookLogic();
    }

    res.status(200).json({ 
      success: true,
      received: true 
    });

  } catch (error) {
    // No need to abort transaction - withTransaction handles it automatically
    logError(error, { context: 'nowpayments_webhook_processing' });
    console.error('Webhook processing error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch (endError) {
        console.log('Failed to end session:', endError.message);
      }
    }
  }
};

// Export aliases for test compatibility
export { handleBlockonomicsWebhook as handleBitcoinWebhook };