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
      sameSite: 'lax',
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
        productName: item.productName,
        productSlug: item.productSlug,
        productImage: item.productImage,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal
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
    const { productId, quantity = 1 } = req.body;

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

    if (product.stockQuantity < quantity) {
      return res.status(400).json({
        success: false,
        error: `Only ${product.stockQuantity} items available in stock`
      });
    }

    // Find or create cart
    const cart = await findOrCreateCart(req, res);

    // Check if adding this quantity would exceed stock
    const existingItem = cart.items.find(
      item => item.productId.toString() === productId
    );
    const currentQuantityInCart = existingItem ? existingItem.quantity : 0;
    const totalQuantityAfterAdd = currentQuantityInCart + quantity;

    if (totalQuantityAfterAdd > product.stockQuantity) {
      return res.status(400).json({
        success: false,
        error: `Cannot add ${quantity} items. You already have ${currentQuantityInCart} in cart. Only ${product.stockQuantity} available.`
      });
    }

    // Add item to cart
    cart.addItem(product, quantity);
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
          productName: product.name,
          quantity: quantity,
          unitPrice: product.price
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
    const { productId } = req.params;
    const { quantity } = req.body;

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
      item => item.productId.toString() === productId
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

      if (quantity > product.stockQuantity) {
        return res.status(400).json({
          success: false,
          error: `Only ${product.stockQuantity} items available in stock`
        });
      }
    }

    // Update item quantity (or remove if quantity is 0)
    cart.updateItemQuantity(productId, quantity);
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
    const { productId } = req.params;

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
      item => item.productId.toString() === productId
    );

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in cart'
      });
    }

    // Remove item from cart
    cart.removeItem(productId);
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


// Merge guest cart when user logs in (called by auth controller)
export const mergeGuestCart = async (userId, sessionId) => {
  try {
    if (!sessionId) return null;
    
    const mergedCart = await Cart.mergeGuestCart(userId, sessionId);
    return mergedCart;
  } catch (error) {
    console.error('Merge guest cart error:', error);
    throw error;
  }
};