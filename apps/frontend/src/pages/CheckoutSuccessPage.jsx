import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { capturePayPalPayment, formatCurrency } from '../services/paymentService';
import { useAuth } from '../contexts/AuthContext';

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Payment Processing - Graphene Security';

    // Preferred path: the checkout review already captured the payment
    // server-side and navigated here with the result — render it directly.
    const captured = location.state?.capturedOrder;
    if (captured) {
      setOrderData(captured);
      setStatus('success');
      document.title = 'Payment Successful - Graphene Security';
      return;
    }

    // Fallback: PayPal redirected back with ?token&PayerID (popup blocked
    // etc.) — the backend capture is idempotent, so this is safe.
    const processPayment = async () => {
      try {
        const paypalOrderId = searchParams.get('token');
        const payerId = searchParams.get('PayerID');

        if (paypalOrderId && payerId) {
          const response = await capturePayPalPayment({ paypalOrderId, payerId });
          if (response.success) {
            setOrderData(response.data);
            setStatus('success');
            document.title = 'Payment Successful - Graphene Security';
          } else {
            throw new Error(response.error || 'PayPal payment capture failed');
          }
        } else {
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
  }, [searchParams, location.state]);

  const handleRetryPayment = () => {
    navigate('/checkout');
  };

  // Processing state
  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-subtle border border-cyan-400 rounded-full mb-6">
            <svg className="h-8 w-8 text-cyan-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 8.0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h1 className="text-2xl font-display uppercase tracking-wider text-cyan-400 mb-4">Processing Payment</h1>
          <p className="text-text-secondary mb-6">
            Please wait while we confirm your payment. This may take a few moments.
          </p>
          <div className="card card-glow p-4">
            <p className="text-text-muted text-sm font-mono">
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
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-matrix-subtle border border-matrix-400 rounded-full mb-6">
            <svg className="h-8 w-8 text-matrix-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-display uppercase tracking-wider text-cyan-400 mb-4">Payment Successful!</h1>
          <p className="text-text-secondary mb-6">
            Your order has been placed{isAuthenticated ? '' : ' as a guest'}. Keep the order number below for your records.
          </p>

          {orderData && (
            <div className="card card-glow p-6 mb-6 text-left" data-testid="payment-summary">
              <h2 className="text-lg font-heading text-text-primary mb-4">Order Summary</h2>
              {orderData.orderNumber && (
                <div className="flex justify-between mb-2">
                  <span className="text-text-secondary">Order Number:</span>
                  <span className="font-semibold font-mono text-text-primary">#{orderData.orderNumber}</span>
                </div>
              )}
              {orderData.amount && (
                <div className="flex justify-between mb-2">
                  <span className="text-text-secondary">Amount Paid:</span>
                  <span className="font-semibold font-mono text-text-primary">{formatCurrency(orderData.amount)}</span>
                </div>
              )}
              {orderData.paymentMethod && (
                <div className="flex justify-between mb-2">
                  <span className="text-text-secondary">Payment Method:</span>
                  <span className="font-semibold capitalize text-text-primary">{orderData.paymentMethod}</span>
                </div>
              )}
              {orderData.customerEmail && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Confirmation sent to:</span>
                  <span className="font-semibold text-text-primary">{orderData.customerEmail}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            {isAuthenticated ? (
              orderData?.orderId && (
                <Link
                  to={`/orders/${orderData.orderId}`}
                  className="block btn btn-primary w-full px-6 py-3 rounded-lg text-center"
                >
                  View Order Details
                </Link>
              )
            ) : (
              <div className="card card-glow p-4 mb-2">
                <p className="text-text-muted text-sm font-mono">
                  A confirmation email with your order details is on its way.
                </p>
              </div>
            )}
            <Link
              to="/products"
              className="block btn btn-secondary w-full px-6 py-3 rounded-lg text-center"
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
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-subtle border border-red rounded-full mb-6">
            <svg className="h-8 w-8 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-display uppercase tracking-wider text-cyan-400 mb-4">Payment Failed</h1>
          <p className="text-text-secondary mb-6">
            {error || 'There was an issue processing your payment. Please try again.'}
          </p>

          <div className="bg-red-subtle border border-red rounded-lg p-4 mb-6 font-mono text-sm">
            <p className="text-red">
              Your payment was not processed. No charges have been made to your account.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRetryPayment}
              className="block btn btn-primary w-full px-6 py-3 rounded-lg text-center"
            >
              Try Again
            </button>
            <Link
              to="/cart"
              className="block btn btn-secondary w-full px-6 py-3 rounded-lg text-center"
            >
              Return to Cart
            </Link>
            <Link
              to="/support"
              className="block w-full px-6 py-3 text-cyan-400 hover:text-matrix-400 text-center"
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
