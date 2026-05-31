import mongoose from 'mongoose';
import { Client, Environment } from '@paypal/paypal-server-sdk';

/**
 * PaymentController class with dependency injection for better testability
 */
export class PaymentController {
  constructor(dependencies = {}) {
    // Inject dependencies or use defaults
    this.models = {
      Cart: dependencies.Cart,
      Product: dependencies.Product,
      Order: dependencies.Order,
      ...dependencies.models
    };
    
    this.services = {
      paypalService: dependencies.paypalService,
      emailService: dependencies.emailService,
      ...dependencies.services
    };
    
    this.database = {
      mongoose: dependencies.mongoose || mongoose,
      startSession: dependencies.startSession || (() => mongoose.startSession()),
      ...dependencies.database
    };
    
    this.logger = dependencies.logger || {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {}
    };
    
    this.logError = dependencies.logError || (() => {});
    this.logPaymentEvent = dependencies.logPaymentEvent || (() => {});
    
    // PayPal client setup
    this.paypalClient = dependencies.paypalClient || this._initializePayPalClient();
  }

  _initializePayPalClient() {
    const paypalEnvironment = process.env.PAYPAL_ENVIRONMENT || 'sandbox';
    const paypalClientId = process.env.PAYPAL_CLIENT_ID;
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!paypalClientId || !paypalClientSecret) {
      return null;
    }

    try {
      const environment = paypalEnvironment === 'live' ? Environment.Production : Environment.Sandbox;
      return new Client({
        clientCredentialsAuthCredentials: {
          oAuthClientId: paypalClientId,
          oAuthClientSecret: paypalClientSecret
        },
        environment: environment
      });
    } catch (error) {
      this.logError(error, { context: 'paypal_client_initialization' });
      return null;
    }
  }

  /**
   * Get available payment methods
   */
  getPaymentMethods(req, res) {
    try {
      const methods = {
        paypal: {
          available: !!this.paypalClient,
          name: 'PayPal',
          description: 'Pay securely with PayPal'
        }
      };

      res.json({
        success: true,
        data: methods
      });
    } catch (error) {
      this.logError(error, { context: 'get_payment_methods' });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payment methods'
      });
    }
  }

  /**
   * Create PayPal order with proper validation and error handling
   */
  async createPayPalOrder(req, res) {
    const session = await this.database.startSession();
    
    try {
      const { shippingAddress, shippingMethodId } = req.body;

      // Validate PayPal client availability
      if (!this.paypalClient) {
        return res.status(500).json({
          success: false,
          error: 'PayPal payment processing is not available'
        });
      }

      // Validate required fields
      const validation = this._validatePaymentRequest(req.body, ['shippingAddress', 'shippingMethodId']);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      const result = await session.withTransaction(async () => {
        // Get user's cart
        const cart = await this._getUserCart(req.user.userId, session);
        if (!cart || cart.items.length === 0) {
          throw new Error('Cart is empty');
        }

        // Create order from cart
        const order = await this._createOrderFromCart(cart, {
          shippingAddress,
          shippingMethodId,
          userId: req.user.userId
        }, session);

        // Create PayPal order
        const paypalOrder = await this.services.paypalService?.createOrder({
          orderId: order._id.toString(),
          amount: order.totalAmount,
          currency: 'GBP',
          items: order.items
        });

        return { order, paypalOrder };
      });

      this.logPaymentEvent('paypal_order_created', {
        orderId: result.order._id,
        amount: result.order.totalAmount,
        paypalOrderId: result.paypalOrder?.id
      });

      res.status(200).json({
        success: true,
        data: {
          orderId: result.order._id,
          paypalOrderId: result.paypalOrder?.id,
          approvalUrl: result.paypalOrder?.links?.find(link => link.rel === 'approve')?.href
        }
      });

    } catch (error) {
      await session.abortTransaction();
      this.logError(error, { context: 'create_paypal_order', userId: req.user?.userId });
      
      const statusCode = this._getErrorStatusCode(error);
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to create PayPal order'
      });
    } finally {
      await session.endSession();
    }
  }

  // Helper methods

  _validatePaymentRequest(body, requiredFields = []) {
    for (const field of requiredFields) {
      if (!body[field]) {
        return {
          isValid: false,
          error: `${field} is required`
        };
      }
    }

    if (requiredFields.includes('shippingAddress')) {
      const addr = body.shippingAddress;
      if (!addr.fullName || !addr.addressLine1 || !addr.city || !addr.postalCode || !addr.country) {
        return {
          isValid: false,
          error: 'Complete shipping address is required'
        };
      }
    }

    return { isValid: true };
  }

  async _getUserCart(userId, session = null) {
    const query = this.models.Cart.findOne({ userId }).populate('items.productId');
    if (session) {
      query.session(session);
    }
    return query.exec();
  }

  async _createOrderFromCart(cart, orderData, session = null) {
    const orderItems = cart.items.map(item => ({
      productId: item.productId._id,
      quantity: item.quantity,
      price: item.productId.price,
      name: item.productId.name
    }));

    const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const order = new this.models.Order({
      userId: orderData.userId,
      items: orderItems,
      totalAmount,
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
      shippingMethodId: orderData.shippingMethodId,
      status: 'pending',
      paymentStatus: 'pending'
    });

    if (session) {
      return order.save({ session });
    }
    return order.save();
  }

  _getErrorStatusCode(error) {
    if (error.message.includes('not found')) return 404;
    if (error.message.includes('Unauthorized') || error.message.includes('access')) return 403;
    if (error.message.includes('required') || error.message.includes('invalid')) return 400;
    return 500;
  }
}

export default PaymentController;