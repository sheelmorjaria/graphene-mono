const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Get authentication token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to handle response parsing with better error handling
const parseResponse = async (response) => {
  // Add detailed logging for debugging
  console.log('🔍 parseResponse Debug Info:');
  console.log('  URL:', response.url);
  console.log('  Status:', response.status, response.statusText);
  console.log('  Content-Type:', response.headers.get('content-type'));
  console.log('  Content-Length:', response.headers.get('content-length'));

  // Check if response is ok before trying to parse JSON
  if (!response.ok) {
    // Try to get error message from response
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
      console.log('  Error response data:', errorData);
    } catch (jsonError) {
      // If JSON parsing fails, use the status text
      console.error('  Failed to parse error response as JSON:', jsonError);
      const responseText = await response.text();
      console.error('  Raw error response:', responseText);
    }
    throw new Error(errorMessage);
  }

  // Check content type before parsing JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const responseText = await response.text();
    console.error('❌ Content Type Mismatch:');
    console.error('  Expected: application/json');
    console.error('  Received:', contentType);
    console.error('  Response URL:', response.url);
    console.error('  Response Status:', response.status);
    console.error('  Response Headers:', Object.fromEntries(response.headers.entries()));
    console.error('  Response Body (first 500 chars):', responseText.substring(0, 500));
    throw new Error(`Server returned invalid response format. Expected JSON but got: ${contentType || 'no content-type'}`);
  }

  try {
    const data = await response.json();
    console.log('  ✅ Successfully parsed JSON response');
    return data;
  } catch (jsonError) {
    const responseText = await response.text();
    console.error('❌ JSON Parse Error:');
    console.error('  Error:', jsonError.message);
    console.error('  Response Body:', responseText);
    throw new Error(`Failed to parse JSON response: ${jsonError.message}`);
  }
};

// Fetch all user addresses
export const getUserAddresses = async () => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const fullUrl = `${API_BASE_URL}/user/addresses`;
    console.log('🔍 Making request to:', fullUrl);
    console.log('🔍 API_BASE_URL:', API_BASE_URL);
    console.log('🔍 Token present:', !!token);
    console.log('🔍 Token preview:', token ? `${token.substring(0, 20)}...` : 'none');

    const response = await fetch(fullUrl, {
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