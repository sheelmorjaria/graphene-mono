import React, { useState } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { formatCurrency } from '../../services/paymentService';

const PayPalPayment = ({ orderSummary, onPaymentSuccess, onPaymentError, onPaymentCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // PayPal configuration
  const paypalOptions = {
    "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || "test",
    currency: "GBP",
    intent: "capture",
    components: "buttons",
    "disable-funding": "credit,card"
  };

  // Create PayPal order
  const createOrder = async (data, actions) => {
    try {
      setIsProcessing(true);
      setError(null);

      if (!orderSummary || !orderSummary.orderTotal) {
        throw new Error('Order summary is required');
      }

      // Create order through PayPal
      return actions.order.create({
        purchase_units: [{
          amount: {
            currency_code: "GBP",
            value: orderSummary.orderTotal.toFixed(2)
          },
          description: `Order from GrapheneOS Store - ${orderSummary.items?.length || 0} item(s)`,
          custom_id: `order_${Date.now()}`,
          invoice_id: `inv_${Date.now()}`
        }],
        application_context: {
          brand_name: "GrapheneOS Store",
          locale: "en-GB",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: `${window.location.origin}/checkout/success`,
          cancel_url: `${window.location.origin}/checkout`
        }
      });
    } catch (err) {
      console.error('Error creating PayPal order:', err);
      setError(err.message);
      setIsProcessing(false);
      throw err;
    }
  };

  // Handle successful payment
  const onApprove = async (data, actions) => {
    try {
      setIsProcessing(true);
      
      // Capture the payment
      const details = await actions.order.capture();
      
      console.log('PayPal payment successful:', details);
      
      // Call success callback with payment details
      if (onPaymentSuccess) {
        onPaymentSuccess({
          orderId: data.orderID,
          payerId: data.payerID,
          paymentDetails: details,
          paymentMethod: 'paypal'
        });
      }
    } catch (err) {
      console.error('Error capturing PayPal payment:', err);
      setError('Payment capture failed. Please try again.');
      setIsProcessing(false);
      
      if (onPaymentError) {
        onPaymentError(err);
      }
    }
  };

  // Handle payment error
  const onError = (err) => {
    console.error('PayPal payment error:', err);
    setError('Payment failed. Please try again or choose a different payment method.');
    setIsProcessing(false);
    
    if (onPaymentError) {
      onPaymentError(err);
    }
  };

  // Handle payment cancellation
  const onCancel = (data) => {
    console.log('PayPal payment cancelled:', data);
    setIsProcessing(false);
    
    if (onPaymentCancel) {
      onPaymentCancel(data);
    }
  };

  if (!orderSummary) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">Loading payment information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Order summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center text-lg font-semibold mb-3">
          <span>Total:</span>
          <span>{formatCurrency(orderSummary.orderTotal)}</span>
        </div>
        
        {/* Order items summary */}
        {orderSummary.items && orderSummary.items.length > 0 && (
          <div className="text-sm text-gray-600">
            <p>{orderSummary.items.length} item(s)</p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(orderSummary.cartTotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>{formatCurrency(orderSummary.shippingCost || 0)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* PayPal Buttons */}
      <div className={isProcessing ? 'opacity-50 pointer-events-none' : ''}>
        <PayPalScriptProvider options={paypalOptions}>
          <PayPalButtons
            style={{
              layout: "vertical",
              color: "blue",
              shape: "rect",
              label: "paypal",
              height: 50
            }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onError}
            onCancel={onCancel}
            disabled={isProcessing}
          />
        </PayPalScriptProvider>
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="text-center py-2">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-gray-600">Processing payment...</span>
          </div>
        </div>
      )}

      {/* PayPal information */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="text-sm text-blue-800">
          <p className="font-medium">Secure PayPal Payment</p>
          <p className="text-blue-700">
            You'll be able to review your order before completing the payment.
            Your financial information is never shared with us.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PayPalPayment;