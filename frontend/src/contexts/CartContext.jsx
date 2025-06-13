import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getCart, 
  addToCart as addToCartService, 
  updateCartItem as updateCartItemService,
  removeFromCart as removeFromCartService,
  clearCart as clearCartService
} from '../services/cartService';
import { useAuth } from './AuthContext';

export const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({
    items: [],
    totalItems: 0,
    totalAmount: 0,
    itemCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { isAuthenticated } = useAuth();

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getCart();
      setCart(response.data.cart);
    } catch (err) {
      setError(err.message || 'Failed to load cart');
      // Don't clear cart on error - keep existing state
    } finally {
      setLoading(false);
    }
  }, []);

  // Load cart on mount and when authentication changes
  useEffect(() => {
    loadCart();
  }, [isAuthenticated, loadCart]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await addToCartService(productId, quantity);
      
      // Update cart state with new totals
      setCart(prevCart => ({
        ...prevCart,
        totalItems: response.data.cart.totalItems,
        totalAmount: response.data.cart.totalAmount,
        itemCount: response.data.cart.itemCount
      }));

      // Optionally reload full cart to get updated items
      await loadCart();
      
      return {
        success: true,
        message: response.message,
        addedItem: response.data.addedItem
      };
      
    } catch (err) {
      setError(err.message || 'Failed to add to cart');
      return {
        success: false,
        error: err.message || 'Failed to add to cart'
      };
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (productId, quantity) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await updateCartItemService(productId, quantity);
      
      // Reload cart to get updated state
      await loadCart();
      
      return {
        success: true,
        message: response.message
      };
      
    } catch (err) {
      setError(err.message || 'Failed to update cart item');
      return {
        success: false,
        error: err.message || 'Failed to update cart item'
      };
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await removeFromCartService(productId);
      
      // Reload cart to get updated state
      await loadCart();
      
      return {
        success: true,
        message: response.message
      };
      
    } catch (err) {
      setError(err.message || 'Failed to remove item from cart');
      return {
        success: false,
        error: err.message || 'Failed to remove item from cart'
      };
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await clearCartService();
      
      // Reload cart to get updated state
      await loadCart();
      
      return {
        success: true,
        message: response.message
      };
      
    } catch (err) {
      setError(err.message || 'Failed to clear cart');
      return {
        success: false,
        error: err.message || 'Failed to clear cart'
      };
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = () => {
    loadCart();
  };

  const clearError = () => {
    setError('');
  };

  const contextValue = {
    cart,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
    clearError,
    // Computed values for easy access
    isEmpty: cart.items.length === 0,
    itemCount: cart.totalItems || 0
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};