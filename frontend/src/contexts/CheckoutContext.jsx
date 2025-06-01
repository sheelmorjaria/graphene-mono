import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserAddresses } from '../services/addressService';
import { useAuth } from './AuthContext';

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
    paymentMethod: null,
    orderNotes: ''
  });
  
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState('');
  
  const { isAuthenticated } = useAuth();

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
      paymentMethod: null,
      orderNotes: ''
    });
  };

  const refreshAddresses = () => {
    loadAddresses();
  };

  const contextValue = {
    // State
    checkoutState,
    addresses,
    addressesLoading,
    addressesError,
    
    // Actions
    setShippingAddress,
    setBillingAddress,
    setUseSameAsShipping,
    setPaymentMethod,
    setOrderNotes,
    goToStep,
    nextStep,
    prevStep,
    resetCheckout,
    refreshAddresses,
    
    // Computed values
    canProceedToPayment: !!checkoutState.shippingAddress,
    canProceedToReview: !!checkoutState.shippingAddress && !!checkoutState.paymentMethod && 
      (checkoutState.useSameAsShipping || !!checkoutState.billingAddress),
    isShippingStep: checkoutState.step === 'shipping',
    isPaymentStep: checkoutState.step === 'payment',
    isReviewStep: checkoutState.step === 'review'
  };

  return (
    <CheckoutContext.Provider value={contextValue}>
      {children}
    </CheckoutContext.Provider>
  );
};