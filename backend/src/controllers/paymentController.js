import Stripe from 'stripe';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { calculateShippingRates } from './shippingController.js';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fake_key_for_testing');

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
    
    let cart = await Cart.findBySessionId(sessionId);
    if (!cart) {
      throw new Error('Cart not found');
    }
    return cart;
  }
};

// Create payment intent for Stripe
export const createPaymentIntent = async (req, res) => {
  try {
    const { shippingAddress, shippingMethodId } = req.body;

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

    // Verify all cart items are still available and get current prices
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

    // Create product lookup map
    const productMap = new Map();
    products.forEach(product => {
      productMap.set(product._id.toString(), product);
    });

    // Recalculate cart total with current prices
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

      // Check stock availability
      if (product.stockQuantity < cartItem.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for product ${product.name}. Available: ${product.stockQuantity}, Requested: ${cartItem.quantity}`
        });
      }

      const itemTotal = product.price * cartItem.quantity;
      cartTotal += itemTotal;

      cartItems.push({
        productId: product._id,
        name: product.name,
        quantity: cartItem.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal,
        weight: product.weight || 100
      });
    }

    // Calculate shipping cost
    const { calculateShippingRates } = await import('./shippingController.js');
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

    // Calculate shipping cost for verification
    const cartData = {
      items: cartItems,
      totalValue: cartTotal
    };

    const calculation = shippingMethod.calculateCost(cartData, shippingAddress);
    if (calculation === null) {
      return res.status(400).json({
        success: false,
        error: 'Shipping method not available for this cart and address'
      });
    }

    const shippingCost = calculation.cost;
    const orderTotal = cartTotal + shippingCost;

    // Convert to smallest currency unit (pence for GBP)
    const amountInPence = Math.round(orderTotal * 100);

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: 'gbp',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: req.user?._id?.toString() || 'guest',
        cartId: cart._id.toString(),
        shippingMethodId: shippingMethodId,
        cartTotal: cartTotal.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        orderTotal: orderTotal.toFixed(2)
      }
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        orderSummary: {
          cartTotal: cartTotal,
          shippingCost: shippingCost,
          orderTotal: orderTotal,
          currency: 'GBP',
          items: cartItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          })),
          shippingMethod: {
            id: shippingMethod._id,
            name: shippingMethod.name,
            cost: shippingCost
          },
          shippingAddress: shippingAddress
        }
      }
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    
    if (error.type === 'StripeError') {
      return res.status(400).json({
        success: false,
        error: `Payment processing error: ${error.message}`
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error occurred while creating payment intent'
    });
  }
};

// Get payment intent details
export const getPaymentIntent = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment intent ID is required'
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      success: true,
      data: {
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata
        }
      }
    });

  } catch (error) {
    console.error('Get payment intent error:', error);
    
    if (error.type === 'StripeError') {
      return res.status(400).json({
        success: false,
        error: `Payment processing error: ${error.message}`
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error occurred while retrieving payment intent'
    });
  }
};

// Stripe webhook handler
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        
        // TODO: Create order in database
        // This will be implemented when we have the Order model
        // await createOrderFromPaymentIntent(paymentIntent);
        
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        
        // TODO: Handle failed payment
        // Maybe send notification or update order status
        
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Get available payment methods
export const getPaymentMethods = async (req, res) => {
  try {
    // For now, return static payment methods
    // In production, you might want to configure these dynamically
    const paymentMethods = [
      {
        id: 'card',
        type: 'card',
        name: 'Credit or Debit Card',
        description: 'Pay securely with your credit or debit card',
        icon: 'credit-card',
        enabled: true
      },
      {
        id: 'paypal',
        type: 'paypal',
        name: 'PayPal',
        description: 'Pay with your PayPal account',
        icon: 'paypal',
        enabled: false // Not implemented yet
      },
      {
        id: 'apple_pay',
        type: 'apple_pay',
        name: 'Apple Pay',
        description: 'Pay with Touch ID or Face ID',
        icon: 'apple',
        enabled: false // Not implemented yet
      },
      {
        id: 'google_pay',
        type: 'google_pay',
        name: 'Google Pay',
        description: 'Pay with Google Pay',
        icon: 'google',
        enabled: false // Not implemented yet
      }
    ];

    res.json({
      success: true,
      data: {
        paymentMethods: paymentMethods.filter(method => method.enabled)
      }
    });

  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while fetching payment methods'
    });
  }
};