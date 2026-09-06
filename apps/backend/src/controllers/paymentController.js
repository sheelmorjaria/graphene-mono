import mongoose from 'mongoose';
import { Client, Environment } from '@paypal/paypal-server-sdk';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import PaymentGateway from '../models/PaymentGateway.js';
import logger, { logError, logPaymentEvent } from '../utils/logger.js';
import { validateFraudDetectionCookie, assessOrderFraudRisk } from '../services/fraudDetectionService.js';
import emailService from '../services/emailService.js';

// Helper function to get PayPal client dynamically (for better testability)
export const getPayPalClient = () => {
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
    const sessionId = req.cookies?.cartSessionId;
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
    // Fetch enabled payment gateways from database
    const gateways = await PaymentGateway.find({ 
      isEnabled: true,
      isDeleted: { $ne: true }
    }).sort({ displayOrder: 1, name: 1 });

    // Transform gateways to frontend format
    const paymentMethods = gateways.map(gateway => ({
      id: gateway.provider.toLowerCase(),
      type: gateway.provider.toLowerCase(),
      name: gateway.name,
      description: gateway.customerMessage || gateway.description,
      icon: gateway.provider.toLowerCase(),
      enabled: gateway.isEnabled && gateway.isProperlyConfigured()
    }));

    res.json({
      success: true,
      data: {
        paymentMethods: paymentMethods.filter(method => method.enabled)
      }
    });

  } catch (error) {
    logError(error, { context: 'payment_methods' });
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

      // Resolve the specific variation the cart item refers to. The Product
      // schema is variation-based: price/stock live on variations[], not at
      // the top level (reading product.price/product.stockQuantity yields
      // undefined → NaN amounts). Match by variationId first, then fall back
      // to condition/color, finally to the first variation.
      const variation = cartItem.variationId
        ? product.variations.find(v => v._id.toString() === cartItem.variationId)
        : (product.variations.find(v =>
            (!cartItem.condition || v.condition === cartItem.condition) &&
            (!cartItem.color || v.color === cartItem.color)
          ) || product.variations[0]);

      if (!variation) {
        return res.status(400).json({
          success: false,
          error: 'Selected variation no longer available'
        });
      }

      if (variation.stockQuantity < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for product ${product.name}`
        });
      }

      const unitPrice = variation.salePrice || variation.price;
      const itemTotal = unitPrice * cartItem.quantity;
      cartTotal += itemTotal;

      cartItems.push({
        productId: product._id,
        name: product.name,
        quantity: cartItem.quantity,
        unitPrice,
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
        // Round-trips cart + shipping method to capture (create is stateless).
        // PayPal caps custom_id at 127 chars; compact keys keep it ~60.
        custom_id: JSON.stringify({ c: cart._id.toString(), s: shippingMethodId }),
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
            country_code: shippingAddress.country
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
        error: 'PayPal service is temporarily unavailable. Please try again later or use an alternative payment method.'
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

    // Idempotency: a retry (double-click, success-page refresh) must neither
    // re-capture the payment nor duplicate the order.
    const alreadyCaptured = await Order.exists({ 'paymentDetails.paypalOrderId': paypalOrderId });
    if (alreadyCaptured) {
      const existing = await Order.findOne({ 'paymentDetails.paypalOrderId': paypalOrderId }).lean();
      return res.json({
        success: true,
        data: {
          orderId: existing?._id,
          orderNumber: existing?.orderNumber,
          amount: existing?.totalAmount,
          customerEmail: existing?.customerEmail,
          isGuest: existing?.isGuest ?? false,
          paymentMethod: 'paypal',
          status: 'already_captured'
        }
      });
    }

    // Guest email guard — BEFORE money moves. Guests must have a receipt
    // address; PayPal payer data is sparse for some payment methods.
    const guestEmail = (req.body.customerEmail || '').trim().toLowerCase();
    if (!req.user && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Email is required for guest checkout'
      });
    }

    // Cart resolution and emptiness — BEFORE money moves. Failing on these
    // after capture leaves a paid-but-no-order situation.
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

    // Fraud detection check
    const fraudData = validateFraudDetectionCookie(req);
    const orderAmount = parseFloat(purchaseUnit.amount.value);
    const shippingAddress = {
      addressLine1: purchaseUnit?.shipping?.address?.address_line_1,
      city: purchaseUnit?.shipping?.address?.admin_area_2,
      postalCode: purchaseUnit?.shipping?.address?.postal_code
    };

    const fraudAssessment = assessOrderFraudRisk(fraudData, {
      totalPrice: orderAmount,
      shippingAddress
    });

    // Block high-risk orders
    if (fraudAssessment.riskLevel === 'high') {
      logPaymentEvent('fraud_detection_blocked', {
        paypalOrderId,
        riskLevel: fraudAssessment.riskLevel,
        indicators: fraudAssessment.indicators,
        ip: fraudData.ip
      });
      return res.status(403).json({
        success: false,
        error: fraudAssessment.recommendation.message || 'Order could not be processed due to security concerns'
      });
    }

    // Decode the checkout reference threaded through custom_id at create time
    // ({ c: cartId, s: shippingMethodId }). Tolerant of pre-deploy orders.
    let checkoutRef = null;
    try {
      checkoutRef = JSON.parse(purchaseUnit?.custom_id || '');
    } catch {
      checkoutRef = null;
    }

    if (checkoutRef?.c && checkoutRef.c !== cart._id.toString()) {
      // The cart changed between PayPal approval and capture (e.g. edited in
      // another tab). Money has moved — log loudly for support reconciliation.
      logPaymentEvent('capture_cart_mismatch', {
        paypalOrderId,
        expectedCartId: checkoutRef.c,
        actualCartId: cart._id?.toString(),
        payerEmail: paymentDetails.payer?.email_address,
        amount: orderAmount
      });
      return res.status(409).json({
        success: false,
        error: 'Your cart changed after payment was approved. Please contact support with your PayPal order ID.',
        data: { paypalOrderId }
      });
    }

    // Resolve the real shipping method chosen at create time; fall back to a
    // default when custom_id is absent/unparseable (legacy PayPal orders).
    const breakdownShipping = parseFloat(purchaseUnit.amount.breakdown?.shipping?.value || 0);
    let shippingMethodData = {
      id: new mongoose.Types.ObjectId(),
      name: 'Standard Shipping',
      cost: breakdownShipping
    };
    if (checkoutRef?.s) {
      try {
        const ShippingMethodModel = (await import('../models/ShippingMethod.js')).default;
        const method = await ShippingMethodModel.findOne({ _id: checkoutRef.s });
        if (method) {
          shippingMethodData = {
            id: method._id,
            name: method.name,
            cost: breakdownShipping,
            ...(method.estimatedDeliveryDays ? {
              estimatedDelivery: `${method.estimatedDeliveryDays.min}-${method.estimatedDeliveryDays.max} business days`
            } : {})
          };
        }
      } catch (methodError) {
        logError(methodError, { context: 'capture_shipping_method_lookup', shippingMethodId: checkoutRef.s });
      }
    }

    await session.withTransaction(async () => {
      // Decrement stock per cart item (mirrors userOrderController.placeOrder).
      // Aborting after capture is a paid-but-no-order situation, so the thrown
      // error carries paypalOrderId for the 502 response and support lookup.
      for (const item of cart.items) {
        const filter = item.variationId
          ? { _id: item.productId, 'variations._id': item.variationId }
          : { _id: item.productId, 'variations.condition': item.condition, 'variations.color': item.color };
        const result = await Product.updateOne(
          filter,
          { $inc: { 'variations.$.stockQuantity': -item.quantity } },
          { session }
        );
        if (result.modifiedCount === 0) {
          const stockError = new Error('Insufficient stock after payment — order not created. Please contact support.');
          stockError.status = 502;
          stockError.paypalOrderId = paypalOrderId;
          logPaymentEvent('capture_failed_after_payment', {
            paypalOrderId,
            reason: 'insufficient_stock',
            productId: item.productId?.toString?.(),
            quantity: item.quantity
          });
          throw stockError;
        }
      }

      // Get shipping info from PayPal response
      const shippingInfo = purchaseUnit?.shipping || {};

      // Create order in database. Email precedence: account email (always
      // right for logged-in users) > guest-entered email (the address the
      // customer designated for this order) > PayPal payer email.
      const orderData = {
        userId: req.user?._id || null,
        isGuest: !req.user,
        customerEmail: req.user?.email || guestEmail || paymentDetails.payer?.email_address,
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
        shippingMethod: shippingMethodData,
        // Fraud detection metadata
        fraudDetection: {
          riskLevel: fraudAssessment.riskLevel,
          indicators: fraudAssessment.indicators || [],
          deviceFingerprint: fraudData.deviceFingerprint?.substring(0, 16),
          ipAddress: fraudData.ip
        }
      };

      const order = new Order(orderData);

      // Generate order number
      const orderCount = await Order.countDocuments({});
      order.orderNumber = `ORD${Date.now()}${(orderCount + 1).toString().padStart(4, '0')}`;

      await order.save({ session });

      // Send order confirmation email
      try {
        await emailService.sendOrderConfirmationEmail(order);
        logPaymentEvent('order_confirmation_email_sent', { orderId: order._id, orderNumber: order.orderNumber });
      } catch (emailError) {
        // Log email error but don't fail the order
        logError(emailError, { context: 'order_confirmation_email', orderId: order._id });
      }

      // Clear the cart — persisted via save() so the empty cart survives
      // (Cart#clearCart only mutates in memory and is never saved).
      cart.items = [];
      cart.totalItems = 0;
      cart.totalAmount = 0;
      await cart.save({ session });

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
        customerEmail: newOrder?.customerEmail,
        paymentMethod: 'paypal',
        status: 'captured'
      }
    });

  } catch (error) {
    logError(error, { context: 'paypal_payment_capture', orderId: req.params.orderId });
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Server error occurred while capturing PayPal payment',
      ...(error.paypalOrderId ? { data: { paypalOrderId: error.paypalOrderId } } : {})
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
  let orderId;
  try {
    const resource = webhookEvent?.resource;
    orderId = resource?.supplementary_data?.related_ids?.order_id;

    logPaymentEvent('paypal_payment_captured', { orderId });

    // TODO: Update order status in database
    // This will be implemented when we have Order model updates

  } catch (error) {
    logError(error, { context: 'paypal_capture_completed_handler', orderId });
  }
};

const handlePaymentCaptureDenied = async (webhookEvent) => {
  let orderId;
  try {
    const resource = webhookEvent?.resource;
    orderId = resource?.supplementary_data?.related_ids?.order_id;

    logPaymentEvent('paypal_payment_denied', { orderId });

    // TODO: Update order status in database

  } catch (error) {
    logError(error, { context: 'paypal_capture_denied_handler', orderId });
  }
};

const handleOrderApproved = async (webhookEvent) => {
  let orderId;
  try {
    const resource = webhookEvent?.resource;
    orderId = resource?.id;

    logPaymentEvent('paypal_order_approved', { orderId });

    // TODO: Update order status in database

  } catch (error) {
    logError(error, { context: 'paypal_order_approved_handler', orderId });
  }
};