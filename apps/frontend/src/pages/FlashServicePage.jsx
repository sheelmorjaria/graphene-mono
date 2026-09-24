import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FlashServiceForm from '../components/checkout/FlashServiceForm';
import FlashOrderPayPalPayment from '../components/checkout/FlashOrderPayPalPayment';
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
                <span>If we <strong className="text-text-primary">cannot flash your device</strong> (for example if it arrives carrier-locked), you are refunded in full minus return shipping, and your device is returned to you at no charge.</span>
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

            {/* Server-side PayPal (backend creates + captures; amounts are
                never client-controlled, and payment status is final BEFORE
                we navigate — no webhook-timing "Order Pending" limbo). */}
            <FlashOrderPayPalPayment
              orderId={orderData.orderId}
              amount={orderData.totalPrice || 140.44}
              onSuccess={handlePaymentSuccess}
            />
          </div>
        )}

        {/* How it works + supported devices — crawlable prose describing the
            service (form-only pages read as thin content to search engines,
            which flagged this page as a soft 404). Always visible. */}
        <div className="max-w-2xl mx-auto mt-12 grid gap-6" data-testid="service-info">
          <section className="bg-bg-card border border-border-subtle rounded-lg p-6">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-4">How the Flashing Service Works</h2>
            <ol className="space-y-3 text-sm text-text-secondary list-decimal list-inside">
              <li><strong className="text-text-primary">Place your order and pay securely.</strong> You'll receive an email confirmation and a PO Box shipping address for your device.</li>
              <li><strong className="text-text-primary">Post your Pixel to us.</strong> Wrap it in bubble wrap, include your order number, and send it tracked. Your data is wiped during the flash, so back it up and factory reset first.</li>
              <li><strong className="text-text-primary">We flash and verify GrapheneOS.</strong> Your device is unlocked, flashed with the latest stable GrapheneOS release, and security-checked — usually within 24 hours of arrival.</li>
              <li><strong className="text-text-primary">Your phone comes back insured.</strong> UK return shipping is fully insured and typically arrives the next working day.</li>
            </ol>
            <p className="mt-4 text-sm text-text-muted">
              The service costs £119.99 plus return shipping (£20.45 UK insured, £13.95 Europe and rest of world).
              Payment is handled by PayPal; guest checkout is available.
            </p>
          </section>

          <section className="bg-bg-card border border-border-subtle rounded-lg p-6">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-3">Supported Devices</h2>
            <p className="text-sm text-text-secondary mb-3">
              We flash the following Google Pixel models with GrapheneOS — the same privacy-hardened operating system
              installed on every phone we sell:
            </p>
            <ul className="text-sm text-text-secondary grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 font-mono">
              <li>Pixel 6a</li>
              <li>Pixel 7 / 7 Pro / 7a</li>
              <li>Pixel 8 / 8 Pro / 8a</li>
              <li>Pixel 9 / 9 Pro XL / 9a</li>
              <li>Pixel 10 / 10a</li>
              <li>Pixel 10 Pro / XL / Fold</li>
              <li>Pixel Fold</li>
              <li>Pixel 9 Pro Fold</li>
            </ul>
            <p className="mt-3 text-xs text-text-muted">
              Your device must be carrier unlocked (SIM-free) and not blacklisted. Prefer a pre-flashed phone?
              Browse our <Link to="/products" className="text-cyan-400 hover:underline">ready-flashed Pixel catalog</Link> —
              every handset is prepared, verified, and ships next day.
            </p>
          </section>

          <section className="bg-bg-card border border-border-subtle rounded-lg p-6">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-3">Frequently Asked Questions</h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-text-primary">Is GrapheneOS safe to install?</dt>
                <dd className="text-text-secondary mt-1">Yes — GrapheneOS is an open-source, security-hardened mobile operating system focused on privacy. It's verified-boot compatible and receives regular security updates.</dd>
              </div>
              <div>
                <dt className="font-semibold text-text-primary">Will my banking apps work?</dt>
                <dd className="text-text-secondary mt-1">Most UK banking apps work on GrapheneOS. A small number of high-security apps that depend on Google Play Services may not function; we're not responsible for software incompatibility after flashing.</dd>
              </div>
              <div>
                <dt className="font-semibold text-text-primary">How long does the whole process take?</dt>
                <dd className="text-text-secondary mt-1">Typically 3–5 days door to door within the UK, including postage both ways and the flash itself.</dd>
              </div>
              <div>
                <dt className="font-semibold text-text-primary">What if my device can't be flashed?</dt>
                <dd className="text-text-secondary mt-1">You're refunded in full minus return shipping, and your device is returned to you at no charge. See the refund policy above for full details.</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
};

export default FlashServicePage;
