import { useState, useCallback, useRef } from 'react';
import { searchProducts } from '../services/searchService';

const useSearch = () => {
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const currentRequestRef = useRef(null);

  const performSearch = useCallback(async (query, options = {}) => {
    // Validate query
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return;
    }

    // Cancel any ongoing request
    if (currentRequestRef.current) {
      currentRequestRef.current.cancelled = true;
    }

    // Create a new request tracking object
    const currentRequest = { cancelled: false };
    currentRequestRef.current = currentRequest;

    setLoading(true);
    setError(null);
    setSearchResults(null);

    try {
      const result = await searchProducts(query.trim(), options);

      // Check if request was cancelled while waiting
      if (currentRequest.cancelled) return;

      if (result.success) {
        setSearchResults(result.data);
        setError(null);
      } else {
        setSearchResults(null);
        setError(result.error);
      }
    } catch (err) {
      if (currentRequest.cancelled) return;
      
      setSearchResults(null);
      setError(err.message);
    } finally {
      if (!currentRequest.cancelled) {
        setLoading(false);
      }
    }
  }, []);

  return {
    searchResults,
    loading,
    error,
    performSearch
  };
};

export default useSearch;