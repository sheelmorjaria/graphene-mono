import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../contexts/CartContext';

const ProductCard = ({ product }) => {
  const {
    id,
    _id,
    name,
    slug,
    shortDescription,
    baseModel,
    priceRange,
    images,
    variations,
    availableColors,
    availableConditions,
    isInStock
  } = product;

  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();

  // Get the main image or placeholder
  const mainImage = images && images.length > 0 ? images[0] : '/placeholder-product.jpg';

  // Format price in GBP
  const formatPrice = (price) => {
    return `£${price.toFixed(2)}`;
  };

  // Format price range
  const formatPriceRange = (range) => {
    if (!range || range.min === range.max) {
      return formatPrice(range?.min || 0);
    }
    return `${formatPrice(range.min)} - ${formatPrice(range.max)}`;
  };

  // Handle add to cart
  const handleAddToCart = async (e) => {
    e.preventDefault(); // Prevent navigation if button is inside a link
    e.stopPropagation();
    
    if (!isInStock || isAddingToCart) {
      return;
    }

    setIsAddingToCart(true);
    try {
      // Use id (from API) or _id (fallback) to handle both cases
      const productId = id || _id;
      
      if (!productId) {
        console.error('Product ID is missing in ProductCard');
        return;
      }
      
      const result = await addToCart(productId, 1);
      if (result.success) {
        // Could show a toast notification here
        console.log('Product added to cart:', productId);
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Get color badge styling
  const getColorBadgeClass = () => {
    return 'px-2 py-1 text-xs font-medium rounded-full bg-forest-200/50 text-forest-700 border border-forest-300/50';
  };

  // Get stock status display
  const getStockStatusDisplay = () => {
    if (isInStock) {
      return { text: 'In Stock', className: 'text-forest-600' };
    }
    return { text: 'Out of Stock', className: 'text-coral' };
  };

  // Capitalize first letter
  const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const stockStatus_ = getStockStatusDisplay();

  return (
    <article 
      data-testid={`product-card-${slug}`}
      className="bg-card rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-forest-600/20 animate-float border border-forest-200/50"
    >
      {/* Product Image */}
      <div className="aspect-square overflow-hidden">
        <img
          src={mainImage}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Available Options */}
        <div className="mb-2 flex flex-wrap gap-1">
          {availableColors && availableColors.length > 0 && (
            <span className={getColorBadgeClass()}>
              {availableColors.length} {availableColors.length === 1 ? 'Color' : 'Colors'}
            </span>
          )}
          {availableConditions && availableConditions.length > 0 && (
            <span className={getColorBadgeClass()}>
              {availableConditions.length} {availableConditions.length === 1 ? 'Condition' : 'Conditions'}
            </span>
          )}
        </div>

        {/* Product Name */}
        <h3 
          data-testid="product-title"
          className="text-lg font-semibold text-forest-800 mb-2 line-clamp-1"
        >
          {name}
        </h3>

        {/* Short Description */}
        <p 
          data-testid="product-description"
          className="text-forest-600 text-sm mb-3 line-clamp-2"
        >
          {shortDescription}
        </p>

        {/* Price and Stock Status */}
        <div className="flex justify-between items-center mb-3">
          <span 
            data-testid="product-price"
            className="text-xl font-bold text-forest-900"
          >
            {formatPriceRange(priceRange)}
          </span>
          <span className={`text-sm font-medium ${stockStatus_.className}`}>
            {stockStatus_.text}
          </span>
        </div>

        {/* Lead Time */}
        {product.leadTime && (
          <div className="mb-4">
            <div className="flex items-center text-sm text-forest-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Lead time: {product.leadTime.displayText || '5-7 working days'}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            data-testid="add-to-cart-button"
            onClick={handleAddToCart}
            disabled={!isInStock || isAddingToCart}
            className={`w-full py-2 px-4 rounded-md font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              !isInStock
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-forest-600 hover:bg-forest-700 focus:ring-forest-500 animate-wave'
            }`}
          >
            {isAddingToCart ? 'Adding...' : !isInStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
          
          <Link
            to={`/products/${slug}`}
            data-testid="product-details"
            className="block w-full bg-forest-700 text-center py-2 px-4 rounded-md hover:bg-forest-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2 transform hover:scale-105"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    shortDescription: PropTypes.string,
    baseModel: PropTypes.string,
    priceRange: PropTypes.shape({
      min: PropTypes.number,
      max: PropTypes.number
    }),
    images: PropTypes.arrayOf(PropTypes.string),
    variations: PropTypes.arrayOf(PropTypes.shape({
      condition: PropTypes.string,
      color: PropTypes.string,
      price: PropTypes.number,
      salePrice: PropTypes.number,
      stockStatus: PropTypes.string,
      sku: PropTypes.string
    })),
    availableColors: PropTypes.arrayOf(PropTypes.string),
    availableConditions: PropTypes.arrayOf(PropTypes.string),
    isInStock: PropTypes.bool,
    category: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
      slug: PropTypes.string
    }),
    createdAt: PropTypes.string
  }).isRequired
};

export default ProductCard;