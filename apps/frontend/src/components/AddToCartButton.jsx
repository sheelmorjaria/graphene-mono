import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AddToCartButton = ({
  productId,
  stockStatus,
  stockQuantity,
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

  const isOutOfStock = stockStatus === 'out_of_stock' || stockQuantity === 0;
  const isLowStock = stockStatus === 'low_stock';

  const handleAddToCart = () => {
    if (!disabled && !isLoading && !isOutOfStock) {
      onAddToCart(productId, showQuantitySelector ? selectedQuantity : 1);
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
  const maxOptions = Math.min(stockQuantity, maxQuantity);
  for (let i = 1; i <= maxOptions; i++) {
    quantityOptions.push(i);
  }

  // Get button classes based on state
  const getButtonClasses = () => {
    if (error) {
      return 'bg-red-600 hover:bg-red-700 text-white';
    }
    if (localShowSuccess) {
      return 'bg-green-600 text-white';
    }
    if (isOutOfStock || disabled || isLoading) {
      return 'bg-gray-400 text-white cursor-not-allowed';
    }
    return 'bg-blue-600 hover:bg-blue-700 text-white';
  };

  // Get button text based on state
  const getButtonText = () => {
    if (error) return 'Try Again';
    if (localShowSuccess) return 'Added to Cart!';
    if (isLoading) return 'Adding...';
    if (isOutOfStock) return outOfStockText;
    return buttonText;
  };

  // Get stock status text
  const getStockStatusText = () => {
    if (isOutOfStock) return 'Unavailable';
    if (isLowStock && stockQuantity <= 5) return `${stockQuantity} in stock`;
    if (stockQuantity > 10) return 'In Stock';
    return `${stockQuantity} in stock`;
  };

  // Get icon based on state
  const getIcon = () => {
    if (error) {
      return (
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-label="Error icon">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    if (localShowSuccess) {
      return (
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-label="Success icon">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    }
    if (isLoading) {
      return (
        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" aria-label="Loading icon">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }
    if (isOutOfStock) {
      return (
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-label="Unavailable icon">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-label="Cart icon">
        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
      </svg>
    );
  };

  const stockDescriptionId = `stock-${productId}`;

  return (
    <div className="space-y-3">
      {/* Quantity Selector */}
      {showQuantitySelector && !isOutOfStock && (
        <div className="flex items-center space-x-2">
          <label htmlFor={`quantity-${productId}`} className="text-sm font-medium text-gray-700">
            Quantity:
          </label>
          <select
            id={`quantity-${productId}`}
            value={selectedQuantity}
            onChange={(e) => setSelectedQuantity(parseInt(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Quantity"
          >
            {quantityOptions.map(qty => (
              <option key={qty} value={qty}>{qty}</option>
            ))}
          </select>
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        onKeyDown={handleKeyPress}
        disabled={isOutOfStock || disabled || isLoading}
        aria-describedby={stockDescriptionId}
        className={`
          w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-sm
          transition-colors duration-200 focus:outline-none focus:ring-2 
          focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center
          ${getButtonClasses()}
        `}
      >
        {getIcon()}
        {getButtonText()}
      </button>

      {/* Stock Status */}
      <div id={stockDescriptionId} className="text-sm text-gray-600">
        {getStockStatusText()}
      </div>

      {/* Low Stock Warning */}
      {isLowStock && stockQuantity <= 5 && stockQuantity > 0 && (
        <div className="text-sm text-amber-600 font-medium">
          Hurry! Only {stockQuantity} left in stock!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 font-medium">
          {error}
        </div>
      )}
    </div>
  );
};

AddToCartButton.propTypes = {
  productId: PropTypes.string.isRequired,
  stockStatus: PropTypes.oneOf(['in_stock', 'low_stock', 'out_of_stock']).isRequired,
  stockQuantity: PropTypes.number.isRequired,
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