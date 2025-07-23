const API_BASE_URL = 'http://localhost:3000/api';

export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    // Store token in localStorage
    if (data.data?.token) {
      localStorage.setItem('authToken', data.data.token);
    }

    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Store token in localStorage
    if (data.data?.token) {
      localStorage.setItem('authToken', data.data.token);
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // Call backend logout endpoint to invalidate token
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    // Even if logout API fails, we still want to clear local storage
    console.error('Logout API error:', error);
  } finally {
    // Always clear token from localStorage
    localStorage.removeItem('authToken');
  }
};

export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Token is invalid, remove it
      localStorage.removeItem('authToken');
      return null;
    }

    return data.data.user;
  } catch (error) {
    console.error('Get current user error:', error);
    localStorage.removeItem('authToken');
    return null;
  }
};

export const updateUserProfile = async (updateData) => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Profile update failed');
    }

    return data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const changePassword = async (passwordData) => {
  try {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/auth/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(passwordData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Password change failed');
    }

    // If password change is successful, the token is invalidated
    // Clear it from localStorage so the user is prompted to login again
    localStorage.removeItem('authToken');

    return data;
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
};

export const forgotPassword = async (emailData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Password reset request failed');
    }

    return data;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

export const resetPassword = async (resetData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resetData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Password reset failed');
    }

    return data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};