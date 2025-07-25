import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserAddresses } from '../services/addressService';
import { calculateShippingRates } from '../services/shippingService';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

const CheckoutContext = createContext();

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
};

export const CheckoutProvider = ({ children }) => {
  const [checkoutState, setCheckoutState] = useState({
    step: 'payment', // payment, review
    deliveryAddress: null,
    shippingMethod: null,
    shippingCost: 0,
    paymentMethod: null,
    orderNotes: ''
  });
  
  const [paymentState, setPaymentState] = useState({
    isProcessing: false,
    error: null,
    paymentData: null
  });
  
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState('');
  
  const [shippingRates, setShippingRates] = useState([]);
  const [shippingRatesLoading, setShippingRatesLoading] = useState(false);
  const [shippingRatesError, setShippingRatesError] = useState('');
  
  const { isAuthenticated } = useAuth();
  const { cart } = useCart();

  const loadAddresses = useCallback(async () => {
    try {
      setAddressesLoading(true);
      setAddressesError('');
      const response = await getUserAddresses();
      setAddresses(response.data.addresses || []);
      
      // Auto-select default address if available
      const defaultAddress = response.data.addresses?.find(addr => addr.isDefault);
      if (defaultAddress && !checkoutState.deliveryAddress) {
        setCheckoutState(prev => ({
          ...prev,
          deliveryAddress: defaultAddress
        }));
      }
    } catch (err) {
      setAddressesError(err.message || 'Failed to load addresses');
    } finally {
      setAddressesLoading(false);
    }
  }, [checkoutState.deliveryAddress]);

  // Load addresses when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses();
    }
  }, [isAuthenticated, loadAddresses]);

  const setDeliveryAddress = (address) => {
    setCheckoutState(prev => ({
      ...prev,
      deliveryAddress: address
    }));
  };

  const setPaymentMethod = (paymentMethod) => {
    setCheckoutState(prev => ({
      ...prev,
      paymentMethod
    }));
  };

  const setOrderNotes = (notes) => {
    setCheckoutState(prev => ({
      ...prev,
      orderNotes: notes
    }));
  };

  const goToStep = (step) => {
    setCheckoutState(prev => ({
      ...prev,
      step
    }));
  };

  const nextStep = () => {
    const steps = ['payment', 'review'];
    const currentIndex = steps.indexOf(checkoutState.step);
    if (currentIndex < steps.length - 1) {
      goToStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps = ['payment', 'review'];
    const currentIndex = steps.indexOf(checkoutState.step);
    if (currentIndex > 0) {
      goToStep(steps[currentIndex - 1]);
    }
  };

  const resetCheckout = () => {
    setCheckoutState({
      step: 'payment',
      deliveryAddress: null,
      shippingMethod: null,
      shippingCost: 0,
      paymentMethod: null,
      orderNotes: ''
    });
    setPaymentState({
      isProcessing: false,
      error: null,
      paymentData: null
    });
    setShippingRates([]);
  };

  const setShippingMethod = (method) => {
    setCheckoutState(prev => ({
      ...prev,
      shippingMethod: method,
      shippingCost: method ? method.cost : 0
    }));
  };

  const refreshAddresses = () => {
    loadAddresses();
  };

  // Load shipping rates when delivery address or cart changes
  const loadShippingRates = useCallback(async (address = checkoutState.deliveryAddress) => {
    if (!address || !cart.items || cart.items.length === 0) {
      setShippingRates([]);
      return;
    }

    try {
      setShippingRatesLoading(true);
      setShippingRatesError('');
      
      // Prepare cart items for shipping calculation
      const cartItems = cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      const response = await calculateShippingRates(cartItems, address);
      setShippingRates(response.data.shippingRates || []);
      
      // If current shipping method is no longer available, clear it
      if (checkoutState.shippingMethod) {
        const isStillAvailable = response.data.shippingRates.find(
          rate => rate.id === checkoutState.shippingMethod.id
        );
        if (!isStillAvailable) {
          setShippingMethod(null);
        }
      }
    } catch (err) {
      setShippingRatesError(err.message || 'Failed to load shipping rates');
      setShippingRates([]);
    } finally {
      setShippingRatesLoading(false);
    }
  }, [checkoutState.deliveryAddress, cart.items, checkoutState.shippingMethod]);

  // Effect to load shipping rates when delivery address or cart changes
  useEffect(() => {
    if (checkoutState.deliveryAddress && cart.items.length > 0) {
      loadShippingRates();
    }
  }, [checkoutState.deliveryAddress, cart.items.length, loadShippingRates]);

  const refreshShippingRates = () => {
    loadShippingRates();
  };

  const contextValue = {
    // State
    checkoutState,
    paymentState,
    addresses,
    addressesLoading,
    addressesError,
    shippingRates,
    shippingRatesLoading,
    shippingRatesError,
    
    // Actions
    setDeliveryAddress,
    setShippingMethod,
    setPaymentMethod,
    setPaymentState,
    setOrderNotes,
    goToStep,
    nextStep,
    prevStep,
    resetCheckout,
    refreshAddresses,
    refreshShippingRates,
    
    // Computed values
    canProceedToReview: !!checkoutState.deliveryAddress && !!checkoutState.shippingMethod &&
      !!checkoutState.paymentMethod,
    isPaymentStep: checkoutState.step === 'payment',
    isReviewStep: checkoutState.step === 'review',
    
    // Order totals and summary
    subtotal: parseFloat(cart.totalAmount || 0),
    shippingCost: parseFloat(checkoutState.shippingCost || 0),
    orderTotal: parseFloat(cart.totalAmount || 0) + parseFloat(checkoutState.shippingCost || 0),
    orderSummary: {
      cartTotal: parseFloat(cart.totalAmount || 0),
      shippingCost: parseFloat(checkoutState.shippingCost || 0),
      orderTotal: parseFloat(cart.totalAmount || 0) + parseFloat(checkoutState.shippingCost || 0),
      currency: 'GBP',
      items: cart.items || [],
      shippingMethod: checkoutState.shippingMethod,
      deliveryAddress: checkoutState.deliveryAddress
    },
    
    // Convenience accessors
    deliveryAddress: checkoutState.deliveryAddress,
    shippingMethod: checkoutState.shippingMethod,
    paymentMethod: checkoutState.paymentMethod,
    orderNotes: checkoutState.orderNotes
  };

  return (
    <CheckoutContext.Provider value={contextValue}>
      {children}
    </CheckoutContext.Provider>
  );
};