const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const getProductBySlug = async (slug) => {
  // Validate slug parameter
  if (!slug || slug.trim() === '') {
    return {
      success: false,
      error: 'Slug parameter is required'
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/products/${slug}`, {
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