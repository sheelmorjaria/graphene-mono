import React, { useState, useEffect } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCardIcon, ShieldCheckIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { getPaymentMethods, getStripe, formatCurrency } from '../../services/paymentService';
import { useCheckout } from '../../contexts/CheckoutContext';

// Card element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#374151',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      '::placeholder': {
        color: '#9CA3AF',
      },
      iconColor: '#6B7280',
    },
    invalid: {
      color: '#EF4444',
      iconColor: '#EF4444',
    },
  },
  hidePostalCode: true,
};

// Payment form component (needs to be inside Elements provider)
const PaymentForm = ({ onPaymentMethodReady, isProcessing, orderSummary }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState(null);

  const handleCardChange = (event) => {
    setCardComplete(event.complete);
    setCardError(event.error ? event.error.message : null);
    
    // Notify parent component about card readiness
    if (onPaymentMethodReady) {
      onPaymentMethodReady({
        isReady: event.complete && !event.error,
        stripe,
        elements,
        error: event.error
      });
    }
  };

  useEffect(() => {
    // Initial state notification
    if (onPaymentMethodReady) {
      onPaymentMethodReady({
        isReady: false,
        stripe,
        elements,
        error: null
      });
    }
  }, [stripe, elements, onPaymentMethodReady]);

  return (
    <div className="space-y-4">
      {/* Order summary */}
      {orderSummary && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total:</span>
            <span>{formatCurrency(orderSummary.orderTotal)}</span>
          </div>
        </div>
      )}

      {/* Card input */}
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <CardElement
          options={cardElementOptions}
          onChange={handleCardChange}
        />
      </div>

      {/* Error message */}
      {cardError && (
        <div className="text-red-600 text-sm flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {cardError}
        </div>
      )}

      {/* Security notices */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="flex items-start">
          <LockClosedIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Secure Payment</p>
            <p className="text-blue-600">Your payment information is encrypted and secure. We never store your card details.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentMethodSection = ({ isActive, isCompleted, onValidationChange }) => {
  const { 
    paymentMethod, 
    setPaymentMethod,
    paymentState,
    setPaymentState,
    orderSummary 
  } = useCheckout();
  
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stripeInstance, setStripeInstance] = useState(null);

  // Load Stripe and payment methods
  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        setLoading(true);
        
        // Load Stripe instance
        const stripe = await getStripe();
        setStripeInstance(stripe);
        
        // Load available payment methods
        const methods = await getPaymentMethods();
        setAvailablePaymentMethods(methods.paymentMethods || []);
        
        // Set default payment method if none selected
        if (!paymentMethod && methods.paymentMethods?.length > 0) {
          setPaymentMethod(methods.paymentMethods[0]);
        }
        
      } catch (err) {
        console.error('Error loading payment data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPaymentData();
  }, [paymentMethod, setPaymentMethod]);

  // Handle payment method selection
  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);
    setPaymentState({
      ...paymentState,
      isReady: false,
      error: null
    });
  };

  // Handle payment method readiness from Stripe Elements
  const handlePaymentMethodReady = (readyState) => {
    setPaymentState({
      stripe: readyState.stripe,
      elements: readyState.elements,
      isReady: readyState.isReady,
      error: readyState.error
    });

    // Notify parent about validation state
    if (onValidationChange) {
      onValidationChange({
        isValid: readyState.isReady && !readyState.error,
        error: readyState.error?.message
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Payment Method</h3>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
        <div className="text-gray-500">Loading payment methods...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Payment Method</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                Failed to load payment methods: {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Payment Method</h3>
        {isCompleted && (
          <div className="flex items-center text-green-600">
            <ShieldCheckIcon className="h-5 w-5 mr-1" />
            <span className="text-sm">Configured</span>
          </div>
        )}
      </div>

      {/* Payment method selection */}
      <div className="space-y-3">
        {availablePaymentMethods.map((method) => (
          <div
            key={method.id}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              paymentMethod?.id === method.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handlePaymentMethodSelect(method)}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCardIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-medium text-gray-900">{method.name}</h4>
                <p className="text-sm text-gray-500">{method.description}</p>
              </div>
              <div className="flex-shrink-0">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={paymentMethod?.id === method.id}
                  onChange={() => handlePaymentMethodSelect(method)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment form for selected method */}
      {isActive && paymentMethod?.type === 'card' && stripeInstance && (
        <Elements stripe={stripeInstance}>
          <PaymentForm
            onPaymentMethodReady={handlePaymentMethodReady}
            orderSummary={orderSummary}
          />
        </Elements>
      )}

      {/* Payment method not implemented notice */}
      {isActive && paymentMethod?.type !== 'card' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                {paymentMethod?.name} is not yet available. Please select a different payment method.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSection;