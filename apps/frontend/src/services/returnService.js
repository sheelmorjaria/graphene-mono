const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Get eligible items for return from a specific order
export const getEligibleReturnItems = async (orderId) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const response = await fetch(`${API_BASE_URL}/user/orders/${orderId}/eligible-returns`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch eligible return items');
    }

    return data;
  } catch (error) {
    console.error('Get eligible return items error:', error);
    throw error;
  }
};

// Submit a return request
export const submitReturnRequest = async (returnRequestData) => {
  try {
    if (!returnRequestData) {
      throw new Error('Return request data is required');
    }

    const response = await fetch(`${API_BASE_URL}/user/returns/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(returnRequestData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit return request');
    }

    return data;
  } catch (error) {
    console.error('Submit return request error:', error);
    throw error;
  }
};

// Get user's return requests with pagination
export const getUserReturnRequests = async (params = {}) => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.status) queryParams.append('status', params.status);

    const url = `${API_BASE_URL}/user/returns${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch return requests');
    }

    return data;
  } catch (error) {
    console.error('Get return requests error:', error);
    throw error;
  }
};

// Get detailed information for a specific return request
export const getReturnRequestDetails = async (returnRequestId) => {
  try {
    if (!returnRequestId) {
      throw new Error('Return request ID is required');
    }

    const response = await fetch(`${API_BASE_URL}/user/returns/${returnRequestId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch return request details');
    }

    return data;
  } catch (error) {
    console.error('Get return request details error:', error);
    throw error;
  }
};

// Format return request status for display
export const formatReturnStatus = (status) => {
  const statusMap = {
    pending_review: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    item_received: 'Item Received',
    processing_refund: 'Processing Refund',
    refunded: 'Refunded',
    closed: 'Closed'
  };
  return statusMap[status] || status;
};

// Get status color for styling
export const getReturnStatusColor = (status) => {
  const colorMap = {
    pending_review: '#f59e0b', // yellow
    approved: '#10b981', // green
    rejected: '#ef4444', // red
    item_received: '#3b82f6', // blue
    processing_refund: '#8b5cf6', // purple
    refunded: '#10b981', // green
    closed: '#6b7280' // gray
  };
  return colorMap[status] || '#6b7280'; // gray as default
};

// Get return status color class for UI
export const getReturnStatusColorClass = (status) => {
  const colorMap = {
    pending_review: 'text-yellow-600 bg-yellow-50',
    approved: 'text-green-600 bg-green-50',
    rejected: 'text-red-600 bg-red-50',
    item_received: 'text-blue-600 bg-blue-50',
    processing_refund: 'text-purple-600 bg-purple-50',
    refunded: 'text-green-600 bg-green-50',
    closed: 'text-gray-600 bg-gray-50'
  };
  
  return colorMap[status] || 'text-gray-600 bg-gray-50';
};

// Format return request date
export const formatReturnDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Calculate days remaining in return window
export const getDaysRemainingInReturnWindow = (deliveryDate, returnWindow = 30) => {
  if (!deliveryDate) return 0;
  
  const delivery = new Date(deliveryDate);
  const windowEnd = new Date(delivery);
  windowEnd.setDate(windowEnd.getDate() + returnWindow);
  
  const now = new Date();
  const timeDiff = windowEnd.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  return Math.max(0, daysDiff);
};

// Check if order is eligible for return
export const isOrderEligibleForReturn = (order) => {
  if (!order) return false;
  
  // Order must be delivered
  if (order.status !== 'delivered') return false;
  
  // Must have a delivery date
  if (!order.deliveryDate) return false;
  
  // Must be within return window
  const daysRemaining = getDaysRemainingInReturnWindow(order.deliveryDate);
  if (daysRemaining <= 0) return false;
  
  // Cannot already have an active return request
  if (order.hasReturnRequest) return false;
  
  return true;
};

export default {
  getEligibleReturnItems,
  submitReturnRequest,
  getUserReturnRequests,
  getReturnRequestDetails,
  formatReturnStatus,
  getReturnStatusColor,
  getReturnStatusColorClass,
  formatReturnDate,
  getDaysRemainingInReturnWindow,
  isOrderEligibleForReturn
};