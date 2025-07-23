import { useState, useCallback, useRef } from 'react';
import productsService from '../services/productsService';

const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Use refs to track the latest request and debounce timeout
  const latestRequestRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  const fetchProducts = useCallback(async (params = {}) => {
    // Clear any pending debounced call
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Create a unique request identifier
    const requestId = Date.now();
    latestRequestRef.current = requestId;

    // Debounce the actual API call
    return new Promise((resolve) => {
      debounceTimeoutRef.current = setTimeout(async () => {
        // Check if this is still the latest request
        if (latestRequestRef.current !== requestId) {
          resolve();
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const response = await productsService.getProducts(params);

          // Only update state if this is still the latest request
          if (latestRequestRef.current === requestId) {
            if (response.success) {
              setProducts(response.data || []);
              setPagination(response.pagination || {
                page: 1,
                limit: 12,
                total: 0,
                pages: 0
              });
            } else {
              setError(response.message || 'Failed to fetch products');
              setProducts([]);
              setPagination({
                page: 1,
                limit: 12,
                total: 0,
                pages: 0
              });
            }
          }
        } catch (err) {
          // Only update state if this is still the latest request
          if (latestRequestRef.current === requestId) {
            setError(err.message || 'An error occurred while fetching products');
            setProducts([]);
            setPagination({
              page: 1,
              limit: 12,
              total: 0,
              pages: 0
            });
          }
        } finally {
          // Only update loading state if this is still the latest request
          if (latestRequestRef.current === requestId) {
            setLoading(false);
          }
        }

        resolve();
      }, 300); // 300ms debounce delay
    });
  }, []);

  return {
    products,
    pagination,
    loading,
    error,
    fetchProducts
  };
};

export default useProducts;