import mongoose from 'mongoose';
import { Client, Environment, OrdersController, PaymentsController } from '@paypal/paypal-server-sdk';
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
    const client = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: paypalClientId,
        oAuthClientSecret: paypalClientSecret
      },
      environment: environment
    });
    // SDK v1.x exposes controllers as standalone classes constructed with the
    // client — the v0.x `client.ordersController` property no longer exists
    // (prod 503: "Cannot read properties of undefined (reading 'ordersCreate')").
    return {
      client,
      ordersController: new OrdersController(client),
      paymentsController: new PaymentsController(client)
    };
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

    // Create PayPal order request. SDK v1.x validates camelCase JS objects
    // (the SDK serializes to snake_case on the wire) — snake_case keys here
    // fail with ArgumentsValidationError before the request ever leaves.
    const orderRequest = {
      intent: 'CAPTURE',
      purchaseUnits: [{
        // Round-trips cart + shipping method to capture (create is stateless).
        // PayPal caps custom_id at 127 chars; compact keys keep it ~60.
        customId: JSON.stringify({ c: cart._id.toString(), s: shippingMethodId }),
        amount: {
          currencyCode: 'GBP',
          value: orderTotal.toFixed(2),
          breakdown: {
            itemTotal: {
              currencyCode: 'GBP',
              value: cartTotal.toFixed(2)
            },
            shipping: {
              currencyCode: 'GBP',
              value: shippingCost.toFixed(2)
            }
          }
        },
        items: cartItems.map(item => ({
          name: item.name,
          unitAmount: {
            currencyCode: 'GBP',
            value: item.unitPrice.toFixed(2)
          },
          quantity: item.quantity.toString()
        })),
        shipping: {
          name: {
            fullName: `${shippingAddress.firstName} ${shippingAddress.lastName}`
          },
          address: {
            addressLine1: shippingAddress.addressLine1,
            addressLine2: shippingAddress.addressLine2 || '',
            adminArea2: shippingAddress.city,
            adminArea1: shippingAddress.stateProvince,
            postalCode: shippingAddress.postalCode,
            countryCode: shippingAddress.country
          }
        }
      }],
      applicationContext: {
        brandName: 'Graphene Security',
        landingPage: 'NO_PREFERENCE',
        userAction: 'PAY_NOW',
        returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/success`,
        cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout`
      }
    };

    // Create PayPal order
    let paypalOrder;
    try {
      const ordersController = paypalClient.ordersController;
      paypalOrder = await ordersController.createOrder({
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

    // Capture the PayPal payment. This call moves the money — a throw here is
    // pre-money (auth/network failure), so surface a graceful 503 instead of
    // leaking raw SDK errors to the client.
    const ordersController = paypalClient.ordersController;
    let captureResponse;
    try {
      captureResponse = await ordersController.captureOrder({
        id: paypalOrderId
      });
    } catch (paypalError) {
      logError(paypalError, { context: 'paypal_api_error', paypalOrderId });
      return res.status(503).json({
        success: false,
        error: 'PayPal service is temporarily unavailable. Please try again later or use an alternative payment method.'
      });
    }

    if (captureResponse.result.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'PayPal payment capture failed'
      });
    }

    // Extract payment details (SDK v1.x deserializes responses to camelCase)
    const paymentDetails = captureResponse.result;
    const purchaseUnit = paymentDetails.purchaseUnits?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];

    if (!capture) {
      return res.status(400).json({
        success: false,
        error: 'PayPal payment capture information not found'
      });
    }

    // Resolve the captured amount. PayPal omits purchase_units[].amount on some
    // capture responses (seen in sandbox 2026-09-08 — crashed with 500 AFTER
    // the money moved); the capture resource itself always carries it.
    const unitAmount = purchaseUnit?.amount;
    const orderAmount = parseFloat(unitAmount?.value ?? capture.amount?.value ?? 0);

    // Fraud detection check
    const fraudData = validateFraudDetectionCookie(req);
    const shippingAddress = {
      addressLine1: purchaseUnit?.shipping?.address?.addressLine1,
      city: purchaseUnit?.shipping?.address?.adminArea2,
      postalCode: purchaseUnit?.shipping?.address?.postalCode
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
      checkoutRef = JSON.parse(purchaseUnit?.customId || '');
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
        payerEmail: paymentDetails.payer?.emailAddress,
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
    const breakdownShipping = parseFloat(unitAmount?.breakdown?.shipping?.value || 0);
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
        customerEmail: req.user?.email || guestEmail || paymentDetails.payer?.emailAddress,
        items: cart.items.map(item => ({
          productId: item.productId,
          productName: item.productName || 'Product',
          productSlug: item.productSlug || 'product',
          quantity: item.quantity,
          unitPrice: item.unitPrice || item.price,
          totalPrice: (item.unitPrice || item.price) * item.quantity
        })),
        subtotal: parseFloat(unitAmount?.breakdown?.itemTotal?.value || 0),
        shipping: parseFloat(unitAmount?.breakdown?.shipping?.value || 0),
        tax: parseFloat(unitAmount?.breakdown?.taxTotal?.value || 0),
        totalAmount: orderAmount,
        paymentMethod: {
          type: 'paypal',
          name: 'PayPal'
        },
        paymentDetails: {
          paypalOrderId: paypalOrderId,
          paypalPaymentId: capture.id,
          paypalPayerId: payerId,
          paypalTransactionId: capture.id,
          paypalPayerEmail: paymentDetails.payer?.emailAddress,
          transactionId: capture.id
        },
        paymentStatus: 'completed',
        status: 'processing',
        shippingAddress: {
          fullName: shippingInfo.name?.fullName || `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || 'Customer',
          addressLine1: shippingInfo.address?.addressLine1 || 'Address Line 1',
          addressLine2: shippingInfo.address?.addressLine2 || '',
          city: shippingInfo.address?.adminArea2 || 'City',
          stateProvince: shippingInfo.address?.adminArea1 || 'State',
          postalCode: shippingInfo.address?.postalCode || '00000',
          country: shippingInfo.address?.countryCode || 'GB',
          phoneNumber: req.user?.phone || ''
        },
        billingAddress: {
          fullName: shippingInfo.name?.fullName || `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || 'Customer',
          addressLine1: shippingInfo.address?.addressLine1 || 'Address Line 1',
          addressLine2: shippingInfo.address?.addressLine2 || '',
          city: shippingInfo.address?.adminArea2 || 'City',
          stateProvince: shippingInfo.address?.adminArea1 || 'State',
          postalCode: shippingInfo.address?.postalCode || '00000',
          country: shippingInfo.address?.countryCode || 'GB',
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
        amount: orderAmount,
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