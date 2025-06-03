const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Admin login
export const adminLogin = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    return data;
  } catch (error) {
    console.error('Admin login error:', error);
    throw error;
  }
};

// Get dashboard metrics
export const getDashboardMetrics = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/admin/dashboard-metrics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      // If unauthorized, clear token and redirect to login
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
      }
      throw new Error(data.error || 'Failed to fetch dashboard metrics');
    }

    return data;
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    throw error;
  }
};

// Get admin profile
export const getAdminProfile = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/admin/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      // If unauthorized, clear token and redirect to login
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
      }
      throw new Error(data.error || 'Failed to fetch admin profile');
    }

    return data;
  } catch (error) {
    console.error('Admin profile error:', error);
    throw error;
  }
};

// Check if user is authenticated as admin
export const isAdminAuthenticated = () => {
  const token = localStorage.getItem('adminToken');
  const user = localStorage.getItem('adminUser');
  
  if (!token || !user) {
    return false;
  }

  try {
    const userData = JSON.parse(user);
    return userData.role === 'admin';
  } catch (error) {
    console.error('Error parsing admin user data:', error);
    return false;
  }
};

// Admin logout
export const adminLogout = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
  window.location.href = '/admin/login';
};

// Format currency for display
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
};

// Format numbers with commas
export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-GB').format(number);
};

// Get stored admin user data
export const getAdminUser = () => {
  try {
    const user = localStorage.getItem('adminUser');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing admin user data:', error);
    return null;
  }
};

// Get admin token
export const getAdminToken = () => {
  return localStorage.getItem('adminToken');
};

// Get all orders (admin only)
export const getAllOrders = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      customerQuery,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });

    if (status && status !== 'all') {
      params.append('status', status);
    }

    if (customerQuery) {
      params.append('customerQuery', customerQuery);
    }

    if (startDate) {
      params.append('startDate', startDate);
    }

    if (endDate) {
      params.append('endDate', endDate);
    }

    const token = getAdminToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/admin/orders?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        adminLogout();
      }
      throw new Error(data.error || 'Failed to fetch orders');
    }

    return data;
  } catch (error) {
    console.error('Get orders error:', error);
    throw error;
  }
};

// Get single order details (admin only)
export const getOrderById = async (orderId) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const token = getAdminToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        adminLogout();
      }
      throw new Error(data.error || 'Failed to fetch order details');
    }

    return data;
  } catch (error) {
    console.error('Get order by ID error:', error);
    throw error;
  }
};

export default {
  adminLogin,
  getDashboardMetrics,
  getAdminProfile,
  isAdminAuthenticated,
  adminLogout,
  formatCurrency,
  formatNumber,
  getAdminUser,
  getAdminToken,
  getAllOrders,
  getOrderById
};