const API_BASE_URL = import.meta.env.VITE_API_BASE_URL + '/api';

// Get authentication token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Fetch cart contents
export const getCart = async () => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: 'GET',
      headers,
      credentials: 'include', // Include cookies for guest cart sessions
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch cart');
    }

    return data;
  } catch (error) {
    console.error('Get cart error:', error);
    throw error;
  }
};

// Add product to cart
export const addToCart = async (productId, quantity = 1) => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/cart/add`, {
      method: 'POST',
      headers,
      credentials: 'include', // Include cookies for guest cart sessions
      body: JSON.stringify({ productId, quantity }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add to cart');
    }

    return data;
  } catch (error) {
    console.error('Add to cart error:', error);
    throw error;
  }
};

// Update item quantity in cart
export const updateCartItem = async (productId, quantity) => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/cart/item/${productId}`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify({ quantity }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update cart item');
    }

    return data;
  } catch (error) {
    console.error('Update cart item error:', error);
    throw error;
  }
};

// Remove item from cart
export const removeFromCart = async (productId) => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/cart/item/${productId}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to remove from cart');
    }

    return data;
  } catch (error) {
    console.error('Remove from cart error:', error);
    throw error;
  }
};

// Clear entire cart
export const clearCart = async () => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/cart/clear`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to clear cart');
    }

    return data;
  } catch (error) {
    console.error('Clear cart error:', error);
    throw error;
  }
};


// Format currency amount for display
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};