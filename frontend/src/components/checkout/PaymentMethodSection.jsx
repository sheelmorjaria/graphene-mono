import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { getPaymentMethods, formatCurrency } from '../../services/paymentService';
import { useCheckout } from '../../contexts/CheckoutContext';
import PayPalPayment from './PayPalPayment';
import MoneroPayment from './MoneroPayment';

const PaymentMethodSection = ({ isActive, isCompleted, onValidationChange }) => {
  const { 
    paymentMethod, 
    setPaymentMethod,
    paymentState: _paymentState,
    setPaymentState,
    orderSummary 
  } = useCheckout();
  
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paypalError, setPaypalError] = useState(null);

  // Load payment methods
  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        setLoading(true);
        
        // Load available payment methods
        const methods = await getPaymentMethods();
        setAvailablePaymentMethods(methods.paymentMethods || []);
        
        // Set default payment method to PayPal if none selected
        if (!paymentMethod && methods.paymentMethods?.length > 0) {
          const paypalMethod = methods.paymentMethods.find(method => method.type === 'paypal');
          if (paypalMethod) {
            setPaymentMethod(paypalMethod);
          }
        }
        
      } catch (err) {
        console.error('Error loading payment data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPaymentData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: Only want to load payment methods once on mount, not when paymentMethod changes

  // Update validation state based on payment method and readiness
  useEffect(() => {
    if (paymentMethod?.type === 'paypal') {
      // PayPal is always ready once selected (no additional validation needed)
      const isValid = !paypalError;
      
      if (onValidationChange) {
        onValidationChange({
          isValid,
          error: paypalError
        });
      }
    } else if (paymentMethod?.type === 'bitcoin') {
      // Bitcoin is always ready once selected (payment happens externally)
      if (onValidationChange) {
        onValidationChange({
          isValid: true,
          error: null
        });
      }
    } else if (paymentMethod?.type === 'monero') {
      // Monero is always ready once selected (payment happens externally)
      if (onValidationChange) {
        onValidationChange({
          isValid: true,
          error: null
        });
      }
    }
  }, [paymentMethod, paypalError, onValidationChange]);

  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);
    setPaypalError(null);
    
    // Reset payment state when changing methods
    setPaymentState({
      isProcessing: false,
      error: null
    });
  };

  const handlePayPalSuccess = (paymentData) => {
    console.log('PayPal payment successful:', paymentData);
    setPaymentState({
      isProcessing: false,
      error: null,
      paymentData
    });
  };

  const handlePayPalError = (error) => {
    console.error('PayPal payment error:', error);
    setPaypalError(error.message || 'PayPal payment failed');
    setPaymentState({
      isProcessing: false,
      error: error.message || 'PayPal payment failed'
    });
  };

  const handlePayPalCancel = () => {
    console.log('PayPal payment cancelled');
    setPaymentState({
      isProcessing: false,
      error: null
    });
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200">
        <div className="text-red-600">
          <h3 className="font-medium mb-2">Payment Methods Unavailable</h3>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      data-testid="payment-methods"
      className={`bg-white p-6 rounded-lg shadow-sm transition-all duration-200 ${
      isActive ? 'border-2 border-blue-500' : 'border border-gray-200'
    } ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
      
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            isCompleted ? 'bg-green-500 text-white' : 
            isActive ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            {isCompleted ? '✓' : '3'}
          </div>
          <h2 className="ml-3 text-lg font-medium text-gray-900">Payment Method</h2>
        </div>
        
        {isCompleted && (
          <span className="text-sm text-green-600 font-medium">Selected</span>
        )}
      </div>

      {/* Payment Methods */}
      {isActive && (
        <div className="space-y-4">
          
          {/* Payment Method Selection */}
          <div 
            data-testid="payment-methods-accordion"
            className="space-y-3"
          >
            {availablePaymentMethods.map((method) => (
              <label
                key={method.id}
                data-testid={`payment-method-${method.type}`}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod?.id === method.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.id}
                  checked={paymentMethod?.id === method.id}
                  onChange={() => handlePaymentMethodSelect(method)}
                  className="sr-only"
                />
                
                <div className="flex items-center flex-1">
                  {/* Payment Method Icon */}
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                    {method.type === 'paypal' ? (
                      <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">PP</span>
                      </div>
                    ) : method.type === 'bitcoin' ? (
                      <div className="h-6 w-6 bg-orange-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">₿</span>
                      </div>
                    ) : method.type === 'monero' ? (
                      <div className="h-6 w-6 bg-orange-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">ɱ</span>
                      </div>
                    ) : (
                      <div className="h-6 w-6 bg-gray-400 rounded"></div>
                    )}
                  </div>

                  {/* Payment Method Details */}
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{method.name}</p>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        paymentMethod?.id === method.id
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {paymentMethod?.id === method.id && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{method.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* PayPal Payment Component */}
          {paymentMethod?.type === 'paypal' && orderSummary && (
            <div 
              data-testid="paypal-checkout-section"
              className="mt-6 border-t pt-6"
            >
              <PayPalPayment
                orderSummary={orderSummary}
                onPaymentSuccess={handlePayPalSuccess}
                onPaymentError={handlePayPalError}
                onPaymentCancel={handlePayPalCancel}
              />
            </div>
          )}

          {/* Bitcoin Payment Information */}
          {paymentMethod?.type === 'bitcoin' && (
            <div className="mt-6 border-t pt-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">₿</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Bitcoin Payment Process</h4>
                    <div className="mt-2 text-sm text-gray-700">
                      <p className="mb-2">When you proceed to checkout:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>You'll receive a unique Bitcoin address and exact amount</li>
                        <li>Payment must be received within 24 hours</li>
                        <li>Order confirmation after 2 network confirmations (~30 minutes)</li>
                        <li>Current exchange rate will be locked for 15 minutes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Monero Payment Information */}
          {paymentMethod?.type === 'monero' && (
            <div className="mt-6 border-t pt-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-orange-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">ɱ</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Monero Payment Process</h4>
                    <div className="mt-2 text-sm text-gray-700">
                      <p className="mb-2">When you proceed to checkout:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>You'll receive a unique Monero address and exact XMR amount</li>
                        <li>Payment must be received within 24 hours</li>
                        <li>Order confirmation after 10 network confirmations (~20 minutes)</li>
                        <li>Current exchange rate will be locked for 5 minutes</li>
                        <li>Completely private and untraceable payment</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Information */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start">
              <ShieldCheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <LockClosedIcon className="h-4 w-4 mr-1" />
                  Secure Payment
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          {orderSummary && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Order Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(orderSummary.cartTotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">{formatCurrency(orderSummary.shippingCost || 0)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-medium text-gray-900">Total:</span>
                  <span className="font-bold text-lg">{formatCurrency(orderSummary.orderTotal || 0)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completed State Display */}
      {isCompleted && paymentMethod && (
        <div className="text-sm text-gray-600">
          <p>Selected payment method: <span className="font-medium">{paymentMethod.name}</span></p>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSection;