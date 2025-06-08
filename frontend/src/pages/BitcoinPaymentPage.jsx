import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import BitcoinPayment from '../components/checkout/BitcoinPayment';
import { getBitcoinPaymentStatus } from '../services/paymentService';

const BitcoinPaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('awaiting_confirmation');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Bitcoin Payment - GrapheneOS Store';
    
    if (orderId) {
      loadOrderDetails();
    } else {
      setError('Invalid order ID');
      setLoading(false);
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getBitcoinPaymentStatus(orderId);
      setOrder(response.data);
      setPaymentStatus(response.data.paymentStatus);

    } catch (err) {
      console.error('Error loading order details:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentStatusChange = (newStatus) => {
    setPaymentStatus(newStatus);
    
    // If payment is completed, redirect to order confirmation after a delay
    if (newStatus === 'completed') {
      setTimeout(() => {
        navigate(`/order-confirmation/${orderId}`);
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <span className="ml-3 text-gray-600">Loading payment details...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            {/* Header */}
            <div className="mb-8">
              <Link
                to="/cart"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Cart
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Payment Error</h1>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-700">{error}</p>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={loadOrderDetails}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  Try Again
                </button>
                <Link
                  to="/cart"
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm"
                >
                  Back to Cart
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/cart"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Cart
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bitcoin Payment</h1>
              {order && (
                <p className="text-gray-600 mt-1">
                  Order #{order.orderNumber || orderId}
                </p>
              )}
            </div>
            
            {paymentStatus === 'completed' && (
              <div className="flex items-center text-green-600">
                <CheckCircleIcon className="h-6 w-6 mr-2" />
                <span className="font-medium">Payment Confirmed</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Complete Success Message */}
        {paymentStatus === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-green-900">Payment Confirmed!</h3>
                <p className="text-green-700 mt-1">
                  Your Bitcoin payment has been confirmed with 2+ network confirmations. 
                  Your order is now being processed.
                </p>
                <p className="text-green-600 text-sm mt-2">
                  Redirecting to order confirmation in a few seconds...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bitcoin Payment Component */}
        <BitcoinPayment
          orderId={orderId}
          orderTotal={order?.orderTotal || 0}
          onPaymentStatusChange={handlePaymentStatusChange}
        />

        {/* Order Summary */}
        {order && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{order.orderNumber || orderId}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium">Bitcoin</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium capitalize ${
                  paymentStatus === 'completed' ? 'text-green-600' :
                  paymentStatus === 'awaiting_confirmation' ? 'text-yellow-600' :
                  paymentStatus === 'expired' || paymentStatus === 'underpaid' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {paymentStatus.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Need Help?</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• Make sure to send the exact amount displayed above</p>
            <p>• Double-check the Bitcoin address before sending</p>
            <p>• Payment must be received within 24 hours</p>
            <p>• Contact support if you experience any issues</p>
          </div>
          <div className="mt-4">
            <Link
              to="/contact"
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              Contact Support →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BitcoinPaymentPage;