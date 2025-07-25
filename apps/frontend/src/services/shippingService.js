const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Debug environment variable loading
console.log('🔍 ShippingService Environment Check:');
console.log('  VITE_API_BASE_URL from env:', import.meta.env.VITE_API_BASE_URL);
console.log('  Current window origin:', typeof window !== 'undefined' ? window.location.origin : 'N/A');
console.log('  MODE:', import.meta.env.MODE);
console.log('  PROD:', import.meta.env.PROD);

// Check if API_BASE_URL is undefined or points to frontend
if (!API_BASE_URL) {
  console.error('❌ VITE_API_BASE_URL is undefined! This will cause API calls to fail.');
  console.error('   Please ensure VITE_API_BASE_URL is set in your deployment environment.');
} else if (typeof window !== 'undefined' && API_BASE_URL.includes(window.location.hostname)) {
  console.error('❌ VITE_API_BASE_URL points to frontend domain! This will cause errors.');
  console.error('   Current API_BASE_URL:', API_BASE_URL);
  console.error('   Frontend hostname:', window.location.hostname);
  console.error('   Expected format: https://your-backend-domain.com/api');
}

// Get authentication token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to handle response parsing with better error handling
const parseResponse = async (response) => {
  // Add detailed logging for debugging
  console.log('🔍 parseResponse Debug Info (Shipping):');
  console.log('  URL:', response.url);
  console.log('  Status:', response.status, response.statusText);
  console.log('  Content-Type:', response.headers.get('content-type'));

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
    console.error('❌ Content Type Mismatch (Shipping):');
    console.error('  Expected: application/json');
    console.error('  Received:', contentType);
    console.error('  Response URL:', response.url);
    console.error('  Response Status:', response.status);
    console.error('  Response Body (first 500 chars):', responseText.substring(0, 500));
    throw new Error(`Server returned invalid response format. Expected JSON but got: ${contentType || 'no content-type'}`);
  }

  try {
    const data = await response.json();
    console.log('  ✅ Successfully parsed JSON response');
    return data;
  } catch (jsonError) {
    const responseText = await response.text();
    console.error('❌ JSON Parse Error (Shipping):');
    console.error('  Error:', jsonError.message);
    console.error('  Response Body:', responseText);
    throw new Error(`Failed to parse JSON response: ${jsonError.message}`);
  }
};

// Calculate shipping rates for cart and address
export const calculateShippingRates = async (cartItems, shippingAddress) => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = `${API_BASE_URL}/shipping/calculate-rates`;
    console.log('🔍 Making shipping rates request to:', fullUrl);
    console.log('🔍 API_BASE_URL:', API_BASE_URL);
    console.log('🔍 Cart items:', cartItems.length, 'items');
    console.log('🔍 Shipping address country:', shippingAddress?.country);

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        cartItems,
        shippingAddress
      }),
    });

    return await parseResponse(response);
  } catch (error) {
    console.error('Calculate shipping rates error:', error);
    throw error;
  }
};

// Get all available shipping methods
export const getShippingMethods = async () => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = `${API_BASE_URL}/shipping/methods`;
    console.log('🔍 Making shipping methods request to:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    return await parseResponse(response);
  } catch (error) {
    console.error('Get shipping methods error:', error);
    throw error;
  }
};

// Validate a specific shipping method for cart
export const validateShippingMethod = async (methodId, cartItems, shippingAddress) => {
  try {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = `${API_BASE_URL}/shipping/validate-method`;
    console.log('🔍 Making validate shipping method request to:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        methodId,
        cartItems,
        shippingAddress
      }),
    });

    return await parseResponse(response);
  } catch (error) {
    console.error('Validate shipping method error:', error);
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