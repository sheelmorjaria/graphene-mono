import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import useSearch from '../hooks/useSearch';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchResults, loading, error, performSearch } = useSearch();
  const [sortBy, setSortBy] = useState('relevance');
  const [condition, setCondition] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const query = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('page')) || 1;

  // Update document title
  useEffect(() => {
    if (query) {
      document.title = `Search: ${query} - GrapheneOS Store`;
    } else {
      document.title = 'Search - GrapheneOS Store';
    }
  }, [query]);

  // Perform search when URL params change
  useEffect(() => {
    if (query) {
      const options = {
        page: currentPage
      };

      // Add sorting options
      if (sortBy !== 'relevance') {
        const [sortField, sortOrder] = sortBy.split('-');
        options.sortBy = sortField;
        options.sortOrder = sortOrder;
      }

      // Add filter options
      if (condition) options.condition = condition;
      if (minPrice) options.minPrice = parseFloat(minPrice);
      if (maxPrice) options.maxPrice = parseFloat(maxPrice);

      performSearch(query, options);
    }
  }, [query, currentPage, sortBy, condition, minPrice, maxPrice, performSearch]);

  const handleSearch = (newQuery) => {
    const newParams = new URLSearchParams();
    if (newQuery.trim()) {
      newParams.set('q', newQuery.trim());
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleFilterChange = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  const handleRetry = () => {
    if (query) {
      performSearch(query, { page: currentPage });
    }
  };

  // Render empty state when no query
  if (!query) {
    return (
      <div data-testid="search-results-page" className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Search Products</h1>
          
          <div className="mb-8">
            <SearchBar onSearch={handleSearch} className="max-w-2xl mx-auto" />
          </div>

          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">
              Enter a search term to find products
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="search-results-page" className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Search Results</h1>
        
        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar 
            onSearch={handleSearch} 
            className="max-w-2xl mx-auto"
            placeholder="Search products..."
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner data-testid="loading-spinner" />
            <p className="mt-4 text-gray-600">Searching products...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-medium text-red-800 mb-2">
                Error Searching Products
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {searchResults && !loading && !error && (
          <>
            {/* Results Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div className="mb-4 lg:mb-0">
                <h2 className="text-xl font-semibold text-gray-900">
                  Found {searchResults?.totalProducts || 0} products for "{query}"
                </h2>
              </div>

              {/* Sort and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
                    Sort by:
                  </label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name-asc">Name: A to Z</option>
                    <option value="name-desc">Name: Z to A</option>
                    <option value="createdAt-desc">Newest First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="condition-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <select
                    id="condition-select"
                    value={condition}
                    onChange={(e) => {
                      setCondition(e.target.value);
                      handleFilterChange();
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Conditions</option>
                    <option value="new">New</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="min-price" className="block text-sm font-medium text-gray-700 mb-1">
                    Min Price
                  </label>
                  <input
                    id="min-price"
                    type="number"
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      handleFilterChange();
                    }}
                    placeholder="£0"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="max-price" className="block text-sm font-medium text-gray-700 mb-1">
                    Max Price
                  </label>
                  <input
                    id="max-price"
                    type="number"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      handleFilterChange();
                    }}
                    placeholder="£1000"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* No Results */}
            {searchResults && searchResults.products && searchResults.products.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-2">
                  No products found for "{query}"
                </div>
                <p className="text-gray-400">
                  Try searching for different keywords or adjusting your filters
                </p>
              </div>
            )}

            {/* Product Grid */}
            {searchResults && searchResults.products && searchResults.products.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {searchResults.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {searchResults && searchResults.totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                      className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {searchResults?.totalPages || 1}
                    </span>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === (searchResults?.totalPages || 1)}
                      aria-label="Next page"
                      className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;