import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const FAQPage = () => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    document.title = 'FAQ - Graphene Security';
    window.scrollTo(0, 0);
  }, []);

  const toggleCategory = (categoryIndex) => {
    setExpandedCategory(expandedCategory === categoryIndex ? null : categoryIndex);
    setExpandedQuestion(null);
  };

  const toggleQuestion = (categoryIndex, questionIndex) => {
    if (expandedCategory !== categoryIndex) {
      setExpandedCategory(categoryIndex);
    }
    setExpandedQuestion(expandedQuestion === `${categoryIndex}-${questionIndex}` ? null : `${categoryIndex}-${questionIndex}`);
  };

  const faqData = [
    {
      category: 'Products & Devices',
      icon: '📱',
      questions: [
        {
          q: 'What is GrapheneOS?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>
                GrapheneOS is a privacy and security-focused mobile operating system based on Android that
                enhances the privacy and security of the upstream Android Open Source Project. It provides:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Hardened security features and exploit mitigation</li>
                <li>Enhanced privacy controls and permissions</li>
                <li>No Google apps or services pre-installed</li>
                <li>Regular security updates directly from GrapheneOS</li>
                <li>Sandboxed Google Play compatibility (optional)</li>
              </ul>
            </div>
          )
        },
        {
          q: 'What devices do you sell?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>
                We sell Google Pixel smartphones that have been professionally flashed with GrapheneOS. Our
                current inventory includes:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Google Pixel 9 Series (Pixel 9, 9 Pro, 9 Pro XL, 9 Pro Fold)</li>
                <li>Google Pixel 8 Series (Pixel 8, 8 Pro, 8a)</li>
                <li>Google Pixel 7 Series (Pixel 7, 7 Pro, 7a)</li>
                <li>Older models available while supplies last</li>
              </ul>
              <p className="text-text-muted">
                All devices are sourced from reputable suppliers and thoroughly tested before sale.
              </p>
            </div>
          )
        },
        {
          q: 'What is the condition of the devices?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>We offer devices in various conditions to suit different budgets:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong className="text-cyan-400">New:</strong> Brand new, sealed in box</li>
                <li><strong className="text-cyan-400">Excellent:</strong> Like new, no visible signs of use</li>
                <li><strong className="text-cyan-400">Good:</strong> Minimal signs of use, fully functional</li>
                <li><strong className="text-cyan-400">Fair:</strong> Visible wear but fully functional with good battery</li>
              </ul>
              <p className="text-text-muted">
                All devices come with a 12-month warranty regardless of condition.
              </p>
            </div>
          )
        },
        {
          q: 'Can I install apps from the Google Play Store?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>
                Yes! GrapheneOS includes sandboxed Google Play as an optional feature. This allows you to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Install and use apps from the Play Store</li>
                <li>Run Google Play in a sandbox, isolated from your core system</li>
                <li>Grant minimal permissions to apps</li>
                <li>Use F-Droid or other app stores alongside</li>
              </ul>
              <p className="text-text-muted">
                You can also choose to not use Google Play at all and use only open-source app stores like F-Droid.
              </p>
            </div>
          )
        },
        {
          q: 'Will GrapheneOS work with my carrier?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>
                Yes, GrapheneOS works with all major carriers worldwide. However, please note:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>All Pixel devices are unlocked and carrier-neutral</li>
                <li>Voice calls, SMS, and mobile data work on all GSM/LTE networks</li>
                <li>Wi-Fi calling and VoLTE depend on carrier support</li>
                <li>CDMA networks (like some in the US) are not supported</li>
              </ul>
              <p className="text-text-muted">
                Contact us if you have questions about carrier compatibility.
              </p>
            </div>
          )
        }
      ]
    },
    {
      category: 'Orders & Shipping',
      icon: '📦',
      questions: [
        {
          q: 'How long does delivery take?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>Delivery times vary by location:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong className="text-cyan-400">UK:</strong> 3-5 days (standard), 2-3 days (express)</li>
                <li><strong className="text-cyan-400">Europe:</strong> 7-14 working days</li>
                <li><strong className="text-cyan-400">USA/Canada:</strong> 10-15 working days</li>
                <li><strong className="text-cyan-400">Rest of World:</strong> 14-21 working days</li>
              </ul>
              <p className="text-text-muted">
                Processing time is 1-2 business days before shipping. See our{' '}
                <Link to="/shipping" className="text-cyan-400 hover:text-matrix-400 transition-colors">
                  Shipping Information
                </Link>{' '}
                page for more details.
              </p>
            </div>
          )
        },
        {
          q: 'Do you ship internationally?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>
                Yes, we ship worldwide! International orders are shipped via tracked and insured services.
              </p>
              <p>
                Please note that international customers are responsible for any customs duties,
                import taxes, or other fees that may apply.
              </p>
              <p className="text-text-muted">
                We cannot ship to countries under UK/US sanctions.
              </p>
            </div>
          )
        },
        {
          q: 'Can I track my order?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>
                Yes! All orders include tracking at no additional cost. You will receive:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Order confirmation email with order details</li>
                <li>Shipping confirmation with tracking number</li>
                <li>Real-time tracking updates via email</li>
              </ul>
              <p className="text-text-muted">
                You can also track your order from your{' '}
                <Link to="/orders" className="text-cyan-400 hover:text-matrix-400 transition-colors">
                  order history
                </Link>{' '}
                page.
              </p>
            </div>
          )
        },
        {
          q: 'Can I cancel or modify my order?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>
                Orders can be cancelled or modified before they ship. Once an order has been shipped,
                it cannot be cancelled and will need to be returned following our{' '}
                <Link to="/refunds" className="text-cyan-400 hover:text-matrix-400 transition-colors">
                  refund policy
                </Link>.
              </p>
              <p>
                To cancel or modify an order, contact us as soon as possible at{' '}
                <a href="mailto:support@graphene-security.com" className="text-cyan-400 hover:text-matrix-400 transition-colors">
                  support@graphene-security.com
                </a>.
              </p>
            </div>
          )
        }
      ]
    },
    {
      category: 'Returns & Warranty',
      icon: '🔄',
      questions: [
        {
          q: 'What is your return policy?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>
                We offer a <strong className="text-cyan-400">14-day return policy</strong> for most items.
                To be eligible for a return, the item must be:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>In the same condition as received</li>
                <li>In original packaging</li>
                <li>Unopened and unused (for sealed items)</li>
              </ul>
              <p className="text-text-muted">
                See our <Link to="/refunds" className="text-cyan-400 hover:text-matrix-400 transition-colors">Refund Policy</Link> page for full details.
              </p>
            </div>
          )
        },
        {
          q: 'What does the warranty cover?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>
                All devices come with a <strong className="text-matrix-400">12-month manufacturer warranty</strong> covering:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Hardware malfunctions under normal use</li>
                <li>Component failures not caused by damage</li>
                <li>Battery defects (below 80% capacity within 12 months)</li>
              </ul>
              <p className="text-text-muted">
                The warranty does not cover physical damage, water exposure, software modifications after purchase, or unauthorized repairs.
              </p>
            </div>
          )
        },
        {
          q: 'What if my device has a problem?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>
                If you experience any issues with your device, please contact us immediately:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Describe the issue in detail</li>
                <li>Include photos or videos if applicable</li>
                <li>Provide your order number</li>
              </ul>
              <p>
                We'll work with you to troubleshoot, repair, or replace the device as appropriate.
              </p>
            </div>
          )
        }
      ]
    },
    {
      category: 'Payment & Security',
      icon: '💳',
      questions: [
        {
          q: 'What payment methods do you accept?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>We accept multiple payment methods for your convenience:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Credit/Debit Cards (Visa, Mastercard, Maestro)</li>
                <li>PayPal</li>
              </ul>
            </div>
          )
        },
        {
          q: 'Is my payment information secure?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>
                Absolutely. We take security seriously:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>All payments are encrypted with TLS 1.3</li>
                <li>We do not store complete credit card details</li>
                <li>Payment processing is handled by PCI-compliant providers</li>
                <li>Crypto payments are processed through reputable services</li>
              </ul>
              <div className="mt-4 p-4 bg-matrix-subtle border border-matrix rounded-lg">
                <p className="text-matrix-400 font-mono text-sm">
                  🔒 Your payment security is our top priority
                </p>
              </div>
            </div>
          )
        },
        {
          q: 'Do you offer discounts for bulk orders?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>
                Yes! We offer competitive pricing for bulk orders. Please contact us at{' '}
                <a href="mailto:bulk@graphene-security.com" className="text-cyan-400 hover:text-matrix-400 transition-colors">
                  bulk@graphene-security.com
                </a>{' '}
                with details about:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Quantity needed</li>
                <li>Device models and conditions</li>
                <li>Delivery location</li>
              </ul>
            </div>
          )
        }
      ]
    },
    {
      category: 'Technical Support',
      icon: '🛠',
      questions: [
        {
          q: 'How do I update GrapheneOS?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>
                GrapheneOS provides seamless over-the-air (OTA) updates. Your device will notify you
                when updates are available. Updates include:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Security patches and fixes</li>
                <li>New features and improvements</li>
                <li>GrapheneOS version updates</li>
              </ul>
              <p className="text-text-muted">
                Updates are signed and verified automatically. No manual intervention required.
              </p>
            </div>
          )
        },
        {
          q: 'Can I switch back to stock Android?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>
                Yes, you can flash the stock Google Pixel firmware if desired. However, please note:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>This will void your warranty with us</li>
                <li>It requires technical knowledge and the right tools</li>
                <li>You'll need to unlock the bootloader again (this wipes data)</li>
              </ul>
              <p className="text-text-muted">
                We don't recommend this as you'll lose all the privacy and security benefits of GrapheneOS.
              </p>
            </div>
          )
        },
        {
          q: 'Do you provide technical support?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>
                Yes! We provide technical support for:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Initial setup and configuration</li>
                <li>Troubleshooting common issues</li>
                <li>Questions about GrapheneOS features</li>
              </ul>
              <p>
                Contact us at{' '}
                <a href="mailto:support@graphene-security.com" className="text-cyan-400 hover:text-matrix-400 transition-colors">
                  support@graphene-security.com
                </a>.
              </p>
            </div>
          )
        }
      ]
    },
    {
      category: 'Account & Privacy',
      icon: '👤',
      questions: [
        {
          q: 'Do I need an account to purchase?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>
                No, you can checkout as a guest. However, creating an account provides benefits:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Faster checkout with saved addresses</li>
                <li>Order history and tracking</li>
                <li>Easy returns management</li>
                <li>Privacy data export and deletion tools</li>
              </ul>
            </div>
          )
        },
        {
          q: 'How do you protect my data?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>
                We are a privacy-focused company and implement extensive security measures:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Minimal data collection - only what's necessary</li>
                <li>End-to-end encryption for all data transmission</li>
                <li>No third-party tracking or analytics for advertising</li>
                <li>No sale of personal data to third parties</li>
              </ul>
              <p className="text-text-muted">
                See our <Link to="/privacy" className="text-cyan-400 hover:text-matrix-400 transition-colors">Privacy Policy</Link> for full details.
              </p>
            </div>
          )
        },
        {
          q: 'Can I delete my account and data?',
          a: (
            <div className="space-y-3 text-text-secondary">
              <p>
                Yes, you have the right to request deletion of your account and personal data. You can:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Visit your <Link to="/account/privacy" className="text-cyan-400 hover:text-matrix-400 transition-colors">account privacy settings</Link></li>
                <li>Request account deletion (requires password confirmation)</li>
                <li>Export your data before deletion</li>
              </ul>
              <p className="text-text-muted">
                Account deletion is permanent and cannot be undone. Some data may be retained for legal/tax purposes.
              </p>
            </div>
          )
        }
      ]
    }
  ];

  // Filter FAQs based on search
  const filteredFAQData = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof q.a === 'string' && q.a.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeIn">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-cyan-400 mb-4 uppercase tracking-wider">
            FAQ
          </h1>
          <p className="text-text-secondary">
            Frequently Asked Questions
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 animate-fadeIn">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for answers..."
              className="form-input pl-12"
            />
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-4">
          {filteredFAQData.map((category, categoryIndex) => (
            <div key={categoryIndex} className="card animate-fadeIn" style={{ animationDelay: `${categoryIndex * 50}ms` }}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(categoryIndex)}
                className="w-full text-left p-6 flex items-center justify-between hover:bg-bg-elevated transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="font-heading text-xl font-bold text-text-primary">
                    {category.category}
                  </h2>
                  <span className="text-sm text-text-muted font-mono">
                    ({category.questions.length} {category.questions.length === 1 ? 'question' : 'questions'})
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-cyan-400 transition-transform duration-300 ${
                    expandedCategory === categoryIndex ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Questions */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  expandedCategory === categoryIndex ? 'max-h-none' : 'max-h-0'
                }`}
              >
                <div className="border-t border-border-subtle">
                  {category.questions.map((item, questionIndex) => (
                    <div key={questionIndex} className="border-b border-border-subtle last:border-b-0">
                      <button
                        onClick={() => toggleQuestion(categoryIndex, questionIndex)}
                        className="w-full text-left p-4 hover:bg-bg-elevated transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-heading font-semibold text-text-primary flex-1">
                            {item.q}
                          </h3>
                          <svg
                            className={`w-4 h-4 text-cyan-400 flex-shrink-0 mt-1 transition-transform duration-200 ${
                              expandedQuestion === `${categoryIndex}-${questionIndex}` ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ${
                          expandedQuestion === `${categoryIndex}-${questionIndex}` ? 'max-h-none' : 'max-h-0'
                        }`}
                      >
                        <div className="px-4 pb-4 text-text-secondary">
                          {item.a}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredFAQData.length === 0 && (
          <div className="card p-8 text-center animate-fadeIn">
            <svg className="w-16 h-16 mx-auto mb-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-text-secondary mb-2">No results found</p>
            <p className="text-text-muted text-sm">Try different search terms or browse the categories above.</p>
          </div>
        )}

        {/* Still Have Questions */}
        <div className="card card-glow p-6 md:p-8 mt-8 text-center animate-fadeIn">
          <h2 className="font-heading text-xl font-bold text-text-primary mb-4">Still Have Questions?</h2>
          <p className="text-text-secondary mb-6">
            Can't find what you're looking for? We're here to help!
          </p>
          <Link
            to="/contact-us"
            className="btn btn-primary inline-flex"
          >
            <span>Contact Us</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Link to="/privacy" className="card p-4 text-center hover:border-cyan transition-colors">
            <p className="text-cyan-400 text-sm font-mono mb-1">Privacy</p>
            <p className="text-text-secondary text-xs">Policy</p>
          </Link>
          <Link to="/terms" className="card p-4 text-center hover:border-cyan transition-colors">
            <p className="text-cyan-400 text-sm font-mono mb-1">Terms</p>
            <p className="text-text-secondary text-xs">of Service</p>
          </Link>
          <Link to="/refunds" className="card p-4 text-center hover:border-cyan transition-colors">
            <p className="text-cyan-400 text-sm font-mono mb-1">Refunds</p>
            <p className="text-text-secondary text-xs">& Returns</p>
          </Link>
          <Link to="/shipping" className="card p-4 text-center hover:border-cyan transition-colors">
            <p className="text-cyan-400 text-sm font-mono mb-1">Shipping</p>
            <p className="text-text-secondary text-xs">Info</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
