import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage = () => {
  useEffect(() => {
    document.title = 'Privacy Policy - Graphene Security';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fadeIn">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-cyan-400 mb-4 uppercase tracking-wider">
            Privacy Policy
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
              Introduction
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>
                Graphene Security ("we," "our," or "us") respects your privacy and is committed to protecting your personal data.
                This privacy policy explains how we collect, use, disclose, and safeguard your information when you visit our
                website and purchase our GrapheneOS-flashed devices.
              </p>
              <p>
                We are a privacy-focused company that specializes in providing secure, privacy-enhancing smartphones.
                Our business model is built on privacy, and we take extreme measures to ensure your data remains secure.
              </p>
            </div>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-cyan-subtle flex items-center justify-center text-cyan-400 text-sm font-mono">2</span>
              Information We Collect
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <h3 className="font-heading font-semibold text-text-primary">Personal Information</h3>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>Name and contact information (email, phone)</li>
                <li>Shipping and billing addresses</li>
                <li>Payment information (processed securely through third-party payment processors)</li>
                <li>Account credentials (encrypted and salted)</li>
              </ul>

              <h3 className="font-heading font-semibold text-text-primary mt-6">Order Information</h3>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>Product selections and customization options</li>
                <li>Order history and transaction records</li>
                <li>Shipping tracking information</li>
                <li>Customer service communications</li>
              </ul>

              <h3 className="font-heading font-semibold text-text-primary mt-6">Technical Information</h3>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>IP address and browser type</li>
                <li>Device information and operating system</li>
                <li>Pages viewed and time spent on pages</li>
                <li>Referring website information</li>
              </ul>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-matrix-subtle flex items-center justify-center text-matrix-400 text-sm font-mono">3</span>
              How We Use Your Information
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>We use your personal information for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li><strong className="text-cyan-400">Order Processing:</strong> To process and fulfill your orders, including payment processing and shipping</li>
                <li><strong className="text-cyan-400">Communication:</strong> To respond to your inquiries, provide support, and send order updates</li>
                <li><strong className="text-cyan-400">Security:</strong> To detect, prevent, and address technical issues and fraudulent activity</li>
                <li><strong className="text-cyan-400">Improvement:</strong> To analyze usage patterns and improve our products and services</li>
                <li><strong className="text-cyan-400">Legal Compliance:</strong> To comply with legal obligations and enforce our terms</li>
              </ul>
            </div>
          </section>

          {/* Data Protection */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-matrix-subtle flex items-center justify-center text-matrix-400 text-sm font-mono">4</span>
              Data Protection & Security
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>
                We implement industry-leading security measures to protect your information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li><strong className="text-matrix-400">End-to-End Encryption:</strong> All data transmitted is encrypted using TLS 1.3</li>
                <li><strong className="text-matrix-400">Secure Storage:</strong> Data is encrypted at rest using AES-256 encryption</li>
                <li><strong className="text-matrix-400">Minimal Data Collection:</strong> We only collect data essential to our operations</li>
                <li><strong className="text-matrix-400">No Third-Party Tracking:</strong> We do not sell your data to third parties</li>
                <li><strong className="text-matrix-400">Regular Audits:</strong> Security audits are conducted regularly</li>
              </ul>
              <div className="mt-4 p-4 bg-matrix-subtle border border-matrix rounded-lg">
                <p className="text-matrix-400 font-mono text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Your privacy is our core business. We don't profit from your personal data.
                </p>
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-cyan-subtle flex items-center justify-center text-cyan-400 text-sm font-mono">5</span>
              Data Sharing & Disclosure
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>We do not sell, rent, or trade your personal information. We may share your data only in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li><strong>Service Providers:</strong> Trusted third parties who assist in operating our business (payment processors, shipping carriers)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government authorities</li>
                <li><strong>Business Transfer:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>Protection of Rights:</strong> To protect our rights, property, or safety and that of our users</li>
              </ul>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-cyan-subtle flex items-center justify-center text-cyan-400 text-sm font-mono">6</span>
              Your Privacy Rights
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>Depending on your location, you may have the following rights:</p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li><strong className="text-cyan-400">Access:</strong> Request a copy of your personal data</li>
                <li><strong className="text-cyan-400">Correction:</strong> Update or correct inaccurate information</li>
                <li><strong className="text-cyan-400">Deletion:</strong> Request deletion of your personal data</li>
                <li><strong className="text-cyan-400">Objection:</strong> Object to processing of your personal data</li>
                <li><strong className="text-cyan-400">Portability:</strong> Receive your data in a structured format</li>
                <li><strong className="text-cyan-400">Restriction:</strong> Request limitation of data processing</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us at{' '}
                <a href="mailto:contact@graphene-security.com" className="text-cyan-400 hover:text-matrix-400 transition-colors">
                  contact@graphene-security.com
                </a>
                {' '}or visit your{' '}
                <Link to="/account/privacy" className="text-cyan-400 hover:text-matrix-400 transition-colors">
                  account privacy settings
                </Link>.
              </p>
            </div>
          </section>

          {/* Cookies & Tracking */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-matrix-subtle flex items-center justify-center text-matrix-400 text-sm font-mono">7</span>
              Cookies & Tracking
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>
                We use minimal cookies and tracking technologies essential for site functionality:
              </p>
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li><strong>Essential Cookies:</strong> Required for site functionality (shopping cart, authentication)</li>
                <li><strong>Security Cookies:</strong> For fraud detection and prevention</li>
                <li><strong>Preference Cookies:</strong> To remember your settings</li>
              </ul>
              <p className="text-text-muted">
                We do NOT use tracking pixels, fingerprinting, or third-party analytics for advertising purposes.
              </p>
            </div>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-cyan-subtle flex items-center justify-center text-cyan-400 text-sm font-mono">8</span>
              Children's Privacy
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>
                Our services are not intended for children under 16. We do not knowingly collect personal information
                from children under 16. If you are a parent or guardian and believe your child has provided us with
                personal information, please contact us immediately.
              </p>
            </div>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-matrix-subtle flex items-center justify-center text-matrix-400 text-sm font-mono">9</span>
              International Data Transfers
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>
                Your information may be transferred to and processed in countries other than your own. We ensure
                appropriate safeguards are in place to protect your data in accordance with this Privacy Policy
                and applicable data protection laws.
              </p>
            </div>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-cyan-subtle flex items-center justify-center text-cyan-400 text-sm font-mono">10</span>
              Changes to This Policy
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>
                We may update this privacy policy from time to time. We will notify you of any changes by posting
                the new policy on this page and updating the "Last updated" date. We encourage you to review this
                policy periodically.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-matrix-subtle flex items-center justify-center text-matrix-400 text-sm font-mono">11</span>
              Contact Us
            </h2>
            <div className="text-text-secondary space-y-4 pl-11">
              <p>
                If you have questions about this Privacy Policy or our data practices, please contact us:
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

export default PrivacyPolicyPage;
