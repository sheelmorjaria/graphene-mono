const API_BASE_URL = 'http://localhost:3000/api';

// Get authentication token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Fetch all user addresses
export const getUserAddresses = async () => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/user/addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch addresses');
    }

    return data;
  } catch (error) {
    console.error('Get addresses error:', error);
    throw error;
  }
};

// Add new address
export const addUserAddress = async (addressData) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/user/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(addressData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add address');
    }

    return data;
  } catch (error) {
    console.error('Add address error:', error);
    throw error;
  }
};

// Update existing address
export const updateUserAddress = async (addressId, addressData) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/user/addresses/${addressId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(addressData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update address');
    }

    return data;
  } catch (error) {
    console.error('Update address error:', error);
    throw error;
  }
};

// Delete address
export const deleteUserAddress = async (addressId) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/user/addresses/${addressId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete address');
    }

    return data;
  } catch (error) {
    console.error('Delete address error:', error);
    throw error;
  }
};