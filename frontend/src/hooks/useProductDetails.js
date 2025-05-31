import { useState, useEffect, useCallback } from 'react';
import { getProductBySlug } from '../services/productDetailsService';

const useProductDetails = (slug) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProduct = useCallback(async (productSlug) => {
    if (!productSlug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getProductBySlug(productSlug);
      
      if (result.success) {
        setProduct(result.data);
      } else {
        setProduct(null);
        setError(result.error);
      }
    } catch (err) {
      setProduct(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    if (slug) {
      fetchProduct(slug);
    }
  }, [slug, fetchProduct]);

  useEffect(() => {
    fetchProduct(slug);
  }, [slug, fetchProduct]);

  return {
    product,
    loading,
    error,
    refetch
  };
};

export default useProductDetails;