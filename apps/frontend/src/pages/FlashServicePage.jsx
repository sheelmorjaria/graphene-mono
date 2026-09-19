import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FlashServiceForm from '../components/checkout/FlashServiceForm';
import PayPalPayment from '../components/checkout/PayPalPayment';
import { createFlashOrder, formatFlashOrderCurrency, getShippingOption } from '../services/flashOrderService';
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
          <div className="flex justify-center">
            <p className="text-lg text-text-secondary max-w-2xl text-center">
              Professional GrapheneOS installation for your Pixel device. We'll flash your phone
              with the latest version of GrapheneOS and return it securely.
            </p>
          </div>
        </div>

        {/* Device eligibility requirements — shown on the order step */}
        {step === 'form' && (
          <div className="max-w-2xl mx-auto mb-8 p-5 bg-yellow-400/10 border border-yellow-400/30 rounded-lg" data-testid="device-requirements">
            <h2 className="text-sm font-heading font-semibold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Before you send your device
            </h2>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">•</span>
                <span>
                  Your Pixel must be <strong className="text-text-primary">carrier unlocked (SIM-free)</strong>.
                  Carrier-locked devices cannot have their bootloader unlocked, so GrapheneOS cannot be installed.
                  Check with your carrier before ordering if you're unsure.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">•</span>
                <span>
                  Your device must <strong className="text-text-primary">not be blacklisted</strong> — reported lost or
                  stolen, or blocked by Google or your carrier. We verify the IMEI on arrival; blacklisted devices are
                  returned unflashed at the sender's expense and no refund of the service fee can be made.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">•</span>
                <span>
                  Ensure <strong className="text-text-primary">'OEM Unlocking'</strong> is available in your device's
                  Developer Options before sending it — carrier-locked devices often have it disabled, and the bootloader
                  cannot be unlocked without it.
                </span>
              </li>
            </ul>
          </div>
        )}

        {/* Refund policy for the flashing service (differs from the 28-day
            hardware policy — service supplied to specification, UK CCR 2013) */}
        {step === 'form' && (
          <div className="max-w-2xl mx-auto mb-8 p-5 bg-bg-card border border-border-subtle rounded-lg" data-testid="refund-policy">
            <h2 className="text-sm font-heading font-semibold text-cyan-400 uppercase tracking-wider mb-3">
              Refund Policy — Flash Service
            </h2>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">✓</span>
                <span><strong className="text-text-primary">Cancel any time before flashing begins</strong> for a full refund of everything you paid.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">✓</span>
                <span>If we <strong className="text-text-primary">cannot flash your device</strong> (for example it arrives carrier-locked with OEM Unlocking unavailable), you are refunded in full minus return shipping, and your device is returned to you at no charge.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">!</span>
                <span>Once flashing has begun the <strong className="text-text-primary">service fee is non-refundable</strong>: this service is supplied to your specification with your express consent, so your right to cancel ends when the service is performed (Consumer Contracts Regulations 2013).</span>
              </li>
            </ul>
            <p className="mt-3 text-xs text-text-muted border-t border-border-subtle pt-3">
              Please note: GrapheneOS alters the device's verified boot state. Certain high-security banking apps may not
              function on the flashed device. We are not responsible for software incompatibility post-flash.
            </p>
          </div>
        )}

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
                    <span className="text-text-secondary">Return Shipping ({getShippingOption(orderData.shippingRegion).label}):</span>
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
