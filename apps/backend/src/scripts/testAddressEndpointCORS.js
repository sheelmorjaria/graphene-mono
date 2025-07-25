import fetch from 'node-fetch';

// Test CORS and various scenarios that might cause non-JSON responses
const testAddressEndpointCORS = async () => {
  console.log('🔍 Testing Address Endpoint CORS and Edge Cases...\n');

  const baseUrl = 'https://graphene-backend.onrender.com';
  
  console.log('📊 Step 1: Test if endpoint exists with different methods');
  
  const methods = ['GET', 'HEAD', 'OPTIONS'];
  
  for (const method of methods) {
    console.log(`🧪 Testing ${method} request:`);
    
    try {
      const response = await fetch(`${baseUrl}/api/user/addresses`, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
      
      console.log(`  Status: ${response.status} - ${response.statusText}`);
      console.log(`  Content-Type: ${response.headers.get('content-type')}`);
      console.log(`  Content-Length: ${response.headers.get('content-length')}`);
      console.log(`  Server: ${response.headers.get('server')}`);
      console.log('  CORS Headers:');
      console.log(`    Access-Control-Allow-Origin: ${response.headers.get('access-control-allow-origin')}`);
      console.log(`    Access-Control-Allow-Methods: ${response.headers.get('access-control-allow-methods')}`);
      console.log(`    Access-Control-Allow-Headers: ${response.headers.get('access-control-allow-headers')}`);
      
      if (method !== 'HEAD') {
        const responseText = await response.text();
        console.log(`  Response: ${responseText.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.error(`  ❌ ${method} request failed:`, error.message);
    }
    
    console.log();
  }
  
  console.log('📊 Step 2: Test wrong endpoint paths (to see if they return HTML)');
  
  const wrongPaths = [
    '/api/user/address', // missing 'es'
    '/api/users/addresses', // wrong plural
    '/api/user/addressess', // typo
    '/api/user', // incomplete path
    '/api/user/nonexistent'
  ];
  
  for (const path of wrongPaths) {
    console.log(`🧪 Testing wrong path: ${path}`);
    
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
      
      console.log(`  Status: ${response.status} - ${response.statusText}`);
      console.log(`  Content-Type: ${response.headers.get('content-type')}`);
      
      const responseText = await response.text();
      console.log(`  Response Length: ${responseText.length}`);
      
      if (responseText.length > 0) {
        if (responseText.trim().startsWith('<')) {
          console.log('  ⚠️  Returns HTML (likely 404 page)');
          console.log(`  HTML Preview: ${responseText.substring(0, 100)}...`);
        } else {
          console.log(`  Response: ${responseText.substring(0, 100)}...`);
        }
      }
      
    } catch (error) {
      console.error('  ❌ Request failed:', error.message);
    }
    
    console.log();
  }
  
  console.log('📊 Step 3: Test with browser-like headers');
  
  try {
    const response = await fetch(`${baseUrl}/api/user/addresses`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://graphene-frontend.vercel.app',
        'Referer': 'https://graphene-frontend.vercel.app/'
      }
    });
    
    console.log('Browser-like request:');
    console.log(`  Status: ${response.status} - ${response.statusText}`);
    console.log(`  Content-Type: ${response.headers.get('content-type')}`);
    
    const responseText = await response.text();
    console.log(`  Response: ${responseText.substring(0, 100)}...`);
    
  } catch (error) {
    console.error('❌ Browser-like request failed:', error.message);
  }
  
  console.log('\n🏁 CORS and edge cases test completed!');
};

// Run the test
testAddressEndpointCORS().catch(console.error);