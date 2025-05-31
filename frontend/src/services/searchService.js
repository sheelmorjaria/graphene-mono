const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const searchProducts = async (query, options = {}) => {
  try {
    // Validate search query
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return {
        success: false,
        error: 'Search query is required'
      };
    }

    // Build query parameters
    const params = new URLSearchParams();
    params.append('q', query.trim());

    // Add optional parameters
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options.condition) params.append('condition', options.condition);
    if (options.minPrice !== undefined) params.append('minPrice', options.minPrice.toString());
    if (options.maxPrice !== undefined) params.append('maxPrice', options.maxPrice.toString());
    if (options.category) params.append('category', options.category);

    // Make API request
    const response = await fetch(`${API_BASE_URL}/api/products/search?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`
      };
    }

    const data = await response.json();
    return data;

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};