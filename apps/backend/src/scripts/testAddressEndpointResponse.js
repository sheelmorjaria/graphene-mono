import fetch from 'node-fetch';

// Test the address endpoint with a valid user token to see exact response
const testAddressEndpointResponse = async () => {
  console.log('🔍 Testing Address Endpoint Response Format...\n');

  const baseUrl = 'https://graphene-backend.onrender.com';
  
  // First, let's try to authenticate and get a valid token
  console.log('📊 Step 1: Testing authentication endpoint to get a valid token');
  try {
    // Try a login request to see if we can get a token
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      })
    });
    
    console.log(`Login Status: ${loginResponse.status} - ${loginResponse.statusText}`);
    console.log(`Login Content-Type: ${loginResponse.headers.get('content-type')}`);
    
    const loginText = await loginResponse.text();
    console.log(`Login Response: ${loginText.substring(0, 200)}...`);
    
  } catch (error) {
    console.error('❌ Login test failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test the addresses endpoint directly to see what it returns
  console.log('📊 Step 2: Test addresses endpoint behavior');
  
  // Test with different scenarios
  const testCases = [
    {
      name: 'No Authorization Header',
      headers: {
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'Invalid Bearer Token',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid_token_123'
      }
    },
    {
      name: 'Malformed Authorization Header',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'invalidformat'
      }
    },
    {
      name: 'Empty Authorization Header',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': ''
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`🧪 Testing: ${testCase.name}`);
    
    try {
      const response = await fetch(`${baseUrl}/api/user/addresses`, {
        method: 'GET',
        headers: testCase.headers
      });
      
      console.log(`  Status: ${response.status} - ${response.statusText}`);
      console.log(`  Content-Type: ${response.headers.get('content-type')}`);
      console.log(`  Content-Length: ${response.headers.get('content-length')}`);
      
      // Read response as text first to see what we actually get
      const responseText = await response.text();
      console.log(`  Response Length: ${responseText.length} characters`);
      
      if (responseText.length > 0) {
        console.log(`  Response Preview: ${responseText.substring(0, 100)}...`);
        
        // Try to identify response type
        if (responseText.trim().startsWith('<')) {
          console.log('  ⚠️  Response appears to be HTML');
        } else if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
          console.log('  ✅ Response appears to be JSON');
          try {
            const parsed = JSON.parse(responseText);
            console.log('  ✅ Valid JSON:', parsed);
          } catch (e) {
            console.log(`  ❌ Invalid JSON: ${e.message}`);
          }
        } else {
          console.log('  ❓ Unknown response format');
        }
      } else {
        console.log('  ⚠️  Empty response');
      }
      
    } catch (error) {
      console.error(`  ❌ Request failed: ${error.message}`);
    }
    
    console.log();
  }
  
  console.log('🏁 Address endpoint response test completed!');
};

// Run the test
testAddressEndpointResponse().catch(console.error);