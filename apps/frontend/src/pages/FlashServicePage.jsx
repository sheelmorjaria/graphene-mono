import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FlashServiceForm from '../components/checkout/FlashServiceForm';
import PayPalPayment from '../components/checkout/PayPalPayment';
import { createFlashOrder, formatFlashOrderCurrency } from '../services/flashOrderService';
import SEOWrapper from '../components/SEO/SEOWrapper';

const FlashServicePage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('form'); // 'form' | 'payment' | 'success'
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && user) {
      setOrderData(prev => ({
        ...prev,
        customerEmail: user.email
      }));
    }
  }, [isAuthenticated, user]);

  const handleFormSuccess = (data) => {
    setOrderData(data);
    setStep('payment');
  };

  const handleFormError = (err) => {
    setError(err.message || 'Failed to create order. Please try again.');
  };

  const handlePaymentSuccess = (paymentData) => {
    setStep('success');
    // Navigate to success page with order ID
    navigate(`/flash-order/success?orderId=${orderData.orderId}`, {
      state: { orderData, paymentData }
    });
  };

  const handlePaymentError = (err) => {
    setError(err.message || 'Payment failed. Please try again.');
  };

  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <SEOWrapper
        title="GrapheneOS Flashing Service"
        description="Send us your Pixel device and we'll flash it with GrapheneOS, the privacy-focused mobile OS. Professional flashing service with secure shipping."
        keywords={['GrapheneOS flashing', 'Pixel flashing', 'privacy phone', 'GrapheneOS installation']}
      />

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-text-primary mb-4">
            GrapheneOS Flashing Service
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto text-center">
            Professional GrapheneOS installation for your Pixel device. We'll flash your phone
            with the latest version of GrapheneOS and return it securely.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step === 'form' ? 'text-cyan-400' : 'text-text-muted'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm ${
                step === 'form' ? 'bg-cyan-400/20 border-2 border-cyan-400' : 'bg-bg-elevated border-2 border-border-subtle'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-heading uppercase tracking-wider">Order</span>
            </div>
            <div className={`flex-1 h-0.5 mx-4 ${step === 'payment' || step === 'success' ? 'bg-cyan-400' : 'bg-border-subtle'}`}></div>
            <div className={`flex items-center ${step === 'payment' || step === 'success' ? 'text-cyan-400' : 'text-text-muted'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm ${
                step === 'payment' || step === 'success' ? 'bg-cyan-400/20 border-2 border-cyan-400' : 'bg-bg-elevated border-2 border-border-subtle'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-heading uppercase tracking-wider">Payment</span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-400/10 border border-red-400/30 rounded-lg">
            <p className="text-red-400 text-center">{error}</p>
            <button
              onClick={() => setError('')}
              className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Form Step */}
        {step === 'form' && (
          <FlashServiceForm
            onSuccess={handleFormSuccess}
            onError={handleFormError}
          />
        )}

        {/* Payment Step */}
        {step === 'payment' && orderData && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8 p-6 bg-bg-card rounded-lg border border-border-subtle">
              <h2 className="text-xl font-display font-bold text-text-primary mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Order Number:</span>
                  <span className="text-text-primary font-mono">{orderData.orderNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Pixel Model:</span>
                  <span className="text-text-primary">{orderData.pixelModel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Email:</span>
                  <span className="text-text-primary">{orderData.customerEmail}</span>
                </div>
                <div className="pt-3 border-t border-border-subtle space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Flashing Service:</span>
                    <span className="text-text-primary font-mono">{formatFlashOrderCurrency(orderData.basePrice || 119.99)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Return Shipping:</span>
                    <span className="text-text-primary font-mono">{formatFlashOrderCurrency(orderData.returnShipping || 20.45)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border-subtle font-semibold">
                    <span className="text-text-primary">Total:</span>
                    <span className="text-cyan-400 font-mono font-bold">{formatFlashOrderCurrency(orderData.totalPrice || 140.44)}</span>
                  </div>
                </div>
              </div>
            </div>

            <PayPalPayment
              flashOrderId={orderData.orderId}
              orderSummary={{
                orderTotal: orderData.totalPrice || 140.44,
                cartTotal: orderData.basePrice || 119.99,
                shippingCost: orderData.returnShipping || 20.45,
                items: [{
                  name: `GrapheneOS Flashing - ${orderData.pixelModel}`,
                  quantity: 1,
                  unitPrice: orderData.basePrice || 119.99,
                  totalPrice: orderData.basePrice || 119.99
                }]
              }}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              onPaymentCancel={() => setStep('form')}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashServicePage;
