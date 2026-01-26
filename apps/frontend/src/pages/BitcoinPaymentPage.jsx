import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
      <div className="min-h-screen bg-bg-primary py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card card-glow p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              <span className="ml-3 text-text-secondary">Loading payment details...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card card-glow p-8">
            {/* Header */}
            <div className="mb-8">
              <Link
                to="/cart"
                className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary mb-4"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Cart
              </Link>
              <h1 className="text-2xl font-bold text-cyan-400 uppercase tracking-wider">Payment Error</h1>
            </div>

            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6">
              <p className="text-red-400">{error}</p>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={loadOrderDetails}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                >
                  Try Again
                </button>
                <Link
                  to="/cart"
                  className="px-4 py-2 bg-bg-muted text-text-primary rounded-md hover:bg-bg-hover transition-colors text-sm"
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
    <div className="min-h-screen bg-bg-primary py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/cart"
            className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary mb-4"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Cart
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-cyan-400 uppercase tracking-wider">Bitcoin Payment</h1>
              {order && (
                <p className="text-text-secondary mt-1">
                  Order #{order.orderNumber || orderId}
                </p>
              )}
            </div>

            {paymentStatus === 'completed' && (
              <div className="flex items-center text-matrix-400">
                <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Payment Confirmed</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Complete Success Message */}
        {paymentStatus === 'completed' && (
          <div className="bg-matrix-900/30 border border-matrix-400/50 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-matrix-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-matrix-400">Payment Confirmed!</h3>
                <p className="text-text-secondary mt-1">
                  Your Bitcoin payment has been confirmed with 2+ network confirmations.
                  Your order is now being processed.
                </p>
                <p className="text-text-muted text-sm mt-2">
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
          <div className="mt-8 card card-glow p-6">
            <h3 className="text-lg font-medium text-cyan-400 mb-4 uppercase tracking-wider">Order Summary</h3>
            <div className="border-t border-border-default pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Order ID:</span>
                <span className="font-medium font-mono">{order.orderNumber || orderId}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-text-secondary">Payment Method:</span>
                <span className="font-medium">Bitcoin</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-text-secondary">Status:</span>
                <span className={`font-medium capitalize ${
                  paymentStatus === 'completed' ? 'text-matrix-400' :
                  paymentStatus === 'awaiting_confirmation' ? 'text-yellow-400' :
                  paymentStatus === 'expired' || paymentStatus === 'underpaid' ? 'text-red-400' :
                  'text-text-secondary'
                }`}>
                  {paymentStatus.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 card card-glow p-6">
          <h3 className="text-lg font-medium text-cyan-400 mb-3 uppercase tracking-wider">Need Help?</h3>
          <div className="space-y-2 text-sm text-text-secondary">
            <p>• Make sure to send the exact amount displayed above</p>
            <p>• Double-check the Bitcoin address before sending</p>
            <p>• Payment must be received within 24 hours</p>
            <p>• Contact support if you experience any issues</p>
          </div>
          <div className="mt-4">
            <Link
              to="/contact"
              className="text-cyan-400 hover:text-cyan-300 underline text-sm"
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