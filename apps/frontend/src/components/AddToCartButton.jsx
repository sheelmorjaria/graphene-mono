import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AddToCartButton = ({
  productId,
  variationId = null,
  stockStatus,
  onAddToCart,
  disabled = false,
  isLoading = false,
  showSuccess = false,
  error = null,
  showQuantitySelector = false,
  maxQuantity = 10,
  buttonText = 'Add to Cart',
  outOfStockText = 'Out of Stock'
}) => {
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [localShowSuccess, setLocalShowSuccess] = useState(showSuccess);

  // Reset success state after 3 seconds
  useEffect(() => {
    if (showSuccess) {
      setLocalShowSuccess(true);
      const timer = setTimeout(() => {
        setLocalShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const isOutOfStock = stockStatus === 'out_of_stock';
  const isLowStock = stockStatus === 'low_stock';

  const handleAddToCart = () => {
    if (!disabled && !isLoading && !isOutOfStock) {
      onAddToCart(productId, showQuantitySelector ? selectedQuantity : 1, variationId);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleAddToCart();
    }
  };

  // Generate quantity options
  const quantityOptions = [];
  const maxOptions = isOutOfStock ? 0 : maxQuantity;
  for (let i = 1; i <= maxOptions; i++) {
    quantityOptions.push(i);
  }

  // Get button classes based on state
  const getButtonClasses = () => {
    const baseClasses = 'w-full sm:w-auto px-6 py-3 rounded-lg font-heading font-semibold text-sm uppercase tracking-wider transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center';

    if (error) {
      return `${baseClasses} bg-red-primary text-white hover:shadow-glow-pink hover:bg-red-primary focus:ring-red-primary`;
    }
    if (localShowSuccess) {
      return `${baseClasses} bg-matrix-primary text-text-on-accent shadow-glow-matrix`;
    }
    if (isOutOfStock || disabled || isLoading) {
      return `${baseClasses} bg-bg-elevated text-text-muted cursor-not-allowed border border-border-subtle`;
    }
    return `${baseClasses} btn-primary`;
  };

  // Get button text based on state
  const getButtonText = () => {
    if (error) return 'Try Again';
    if (localShowSuccess) return 'Added to Cart!';
    if (isLoading) return 'Adding...';
    if (isOutOfStock) return outOfStockText;
    return buttonText;
  };

  // Get stock status text and color
  const getStockStatus = () => {
    if (isOutOfStock) return { text: 'Unavailable', className: 'text-red-400', dotClass: 'bg-red-400' };
    if (isLowStock) return { text: 'Low Stock', className: 'text-amber-primary', dotClass: 'bg-amber-primary animate-pulse' };
    return { text: 'In Stock', className: 'text-matrix-400', dotClass: 'bg-matrix-400 animate-pulse' };
  };

  // Get icon based on state
  const getIcon = () => {
    if (error) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Error icon">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (localShowSuccess) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Success icon">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (isLoading) {
      return (
        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" aria-label="Loading icon">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }
    if (isOutOfStock) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Unavailable icon">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Cart icon">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.68 6.32a1 1 0 00.95 1.32h9.46a1 1 0 00.95-1.32L15 13M9 19v.01M20 19v.01" />
      </svg>
    );
  };

  const stockStatus_ = getStockStatus();
  const stockDescriptionId = `stock-${productId}`;

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      {showQuantitySelector && !isOutOfStock && (
        <div className="flex items-center gap-3">
          <label htmlFor={`quantity-${productId}`} className="form-label !mb-0">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              Quantity
            </span>
          </label>
          <div className="relative">
            <select
              id={`quantity-${productId}`}
              value={selectedQuantity}
              onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
              className="form-input !py-2 pr-10 appearance-none cursor-pointer font-mono text-sm"
              aria-label="Quantity"
            >
              {quantityOptions.map(qty => (
                <option key={qty} value={qty}>{qty}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        onKeyDown={handleKeyPress}
        disabled={isOutOfStock || disabled || isLoading}
        aria-describedby={stockDescriptionId}
        className={getButtonClasses()}
      >
        {getIcon()}
        <span>{getButtonText()}</span>
      </button>

      {/* Stock Status */}
      <div id={stockDescriptionId} className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${stockStatus_.dotClass}`}></span>
        <span className={`font-mono text-xs uppercase tracking-wider ${stockStatus_.className}`}>
          {stockStatus_.text}
        </span>
      </div>

      {/* Low Stock Warning */}
      {isLowStock && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-subtle border border-amber-primary/30 rounded-lg">
          <svg className="w-4 h-4 text-amber-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-mono text-xs text-amber-primary uppercase tracking-wider">
            Limited stock available
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-subtle border border-red-primary/30 rounded-lg animate-fadeIn">
          <svg className="w-4 h-4 text-red-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-mono text-xs text-red-primary">{error}</span>
        </div>
      )}
    </div>
  );
};

AddToCartButton.propTypes = {
  productId: PropTypes.string.isRequired,
  variationId: PropTypes.string,
  stockStatus: PropTypes.oneOf(['in_stock', 'low_stock', 'out_of_stock']).isRequired,
  stockQuantity: PropTypes.number,
  onAddToCart: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  showSuccess: PropTypes.bool,
  error: PropTypes.string,
  showQuantitySelector: PropTypes.bool,
  maxQuantity: PropTypes.number,
  buttonText: PropTypes.string,
  outOfStockText: PropTypes.string
};

export default AddToCartButton;
