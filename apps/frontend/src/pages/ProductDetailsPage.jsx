import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useProductDetails from '../hooks/useProductDetails';
import ImageGallery from '../components/ImageGallery';
import AddToCartButton from '../components/AddToCartButton';
import VariationSelector from '../components/VariationSelector';
import { useCart } from '../contexts/CartContext';
import SEOWrapper from '../components/SEO/SEOWrapper';
import { generateProductStructuredData, generateBreadcrumbStructuredData } from '../utils/structuredData';

const ProductDetailsPage = () => {
  const { slug } = useParams();
  const { product, loading, error, refetch } = useProductDetails(slug);
  const { addToCart } = useCart();
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [currentImages, setCurrentImages] = useState([]);

  // Update images when product or selected variation changes
  useEffect(() => {
    console.log('ProductDetailsPage: selectedVariation changed:', selectedVariation);
    if (product) {
      if (selectedVariation && selectedVariation.images && selectedVariation.images.length > 0) {
        // Use variant-specific images if available
        console.log('Using variation images:', selectedVariation.images);
        setCurrentImages(selectedVariation.images);
      } else {
        // Fall back to product images
        console.log('Using product images:', product.images);
        setCurrentImages(product.images || []);
      }
    }
  }, [product, selectedVariation]);

  const handleAddToCart = async (productId, quantity, variationId) => {
    console.log('handleAddToCart called with:', { productId, quantity, variationId });

    if (!productId) {
      console.error('Product ID is missing in handleAddToCart');
      return;
    }

    try {
      const result = await addToCart(productId, quantity, variationId);
      if (result.success) {
        console.log('Product added to cart successfully:', result.addedItem);
      } else {
        console.error('Failed to add to cart:', result.error);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };


  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) {
      return '£0.00';
    }
    return `£${Number(price).toFixed(2)}`;
  };

  const formatPriceRange = (range) => {
    if (!range || range.min === range.max) {
      return formatPrice(range?.min || 0);
    }
    return `${formatPrice(range.min)} - ${formatPrice(range.max)}`;
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"
              data-testid="loading-spinner"
              aria-label="Loading"
            ></div>
            <p className="text-text-muted font-mono">Loading product details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="card card-glow p-8 max-w-md mx-auto">
            <svg className="w-16 h-16 mx-auto mb-4 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="font-heading text-xl font-bold text-text-primary mb-2">Error Loading Product</h2>
            <p className="text-text-secondary mb-6">{error}</p>
            <button
              onClick={refetch}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="card card-glow p-8 max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 bg-cyan-subtle border border-cyan-400 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="font-heading text-xl font-bold text-text-primary mb-2">Product Not Found</h2>
            <p className="text-text-secondary mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <Link
              to="/products"
              className="btn btn-primary"
            >
              Back to Products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Generate breadcrumb data
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' }
  ];


  breadcrumbs.push({ name: product.name });

  // Generate structured data
  const productStructuredData = generateProductStructuredData(product);
  const breadcrumbStructuredData = generateBreadcrumbStructuredData(breadcrumbs);

  return (
    <>
      <SEOWrapper
        title={product.name}
        description={product.shortDescription || product.description?.substring(0, 160)}
        image={product.images?.[0]}
        type="product"
        structuredData={[productStructuredData, breadcrumbStructuredData]}
        additionalMeta={[
          { property: 'product:price:amount', content: product.price },
          { property: 'product:price:currency', content: 'GBP' },
          { property: 'product:availability', content: product.inStock ? 'in stock' : 'out of stock' },
          { property: 'product:condition', content: product.condition || 'new' }
        ]}
      />
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8 animate-fadeIn" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link to="/" className="text-text-muted hover:text-cyan-400 transition-colors font-mono">
                Home
              </Link>
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mx-2 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <Link to="/products" className="text-text-muted hover:text-cyan-400 transition-colors font-mono">
                Products
              </Link>
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mx-2 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-cyan-400 font-mono">{product.name}</span>
            </li>
          </ol>
        </nav>

        {/* Product Details Container */}
        <div
          className="flex flex-col lg:flex-row gap-8"
          data-testid="product-details-container"
        >
          {/* Image Section */}
          <div
            className="w-full lg:w-1/2"
            data-testid="image-section"
          >
            <ImageGallery
              images={currentImages}
              alt={`${product.name} product images`}
            />
          </div>

          {/* Details Section */}
          <div
            className="w-full lg:w-1/2 space-y-6"
            data-testid="details-section"
          >
            {/* Product Header */}
            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-cyan-400 uppercase tracking-wider mb-2">
                {product.name}
              </h1>

              {product.baseModel && (
                <p className="text-sm text-text-muted font-mono mb-2">
                  Model: <span className="text-cyan-400">{product.baseModel}</span>
                </p>
              )}

              {product.shortDescription && (
                <p className="text-lg text-text-secondary mb-4">
                  {product.shortDescription}
                </p>
              )}

              {/* Price Display */}
              <div className="flex items-center gap-4 mb-6">
                {selectedVariation ? (
                  <div className="flex items-center gap-3">
                    <span
                      className="text-3xl font-bold text-cyan-400 font-mono"
                      aria-label={`Price: ${selectedVariation.salePrice ? formatPrice(selectedVariation.salePrice) : formatPrice(selectedVariation.price)}`}
                    >
                      {selectedVariation.salePrice ? (
                        <>
                          <span className="line-through text-text-muted text-2xl mr-2">
                            {formatPrice(selectedVariation.price)}
                          </span>
                          {formatPrice(selectedVariation.salePrice)}
                        </>
                      ) : (
                        formatPrice(selectedVariation.price)
                      )}
                    </span>
                    {selectedVariation.salePrice && (
                      <span className="bg-red-subtle border border-red text-red text-sm font-mono px-3 py-1 rounded">
                        SALE
                      </span>
                    )}
                  </div>
                ) : (
                  product.priceRange && (
                    <span
                      className="text-3xl font-bold text-cyan-400 font-mono"
                      aria-label={`Price range: ${formatPriceRange(product.priceRange)}`}
                    >
                      {formatPriceRange(product.priceRange)}
                    </span>
                  )
                )}
              </div>

              {/* Lead Time Information */}
              {product.leadTime && (
                <div className="bg-cyan-subtle border border-cyan-400 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="font-heading font-semibold text-text-primary mb-1">Delivery Information</h4>
                      <p className="text-text-secondary text-sm">
                        Shipping time: <span className="font-mono text-cyan-400">{product.leadTime.displayText || '3-5 days'}</span>
                      </p>
                      <p className="text-text-muted text-xs mt-1 font-mono">
                        All GrapheneOS phones are custom-prepared upon order to ensure maximum security and privacy.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Variation Selector */}
            {product.variations && product.variations.length > 0 && (
              <div className="border-t border-border-subtle pt-6">
                <VariationSelector
                  variations={product.variations}
                  onVariationSelect={setSelectedVariation}
                />
              </div>
            )}

            {/* Add to Cart Section */}
            {product._id && (
              <div className="border-t border-border-subtle pt-6">
                {selectedVariation ? (
                  <AddToCartButton
                    productId={product._id}
                    variationId={selectedVariation._id}
                    stockStatus={selectedVariation.stockStatus}
                    onAddToCart={handleAddToCart}
                    showQuantitySelector={true}
                  />
                ) : (
                  <div className="space-y-3">
                    <button
                      disabled
                      className="w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-sm bg-bg-elevated border border-border-subtle text-text-muted cursor-not-allowed flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                      </svg>
                      Add to Cart
                    </button>
                    <p className="text-sm text-text-muted font-mono">
                      Please select product options above to add this item to your cart.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Product Specifications */}
            {product.attributes && product.attributes.length > 0 && (
              <div className="border-t border-border-subtle pt-6">
                <h3 className="font-heading text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Specifications
                </h3>
                <ul
                  className="space-y-3"
                  aria-label="Product specifications"
                >
                  {product.attributes.map((attr, index) => (
                    <li key={index} className="flex justify-between py-2 border-b border-border-subtle">
                      <span className="font-medium text-text-secondary">{attr.name}:</span>
                      <span className="text-text-primary font-mono text-sm">{attr.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Long Description */}
            {product.longDescription && (
              <div className="border-t border-border-subtle pt-6">
                <h3 className="font-heading text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-matrix-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Description
                </h3>
                <div className="prose prose-invert prose-sm max-w-none text-text-secondary">
                  <p>{product.longDescription}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default ProductDetailsPage;
