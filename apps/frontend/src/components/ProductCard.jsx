import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const {
    _id,
    name,
    slug,
    shortDescription,
    priceRange,
    images,
    availableColors,
    availableConditions,
    availableStorage,
    category,
    isInStock
  } = product;


  // Get the main image or placeholder - use out-of-stock placeholder if not in stock
  const mainImage = isInStock && images && images.length > 0
    ? images[0]
    : isInStock
      ? '/images/placeholder.png'
      : '/images/placeholder-out-of-stock.png';

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


  // Get color badge styling
  const getColorBadgeClass = () => {
    return 'px-2 py-1 text-xs font-mono uppercase tracking-wider rounded bg-bg-elevated text-cyan-400 border border-border-cyan';
  };

  // Get stock status display
  const getStockStatusDisplay = () => {
    if (isInStock) {
      return { text: 'In Stock', className: 'text-matrix-400', icon: 'check' };
    }
    return { text: 'Out of Stock', className: 'text-red-400', icon: 'x' };
  };

  // Get lead time, honoring the product's lead time when available and
  // falling back to the fixed default otherwise.
  const getLeadTime = () => {
    const leadTime = product.leadTime?.displayText;
    return leadTime || '5-7 working days';
  };


  const stockStatus_ = getStockStatusDisplay();

  return (
    <article
      data-testid={`product-card-${slug}`}
      className="group card card-glow"
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-bg-elevated">
        {/* Status indicator overlay */}
        {!isInStock && (
          <div className="absolute inset-0 bg-bg-deep/80 flex items-center justify-center z-10">
            <div className="text-center">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="font-heading font-bold text-red-400 text-sm uppercase tracking-wider">Out of Stock</span>
            </div>
          </div>
        )}

        {/* Category badge */}
        {category && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2 py-1 text-xs font-mono uppercase tracking-wider bg-bg-primary/90 backdrop-blur text-cyan-400 border border-border-cyan rounded">
              {category.slug}
            </span>
          </div>
        )}

        <img
          src={mainImage}
          alt={name}
          className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Product Info */}
      <div className="p-5">
        {/* Available Options */}
        <div className="mb-3 flex flex-wrap gap-2">
          {/* Show color, condition, and storage options */}
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
          {availableStorage && availableStorage.length > 0 && (
            <span className={getColorBadgeClass()}>
              {availableStorage.length} {availableStorage.length === 1 ? 'Storage' : 'Storage Options'}
            </span>
          )}
        </div>

        {/* Product Name */}
        <h3
          data-testid="product-title"
          className="font-heading font-bold text-lg text-text-primary mb-2 line-clamp-1 group-hover:text-cyan-400 transition-colors duration-200"
        >
          {name}
        </h3>

        {/* Short Description */}
        <p
          data-testid="product-description"
          className="text-text-secondary text-sm mb-4 line-clamp-2"
        >
          {shortDescription}
        </p>

        {/* Price and Stock Status */}
        <div className="flex justify-between items-center mb-3">
          <span
            data-testid="product-price"
            className="font-display font-bold text-xl text-cyan-400"
          >
            {formatPriceRange(priceRange)}
          </span>
          <span className={`flex items-center gap-1 text-sm font-mono uppercase tracking-wider ${stockStatus_.className}`}>
            <span className={`w-2 h-2 rounded-full ${isInStock ? 'bg-matrix-400 animate-pulse' : 'bg-red-400'}`}></span>
            {stockStatus_.text}
          </span>
        </div>

        {/* Lead Time */}
        <div className="mb-4">
          <div className="flex items-center text-sm text-text-muted font-mono">
            <svg className="w-4 h-4 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{getLeadTime()}</span>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <Link
            to={`/products/${slug}`}
            data-testid="product-details"
            className="btn btn-primary w-full group-hover:shadow-glow-matrix transition-all duration-200"
          >
            <span>View Details</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
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
    availableStorage: PropTypes.arrayOf(PropTypes.string),
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
