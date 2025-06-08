import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../contexts/CartContext';

const ProductCard = ({ product }) => {
  const {
    _id,
    name,
    slug,
    shortDescription,
    price,
    images,
    condition,
    stockStatus,
    stockQuantity
  } = product;

  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();

  // Get the main image or placeholder
  const mainImage = images && images.length > 0 ? images[0] : '/placeholder-product.jpg';

  // Format price in GBP
  const formatPrice = (price) => {
    return `£${price.toFixed(2)}`;
  };

  // Handle add to cart
  const handleAddToCart = async (e) => {
    e.preventDefault(); // Prevent navigation if button is inside a link
    e.stopPropagation();
    
    if (stockStatus === 'out_of_stock' || stockQuantity === 0 || isAddingToCart) {
      return;
    }

    setIsAddingToCart(true);
    try {
      const result = await addToCart(_id, 1);
      if (result.success) {
        // Could show a toast notification here
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Get condition badge styling with forest theme
  const getConditionBadgeClass = (condition) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (condition) {
      case 'new':
        return `${baseClasses} bg-forest-needle/20 text-forest-needle border border-forest-needle/30`;
      case 'excellent':
        return `${baseClasses} bg-forest-600/20 text-forest-600 border border-forest-600/30`;
      case 'good':
        return `${baseClasses} bg-forest-moss/20 text-forest-700 border border-forest-moss/30`;
      case 'fair':
        return `${baseClasses} bg-coral/20 text-coral-dark border border-coral/30`;
      default:
        return `${baseClasses} bg-forest-200 text-forest-700 border border-forest-300`;
    }
  };

  // Get stock status styling and text with forest theme
  const getStockStatusDisplay = (stockStatus) => {
    switch (stockStatus) {
      case 'in_stock':
        return { text: 'In Stock', className: 'text-forest-600' };
      case 'low_stock':
        return { text: 'Low Stock', className: 'text-sand-dark' };
      case 'out_of_stock':
        return { text: 'Out of Stock', className: 'text-coral' };
      default:
        return { text: 'Unknown', className: 'text-forest-500' };
    }
  };

  // Capitalize first letter
  const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const stockStatus_ = getStockStatusDisplay(stockStatus);

  return (
    <article className="bg-card rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-forest-600/20 animate-float border border-forest-200/50">
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
        {/* Condition Badge */}
        <div className="mb-2">
          <span className={getConditionBadgeClass(condition)}>
            {capitalize(condition)}
          </span>
        </div>

        {/* Product Name */}
        <h3 className="text-lg font-semibold text-forest-800 mb-2 line-clamp-1">
          {name}
        </h3>

        {/* Short Description */}
        <p className="text-forest-600 text-sm mb-3 line-clamp-2">
          {shortDescription}
        </p>

        {/* Price and Stock Status */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-bold text-forest-900">
            {formatPrice(price)}
          </span>
          <span className={`text-sm font-medium ${stockStatus_.className}`}>
            {stockStatus_.text}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleAddToCart}
            disabled={stockStatus === 'out_of_stock' || stockQuantity === 0 || isAddingToCart}
            className={`w-full py-2 px-4 rounded-md font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              stockStatus === 'out_of_stock' || stockQuantity === 0
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-forest-600 hover:bg-forest-700 focus:ring-forest-500 animate-wave'
            }`}
          >
            {isAddingToCart ? 'Adding...' : stockStatus === 'out_of_stock' || stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
          
          <Link
            to={`/products/${slug}`}
            className="block w-full bg-forest-700  text-center py-2 px-4 rounded-md hover:bg-forest-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2 transform hover:scale-105"
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
    price: PropTypes.number.isRequired,
    images: PropTypes.arrayOf(PropTypes.string),
    condition: PropTypes.oneOf(['new', 'excellent', 'good', 'fair']).isRequired,
    stockStatus: PropTypes.oneOf(['in_stock', 'low_stock', 'out_of_stock']).isRequired,
    stockQuantity: PropTypes.number,
    category: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
      slug: PropTypes.string
    }),
    createdAt: PropTypes.string
  }).isRequired
};

export default ProductCard;