const API_BASE_URL = '/api';

// Get authentication token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to handle response parsing with better error handling
const parseResponse = async (response) => {
  // Check if response is ok before trying to parse JSON
  if (!response.ok) {
    // Try to get error message from response
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch (jsonError) {
      // If JSON parsing fails, use the status text
      console.error('Failed to parse error response as JSON:', jsonError);
    }
    throw new Error(errorMessage);
  }

  // Check content type before parsing JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const responseText = await response.text();
    console.error('Expected JSON response but got:', contentType);
    console.error('Response body:', responseText);
    throw new Error('Server returned invalid response format');
  }

  return await response.json();
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

    return await parseResponse(response);
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

    return await parseResponse(response);
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

    return await parseResponse(response);
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

    return await parseResponse(response);
  } catch (error) {
    console.error('Delete address error:', error);
    throw error;
  }
};