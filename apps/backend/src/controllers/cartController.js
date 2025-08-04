import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { v4 as uuidv4 } from 'uuid';

// Helper function to get or create session ID for guest users
const getOrCreateSessionId = (req, res) => {
  let sessionId = req.cookies.cartSessionId;
  
  if (!sessionId) {
    sessionId = `guest-${uuidv4()}`;
    res.cookie('cartSessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
  }
  
  return sessionId;
};

// Helper function to find or create cart
const findOrCreateCart = async (req, res) => {
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
    const sessionId = getOrCreateSessionId(req, res);
    let cart = await Cart.findBySessionId(sessionId);
    if (!cart) {
      cart = new Cart({ sessionId });
      await cart.save();
    }
    return cart;
  }
};

// Get cart contents
export const getCart = async (req, res) => {
  try {
    const cart = await findOrCreateCart(req, res);
    
    const cartData = {
      _id: cart._id,
      items: cart.items.map(item => ({
        _id: item._id,
        productId: item.productId,
        variationId: item.variationId,
        productName: item.productName,
        productSlug: item.productSlug,
        productImage: item.productImage,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
        variationDetails: item.variationDetails
      })),
      totalItems: cart.totalItems,
      totalAmount: cart.totalAmount,
      lastModified: cart.lastModified
    };


    res.json({
      success: true,
      data: {
        cart: cartData
      }
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while fetching cart'
    });
  }
};

// Add product to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, variationId } = req.body;

    // Input validation
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be a number between 1 and 99'
      });
    }

    // Find product and check availability
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check if this is a product with variations
    let selectedVariation = null;
    let stockQuantity = 0;
    let price = 0;
    let sku = '';

    if (product.variations && product.variations.length > 0) {
      // Product has variations, variationId is required
      if (!variationId) {
        return res.status(400).json({
          success: false,
          error: 'Please select a product variation'
        });
      }

      selectedVariation = product.variations.id(variationId);
      if (!selectedVariation) {
        return res.status(404).json({
          success: false,
          error: 'Selected variation not found'
        });
      }

      stockQuantity = selectedVariation.stockQuantity;
      price = selectedVariation.salePrice || selectedVariation.price;
      sku = selectedVariation.sku;

      if (selectedVariation.stockStatus === 'out_of_stock' || stockQuantity < quantity) {
        return res.status(400).json({
          success: false,
          error: `Only ${stockQuantity} items available in stock`
        });
      }
    } else {
      // Legacy product without variations
      return res.status(400).json({
        success: false,
        error: 'This product requires variation selection'
      });
    }

    // Find or create cart
    const cart = await findOrCreateCart(req, res);

    // Check if adding this quantity would exceed stock
    const cartItemId = variationId ? `${productId}_${variationId}` : productId;
    const existingItem = cart.items.find(
      item => {
        if (variationId) {
          return item.productId.toString() === productId && item.variationId === variationId;
        }
        return item.productId.toString() === productId;
      }
    );
    const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
    const totalQuantityAfterAdd = currentQuantityInCart + quantity;

    if (totalQuantityAfterAdd > stockQuantity) {
      return res.status(400).json({
        success: false,
        error: `Cannot add ${quantity} items. You already have ${currentQuantityInCart} in cart. Only ${stockQuantity} available.`
      });
    }

    // Add item to cart with variation info
    const itemData = {
      product,
      quantity,
      variationId: variationId || null,
      variationDetails: selectedVariation ? {
        condition: selectedVariation.condition,
        color: selectedVariation.color,
        sku: selectedVariation.sku,
        price: selectedVariation.salePrice || selectedVariation.price
      } : null
    };
    
    cart.addItem(itemData);
    await cart.save();

    res.json({
      success: true,
      message: 'Product added to cart successfully',
      data: {
        cart: {
          totalItems: cart.totalItems,
          totalAmount: cart.totalAmount,
          itemCount: cart.items.length
        },
        addedItem: {
          productId: product._id,
          variationId: variationId || null,
          productName: product.name,
          quantity: quantity,
          unitPrice: price,
          sku: sku,
          variationDetails: selectedVariation ? {
            condition: selectedVariation.condition,
            color: selectedVariation.color
          } : null
        }
      }
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while adding to cart'
    });
  }
};

// Update item quantity in cart
export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params; // Can be productId or productId_variationId
    const { quantity } = req.body;

    // Parse itemId to get productId and variationId
    const [productId, variationId] = itemId.includes('_') ? itemId.split('_') : [itemId, null];

    // Input validation
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }

    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be a number between 0 and 99'
      });
    }

    // Find cart
    const cart = await findOrCreateCart(req, res);

    // Check if item exists in cart
    const existingItem = cart.items.find(
      item => {
        if (variationId) {
          return item.productId.toString() === productId && item.variationId === variationId;
        }
        return item.productId.toString() === productId && !item.variationId;
      }
    );

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in cart'
      });
    }

    // If quantity > 0, check stock availability
    if (quantity > 0) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      // Check stock based on variation or product
      let stockQuantity = 0;
      if (variationId && product.variations && product.variations.length > 0) {
        const variation = product.variations.id(variationId);
        if (!variation) {
          return res.status(404).json({
            success: false,
            error: 'Variation not found'
          });
        }
        stockQuantity = variation.stockQuantity;
      } else {
        // Should not reach here with new variation system
        return res.status(400).json({
          success: false,
          error: 'Product variation required'
        });
      }

      if (quantity > stockQuantity) {
        return res.status(400).json({
          success: false,
          error: `Only ${stockQuantity} items available in stock`
        });
      }
    }

    // Update item quantity (or remove if quantity is 0)
    cart.updateItemQuantity(itemId, quantity);
    await cart.save();

    res.json({
      success: true,
      message: quantity > 0 ? 'Cart updated successfully' : 'Item removed from cart',
      data: {
        cart: {
          totalItems: cart.totalItems,
          totalAmount: cart.totalAmount,
          itemCount: cart.items.length
        }
      }
    });

  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while updating cart'
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params; // Can be productId or productId_variationId
    
    // Parse itemId to get productId and variationId
    const [productId, variationId] = itemId.includes('_') ? itemId.split('_') : [itemId, null];

    // Input validation
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID format'
      });
    }

    // Find cart
    const cart = await findOrCreateCart(req, res);

    // Check if item exists in cart
    const existingItem = cart.items.find(
      item => {
        if (variationId) {
          return item.productId.toString() === productId && item.variationId === variationId;
        }
        return item.productId.toString() === productId && !item.variationId;
      }
    );

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in cart'
      });
    }

    // Remove item from cart
    cart.removeItem(itemId);
    await cart.save();

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: {
        cart: {
          totalItems: cart.totalItems,
          totalAmount: cart.totalAmount,
          itemCount: cart.items.length
        }
      }
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while removing from cart'
    });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const cart = await findOrCreateCart(req, res);
    
    cart.clearCart();
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        cart: {
          totalItems: 0,
          totalAmount: 0,
          itemCount: 0
        }
      }
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while clearing cart'
    });
  }
};