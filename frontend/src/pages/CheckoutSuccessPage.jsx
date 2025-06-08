import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { capturePayPalPayment, formatCurrency } from '../services/paymentService';

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Payment Processing - GrapheneOS Store';
    
    const processPayment = async () => {
      try {
        // Get payment information from URL parameters
        const paypalOrderId = searchParams.get('token'); // PayPal order ID
        const payerId = searchParams.get('PayerID'); // PayPal payer ID

        if (paypalOrderId && payerId) {
          // Handle PayPal payment completion
          await handlePayPalPayment(paypalOrderId, payerId);
        } else {
          // No valid payment parameters found
          setError('Invalid payment parameters. Please try again.');
          setStatus('error');
        }
      } catch (err) {
        console.error('Payment processing error:', err);
        setError(err.message || 'Payment processing failed');
        setStatus('error');
      }
    };

    processPayment();
  }, [searchParams]);

  const handlePayPalPayment = async (paypalOrderId, payerId) => {
    try {
      setStatus('processing');
      
      // Capture the PayPal payment
      const response = await capturePayPalPayment({
        paypalOrderId,
        payerId
      });

      if (response.success) {
        setOrderData(response.data);
        setStatus('success');
        
        // Update document title
        document.title = 'Payment Successful - GrapheneOS Store';
        
        // Redirect to order confirmation page after a short delay
        setTimeout(() => {
          if (response.data.orderId) {
            navigate(`/orders/${response.data.orderId}`);
          } else {
            navigate('/orders');
          }
        }, 3000);
      } else {
        throw new Error(response.error || 'PayPal payment capture failed');
      }
    } catch (err) {
      console.error('PayPal payment processing error:', err);
      setError(err.message || 'PayPal payment processing failed');
      setStatus('error');
    }
  };


  const handleRetryPayment = () => {
    navigate('/checkout');
  };

  // Processing state
  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">Processing Payment</h1>
          <p className="text-gray-600 mb-6">
            Please wait while we confirm your payment. This may take a few moments.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              Please do not close this window or navigate away from this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your payment has been processed successfully. You will be redirected to your order details shortly.
          </p>
          
          {orderData && (
            <div className="bg-white rounded-lg shadow p-6 mb-6 text-left">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Summary</h2>
              {orderData.orderNumber && (
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-semibold">#{orderData.orderNumber}</span>
                </div>
              )}
              {orderData.amount && (
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-semibold">{formatCurrency(orderData.amount)}</span>
                </div>
              )}
              {orderData.paymentMethod && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold capitalize">{orderData.paymentMethod}</span>
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              Redirecting to your order details in a few seconds...
            </p>
          </div>

          <div className="space-y-3">
            <Link
              to="/orders"
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View My Orders
            </Link>
            <Link
              to="/products"
              className="block w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-4">Payment Failed</h1>
          <p className="text-gray-600 mb-6">
            {error || 'There was an issue processing your payment. Please try again.'}
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">
              Your payment was not processed. No charges have been made to your account.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRetryPayment}
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              to="/cart"
              className="block w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Return to Cart
            </Link>
            <Link
              to="/support"
              className="block w-full px-6 py-3 text-blue-600 hover:text-blue-700 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CheckoutSuccessPage;