import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-bg-primary border-t border-border-subtle mt-auto">
      {/* Animated accent line at top */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>

      <div className="container mx-auto px-4 lg:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div>
              <h3 className="font-display font-bold text-xl text-text-primary tracking-wider mb-1">GRAPHENE</h3>
              <p className="font-mono text-xs text-cyan-400 tracking-[0.2em] uppercase">Security</p>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Privacy-focused smartphones with GrapheneOS pre-installed. Take back control of your digital life.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <div className="w-2 h-2 bg-matrix-400 rounded-full animate-pulse"></div>
              <span className="font-mono text-xs text-text-muted uppercase tracking-wider">Secure • Private • Simple</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-text-primary mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/products" className="text-sm text-text-secondary hover:text-cyan-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-border-strong group-hover:bg-cyan-400 rounded-full transition-colors duration-200"></span>
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/contact-us" className="text-sm text-text-secondary hover:text-cyan-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-border-strong group-hover:bg-cyan-400 rounded-full transition-colors duration-200"></span>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-text-secondary hover:text-cyan-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-border-strong group-hover:bg-cyan-400 rounded-full transition-colors duration-200"></span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-text-secondary hover:text-cyan-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-border-strong group-hover:bg-cyan-400 rounded-full transition-colors duration-200"></span>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/refunds" className="text-sm text-text-secondary hover:text-cyan-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-border-strong group-hover:bg-cyan-400 rounded-full transition-colors duration-200"></span>
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-text-secondary hover:text-cyan-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-border-strong group-hover:bg-cyan-400 rounded-full transition-colors duration-200"></span>
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-text-primary mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/my-account/returns" className="text-sm text-text-secondary hover:text-cyan-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-border-strong group-hover:bg-cyan-400 rounded-full transition-colors duration-200"></span>
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="text-sm text-text-secondary hover:text-cyan-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-border-strong group-hover:bg-cyan-400 rounded-full transition-colors duration-200"></span>
                  Shipping Information
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-sm text-text-secondary hover:text-cyan-400 transition-colors duration-200 flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-border-strong group-hover:bg-cyan-400 rounded-full transition-colors duration-200"></span>
                  Track Your Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment & Security */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-text-primary mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Payment
            </h3>
            <p className="text-sm text-text-secondary">
              We accept secure payments via:
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="p-2 bg-bg-elevated rounded-lg border border-border-subtle">
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.485 7.095l1.304 7.724a.641.641 0 0 1-.54.742l-4.33.964Zm7.220-17.52c-.042-.027-.088-.053-.136-.077-.05-.026-.102-.048-.16-.067a3.572 3.572 0 0 0-.614-.126 9.962 9.962 0 0 0-1.67-.123H5.943L3.732 19.953l2.665-.592 1.328-7.527c.093-.524.563-.893 1.094-.893.824 0 1.607-.193 2.297-.568.696-.377 1.293-.925 1.735-1.612.446-.696.708-1.518.75-2.41a4.24 4.24 0 0 0-.077-.915 3.018 3.018 0 0 0-.028-.133Z" />
                  </svg>
                </div>
                <span className="text-sm text-text-secondary">PayPal</span>
                <span className="text-xs text-text-muted font-mono">Fast & Secure</span>
              </li>
            </ul>
            <div className="pt-4">
              <div className="flex items-center gap-2 px-4 py-3 bg-bg-elevated rounded-lg border border-border-subtle">
                <svg className="w-5 h-5 text-matrix-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="font-mono text-xs text-text-secondary uppercase tracking-wider">SSL Encrypted Checkout</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border-subtle">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-text-muted font-mono">
              &copy; {currentYear} Graphene Security. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="https://grapheneos.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-text-muted hover:text-cyan-400 transition-colors duration-200 font-mono uppercase tracking-wider text-xs flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                GrapheneOS
              </a>
              <a
                href="https://github.com/GrapheneOS"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-text-muted hover:text-cyan-400 transition-colors duration-200 font-mono uppercase tracking-wider text-xs flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.627-5.373-12-12-12" />
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className="h-[2px] bg-gradient-to-r from-cyan-400 via-matrix-400 to-cyan-400 bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]"></div>
    </footer>
  );
};

export default Footer;
