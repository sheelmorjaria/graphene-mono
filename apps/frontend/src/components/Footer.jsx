import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-forest-900 text-forest-100 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">graphene-security.com</h3>
            <p className="text-sm text-forest-200 mb-4">
              Your trusted source for privacy-focused smartphones with GrapheneOS pre-installed.
            </p>
            <p className="text-sm text-forest-200">
              Secure. Private. Simple.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-sm text-forest-200 hover:text-forest-100 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/contact-us" className="text-sm text-forest-200 hover:text-forest-100 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href="/privacy-policy" className="text-sm text-forest-200 hover:text-forest-100 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms-of-service" className="text-sm text-forest-200 hover:text-forest-100 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/refund-policy" className="text-sm text-forest-200 hover:text-forest-100 transition-colors">
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/my-account/returns" className="text-sm text-forest-200 hover:text-forest-100 transition-colors">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <a href="/shipping-info" className="text-sm text-forest-200 hover:text-forest-100 transition-colors">
                  Shipping Information
                </a>
              </li>
              <li>
                <a href="/faq" className="text-sm text-forest-200 hover:text-forest-100 transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <Link to="/orders" className="text-sm text-forest-200 hover:text-forest-100 transition-colors">
                  Track Your Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment & Security */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
            <p className="text-sm text-forest-200 mb-4">
              We accept secure payments via:
            </p>
            <ul className="space-y-2">
              <li className="text-sm text-forest-200">
                <span className="font-medium">PayPal</span> - Fast & secure
              </li>
              <li className="text-sm text-forest-200">
                <span className="font-medium">Bitcoin</span> - Private transactions
              </li>
            </ul>
            <div className="mt-4">
              <p className="text-sm text-forest-200">
                <span className="inline-block mr-2">🔒</span>
                SSL Encrypted Checkout
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-forest-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-forest-200 mb-4 md:mb-0">
              &copy; {currentYear} graphene-security.com. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a 
                href="https://grapheneos.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-forest-200 hover:text-forest-100 transition-colors"
              >
                About GrapheneOS
              </a>
              <a 
                href="https://github.com/GrapheneOS" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-forest-200 hover:text-forest-100 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;