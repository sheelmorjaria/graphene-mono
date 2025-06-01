import ShippingMethod from '../models/ShippingMethod.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

// Calculate shipping rates for cart and address
export const calculateShippingRates = async (req, res) => {
  try {
    const { cartItems, shippingAddress } = req.body;

    // Input validation
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart items are required and must be a non-empty array'
      });
    }

    if (!shippingAddress || !shippingAddress.country) {
      return res.status(400).json({
        success: false,
        error: 'Shipping address with country is required'
      });
    }

    // Validate cart items structure
    for (const item of cartItems) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          error: 'Each cart item must have productId and quantity >= 1'
        });
      }

      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid product ID format'
        });
      }
    }

    // Validate country code
    if (!/^[A-Z]{2}$/.test(shippingAddress.country)) {
      return res.status(400).json({
        success: false,
        error: 'Country must be a valid ISO 3166-1 alpha-2 code (e.g., GB, IE)'
      });
    }

    // Fetch product details to get weights and prices
    const productIds = cartItems.map(item => item.productId);
    const products = await Product.find({ 
      _id: { $in: productIds },
      isActive: true 
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        error: 'One or more products not found or inactive'
      });
    }

    // Create product lookup map
    const productMap = new Map();
    products.forEach(product => {
      productMap.set(product._id.toString(), product);
    });

    // Prepare cart data for shipping calculation
    const cartData = {
      items: [],
      totalValue: 0
    };

    for (const cartItem of cartItems) {
      const product = productMap.get(cartItem.productId);
      
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

      const itemData = {
        productId: product._id,
        name: product.name,
        quantity: cartItem.quantity,
        unitPrice: product.price,
        totalPrice: product.price * cartItem.quantity,
        weight: product.weight || 100, // Default 100g if no weight specified
        dimensions: product.dimensions || { length: 10, width: 10, height: 5 } // Default dimensions in cm
      };

      cartData.items.push(itemData);
      cartData.totalValue += itemData.totalPrice;
    }

    // Round total value to 2 decimal places
    cartData.totalValue = Math.round(cartData.totalValue * 100) / 100;

    // Calculate shipping rates
    const availableRates = await ShippingMethod.calculateRatesForCart(cartData, shippingAddress);

    // If no shipping methods are available
    if (availableRates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No shipping methods available for the selected address and cart contents'
      });
    }

    res.json({
      success: true,
      data: {
        shippingRates: availableRates,
        cartSummary: {
          totalItems: cartData.items.reduce((sum, item) => sum + item.quantity, 0),
          totalWeight: cartData.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0),
          totalValue: cartData.totalValue,
          itemCount: cartData.items.length
        },
        shippingAddress: {
          country: shippingAddress.country,
          stateProvince: shippingAddress.stateProvince,
          city: shippingAddress.city,
          postalCode: shippingAddress.postalCode
        }
      }
    });

  } catch (error) {
    console.error('Calculate shipping rates error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while calculating shipping rates'
    });
  }
};

// Get all available shipping methods (for admin reference)
export const getShippingMethods = async (req, res) => {
  try {
    const methods = await ShippingMethod.getActiveShippingMethods();
    
    res.json({
      success: true,
      data: {
        shippingMethods: methods.map(method => ({
          id: method._id,
          code: method.code,
          name: method.name,
          description: method.description,
          estimatedDelivery: method.formattedDelivery,
          baseCost: method.baseCost,
          criteria: method.criteria,
          isActive: method.isActive
        }))
      }
    });

  } catch (error) {
    console.error('Get shipping methods error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while fetching shipping methods'
    });
  }
};

// Validate a specific shipping method for cart (used during checkout)
export const validateShippingMethod = async (req, res) => {
  try {
    const { methodId, cartItems, shippingAddress } = req.body;

    // Input validation
    if (!methodId || !mongoose.Types.ObjectId.isValid(methodId)) {
      return res.status(400).json({
        success: false,
        error: 'Valid shipping method ID is required'
      });
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart items are required'
      });
    }

    if (!shippingAddress || !shippingAddress.country) {
      return res.status(400).json({
        success: false,
        error: 'Shipping address is required'
      });
    }

    // Find the shipping method
    const shippingMethod = await ShippingMethod.findOne({ 
      _id: methodId, 
      isActive: true 
    });

    if (!shippingMethod) {
      return res.status(404).json({
        success: false,
        error: 'Shipping method not found or inactive'
      });
    }

    // Calculate rates for validation
    const availableRates = await ShippingMethod.calculateRatesForCart(
      { items: cartItems, totalValue: 0 }, // Will be calculated in the method
      shippingAddress
    );

    // Check if the requested method is in the available rates
    const selectedRate = availableRates.find(rate => rate.id.toString() === methodId);

    if (!selectedRate) {
      return res.status(400).json({
        success: false,
        error: 'Selected shipping method is not available for this cart and address'
      });
    }

    res.json({
      success: true,
      data: {
        shippingMethod: selectedRate,
        isValid: true
      }
    });

  } catch (error) {
    console.error('Validate shipping method error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while validating shipping method'
    });
  }
};