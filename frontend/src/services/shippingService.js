const API_BASE_URL = 'http://localhost:3000/api';

// Get authentication token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Calculate shipping rates for cart and address
export const calculateShippingRates = async (cartItems, shippingAddress) => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/shipping/calculate-rates`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        cartItems,
        shippingAddress
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to calculate shipping rates');
    }

    return data;
  } catch (error) {
    console.error('Calculate shipping rates error:', error);
    throw error;
  }
};

// Get all available shipping methods
export const getShippingMethods = async () => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/shipping/methods`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch shipping methods');
    }

    return data;
  } catch (error) {
    console.error('Get shipping methods error:', error);
    throw error;
  }
};

// Validate a specific shipping method for cart
export const validateShippingMethod = async (methodId, cartItems, shippingAddress) => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/shipping/validate-method`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        methodId,
        cartItems,
        shippingAddress
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to validate shipping method');
    }

    return data;
  } catch (error) {
    console.error('Validate shipping method error:', error);
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