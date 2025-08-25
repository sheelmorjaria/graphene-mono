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
          className="flex items-center justify-between w-full text-forest-900 px-3 py-2 rounded hover:bg-forest-800 hover:text-forest-300 transition-colors duration-200"
          aria-expanded={isOpen}
        >
          <span>Products</span>
          <svg 
            className={`w-4 h-4 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isOpen && (
          <ul className="pl-6 py-2 space-y-1">
            <li>
              <Link
                to="/products"
                className="block text-forest-900 px-3 py-2 rounded hover:bg-forest-800 hover:text-forest-300 transition-colors duration-200 text-sm"
                onClick={handleItemClick}
              >
                All Products
              </Link>
            </li>
            <li>
              <Link
                to="/products?category=smartphones"
                className="block text-forest-900 px-3 py-2 rounded hover:bg-forest-800 hover:text-forest-300 transition-colors duration-200 text-sm"
                onClick={handleItemClick}
              >
                GrapheneOS Smartphones
              </Link>
            </li>
            <li>
              <Link
                to="/products?category=usb-drives"
                className="block text-forest-900 px-3 py-2 rounded hover:bg-forest-800 hover:text-forest-300 transition-colors duration-200 text-sm"
                onClick={handleItemClick}
              >
                Encrypted USB Drives
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
        className="flex items-center space-x-1 text-forest-900 px-3 py-1 rounded hover:text-forest-300 transition-colors duration-200"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>Products</span>
        <svg 
          className={`w-4 h-4 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-card rounded-md shadow-xl border border-border py-2 z-50 animate-slideIn">
          <Link
            to="/products"
            className="block px-4 py-3 text-sm text-forest-800 hover:bg-forest-50 transition-colors duration-200 border-b border-border last:border-b-0"
            onClick={handleItemClick}
          >
            <div className="font-medium">All Products</div>
            <div className="text-xs text-forest-600 mt-1">Browse our complete catalog</div>
          </Link>
          
          <Link
            to="/products?category=smartphones"
            className="block px-4 py-3 text-sm text-forest-800 hover:bg-forest-50 transition-colors duration-200 border-b border-border last:border-b-0"
            onClick={handleItemClick}
          >
            <div className="font-medium">GrapheneOS Smartphones</div>
            <div className="text-xs text-forest-600 mt-1">Privacy-focused Google Pixel phones</div>
          </Link>
          
          <Link
            to="/products?category=usb-drives"
            className="block px-4 py-3 text-sm text-forest-800 hover:bg-forest-50 transition-colors duration-200 border-b border-border last:border-b-0"
            onClick={handleItemClick}
          >
            <div className="font-medium">Encrypted USB Drives</div>
            <div className="text-xs text-forest-600 mt-1">Secure storage solutions</div>
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