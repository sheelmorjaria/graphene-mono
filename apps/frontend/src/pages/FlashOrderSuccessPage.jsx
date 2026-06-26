import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getFlashOrderInstructions } from '../services/flashOrderService';
import SEOWrapper from '../components/SEO/SEOWrapper';

const FlashOrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [instructions, setInstructions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }

    const fetchInstructions = async () => {
      try {
        const data = await getFlashOrderInstructions(orderId);
        setInstructions(data);
        setLoading(false);
      } catch (err) {
        if (err.message.includes('complete payment') || err.message.includes('403')) {
          setError('Please complete your payment to access shipping instructions.');
        } else {
          setError(err.message || 'Failed to fetch order instructions.');
        }
        setLoading(false);
      }
    };

    fetchInstructions();
  }, [orderId]);

  const handleGoHome = () => {
    navigate('/products');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your order information...</p>
        </div>
      </div>
    );
  }

  if (error || !instructions) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <SEOWrapper
          title="Order Pending"
          description="Complete your payment to receive shipping instructions for your GrapheneOS flashing service order."
        />
        <div className="max-w-lg w-full mx-4">
          <div className="bg-bg-card rounded-lg border border-border-subtle p-8 text-center">
            <div className="w-16 h-16 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-display font-bold text-text-primary mb-4">
              Order Pending
            </h1>
            <p className="text-text-secondary mb-6">
              {error || 'Please complete your payment to access shipping instructions.'}
            </p>
            <button
              onClick={handleGoHome}
              className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-matrix-400 text-text-on-accent font-heading font-bold text-sm uppercase tracking-wider rounded-lg hover:shadow-glow-cyan transition-all duration-200"
            >
              Return to Shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-12">
      <SEOWrapper
        title="Order Confirmed"
        description="Your GrapheneOS flashing service order has been confirmed. Find shipping instructions and PO Box address here."
      />

      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-display font-bold text-text-primary mb-2">
              Order Confirmed!
            </h1>
            <p className="text-text-secondary">
              Your GrapheneOS flashing service order has been confirmed.
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-bg-card rounded-lg border border-border-subtle p-6 mb-6">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-4">Order Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Order Number:</span>
                <span className="text-text-primary font-mono font-semibold">{instructions.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Status:</span>
                <span className="text-green-400 font-semibold">{instructions.orderStatus}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Payment:</span>
                <span className="text-green-400 font-semibold">{instructions.paymentStatus}</span>
              </div>
            </div>
          </div>

          {/* Shipping Instructions */}
          <div className="bg-bg-card rounded-lg border border-cyan-400/30 p-6 mb-6">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Shipping Instructions
            </h2>

            {/* PO Box Address */}
            <div className="bg-bg-elevated rounded-lg p-4 mb-4">
              <h3 className="text-sm font-heading font-semibold text-cyan-400 uppercase tracking-wider mb-3">
                Send Your Device To:
              </h3>
              <div className="space-y-1 text-text-primary">
                <p className="font-semibold">{instructions.poBoxAddress.street}</p>
                <p>{instructions.poBoxAddress.city}</p>
                <p>{instructions.poBoxAddress.postalCode}</p>
                <p>{instructions.poBoxAddress.country}</p>
              </div>
            </div>

            {/* Important Instructions */}
            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4">
              <h3 className="text-sm font-heading font-semibold text-yellow-400 uppercase tracking-wider mb-2">
                Important:
              </h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Include your order number <strong>{instructions.orderNumber}</strong> on the package</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Wrap device in bubble wrap and use a sturdy box</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Ensure device is factory reset before shipping</span>
                </li>
              </ul>
            </div>

            {/* Instructions from API */}
            {instructions.instructions && (
              <div className="mt-4 p-4 bg-bg-elevated rounded-lg">
                <p className="text-sm text-text-secondary">{instructions.instructions}</p>
              </div>
            )}
          </div>

          {/* What Happens Next */}
          <div className="bg-bg-card rounded-lg border border-border-subtle p-6 mb-6">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-4">What Happens Next</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-cyan-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-cyan-400 font-mono font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Ship Your Device</h3>
                  <p className="text-sm text-text-secondary">Send your Pixel device to the address above with your order number on the package.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-cyan-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-cyan-400 font-mono font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">We Flash Your Device</h3>
                  <p className="text-sm text-text-secondary">We'll install the latest stable version of GrapheneOS on your device.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-cyan-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-cyan-400 font-mono font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">We Return Your Device</h3>
                  <p className="text-sm text-text-secondary">Your flashed device is shipped back to your return address.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleGoHome}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-cyan-400 to-matrix-400 text-text-on-accent font-heading font-bold text-sm uppercase tracking-wider rounded-lg hover:shadow-glow-cyan transition-all duration-200"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 py-3 px-6 bg-bg-elevated border border-border-subtle text-text-primary font-heading font-bold text-sm uppercase tracking-wider rounded-lg hover:bg-bg-hover transition-all duration-200"
            >
              Print Instructions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashOrderSuccessPage;
