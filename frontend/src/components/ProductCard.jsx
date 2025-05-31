import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const {
    name,
    slug,
    shortDescription,
    price,
    images,
    condition,
    stockStatus,
    category
  } = product;

  // Get the main image or placeholder
  const mainImage = images && images.length > 0 ? images[0] : '/placeholder-product.jpg';

  // Format price in GBP
  const formatPrice = (price) => {
    return `£${price.toFixed(2)}`;
  };

  // Get condition badge styling
  const getConditionBadgeClass = (condition) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (condition) {
      case 'new':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'excellent':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'good':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'fair':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Get stock status styling and text
  const getStockStatusDisplay = (stockStatus) => {
    switch (stockStatus) {
      case 'in_stock':
        return { text: 'In Stock', className: 'text-green-600' };
      case 'low_stock':
        return { text: 'Low Stock', className: 'text-yellow-600' };
      case 'out_of_stock':
        return { text: 'Out of Stock', className: 'text-red-600' };
      default:
        return { text: 'Unknown', className: 'text-gray-600' };
    }
  };

  // Capitalize first letter
  const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const stockStatus_ = getStockStatusDisplay(stockStatus);

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 hover:shadow-lg">
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
          {name}
        </h3>

        {/* Short Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {shortDescription}
        </p>

        {/* Price and Stock Status */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-bold text-gray-900">
            {formatPrice(price)}
          </span>
          <span className={`text-sm font-medium ${stockStatus_.className}`}>
            {stockStatus_.text}
          </span>
        </div>

        {/* View Details Button */}
        <Link
          to={`/products/${slug}`}
          className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          View Details
        </Link>
      </div>
    </article>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    shortDescription: PropTypes.string,
    price: PropTypes.number.isRequired,
    images: PropTypes.arrayOf(PropTypes.string),
    condition: PropTypes.oneOf(['new', 'excellent', 'good', 'fair']).isRequired,
    stockStatus: PropTypes.oneOf(['in_stock', 'low_stock', 'out_of_stock']).isRequired,
    category: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      slug: PropTypes.string
    }),
    createdAt: PropTypes.string
  }).isRequired
};

export default ProductCard;