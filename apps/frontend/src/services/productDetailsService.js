const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const getProductBySlug = async (slug) => {
  // Validate slug parameter
  if (!slug || slug === 'undefined' || slug.trim() === '') {
    console.error('❌ Invalid product slug provided:', slug);
    return {
      success: false,
      error: 'Slug parameter is required and cannot be undefined'
    };
  }

  // Validate API base URL
  if (!API_BASE_URL || API_BASE_URL === 'undefined') {
    console.error('❌ API_BASE_URL is undefined:', API_BASE_URL);
    return {
      success: false,
      error: 'API configuration error'
    };
  }

  try {
    const url = `${API_BASE_URL}/products/${slug}`;
    console.log('🌐 Fetching product from URL:', url);
    
    const response = await fetch(url, {
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