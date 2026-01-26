import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const RefundPolicyPage = () => {
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    document.title = 'Refund Policy - Graphene Security';
    window.scrollTo(0, 0);
  }, []);

  const toggleSection = (index) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  const sections = [
    {
      title: 'Return Period',
      icon: '⏱',
      content: (
        <div className="space-y-4 text-text-secondary">
          <p>You may return most products within <strong className="text-cyan-400">14 calendar days</strong> from the date of delivery.</p>
          <p>To be eligible for a return, your item must be:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>In the same condition as received</li>
            <li>In the original packaging</li>
            <li>Unopened and unused (for sealed items)</li>
            <li>Accompanied by proof of purchase</li>
          </ul>
        </div>
      )
    },
    {
      title: 'Non-Returnable Items',
      icon: '🚫',
      content: (
        <div className="space-y-4 text-text-secondary">
          <p>The following items are <strong className="text-red">NOT eligible for return</strong>:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Services already performed (privacy app installation)</li>
            <li>Items damaged through misuse or improper handling</li>
            <li>Items with missing or damaged serial numbers</li>
            <li>Items that have been flashed with custom firmware after purchase</li>
            <li>Software or digital downloads</li>
          </ul>
          <div className="mt-4 p-4 bg-red-subtle border border-red rounded-lg">
            <p className="text-red font-mono text-sm">
              Once privacy app installation services are completed, they are non-refundable.
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'How to Initiate a Return',
      icon: '📝',
      content: (
        <div className="space-y-4 text-text-secondary">
          <p>To initiate a return, follow these steps:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Contact us at <a href="mailto:support@graphene-security.com" className="text-cyan-400 hover:text-matrix-400 transition-colors">support@graphene-security.com</a></li>
            <li>Provide your order number and reason for return</li>
            <li>Wait for return authorization (RMA number)</li>
            <li>Pack the item securely in original packaging</li>
            <li>Ship to the address provided with your RMA number</li>
          </ol>
          <p className="text-text-muted">Please do not send your purchase back to the manufacturer without prior authorization.</p>
        </div>
      )
    },
    {
      title: 'Refund Process',
      icon: '💰',
      content: (
        <div className="space-y-4 text-text-secondary">
          <p>Once your return is received and inspected, we will notify you of the approval or rejection of your refund.</p>
          <p><strong className="text-cyan-400">If approved:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Refund will be processed within <strong className="text-matrix-400">5-10 business days</strong></li>
            <li>Credit will be applied to your original payment method</li>
            <li>You will receive an email confirmation</li>
          </ul>
          <p><strong className="text-cyan-400">Payment Processing Times:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Credit/Debit Cards: 5-10 business days</li>
            <li>PayPal: 3-5 business days</li>
            <li>Bitcoin/Monero: Requires valid wallet address, processed within 48 hours</li>
          </ul>
        </div>
      )
    },
    {
      title: 'Return Shipping Costs',
      icon: '📦',
      content: (
        <div className="space-y-4 text-text-secondary">
          <p><strong className="text-cyan-400">Defective Products:</strong></p>
          <p className="ml-4">We will cover return shipping costs for products that are defective or damaged upon receipt.</p>
          <p><strong className="text-cyan-400">Change of Mind:</strong></p>
          <p className="ml-4">You are responsible for return shipping costs for items returned for reasons other than defects.</p>
          <p><strong className="text-cyan-400">International Returns:</strong></p>
          <p className="ml-4">International customers are responsible for all return shipping costs and any customs fees.</p>
        </div>
      )
    },
    {
      title: 'Exchanges',
      icon: '🔄',
      content: (
        <div className="space-y-4 text-text-secondary">
          <p>We only replace items if they are defective or damaged. If you need to exchange for the same item in a different:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong className="text-cyan-400">Color:</strong> Contact us to check availability</li>
            <li><strong className="text-cyan-400">Storage Capacity:</strong> Subject to price difference</li>
            <li><strong className="text-cyan-400">Condition:</strong> Subject to price difference</li>
          </ul>
          <p>To request an exchange, please contact us at <a href="mailto:support@graphene-security.com" className="text-cyan-400 hover:text-matrix-400 transition-colors">support@graphene-security.com</a>.</p>
        </div>
      )
    },
    {
      title: 'Warranty Claims',
      icon: '🛡',
      content: (
        <div className="space-y-4 text-text-secondary">
          <p>All devices come with a <strong className="text-matrix-400">12-month manufacturer warranty</strong> covering hardware defects.</p>
          <p><strong className="text-cyan-400">Warranty Covers:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Hardware malfunctions under normal use</li>
            <li>Component failures not caused by damage</li>
            <li>Battery defects (capacity below 80% within 12 months)</li>
          </ul>
          <p><strong className="text-cyan-400">Warranty Does NOT Cover:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Physical damage (cracked screen, water damage, drops)</li>
            <li>Software modifications after purchase</li>
            <li>Normal wear and tear</li>
            <li>Unauthorized repairs or modifications</li>
          </ul>
        </div>
      )
    },
    {
      title: 'Software Installation Services',
      icon: '💻',
      content: (
        <div className="space-y-4 text-text-secondary">
          <div className="p-4 bg-matrix-subtle border border-matrix rounded-lg">
            <p className="text-matrix-400 font-mono text-sm font-semibold mb-2">IMPORTANT NOTE</p>
            <p className="text-text-secondary">
              Privacy app installation services are <strong className="text-matrix-400">non-refundable</strong> once the service has been completed.
              This is because the service involves labor and expertise that cannot be "un-done."
            </p>
          </div>
          <p>If there is a technical issue with the installation, we will:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Work to resolve the issue remotely</li>
            <li>Provide troubleshooting guidance</li>
            <li>Offer re-installation if necessary</li>
          </ul>
          <p className="text-text-muted">No refunds will be issued for services that have been successfully completed.</p>
        </div>
      )
    },
    {
      title: 'Partial Refunds',
      icon: '▓',
      content: (
        <div className="space-y-4 text-text-secondary">
          <p>We reserve the right to issue partial refunds in the following situations:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Item is returned with missing accessories or packaging</li>
            <li>Item shows signs of use beyond normal inspection</li>
            <li>Return is initiated after the 14-day period</li>
            <li>Item cannot be resold as new</li>
          </ul>
          <p>Partial refund amounts will be determined based on the condition of the returned item and its resale value.</p>
        </div>
      )
    },
    {
      title: 'Late or Missing Refunds',
      icon: '🔍',
      content: (
        <div className="space-y-4 text-text-secondary">
          <p>If you haven't received your refund within the stated timeframes:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Check your bank account again</li>
            <li>Contact your credit card company (processing may take additional time)</li>
            <li>Contact your bank (there may be processing delays)</li>
            <li>If you've completed all above and still not received your refund, contact us</li>
          </ol>
          <p className="text-text-muted">Please include your order number and the date of return in your communication.</p>
        </div>
      )
    },
    {
      title: 'Sale Items',
      icon: '🏷',
      content: (
        <div className="space-y-4 text-text-secondary">
          <p>Only regular priced items may be refunded. Unfortunately, sale items cannot be refunded unless they are defective.</p>
          <p className="text-text-muted">This applies to clearance items, promotional offers, and special discounts.</p>
        </div>
      )
    },
    {
      title: 'Cancellation Policy',
      icon: '❌',
      content: (
        <div className="space-y-4 text-text-secondary">
          <p><strong className="text-cyan-400">Before Shipping:</strong></p>
          <p className="ml-4">Orders may be cancelled before shipment. Full refund will be issued within 3-5 business days.</p>
          <p><strong className="text-cyan-400">After Shipping:</strong></p>
          <p className="ml-4">Once an order has shipped, it cannot be cancelled. You will need to wait for delivery and then initiate a return following our standard return policy.</p>
          <p className="text-text-muted">To request cancellation, please contact us immediately with your order number.</p>
        </div>
      )
    },
    {
      title: 'Contact Information',
      icon: '📧',
      content: (
        <div className="space-y-4 text-text-secondary">
          <p>If you have any questions about our Refund Policy, please contact us:</p>
          <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4 font-mono text-sm">
            <p className="mb-2">
              <span className="text-text-muted">Email:</span>{' '}
              <a href="mailto:support@graphene-security.com" className="text-cyan-400 hover:text-matrix-400 transition-colors">
                support@graphene-security.com
              </a>
            </p>
            <p className="mb-2">
              <span className="text-text-muted">Returns Department:</span>{' '}
              <a href="mailto:returns@graphene-security.com" className="text-cyan-400 hover:text-matrix-400 transition-colors">
                returns@graphene-security.com
              </a>
            </p>
            <p>
              <span className="text-text-muted">Address:</span> United Kingdom
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeIn">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-cyan-400 mb-4 uppercase tracking-wider">
            Refund Policy
          </h1>
          <p className="text-text-secondary">
            Returns & Exchanges Policy
          </p>
          <p className="text-text-muted mt-2">
            Last updated: January 2026
          </p>
        </div>

        {/* Key Points Summary */}
        <div className="card card-glow p-6 md:p-8 mb-8 animate-fadeIn">
          <h2 className="font-heading text-xl font-bold text-text-primary mb-4">Key Points at a Glance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-cyan-subtle border border-cyan rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-cyan-400 mb-1">14</p>
              <p className="text-sm text-text-secondary">Day Return Period</p>
            </div>
            <div className="bg-matrix-subtle border border-matrix rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-matrix-400 mb-1">12</p>
              <p className="text-sm text-text-secondary">Month Warranty</p>
            </div>
            <div className="bg-pink-subtle border border-pink rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-pink-400 mb-1">5-10</p>
              <p className="text-sm text-text-secondary">Business Days to Refund</p>
            </div>
          </div>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={index} className="card animate-fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
              <button
                onClick={() => toggleSection(index)}
                className="w-full text-left p-6 flex items-center justify-between hover:bg-bg-elevated transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{section.icon}</span>
                  <h3 className="font-heading text-lg font-semibold text-text-primary">
                    {section.title}
                  </h3>
                </div>
                <svg
                  className={`w-5 h-5 text-cyan-400 transition-transform duration-300 ${
                    expandedSection === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  expandedSection === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-6 pt-2 border-t border-border-subtle">
                  {section.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Information */}
        <div className="card card-glow p-6 md:p-8 mt-8 animate-fadeIn">
          <h2 className="font-heading text-xl font-bold text-text-primary mb-4">Important Notes</h2>
          <div className="space-y-4 text-text-secondary">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p>
                This policy applies to purchases made through our website. For purchases made through third-party
                platforms (e.g., Amazon, eBay), please refer to their respective return policies.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-matrix-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p>
                We strive to provide excellent customer service. If you have any concerns about your order,
                please contact us before initiating a return - we may be able to resolve the issue quickly.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>
                For order status and return tracking, you can also check your{' '}
                <Link to="/orders" className="text-cyan-400 hover:text-matrix-400 transition-colors">
                  order history
                </Link>{' '}
                or visit your{' '}
                <Link to="/profile" className="text-cyan-400 hover:text-matrix-400 transition-colors">
                  account dashboard
                </Link>.
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

export default RefundPolicyPage;
