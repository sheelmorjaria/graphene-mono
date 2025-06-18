import { useParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import useProductDetails from '../hooks/useProductDetails';
import ImageGallery from '../components/ImageGallery';
import AddToCartButton from '../components/AddToCartButton';
import { useCart } from '../contexts/CartContext';

const ProductDetailsPage = () => {
  const { slug } = useParams();
  const { product, loading, error, refetch } = useProductDetails(slug);
  const { addToCart } = useCart();

  // Set page title when product loads
  useEffect(() => {
    if (product) {
      document.title = `${product.name} - GrapheneOS Store`;
    } else {
      document.title = 'Product Details - GrapheneOS Store';
    }
  }, [product]);

  const handleAddToCart = async (productId, quantity) => {
    console.log('handleAddToCart called with:', { productId, quantity });
    
    if (!productId) {
      console.error('Product ID is missing in handleAddToCart');
      return;
    }
    
    try {
      const result = await addToCart(productId, quantity);
      if (result.success) {
        console.log('Product added to cart successfully:', result.addedItem);
      } else {
        console.error('Failed to add to cart:', result.error);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const getConditionBadgeClasses = (condition) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
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

  const formatPrice = (price) => {
    return `£${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
              data-testid="loading-spinner"
              aria-label="Loading"
            ></div>
            <p className="text-gray-600">Loading product details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Product</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
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
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h2>
            <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <Link
              to="/products"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link to="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <Link to="/products" className="hover:text-blue-600 transition-colors">
              Products
            </Link>
          </li>
          {product.category && (
            <li className="flex items-center">
              <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <Link 
                to={`/products?category=${product.category.slug}`} 
                className="hover:text-blue-600 transition-colors"
              >
                {product.category.name}
              </Link>
            </li>
          )}
          <li className="flex items-center">
            <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-900">{product.name}</span>
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
            images={product.images || []} 
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
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {product.name}
              </h1>
              {product.condition && (
                <span 
                  className={getConditionBadgeClasses(product.condition)}
                  data-testid="condition-badge"
                >
                  {product.condition.charAt(0).toUpperCase() + product.condition.slice(1)}
                </span>
              )}
            </div>
            
            {product.shortDescription && (
              <p className="text-lg text-gray-600 mb-4">
                {product.shortDescription}
              </p>
            )}

            <div className="flex items-center gap-4 mb-6">
              <span 
                className="text-3xl font-bold text-blue-600"
                aria-label={`Price: ${formatPrice(product.price)}`}
              >
                {formatPrice(product.price)}
              </span>
              
              {product.category && (
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Category:</span> {product.category.name}
                </div>
              )}
            </div>
          </div>

          {/* Add to Cart Section */}
          {product._id && (
            <div className="border-t border-gray-200 pt-6">
              <AddToCartButton
                productId={product._id}
                stockStatus={product.stockStatus}
                stockQuantity={product.stockQuantity}
                onAddToCart={handleAddToCart}
                showQuantitySelector={true}
              />
            </div>
          )}

          {/* Product Specifications */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
              <ul 
                className="space-y-3"
                aria-label="Product specifications"
              >
                {product.attributes.map((attr, index) => (
                  <li key={index} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">{attr.name}:</span>
                    <span className="text-gray-600">{attr.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Long Description */}
          {product.longDescription && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              <div className="prose prose-sm max-w-none text-gray-600">
                <p>{product.longDescription}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ProductDetailsPage;