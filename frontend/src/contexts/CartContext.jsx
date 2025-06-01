import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCart, addToCart as addToCartService } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext();

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

  // Load cart on mount and when authentication changes
  useEffect(() => {
    loadCart();
  }, [isAuthenticated]);

  const loadCart = async () => {
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
  };

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