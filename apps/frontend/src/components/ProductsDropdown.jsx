import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const ProductsDropdown = ({ onItemClick, isMobile = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleItemClick = () => {
    setIsOpen(false);
    if (onItemClick) {
      onItemClick();
    }
  };

  // Mobile version - renders as expandable menu items
  if (isMobile) {
    return (
      <li>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-4 py-3 text-text-secondary hover:text-cyan-400 hover:bg-bg-elevated transition-all duration-200 font-heading font-semibold text-sm uppercase tracking-wider rounded-lg"
          aria-expanded={isOpen}
        >
          <span className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Products
          </span>
          <svg
            className={`w-4 h-4 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <ul className="pl-12 py-2 space-y-1 animate-fadeIn">
            <li>
              <Link
                to="/products"
                className="flex items-center gap-3 px-4 py-2 text-text-muted hover:text-matrix-400 transition-all duration-200 font-mono text-sm uppercase tracking-wider rounded-lg"
                onClick={handleItemClick}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                All Products
              </Link>
            </li>
            <li>
              <Link
                to="/products?category=smartphones"
                className="flex items-center gap-3 px-4 py-2 text-text-muted hover:text-matrix-400 transition-all duration-200 font-mono text-sm uppercase tracking-wider rounded-lg"
                onClick={handleItemClick}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Smartphones
              </Link>
            </li>
          </ul>
        )}
      </li>
    );
  }

  // Desktop version - renders as dropdown
  return (
    <li className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-text-secondary hover:text-cyan-400 transition-all duration-200 font-heading font-semibold text-sm uppercase tracking-wider"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>Products</span>
        <svg
          className={`w-4 h-4 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-3 w-72 bg-bg-card backdrop-blur-md rounded-lg shadow-glow-cyan border border-border-cyan overflow-hidden z-50 animate-slideIn">
          <Link
            to="/products"
            className="block px-5 py-4 hover:bg-bg-elevated transition-all duration-200 border-b border-border-subtle last:border-b-0 group"
            onClick={handleItemClick}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-bg-primary rounded-lg group-hover:bg-cyan-subtle transition-colors duration-200">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-heading font-semibold text-text-primary group-hover:text-cyan-400 transition-colors duration-200">All Products</div>
                <div className="font-mono text-xs text-text-muted mt-1">Browse complete catalog</div>
              </div>
            </div>
          </Link>

          <Link
            to="/products?category=smartphones"
            className="block px-5 py-4 hover:bg-bg-elevated transition-all duration-200 border-b border-border-subtle last:border-b-0 group"
            onClick={handleItemClick}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-bg-primary rounded-lg group-hover:bg-matrix-subtle transition-colors duration-200">
                <svg className="w-5 h-5 text-matrix-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-heading font-semibold text-text-primary group-hover:text-matrix-400 transition-colors duration-200">GrapheneOS Phones</div>
                <div className="font-mono text-xs text-text-muted mt-1">Privacy-focused Pixel devices</div>
              </div>
            </div>
          </Link>
        </div>
      )}
    </li>
  );
};

ProductsDropdown.propTypes = {
  onItemClick: PropTypes.func,
  isMobile: PropTypes.bool
};

export default ProductsDropdown;
