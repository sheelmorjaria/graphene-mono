import fetch from 'node-fetch';

// Test the address API endpoint
const testAddressAPI = async () => {
  console.log('🔍 Testing Address API Endpoint...\n');

  const baseUrl = 'https://graphene-backend.onrender.com';
  
  // Test without authentication token (should return 401)
  console.log('📊 Testing without authentication token:');
  try {
    const response = await fetch(`${baseUrl}/api/user/addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status} - ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    // Try to read as text first to see what we get
    const responseText = await response.text();
    console.log(`Response length: ${responseText.length} characters`);
    console.log(`Response preview: ${responseText.substring(0, 200)}...`);
    
    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      console.log('✅ Valid JSON response:', data);
    } catch (jsonError) {
      console.log('❌ JSON Parse Error:', jsonError.message);
      console.log('Raw response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test with invalid token (should return 401 with JSON)
  console.log('📊 Testing with invalid authentication token:');
  try {
    const response = await fetch(`${baseUrl}/api/user/addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid_token_here'
      }
    });
    
    console.log(`Status: ${response.status} - ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    // Try to read as text first
    const responseText = await response.text();
    console.log(`Response length: ${responseText.length} characters`);
    console.log(`Response preview: ${responseText.substring(0, 200)}...`);
    
    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      console.log('✅ Valid JSON response:', data);
    } catch (jsonError) {
      console.log('❌ JSON Parse Error:', jsonError.message);
      console.log('Raw response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test if the endpoint exists at all
  console.log('📊 Testing if endpoint exists with OPTIONS:');
  try {
    const response = await fetch(`${baseUrl}/api/user/addresses`, {
      method: 'OPTIONS'
    });
    
    console.log(`Status: ${response.status} - ${response.statusText}`);
    console.log(`Allow header: ${response.headers.get('allow')}`);
    console.log(`Access-Control-Allow-Methods: ${response.headers.get('access-control-allow-methods')}`);
    
  } catch (error) {
    console.error('❌ OPTIONS request failed:', error.message);
  }
  
  console.log('\n🏁 Address API test completed!');
};

// Run the test
testAddressAPI().catch(console.error);