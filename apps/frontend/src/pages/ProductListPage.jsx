import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useProducts from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import SortOptions from '../components/SortOptions';
import FilterSidebar from '../components/FilterSidebar';
import SEOWrapper from '../components/SEO/SEOWrapper';

const ProductListPage = () => {
  const { products, pagination, loading, error, fetchProducts } = useProducts();
  const [searchParams] = useSearchParams();
  const [currentSort, setCurrentSort] = useState('price-low');
  const [filters, setFilters] = useState({
    condition: '',
    priceRange: { min: '', max: '' }
  });


  useEffect(() => {
    const category = searchParams.get('category');
    const params = {
      sort: currentSort,
      ...(category && { category }),
      ...(filters.condition && { condition: filters.condition }),
      ...(filters.priceRange.min && { minPrice: filters.priceRange.min }),
      ...(filters.priceRange.max && { maxPrice: filters.priceRange.max })
    };
    fetchProducts(params);
  }, [fetchProducts, currentSort, filters, searchParams]);

  const handleRetry = () => {
    const category = searchParams.get('category');
    const params = {
      sort: currentSort,
      ...(category && { category }),
      ...(filters.condition && { condition: filters.condition }),
      ...(filters.priceRange.min && { minPrice: filters.priceRange.min }),
      ...(filters.priceRange.max && { maxPrice: filters.priceRange.max })
    };
    fetchProducts(params);
  };

  const handlePageChange = (newPage) => {
    const category = searchParams.get('category');
    const params = {
      page: newPage,
      sort: currentSort,
      ...(category && { category }),
      ...(filters.condition && { condition: filters.condition }),
      ...(filters.priceRange.min && { minPrice: filters.priceRange.min }),
      ...(filters.priceRange.max && { maxPrice: filters.priceRange.max })
    };
    fetchProducts(params);
  };

  const handleSortChange = (newSort) => {
    setCurrentSort(newSort);
    const category = searchParams.get('category');
    const params = {
      sort: newSort,
      page: 1,
      ...(category && { category }),
      ...(filters.condition && { condition: filters.condition }),
      ...(filters.priceRange.min && { minPrice: filters.priceRange.min }),
      ...(filters.priceRange.max && { maxPrice: filters.priceRange.max })
    };
    fetchProducts(params);
  };


  const handleConditionChange = (condition) => {
    setFilters(prev => ({ ...prev, condition }));
  };

  const handlePriceRangeChange = (priceRange) => {
    setFilters(prev => ({ ...prev, priceRange }));
  };

  const handleClearFilters = () => {
    setFilters({
      condition: '',
      priceRange: { min: '', max: '' }
    });
  };

  // Loading state
  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-64">
          <div
            data-testid="loading-spinner"
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"
          ></div>
          <p className="mt-4 text-text-muted font-mono">Loading products...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-64">
          <div className="text-center max-w-md">
            <div className="card card-glow p-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="font-display text-2xl font-bold text-text-primary mb-2">Error Loading Products</h2>
              <p className="text-text-secondary mb-6">{error}</p>
              <button
                onClick={handleRetry}
                className="btn btn-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Empty state
  if (!products || products.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-cyan-400 mb-4 animate-fadeIn uppercase tracking-wider">
            GrapheneOS Smartphones
          </h1>
          <p className="text-lg text-text-secondary mb-8">Privacy-focused smartphones with GrapheneOS pre-installed</p>

          <div className="flex flex-col items-center justify-center min-h-64">
            <div className="card card-glow p-8 max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 bg-matrix-subtle border border-matrix-400 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-matrix-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="font-heading text-xl font-bold text-text-primary mb-2">No Products Found</h2>
              <p className="text-text-secondary mb-6">We couldn't find any products matching your criteria.</p>
              <button
                onClick={handleClearFilters}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const productCountText = pagination.total === 1 ? '1 product found' : `${pagination.total} products found`;

  return (
    <>
      <SEOWrapper
        title="GrapheneOS Smartphones - Privacy-Focused Phones"
        description="Buy Google Pixel phones pre-installed with GrapheneOS. Secure, private smartphones with Bitcoin, Monero, and PayPal payment options. Free UK shipping available."
        additionalMeta={[
          { name: 'keywords', content: 'GrapheneOS phones, privacy smartphones, secure phones, Google Pixel GrapheneOS, Bitcoin payment, Monero payment' },
          { property: 'og:type', content: 'website' }
        ]}
      />
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-cyan-400 mb-4 animate-fadeIn uppercase tracking-wider">
            GrapheneOS Smartphones
          </h1>
          <p className="text-lg text-text-secondary mb-4">Privacy-focused smartphones with GrapheneOS pre-installed</p>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 mb-8 text-left max-w-6xl mx-auto">
            <div className="card p-5 border-l-4 border-cyan-400 hover:border-matrix-400 transition-colors group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-subtle flex items-center justify-center flex-shrink-0 group-hover:bg-matrix-subtle transition-colors">
                  <svg className="w-5 h-5 text-cyan-400 group-hover:text-matrix-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-text-primary mb-1">Plug-and-play</h3>
                  <p className="text-xs text-text-secondary">No technical setup required - we handle the complex flashing process</p>
                </div>
              </div>
            </div>
            <div className="card p-5 border-l-4 border-matrix-400 hover:border-cyan-400 transition-colors group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-matrix-subtle flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-subtle transition-colors">
                  <svg className="w-5 h-5 text-matrix-400 group-hover:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-text-primary mb-1">Enhanced Privacy</h3>
                  <p className="text-xs text-text-secondary">Escape Google's surveillance ecosystem while keeping Android compatibility</p>
                </div>
              </div>
            </div>
            <div className="card p-5 border-l-4 border-cyan hover:border-matrix transition-colors group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-subtle flex items-center justify-center flex-shrink-0 group-hover:bg-matrix-subtle transition-colors">
                  <svg className="w-5 h-5 text-cyan-400 group-hover:text-matrix-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-text-primary mb-1">Security Focus</h3>
                  <p className="text-xs text-text-secondary">Hardened security features, verified boot, network permission controls</p>
                </div>
              </div>
            </div>
            <div className="card p-5 border-l-4 border-matrix-400 hover:border-cyan-400 transition-colors group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-matrix-subtle flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-subtle transition-colors">
                  <svg className="w-5 h-5 text-matrix-400 group-hover:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-text-primary mb-1">App Compatible</h3>
                  <p className="text-xs text-text-secondary">Run your favorite apps without sacrificing privacy</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-text-muted font-mono">{productCountText}</p>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Sidebar */}
          <div className="lg:w-1/4">
            <FilterSidebar
              priceRange={filters.priceRange}
              selectedCondition={filters.condition}
              onPriceRangeChange={handlePriceRangeChange}
              onConditionChange={handleConditionChange}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Products Content */}
          <div className="lg:w-3/4">
            {/* Sorting Controls */}
            <div className="flex justify-end mb-6">
              <SortOptions currentSort={currentSort} onSortChange={handleSortChange} />
            </div>

            {/* Products Grid */}
            <section aria-label="Product listings">
              <div className="products-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>

            {/* Pagination */}
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </main>
    </>
  );
};

export default ProductListPage;
