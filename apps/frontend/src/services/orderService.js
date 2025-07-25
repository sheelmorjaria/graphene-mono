const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Fetch user's order history with pagination and sorting
export const getUserOrders = async (params = {}) => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
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
      credentials: 'include'
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
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${API_BASE_URL}/user/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include'
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
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
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
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    returned: 'Returned'
  };
  return statusMap[status] || status;
};

// Get status color for styling
export const getStatusColor = (status) => {
  const colorMap = {
    pending: '#fbbf24', // yellow
    processing: '#3b82f6', // blue
    shipped: '#8b5cf6', // purple
    out_for_delivery: '#f59e0b', // amber
    delivered: '#10b981', // green
    cancelled: '#ef4444', // red
    returned: '#6b7280' // gray
  };
  return colorMap[status] || '#6b7280'; // gray as default
};

// Place order
export const placeOrder = async (orderData) => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    // Convert addresses to backend format
    const formattedOrderData = {
      ...orderData,
      shippingAddress: convertAddressFormat(orderData.shippingAddress),
      billingAddress: convertAddressFormat(orderData.billingAddress || orderData.shippingAddress),
      shippingMethodId: orderData.shippingMethod?.id || orderData.shippingMethodId,
      paypalOrderId: orderData.paymentMethod?.paypalOrderId || orderData.paypalOrderId
    };

    const response = await fetch(`${API_BASE_URL}/user/orders/place-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(formattedOrderData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to place order');
    }

    return data;
  } catch (error) {
    console.error('Error placing order:', error);
    throw error;
  }
};

// Convert address format from frontend to backend
const convertAddressFormat = (address) => {
  if (!address) return null;
  
  // Split fullName into firstName and lastName
  const nameParts = (address.fullName || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  return {
    firstName,
    lastName,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 || '',
    city: address.city,
    stateProvince: address.stateProvince,
    postalCode: address.postalCode,
    country: address.country,
    phoneNumber: address.phoneNumber || ''
  };
};

// Validate order data before placing
export const validateOrderData = (orderData) => {
  const errors = [];

  if (!orderData.shippingAddress) {
    errors.push('Shipping address is required');
  }

  if (!orderData.shippingMethod) {
    errors.push('Shipping method is required');
  }

  if (!orderData.paymentMethod) {
    errors.push('Payment method is required');
  }

  // Validate shipping address fields
  if (orderData.shippingAddress) {
    const requiredFields = ['fullName', 'addressLine1', 'city', 'stateProvince', 'postalCode', 'country'];
    
    for (const field of requiredFields) {
      if (!orderData.shippingAddress[field]) {
        errors.push(`Delivery address ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
      }
    }
  }

  // Validate billing address if provided separately
  if (orderData.billingAddress && !orderData.useSameAsShipping) {
    const requiredFields = ['fullName', 'addressLine1', 'city', 'stateProvince', 'postalCode', 'country'];
    
    for (const field of requiredFields) {
      if (!orderData.billingAddress[field]) {
        errors.push(`Billing address ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Get order status color class for UI
export const getOrderStatusColor = (status) => {
  const colorMap = {
    pending: 'text-yellow-600 bg-yellow-50',
    processing: 'text-blue-600 bg-blue-50',
    shipped: 'text-purple-600 bg-purple-50',
    out_for_delivery: 'text-amber-600 bg-amber-50',
    delivered: 'text-green-600 bg-green-50',
    cancelled: 'text-red-600 bg-red-50',
    returned: 'text-gray-600 bg-gray-50'
  };
  
  return colorMap[status] || 'text-gray-600 bg-gray-50';
};

// Format order date
export const formatOrderDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Cancel order
export const cancelOrder = async (orderId) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${API_BASE_URL}/user/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to cancel order');
    }

    return data;
  } catch (error) {
    console.error('Cancel order error:', error);
    throw error;
  }
};