import React, { createContext, useContext, useState, useEffect } from 'react';
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
    step: 'shipping', // shipping, payment, review
    shippingAddress: null,
    billingAddress: null,
    useSameAsShipping: true,
    shippingMethod: null,
    shippingCost: 0,
    paymentMethod: null,
    orderNotes: ''
  });
  
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState('');
  
  const [shippingRates, setShippingRates] = useState([]);
  const [shippingRatesLoading, setShippingRatesLoading] = useState(false);
  const [shippingRatesError, setShippingRatesError] = useState('');
  
  const { isAuthenticated } = useAuth();
  const { cart } = useCart();

  // Load addresses when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses();
    }
  }, [isAuthenticated]);

  const loadAddresses = async () => {
    try {
      setAddressesLoading(true);
      setAddressesError('');
      const response = await getUserAddresses();
      setAddresses(response.data.addresses || []);
      
      // Auto-select default address if available
      const defaultAddress = response.data.addresses?.find(addr => addr.isDefault);
      if (defaultAddress && !checkoutState.shippingAddress) {
        setCheckoutState(prev => ({
          ...prev,
          shippingAddress: defaultAddress
        }));
      }
    } catch (err) {
      setAddressesError(err.message || 'Failed to load addresses');
    } finally {
      setAddressesLoading(false);
    }
  };

  const setShippingAddress = (address) => {
    setCheckoutState(prev => ({
      ...prev,
      shippingAddress: address,
      // If using same as shipping, update billing address too
      billingAddress: prev.useSameAsShipping ? address : prev.billingAddress
    }));
  };

  const setBillingAddress = (address) => {
    setCheckoutState(prev => ({
      ...prev,
      billingAddress: address
    }));
  };

  const setUseSameAsShipping = (useSame) => {
    setCheckoutState(prev => ({
      ...prev,
      useSameAsShipping: useSame,
      // If switching to use shipping address, copy it to billing
      billingAddress: useSame ? prev.shippingAddress : prev.billingAddress
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
    const steps = ['shipping', 'payment', 'review'];
    const currentIndex = steps.indexOf(checkoutState.step);
    if (currentIndex < steps.length - 1) {
      goToStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps = ['shipping', 'payment', 'review'];
    const currentIndex = steps.indexOf(checkoutState.step);
    if (currentIndex > 0) {
      goToStep(steps[currentIndex - 1]);
    }
  };

  const resetCheckout = () => {
    setCheckoutState({
      step: 'shipping',
      shippingAddress: null,
      billingAddress: null,
      useSameAsShipping: true,
      shippingMethod: null,
      shippingCost: 0,
      paymentMethod: null,
      orderNotes: ''
    });
    setShippingRates([]);
  };

  const refreshAddresses = () => {
    loadAddresses();
  };

  // Load shipping rates when shipping address or cart changes
  const loadShippingRates = async (address = checkoutState.shippingAddress) => {
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
  };

  // Effect to load shipping rates when shipping address or cart changes
  useEffect(() => {
    if (checkoutState.shippingAddress && cart.items.length > 0) {
      loadShippingRates();
    }
  }, [checkoutState.shippingAddress, cart.items.length]);

  const setShippingMethod = (method) => {
    setCheckoutState(prev => ({
      ...prev,
      shippingMethod: method,
      shippingCost: method ? method.cost : 0
    }));
  };

  const refreshShippingRates = () => {
    loadShippingRates();
  };

  const contextValue = {
    // State
    checkoutState,
    addresses,
    addressesLoading,
    addressesError,
    shippingRates,
    shippingRatesLoading,
    shippingRatesError,
    
    // Actions
    setShippingAddress,
    setBillingAddress,
    setUseSameAsShipping,
    setShippingMethod,
    setPaymentMethod,
    setOrderNotes,
    goToStep,
    nextStep,
    prevStep,
    resetCheckout,
    refreshAddresses,
    refreshShippingRates,
    
    // Computed values
    canProceedToPayment: !!checkoutState.shippingAddress,
    canProceedToReview: !!checkoutState.shippingAddress && !!checkoutState.shippingMethod &&
      !!checkoutState.paymentMethod && 
      (checkoutState.useSameAsShipping || !!checkoutState.billingAddress),
    isShippingStep: checkoutState.step === 'shipping',
    isPaymentStep: checkoutState.step === 'payment',
    isReviewStep: checkoutState.step === 'review',
    
    // Order totals
    subtotal: parseFloat(cart.totalAmount || 0),
    shippingCost: parseFloat(checkoutState.shippingCost || 0),
    orderTotal: parseFloat(cart.totalAmount || 0) + parseFloat(checkoutState.shippingCost || 0)
  };

  return (
    <CheckoutContext.Provider value={contextValue}>
      {children}
    </CheckoutContext.Provider>
  );
};