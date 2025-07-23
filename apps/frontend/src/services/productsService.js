const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const productsService = {
  async getProducts(params = {}) {
    // Filter out undefined, null, and empty string values
    const filteredParams = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    // Build query string
    const queryString = new URLSearchParams(filteredParams).toString();
    const url = `${API_BASE_URL}/api/products${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }
};

export default productsService;