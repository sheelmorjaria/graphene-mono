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
  
  // Use ref to track the latest request to handle debouncing
  const latestRequestRef = useRef(null);

  const fetchProducts = useCallback(async (params = {}) => {
    // Create a unique request identifier
    const requestId = Date.now();
    latestRequestRef.current = requestId;

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