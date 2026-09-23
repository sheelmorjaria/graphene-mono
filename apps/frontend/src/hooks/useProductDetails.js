import { useState, useEffect, useCallback, useRef } from 'react';
import { getProductBySlug } from '../services/productDetailsService';

// Build-time prerendered seed: the prerender crawl embeds this product's API
// response in /products/<slug> as <script id="__PRERENDER_PRODUCT__"> so the
// page renders fully without a runtime fetch — Google's renderer sometimes
// fails the refetch, and a rendered error card is classified as a soft 404.
// Consumed once, then removed from the DOM.
export const readPrerenderedProduct = () => {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById('__PRERENDER_PRODUCT__');
  if (!el) return null;
  el.remove();
  try {
    const payload = JSON.parse(el.textContent);
    return payload?.success ? payload : null;
  } catch {
    return null;
  }
};

const useProductDetails = (slug) => {
  // Lazily read (and consume) the prerendered seed exactly once
  const seedRef = useRef(undefined);
  if (seedRef.current === undefined) {
    seedRef.current = readPrerenderedProduct();
  }
  const seed = seedRef.current;

  const [product, setProduct] = useState(seed?.data || null);
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
      } else if (seed?.data?.slug === productSlug) {
        // Refetch failed but this page's prerendered seed matches the slug —
        // keep the rendered product (soft-404 guard) and fail silently.
        setError(null);
      } else {
        setProduct(null);
        setError(result.error);
      }
    } catch (err) {
      if (seed?.data?.slug === productSlug) {
        setError(null);
      } else {
        setProduct(null);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    if (slug) {
      return fetchProduct(slug);
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