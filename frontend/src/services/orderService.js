const API_BASE_URL = 'http://localhost:3000/api';

// Get authentication token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Fetch user's order history with pagination and sorting
export const getUserOrders = async (params = {}) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `${API_BASE_URL}/user/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch orders');
    }

    return data;
  } catch (error) {
    console.error('Get orders error:', error);
    throw error;
  }
};

// Fetch detailed information for a specific order
export const getUserOrderDetails = async (orderId) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const response = await fetch(`${API_BASE_URL}/user/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch order details');
    }

    return data;
  } catch (error) {
    console.error('Get order details error:', error);
    throw error;
  }
};

// Format currency amount for display
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format order status for display
export const formatOrderStatus = (status) => {
  const statusMap = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  return statusMap[status] || status;
};

// Get status color for styling
export const getStatusColor = (status) => {
  const colorMap = {
    pending: '#fbbf24', // yellow
    processing: '#3b82f6', // blue
    shipped: '#8b5cf6', // purple
    delivered: '#10b981', // green
    cancelled: '#ef4444' // red
  };
  return colorMap[status] || '#6b7280'; // gray as default
};