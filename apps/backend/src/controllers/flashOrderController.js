import FlashOrder from '../models/FlashOrder.js';
import logger, { logError, logPaymentEvent } from '../utils/logger.js';

// Supported Pixel models
const SUPPORTED_PIXEL_MODELS = [
  'Pixel 6', 'Pixel 6 Pro', 'Pixel 6a',
  'Pixel 7', 'Pixel 7 Pro', 'Pixel 7a',
  'Pixel 8', 'Pixel 8 Pro', 'Pixel 8a',
  'Pixel Fold',
  'Pixel 9', 'Pixel 9 Pro XL', 'Pixel 9a',
  'Pixel 10', 'Pixel 10a', 'Pixel 10 Pro', 'Pixel 10 Pro XL', 'Pixel 10 Pro Fold'
];

// Default pricing
const BASE_PRICE = 119.99;
const RETURN_SHIPPING = 19.99;

// PO Box address (revealed only after payment)
const PO_BOX_ADDRESS = {
  street: 'PO Box 12345',
  city: 'London',
  postalCode: 'E1 6AN',
  country: 'United Kingdom',
  instructions: 'Include your order number on the package. Wrap device in bubble wrap and use a sturdy box.'
};

/**
 * Create a new Flash Order
 * POST /api/flash-orders
 */
export const createFlashOrder = async (req, res) => {
  try {
    const { customerEmail, pixelModel, returnAddress, factoryResetConfirmed } = req.body;

    // Validate required fields
    if (!customerEmail || !pixelModel || !returnAddress) {
      return res.status(400).json({
        success: false,
        error: 'Customer email, pixel model, and return address are required'
      });
    }

    // Validate return address fields
    const requiredAddressFields = ['fullName', 'addressLine1', 'city', 'stateProvince', 'postalCode'];
    const missingAddressFields = requiredAddressFields.filter(field => !returnAddress[field]);
    if (missingAddressFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required address fields: ${missingAddressFields.join(', ')}`
      });
    }

    // Validate Pixel model
    if (!SUPPORTED_PIXEL_MODELS.includes(pixelModel)) {
      return res.status(400).json({
        success: false,
        error: `Invalid Pixel model. Only supported Pixel models are accepted. Received: ${pixelModel}`
      });
    }

    // Validate factory reset confirmation
    if (factoryResetConfirmed !== true) {
      return res.status(400).json({
        success: false,
        error: 'You must confirm that the device has been factory reset before ordering'
      });
    }

    // Create Flash Order
    const order = new FlashOrder({
      customerEmail,
      pixelModel,
      returnAddress: {
        fullName: returnAddress.fullName,
        addressLine1: returnAddress.addressLine1,
        addressLine2: returnAddress.addressLine2 || '',
        city: returnAddress.city,
        stateProvince: returnAddress.stateProvince,
        postalCode: returnAddress.postalCode,
        country: returnAddress.country || 'GB',
        phoneNumber: returnAddress.phoneNumber || ''
      },
      factoryResetConfirmed: true,
      basePrice: BASE_PRICE,
      returnShipping: RETURN_SHIPPING
    });

    await order.save();

    logPaymentEvent('flash_order_created', { orderId: order._id, orderNumber: order.orderNumber, pixelModel });

    // Return order WITHOUT PO Box address
    res.status(201).json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        pixelModel: order.pixelModel,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        basePrice: order.basePrice,
        returnShipping: order.returnShipping,
        totalPrice: order.totalPrice,
        createdAt: order.createdAt
      }
    });

  } catch (error) {
    logError(error, { context: 'flash_order_creation' });

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error occurred while creating flash order'
    });
  }
};

/**
 * Handle PayPal webhook for Flash Orders
 * POST /api/flash-orders/paypal-webhook
 */
export const handleFlashOrderWebhook = async (req, res) => {
  try {
    const webhookEvent = req.body;
    const eventType = webhookEvent.event_type;

    logPaymentEvent('flash_order_webhook_received', { eventType });

    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handleFlashPaymentCaptureCompleted(webhookEvent);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        await handleFlashPaymentCaptureDenied(webhookEvent);
        break;

      default:
        logger.warn(`Unhandled Flash Order webhook event: ${eventType}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    logError(error, { context: 'flash_order_webhook_processing' });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Handle successful payment capture for Flash Order
 */
const handleFlashPaymentCaptureCompleted = async (webhookEvent) => {
  try {
    const resource = webhookEvent.resource;
    const customId = resource.custom_id; // Flash Order ID
    const paypalOrderId = resource.supplementary_data?.related_ids?.order_id;
    const captureId = resource.id;
    const payerEmail = resource.payer?.email_address;
    const amount = resource.amount?.value;

    if (!customId) {
      logger.warn('Flash Order webhook missing custom_id');
      return;
    }

    // Find and update the Flash Order
    const order = await FlashOrder.findById(customId);
    if (!order) {
      logger.warn(`Flash Order not found for webhook: ${customId}`);
      return;
    }

    // Update order status and populate PO Box
    order.paymentStatus = 'Completed';
    order.orderStatus = 'Paid';
    order.poBoxAddress = PO_BOX_ADDRESS;
    order.paymentDetails = {
      paypalOrderId: paypalOrderId,
      paypalTransactionId: captureId,
      paypalPayerEmail: payerEmail
    };

    // Add status history entry
    order.statusHistory.push({
      status: 'Paid',
      timestamp: new Date(),
      note: 'Payment received via PayPal'
    });

    await order.save();

    logPaymentEvent('flash_order_payment_completed', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      paypalOrderId,
      amount
    });

  } catch (error) {
    logError(error, { context: 'flash_payment_capture_completed_handler' });
  }
};

/**
 * Handle denied payment capture for Flash Order
 * Note: We don't update the order status - customer can try payment again
 */
const handleFlashPaymentCaptureDenied = async (webhookEvent) => {
  try {
    const resource = webhookEvent.resource;
    const customId = resource.custom_id;

    if (!customId) {
      return;
    }

    const order = await FlashOrder.findById(customId);
    if (!order) {
      return;
    }

    // Log the denied payment but don't update order status
    // Customer can try payment again, so order remains in 'Unpaid' state
    logPaymentEvent('flash_order_payment_denied', { orderId: order._id });

  } catch (error) {
    logError(error, { context: 'flash_payment_capture_denied_handler' });
  }
};

/**
 * Get Flash Order shipping instructions (includes PO Box address)
 * GET /api/flash-orders/:id/instructions
 */
export const getFlashOrderInstructions = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order ID format'
      });
    }

    const order = await FlashOrder.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Flash Order not found'
      });
    }

    // Security: Only reveal PO Box if payment is completed
    if (order.paymentStatus !== 'Completed') {
      return res.status(403).json({
        success: false,
        error: 'You must complete payment before accessing shipping instructions'
      });
    }

    // Return instructions with PO Box address
    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        poBoxAddress: order.poBoxAddress,
        instructions: order.poBoxAddress?.instructions || 'Include your order number on the package.',
        returnAddress: order.returnAddress,
        createdAt: order.createdAt
      }
    });

  } catch (error) {
    logError(error, { context: 'flash_order_instructions' });
    res.status(500).json({
      success: false,
      error: 'Server error occurred while fetching instructions'
    });
  }
};
