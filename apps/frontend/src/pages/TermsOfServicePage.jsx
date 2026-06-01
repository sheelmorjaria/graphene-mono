import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const TermsOfServicePage = () => {
  useEffect(() => {
    document.title = 'Terms of Service - Graphene Security';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeIn">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-cyan-400 mb-4 uppercase tracking-wider">
            Terms of Service
          </h1>
          <p className="text-text-secondary">
            Last updated: January 2026
          </p>
        </div>

        {/* Content */}
        <div className="card card-glow p-6 md:p-8 animate-fadeIn space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-cyan-subtle flex items-center justify-center text-cyan-400 text-sm font-mono">1</span>
              Acceptance of Terms
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>
                By accessing or using Graphene Security's website and services, you agree to be bound by these
                Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our services.
              </p>
              <p>
                These Terms constitute a legally binding agreement between you and Graphene Security. We reserve
                the right to modify these Terms at any time, and your continued use of the service constitutes
                acceptance of any changes.
              </p>
            </div>
          </section>

          {/* Services */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-matrix-subtle flex items-center justify-center text-matrix-400 text-sm font-mono">2</span>
              Description of Services
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>Graphene Security provides the following services:</p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>Sale of GrapheneOS-flashed Google Pixel smartphones</li>
                <li>Optional privacy app installation services</li>
                <li>Technical support and documentation</li>
                <li>Secure payment processing</li>
                <li>Shipping and delivery services</li>
              </ul>
              <p className="text-text-muted">
                All devices are thoroughly tested and verified to ensure GrapheneOS functionality before shipping.
              </p>
            </div>
          </section>

          {/* Account Terms */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-cyan-subtle flex items-center justify-center text-cyan-400 text-sm font-mono">3</span>
              Account Terms
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>To use certain features of our service, you must create an account. You agree to:</p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
              <div className="mt-4 p-4 bg-red-subtle border border-red rounded-lg">
                <p className="text-red font-mono text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  You are solely responsible for maintaining the security of your account.
                </p>
              </div>
            </div>
          </section>

          {/* Products and Pricing */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-matrix-subtle flex items-center justify-center text-matrix-400 text-sm font-mono">4</span>
              Products and Pricing
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>
                All prices are listed in British Pounds (£) and are inclusive of VAT where applicable. We reserve
                the right to modify prices at any time without prior notice.
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>Prices are confirmed at the time of order placement</li>
                <li>Payment is due at the time of purchase</li>
                <li>We accept credit/debit cards and PayPal</li>
              </ul>
              <p>
                While we strive for accuracy, we do not warrant that product descriptions are entirely error-free.
                In the event of a pricing error, we reserve the right to cancel orders.
              </p>
            </div>
          </section>

          {/* Orders and Payment */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-cyan-subtle flex items-center justify-center text-cyan-400 text-sm font-mono">5</span>
              Orders and Payment
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>
                We reserve the right to refuse or cancel any order for any reason, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>Product availability</li>
                <li>Errors in product or pricing information</li>
                <li>Suspected fraudulent activity</li>
                <li>Violation of these Terms</li>
              </ul>
              <p>
                Payment information is encrypted and processed securely through third-party payment processors.
                We do not store complete payment card details on our servers.
              </p>
            </div>
          </section>

          {/* Shipping and Delivery */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-matrix-subtle flex items-center justify-center text-matrix-400 text-sm font-mono">6</span>
              Shipping and Delivery
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>
                Shipping times are estimates and not guarantees. Delivery times may vary based on your location
                and external factors beyond our control.
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>UK delivery: Typically 5-7 working days</li>
                <li>International delivery: Times vary by destination</li>
                <li>Risk of loss transfers to you upon delivery</li>
                <li>Signature may be required for delivery</li>
              </ul>
              <p className="text-text-muted">
                For detailed shipping information, see our{' '}
                <Link to="/shipping" className="text-cyan-400 hover:text-matrix-400 transition-colors">
                  Shipping Information
                </Link>{' '}
                page.
              </p>
            </div>
          </section>

          {/* Returns and Refunds */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-cyan-subtle flex items-center justify-center text-cyan-400 text-sm font-mono">7</span>
              Returns and Refunds
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>
                Our return policy is designed to ensure customer satisfaction while protecting the integrity of
                our products. See our{' '}
                <Link to="/refunds" className="text-cyan-400 hover:text-matrix-400 transition-colors">
                  Refund Policy
                </Link>{' '}
                for detailed information.
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>14-day return period for most items</li>
                <li>Items must be in original condition</li>
                <li>Software-installation services are non-refundable once completed</li>
                <li>Return shipping costs may apply</li>
              </ul>
            </div>
          </section>

          {/* Warranty */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-matrix-subtle flex items-center justify-center text-matrix-400 text-sm font-mono">8</span>
              Warranty
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>
                All devices come with a 12-month warranty covering hardware defects. This warranty does not cover:
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>Physical damage, drops, or water exposure</li>
                <li>Software modifications after purchase</li>
                <li>Normal wear and tear</li>
                <li>Third-party accessories or unauthorized repairs</li>
              </ul>
              <p>
                The GrapheneOS software is provided "as is" with no separate warranty, though the upstream
                GrapheneOS project provides security updates.
              </p>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-cyan-subtle flex items-center justify-center text-cyan-400 text-sm font-mono">9</span>
              Intellectual Property
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>
                All content on this website, including text, graphics, logos, images, and software, is the
                property of Graphene Security or its licensors and is protected by copyright laws.
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>GrapheneOS is a separate open-source project</li>
                <li>Google Pixel is a trademark of Google LLC</li>
                <li>You may not reproduce, distribute, or create derivative works without permission</li>
              </ul>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-cyan-subtle flex items-center justify-center text-cyan-400 text-sm font-mono">10</span>
              Limitation of Liability
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>
                To the fullest extent permitted by law, Graphene Security shall not be liable for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>Indirect, incidental, special, or consequential damages</li>
                <li>Loss of profits, data, or business opportunities</li>
                <li>Damages exceeding the amount you paid for the product</li>
              </ul>
              <div className="mt-4 p-4 bg-amber-subtle border border-amber rounded-lg">
                <p className="text-amber font-mono text-sm">
                  ⚠️ Some jurisdictions do not allow exclusion of liability, so these limitations may not apply to you.
                </p>
              </div>
            </div>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-matrix-subtle flex items-center justify-center text-matrix-400 text-sm font-mono">11</span>
              Indemnification
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>
                You agree to indemnify and hold harmless Graphene Security from any claims, damages, losses,
                liabilities, and expenses arising from:
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>Your use of our products or services</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
              </ul>
            </div>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-cyan-subtle flex items-center justify-center text-cyan-400 text-sm font-mono">12</span>
              Governing Law and Dispute Resolution
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>
                These Terms are governed by the laws of the United Kingdom. Any disputes arising under these
                Terms shall be resolved in the courts of the United Kingdom.
              </p>
              <p>
                We encourage you to contact us directly with any concerns before pursuing legal action.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-matrix-subtle flex items-center justify-center text-matrix-400 text-sm font-mono">13</span>
              Termination
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>
                We reserve the right to suspend or terminate your account and access to our services at our
                sole discretion, without prior notice, for conduct that we believe violates these Terms or
                is harmful to other users, us, or third parties.
              </p>
            </div>
          </section>

          {/* General Provisions */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-cyan-subtle flex items-center justify-center text-cyan-400 text-sm font-mono">14</span>
              General Provisions
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and us</li>
                <li><strong>Severability:</strong> If any provision is found invalid, the remaining provisions remain in effect</li>
                <li><strong>Waiver:</strong> Failure to enforce any provision does not constitute a waiver</li>
                <li><strong>Assignment:</strong> You may not assign these Terms without our consent</li>
              </ul>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-matrix-subtle flex items-center justify-center text-matrix-400 text-sm font-mono">15</span>
              Contact Us
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>
                If you have questions about these Terms, please contact us:
              </p>
              <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4 font-mono text-sm">
                <p className="mb-2">
                  <span className="text-text-muted">Email:</span>{' '}
                  <a href="mailto:contact@graphene-security.com" className="text-cyan-400 hover:text-matrix-400 transition-colors">
                    contact@graphene-security.com
                  </a>
                </p>
                <p className="mb-2">
                  <span className="text-text-muted">Website:</span>{' '}
                  <a href="https://graphene-security.com" className="text-cyan-400 hover:text-matrix-400 transition-colors">
                    https://graphene-security.com
                  </a>
                </p>
              </div>
            </div>
          </section>
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

export default TermsOfServicePage;
