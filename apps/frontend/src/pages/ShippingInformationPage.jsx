import { useEffect } from 'react';

const ShippingInformationPage = () => {
  useEffect(() => {
    document.title = 'Shipping Information - Graphene Security';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeIn">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-cyan-400 mb-4 uppercase tracking-wider">
            Shipping Information
          </h1>
          <p className="text-text-secondary">
            Delivery times, costs, and policies
          </p>
          <p className="text-text-muted mt-2">
            Last updated: January 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* UK Shipping */}
          <div className="card card-glow p-6 md:p-8 animate-fadeIn">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-cyan-subtle border border-cyan flex items-center justify-center">
                <span className="text-2xl">🇬🇧</span>
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold text-text-primary">United Kingdom</h2>
                <p className="text-text-muted text-sm">Royal Mail Special Delivery</p>
              </div>
            </div>

            <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading font-semibold text-cyan-400">Royal Mail Special Delivery</h3>
                <span className="font-mono text-matrix-400 font-bold">£20.45</span>
              </div>
              <p className="text-text-secondary text-sm mb-2">Next Day in the U.K.</p>
              <p className="text-text-muted text-xs">
                Fully insured delivery guaranteed next working day. Orders placed before 2 PM are shipped the same day.
              </p>
            </div>
          </div>

          {/* International Shipping */}
          <div className="card card-glow p-6 md:p-8 animate-fadeIn">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-matrix-subtle border border-matrix flex items-center justify-center">
                <span className="text-2xl">🌍</span>
              </div>
              <div>
                <h2 className="font-heading text-2xl font-bold text-text-primary">International Shipping</h2>
                <p className="text-text-muted text-sm">Royal International Tracked</p>
              </div>
            </div>

            <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-heading font-semibold text-matrix-400">Royal International Tracked</h3>
                <span className="font-mono text-cyan-400 font-bold">£13.95</span>
              </div>
              <p className="text-text-secondary text-sm mb-2">3-5 Days within Europe or 6-7 Days to Rest of World</p>
              <p className="text-text-muted text-xs">
                Fully tracked international delivery. Delivery times vary by destination.
              </p>
            </div>

            <div className="mt-4 p-4 bg-amber-subtle border border-amber rounded-lg">
              <p className="text-amber font-mono text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                International customers are responsible for any customs duties, import taxes, or other fees.
              </p>
            </div>
          </div>

          {/* Order Processing */}
          <div className="card card-glow p-6 md:p-8 animate-fadeIn">
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-cyan-subtle border border-cyan flex items-center justify-center text-cyan-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Order Processing Times
            </h2>

            <div className="space-y-4 text-text-secondary">
              <p>
                We operate on a Just-In-Time (JIT) model, which means we flash and prepare devices after orders
                are placed. This ensures you receive the latest GrapheneOS version.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4">
                  <h3 className="font-heading font-semibold text-cyan-400 mb-2">Standard Orders</h3>
                  <p className="text-sm">Processed within 1-2 business days</p>
                  <p className="text-text-muted text-xs mt-2">Most orders ship within 24-48 hours of payment confirmation.</p>
                </div>

                <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4">
                  <h3 className="font-heading font-semibold text-cyan-400 mb-2">Custom Orders</h3>
                  <p className="text-sm">Processed within 3-5 business days</p>
                  <p className="text-text-muted text-xs mt-2">Orders with privacy app installation may take additional time.</p>
                </div>
              </div>

              <p className="text-text-muted text-sm">
                Orders placed on weekends or holidays will be processed on the next business day.
              </p>
            </div>
          </div>

          {/* Tracking */}
          <div className="card card-glow p-6 md:p-8 animate-fadeIn">
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-matrix-subtle border border-matrix flex items-center justify-center text-matrix-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </span>
              Order Tracking
            </h2>

            <div className="space-y-4 text-text-secondary">
              <p>
                All orders include tracking at no additional cost. You will receive:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Order confirmation email with order details</li>
                <li>Shipping confirmation email with tracking number</li>
                <li>Real-time tracking updates via email</li>
                <li>Delivery confirmation upon successful delivery</li>
              </ul>

              <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4 font-mono text-sm">
                <p className="text-text-muted">
                  You can also track your order by visiting your{' '}
                  <a href="/orders" className="text-cyan-400 hover:text-matrix-400 transition-colors">
                    order history
                  </a>{' '}
                  page or checking your email for tracking updates.
                </p>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="card card-glow p-6 md:p-8 animate-fadeIn">
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-pink-subtle border border-pink flex items-center justify-center text-pink-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </span>
              Delivery Information
            </h2>

            <div className="space-y-6">
              <div className="text-text-secondary">
                <h3 className="font-heading font-semibold text-text-primary mb-3">What to Expect on Delivery</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-matrix-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Secure, tamper-evident packaging</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-matrix-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Signature may be required for high-value orders</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-matrix-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Discreet outer packaging (no branding visible)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-matrix-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Quick start guide included</span>
                  </li>
                </ul>
              </div>

              <div className="text-text-secondary">
                <h3 className="font-heading font-semibold text-text-primary mb-3">Delivery Address</h3>
                <p className="mb-3">
                  We can only deliver to residential or business addresses. We cannot deliver to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-text-muted">
                  <li>PO Boxes</li>
                  <li>Parcel lockers</li>
                  <li>Hotels or temporary accommodation</li>
                </ul>
              </div>

              <div className="text-text-secondary">
                <h3 className="font-heading font-semibold text-text-primary mb-3">Missed Deliveries</h3>
                <p>
                  If you're not available when delivery is attempted, the carrier will leave a notification
                  with instructions for redelivery or parcel pickup. After 3 failed delivery attempts, the
                  package may be returned to sender.
                </p>
              </div>
            </div>
          </div>

          {/* Import & Customs */}
          <div className="card card-glow p-6 md:p-8 animate-fadeIn">
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-amber-subtle border border-amber flex items-center justify-center text-amber">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </span>
              International Orders: Import & Customs
            </h2>

            <div className="space-y-4 text-text-secondary">
              <div className="bg-amber-subtle border border-amber rounded-lg p-4">
                <p className="text-amber font-mono text-sm mb-2">
                  ⚠️ IMPORTANT: International Shipping Policies
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• <strong className="text-text-primary">Customs Duties:</strong> You are responsible for any customs duties, import taxes, or other fees</li>
                  <li>• <strong className="text-text-primary">Documentation:</strong> All required customs documentation is included</li>
                  <li>• <strong className="text-text-primary">Delays:</strong> Customs processing may add 1-5 days to delivery time</li>
                  <li>• <strong className="text-text-primary">Restricted Countries:</strong> We do not ship to countries under UK/US sanctions</li>
                </ul>
              </div>

              <p className="text-text-muted">
                Please check with your local customs office for specific regulations and potential fees before placing an order.
              </p>
            </div>
          </div>

          {/* Shipping Restrictions */}
          <div className="card card-glow p-6 md:p-8 animate-fadeIn">
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-red-subtle border border-red flex items-center justify-center text-red">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </span>
              Shipping Restrictions
            </h2>

            <div className="space-y-4 text-text-secondary">
              <p>
                Due to regulations and carrier restrictions, we cannot ship to certain locations or items:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>PO Boxes and APO/FPO addresses</li>
                <li>Freight forwarders or mail forwarding services</li>
                <li>Countries under UK or international sanctions</li>
                <li>Addresses that cannot be verified by our fraud prevention system</li>
              </ul>
              <p className="text-text-muted">
                If your address is affected, we will contact you to discuss alternative delivery options.
              </p>
            </div>
          </div>

          {/* Questions */}
          <div className="card card-glow p-6 md:p-8 animate-fadeIn">
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4">Questions About Shipping?</h2>
            <p className="text-text-secondary mb-4">
              If you have questions about shipping, delivery, or tracking, please contact us:
            </p>
            <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4 font-mono text-sm">
              <p className="mb-2">
                <span className="text-text-muted">Email:</span>{' '}
                <a href="mailto:contact@graphene-security.com" className="text-cyan-400 hover:text-matrix-400 transition-colors">
                  contact@graphene-security.com
                </a>
              </p>
              <p>
                <span className="text-text-muted">Response Time:</span> Within 24 hours
              </p>
            </div>
          </div>
        </div>

        {/* Back to Top */}
        <div className="text-center mt-8">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="btn btn-secondary"
          >
            Back to Top
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShippingInformationPage;
