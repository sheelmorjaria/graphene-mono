const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const ADMIN_API_BASE = `${API_BASE_URL}/api/admin`;

// Admin login
export const adminLogin = async (credentials) => {
  try {
    const response = await fetch(`${ADMIN_API_BASE}/login`, {
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

    const response = await fetch(`${ADMIN_API_BASE}/dashboard-metrics`, {
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

    const response = await fetch(`${ADMIN_API_BASE}/profile`, {
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

    const response = await fetch(`${ADMIN_API_BASE}/orders?${params}`, {
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

    const response = await fetch(`${ADMIN_API_BASE}/orders/${orderId}`, {
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

// Update order status (admin only)
export const updateOrderStatus = async (orderId, statusData) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    const token = getAdminToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${ADMIN_API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(statusData)
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        adminLogout();
      }
      throw new Error(data.error || 'Failed to update order status');
    }

    return data;
  } catch (error) {
    console.error('Update order status error:', error);
    throw error;
  }
};

// Issue refund for an order
export const issueRefund = async (orderId, refundData) => {
  try {
    const token = getAdminToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${ADMIN_API_BASE}/orders/${orderId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(refundData)
    });

    const data = await response.json();

    if (!response.ok) {
      // If unauthorized, clear token and redirect to login
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
        return;
      }
      
      throw new Error(data.error || 'Failed to process refund');
    }

    return data;
  } catch (error) {
    console.error('Issue refund error:', error);
    throw error;
  }
};

// Get all return requests (admin only)
export const getAllReturnRequests = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      customerQuery,
      startDate,
      endDate,
      sortBy = 'requestDate',
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

    const response = await fetch(`${ADMIN_API_BASE}/returns?${params}`, {
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
      throw new Error(data.error || 'Failed to fetch return requests');
    }

    return data;
  } catch (error) {
    console.error('Get return requests error:', error);
    throw error;
  }
};

// Get single return request details (admin only)
export const getReturnRequestById = async (returnRequestId) => {
  try {
    if (!returnRequestId) {
      throw new Error('Return request ID is required');
    }

    const token = getAdminToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${ADMIN_API_BASE}/returns/${returnRequestId}`, {
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
      throw new Error(data.error || 'Failed to fetch return request details');
    }

    return data;
  } catch (error) {
    console.error('Get return request by ID error:', error);
    throw error;
  }
};

// Update return request status (admin only)
export const updateReturnRequestStatus = async (returnRequestId, statusData) => {
  try {
    if (!returnRequestId) {
      throw new Error('Return request ID is required');
    }

    const token = getAdminToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${ADMIN_API_BASE}/returns/${returnRequestId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(statusData)
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        adminLogout();
      }
      throw new Error(data.error || 'Failed to update return request status');
    }

    return data;
  } catch (error) {
    console.error('Update return request status error:', error);
    throw error;
  }
};

// Get all products with filters
export const getProducts = async (params = {}) => {
  try {
    const token = getAdminToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Build query string
    const queryParams = new URLSearchParams();
    
    // Add all provided parameters to query string
    Object.entries(params).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const url = `${ADMIN_API_BASE}/products${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
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
      throw new Error(data.error || 'Failed to fetch products');
    }

    return data;
  } catch (error) {
    console.error('Get products error:', error);
    throw error;
  }
};

// Get single product by ID
export const getProductById = async (productId) => {
  try {
    const token = getAdminToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${ADMIN_API_BASE}/products/${productId}`, {
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
      throw new Error(data.error || 'Failed to fetch product');
    }

    return data;
  } catch (error) {
    console.error('Get product by ID error:', error);
    throw error;
  }
};

// Create new product
export const createProduct = async (productData) => {
  try {
    const token = getAdminToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Determine if we need to use FormData for file uploads
    const isFormData = productData instanceof FormData;
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    // Only set Content-Type for JSON, let browser set it for FormData
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${ADMIN_API_BASE}/products`, {
      method: 'POST',
      headers,
      body: isFormData ? productData : JSON.stringify(productData)
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        adminLogout();
      }
      throw new Error(data.error || 'Failed to create product');
    }

    return data;
  } catch (error) {
    console.error('Create product error:', error);
    throw error;
  }
};

// Update existing product
export const updateProduct = async (productId, productData) => {
  try {
    const token = getAdminToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Determine if we need to use FormData for file uploads
    const isFormData = productData instanceof FormData;
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    // Only set Content-Type for JSON, let browser set it for FormData
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${ADMIN_API_BASE}/products/${productId}`, {
      method: 'PUT',
      headers,
      body: isFormData ? productData : JSON.stringify(productData)
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        adminLogout();
      }
      throw new Error(data.error || 'Failed to update product');
    }

    return data;
  } catch (error) {
    console.error('Update product error:', error);
    throw error;
  }
};

// Delete product (soft delete - archive)
export const deleteProduct = async (productId) => {
  try {
    const token = getAdminToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${ADMIN_API_BASE}/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        adminLogout();
      }
      throw new Error(data.error || 'Failed to delete product');
    }

    return data;
  } catch (error) {
    console.error('Delete product error:', error);
    throw error;
  }
};

// Get all users with filters
export const getAllUsers = async (params = {}) => {
  try {
    const token = getAdminToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Build query string
    const queryParams = new URLSearchParams();
    
    // Add all provided parameters to query string
    Object.entries(params).forEach(([key, value]) => {
      if (value !== '' && value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const url = `${ADMIN_API_BASE}/users${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
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
      throw new Error(data.error || 'Failed to fetch users');
    }

    return data;
  } catch (error) {
    console.error('Get users error:', error);
    throw error;
  }
};

// Get single user by ID
export const getUserById = async (userId) => {
  try {
    const token = getAdminToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${ADMIN_API_BASE}/users/${userId}`, {
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
      throw new Error(data.error || 'Failed to fetch user');
    }

    return data;
  } catch (error) {
    console.error('Get user by ID error:', error);
    throw error;
  }
};

// Update user status
export const updateUserStatus = async (userId, statusData) => {
  try {
    const token = getAdminToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${ADMIN_API_BASE}/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(statusData)
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        adminLogout();
      }
      throw new Error(data.error || 'Failed to update user status');
    }

    return data;
  } catch (error) {
    console.error('Update user status error:', error);
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
  getOrderById,
  updateOrderStatus,
  issueRefund,
  getAllReturnRequests,
  getReturnRequestById,
  updateReturnRequestStatus,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllUsers,
  getUserById,
  updateUserStatus
};