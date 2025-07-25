// Debug script to check API_BASE_URL configuration
console.log('🔍 Frontend API Configuration Debug:');
console.log('  VITE_API_BASE_URL env var:', import.meta.env.VITE_API_BASE_URL);
console.log('  Resolved API_BASE_URL:', import.meta.env.VITE_API_BASE_URL || '/api');
console.log('  Current window location:', window.location.href);
console.log('  Current origin:', window.location.origin);
console.log('  Environment mode:', import.meta.env.MODE);
console.log('  Is development:', import.meta.env.DEV);
console.log('  Is production:', import.meta.env.PROD);

// Test the actual URL that would be used
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const testUrl = `${API_BASE_URL}/user/addresses`;
console.log('  Final addresses URL would be:', testUrl);

// If API_BASE_URL is relative, show what the absolute URL would be
if (API_BASE_URL.startsWith('/')) {
  console.log('  Absolute URL (relative to current origin):', window.location.origin + testUrl);
} else {
  console.log('  URL is absolute:', testUrl);
}

// Test basic connectivity to the API
const testAPIConnectivity = async () => {
  console.log('\n🧪 Testing API Connectivity:');
  
  try {
    // Test a simple endpoint that doesn't require authentication
    const testResponse = await fetch(`${API_BASE_URL}/products?limit=1`);
    console.log('  Products endpoint test:');
    console.log('    Status:', testResponse.status);
    console.log('    Content-Type:', testResponse.headers.get('content-type'));
    console.log('    URL:', testResponse.url);
    
    if (testResponse.ok) {
      const data = await testResponse.json();
      console.log('    ✅ API is accessible and returning JSON');
      console.log('    Response preview:', Object.keys(data));
    } else {
      console.log('    ⚠️  API returned error status');
    }
  } catch (error) {
    console.error('    ❌ API connectivity test failed:', error.message);
    console.error('    This suggests the API_BASE_URL is incorrect or the API is not accessible');
  }
};

// Run the connectivity test
testAPIConnectivity();