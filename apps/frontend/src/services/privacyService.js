const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Get authentication token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Request data export
export const requestDataExport = async () => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/user/data/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to request data export');
  }

  return data;
};

// Request account deletion
export const requestAccountDeletion = async (password) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/user/data/delete-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to request account deletion');
  }

  // If successful, the user should be logged out
  // Clear the token from localStorage
  localStorage.removeItem('authToken');

  return data;
};