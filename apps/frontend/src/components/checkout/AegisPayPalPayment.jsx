import React, { useState } from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import {
  createAegisPayPalPayment,
  captureAegisPayPalPayment
} from '../../services/aegisService';

// Server-side PayPal for the Aegis Hardening Suite — same flow as checkout
// and the flash service: the BACKEND creates and captures the PayPal order
// (amounts are never client-controlled); the buttons only start/approve the
// payment.
const AegisPayPalPayment = ({ orderId, amount, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

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
      const data = await createAegisPayPalPayment(orderId);
      return data.paypalOrderId;
    } catch (err) {
      console.error('Error creating Aegis PayPal order:', err);
      setError(err.message || 'Could not start the payment. Please try again.');
      setIsProcessing(false);
      throw err;
    }
  };

  // NO actions.order.capture() — the backend captures and completes the
  // licence order (the capture response carries the download link, passed
  // through to the success step).
  const onApprove = async (paypalData) => {
    try {
      setIsProcessing(true);
      const captureData = await captureAegisPayPalPayment(orderId, {
        paypalOrderId: paypalData.orderID,
        payerId: paypalData.payerID
      });
      if (onSuccess) {
        onSuccess(captureData);
      }
    } catch (err) {
      console.error('Error capturing Aegis PayPal payment:', err);
      setError(err.message || 'Payment capture failed. Please contact support.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {amount !== undefined && (
        <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4 flex justify-between items-center">
          <span className="font-heading font-semibold text-text-primary">Total to pay:</span>
          <span className="font-mono text-lg text-cyan-400" data-testid="aegis-payment-total">
            £{Number(amount).toFixed(2)}
          </span>
        </div>
      )}

      {error && (
        <div data-testid="aegis-payment-error" className="bg-red-subtle border border-red rounded-lg p-4 text-sm text-red">
          {error}
        </div>
      )}

      <div className={isProcessing ? 'opacity-50 pointer-events-none' : ''} data-testid="aegis-paypal-button">
        <PayPalScriptProvider options={paypalOptions}>
          <PayPalButtons
            style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'paypal', height: 50 }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={() => setError((current) => current || 'Payment failed. Please try again.')}
            onCancel={() => setIsProcessing(false)}
            disabled={isProcessing}
          />
        </PayPalScriptProvider>
      </div>

      {isProcessing && (
        <div className="text-center py-2 text-sm text-text-secondary" data-testid="aegis-payment-processing">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400 mr-2" />
            Processing payment...
          </div>
        </div>
      )}
    </div>
  );
};

export default AegisPayPalPayment;
