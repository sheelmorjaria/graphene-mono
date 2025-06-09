import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import MoneroPayment from '../components/checkout/MoneroPayment';

const MoneroPaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Monero Payment - GrapheneOS Store';
    
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

      const response = await fetch(`/api/payments/monero/status/${orderId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load order details');
      }

      const data = await response.json();
      
      if (data.success) {
        setOrder(data.data);
        setPaymentStatus(data.data.paymentStatus);
      } else {
        throw new Error(data.error || 'Failed to load order details');
      }

    } catch (err) {
      console.error('Error loading order details:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentStatusChange = (statusData) => {
    setPaymentStatus(statusData.status);
    
    // If payment is completed, redirect to order confirmation after a delay
    if (statusData.status === 'confirmed') {
      setTimeout(() => {
        navigate(`/order-confirmation/${orderId}`);
      }, 3000);
    }
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-red-600 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/checkout')}
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Checkout
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Try Again
              </button>
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
          <div className="flex items-center justify-between">
            <Link
              to="/checkout"
              className="inline-flex items-center text-orange-600 hover:text-orange-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Checkout
            </Link>
            
            {paymentStatus === 'confirmed' && (
              <div className="flex items-center text-green-600">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">Payment Confirmed!</span>
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <h1 className="text-3xl font-bold text-gray-900">Monero Payment</h1>
            <p className="text-gray-600 mt-2">
              Complete your order by sending Monero to the address below
            </p>
          </div>
        </div>

        {/* Payment Status Banner */}
        {paymentStatus === 'confirmed' && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
              <div>
                <h3 className="font-medium text-green-900">Payment Confirmed!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Your Monero payment has been confirmed. You'll be redirected to the order confirmation page shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Monero Payment Component */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {order && (
            <MoneroPayment
              paymentData={{
                orderId: order.orderId,
                moneroAddress: order.moneroAddress, // This would come from the order
                xmrAmount: order.xmrAmount, // This would come from the order
                exchangeRate: order.exchangeRate, // This would come from the order
                validUntil: order.validUntil, // This would come from the order
                expirationTime: order.expirationTime, // This would come from the order
                requiredConfirmations: order.requiredConfirmations || 10,
                paymentWindowHours: order.paymentWindowHours || 24,
                orderTotal: order.orderTotal || 0 // This would be the GBP total
              }}
              onPaymentUpdate={handlePaymentStatusChange}
              onError={handleError}
            />
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Payment Issues</h4>
              <ul className="space-y-1">
                <li>• Ensure you send the exact amount shown</li>
                <li>• Use a personal Monero wallet (not an exchange)</li>
                <li>• Payment must be received within 24 hours</li>
                <li>• Allow time for network confirmations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Contact Support</h4>
              <p className="mb-2">
                If you experience any issues with your payment, please contact our support team.
              </p>
              <Link
                to="/contact-us"
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Contact Support →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoneroPaymentPage;