import React, { useState } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useCheckout } from '../../contexts/CheckoutContext';
import { createPayPalOrder, capturePayPalPayment, formatCurrency } from '../../services/paymentService';

// Splits "Jane Doe" into first/last for the backend's create-order payload
// (it reads shippingAddress.firstName / .lastName).
const splitFullName = (fullName = '') => {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ') || '';
  return { firstName, lastName };
};

const mapAddressForApi = (address = {}) => ({
  ...splitFullName(address.fullName),
  addressLine1: address.addressLine1,
  addressLine2: address.addressLine2 || '',
  city: address.city,
  stateProvince: address.stateProvince,
  postalCode: address.postalCode,
  country: address.country,
  phoneNumber: address.phoneNumber || ''
});

// Server-side PayPal flow: the BACKEND creates and captures the PayPal
// order (stock validation, amounts, order persistence all happen server-
// side). The JS SDK buttons only start/approve the payment. Works for both
// logged-in users (Bearer + user cart) and guests (cartSessionId cookie).
const PayPalServerPayment = ({ orderSummary, onSuccess, onError, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const { guestEmail, isGuestCheckout, shippingMethod } = useCheckout();

  const paypalOptions = {
    'client-id': import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test',
    currency: 'GBP',
    intent: 'capture',
    components: 'buttons',
    'disable-funding': 'credit,card'
  };

  // PayPalButtons contract: createOrder must return the order-ID STRING.
  const createOrder = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const data = await createPayPalOrder({
        shippingAddress: mapAddressForApi(orderSummary.shippingAddress),
        shippingMethodId: shippingMethod?.id,
        customerEmail: isGuestCheckout ? guestEmail : undefined
      });

      return data.paypalOrderId;
    } catch (err) {
      console.error('Error creating PayPal order:', err);
      setError(err.message || 'Could not start the payment. Please try again.');
      setIsProcessing(false);
      throw err; // routes to PayPal onError
    }
  };

  // NO actions.order.capture() here — the backend captures, persists the
  // order, clears the cart and emails the receipt.
  const onApprove = async (paypalData) => {
    try {
      setIsProcessing(true);

      const response = await capturePayPalPayment({
        paypalOrderId: paypalData.orderID,
        payerId: paypalData.payerID,
        customerEmail: isGuestCheckout ? guestEmail : undefined
      });

      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      console.error('Error capturing PayPal payment:', err);
      setError(err.message || 'Payment capture failed. Please contact support.');
      setIsProcessing(false);
      if (onError) {
        onError(err);
      }
    }
  };

  const handlePayPalError = (err) => {
    console.error('PayPal payment error:', err);
    setError('Payment failed. Please try again or choose a different payment method.');
    setIsProcessing(false);
    if (onError) {
      onError(err);
    }
  };

  const handleCancel = (data) => {
    setIsProcessing(false);
    if (onCancel) {
      onCancel(data);
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
          <span data-testid="paypal-order-total">
            {formatCurrency(orderSummary.orderTotal)}
          </span>
        </div>

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
        <div data-testid="payment-error" className="bg-red-50 border border-red-200 rounded-lg p-4">
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
      <div
        data-testid="paypal-checkout-button"
        className={isProcessing ? 'opacity-50 pointer-events-none' : ''}
      >
        <PayPalScriptProvider options={paypalOptions}>
          <PayPalButtons
            style={{
              layout: 'vertical',
              color: 'blue',
              shape: 'rect',
              label: 'paypal',
              height: 50
            }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={handlePayPalError}
            onCancel={handleCancel}
            disabled={isProcessing}
          />
        </PayPalScriptProvider>
      </div>

      {/* Processing indicator — the backend capture is a real network hop */}
      {isProcessing && (
        <div data-testid="payment-processing" className="text-center py-2">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
            <span className="text-sm text-gray-600">Processing payment...</span>
          </div>
        </div>
      )}

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

export default PayPalServerPayment;
