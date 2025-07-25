import fetch from 'node-fetch';

// Test what happens when new users try to access addresses
const testNewUserAddresses = async () => {
  console.log('🔍 Testing New User Address Access Scenarios...\n');

  const baseUrl = 'https://graphene-backend.onrender.com';
  
  console.log('📊 Scenario 1: No authentication token (guest user)');
  try {
    const response = await fetch(`${baseUrl}/api/user/addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // No Authorization header
      }
    });
    
    console.log(`  Status: ${response.status} - ${response.statusText}`);
    console.log(`  Content-Type: ${response.headers.get('content-type')}`);
    
    const responseText = await response.text();
    console.log(`  Response: ${responseText}`);
    
  } catch (error) {
    console.error(`  ❌ Request failed: ${error.message}`);
  }
  
  console.log('\n📊 Scenario 2: Empty/null authorization token');
  try {
    const response = await fetch(`${baseUrl}/api/user/addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '
      }
    });
    
    console.log(`  Status: ${response.status} - ${response.statusText}`);
    console.log(`  Content-Type: ${response.headers.get('content-type')}`);
    
    const responseText = await response.text();
    console.log(`  Response: ${responseText}`);
    
  } catch (error) {
    console.error(`  ❌ Request failed: ${error.message}`);
  }
  
  console.log('\n📊 Scenario 3: Malformed authorization token');
  try {
    const response = await fetch(`${baseUrl}/api/user/addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid.jwt.token'
      }
    });
    
    console.log(`  Status: ${response.status} - ${response.statusText}`);
    console.log(`  Content-Type: ${response.headers.get('content-type')}`);
    
    const responseText = await response.text();
    console.log(`  Response: ${responseText}`);
    
  } catch (error) {
    console.error(`  ❌ Request failed: ${error.message}`);
  }
  
  console.log('\n📊 Scenario 4: Testing user registration to get valid token');
  try {
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: `test.newuser.${Date.now()}@example.com`,
        password: 'TestPassword123!'
      })
    });
    
    console.log(`  Registration Status: ${registerResponse.status} - ${registerResponse.statusText}`);
    console.log(`  Registration Content-Type: ${registerResponse.headers.get('content-type')}`);
    
    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('  ✅ Registration successful');
      
      if (registerData.token) {
        console.log('  📝 Token received, testing addresses endpoint...');
        
        const addressResponse = await fetch(`${baseUrl}/api/user/addresses`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${registerData.token}`
          }
        });
        
        console.log(`  New User Addresses Status: ${addressResponse.status} - ${addressResponse.statusText}`);
        console.log(`  New User Addresses Content-Type: ${addressResponse.headers.get('content-type')}`);
        
        const addressText = await addressResponse.text();
        console.log(`  New User Addresses Response: ${addressText}`);
        
        if (addressResponse.headers.get('content-type')?.includes('text/html')) {
          console.log('  ❌ PROBLEM: New user getting HTML instead of JSON!');
        } else {
          console.log('  ✅ New user getting proper JSON response');
        }
      } else {
        console.log('  ⚠️  Registration successful but no token returned');
      }
    } else {
      const registerText = await registerResponse.text();
      console.log(`  Registration failed: ${registerText}`);
    }
    
  } catch (error) {
    console.error(`  ❌ Registration test failed: ${error.message}`);
  }
  
  console.log('\n🏁 New user address access test completed!');
  console.log('\n💡 Key insights:');
  console.log('- Check if users without tokens are being redirected');
  console.log('- Check if authentication middleware is working correctly');
  console.log('- Check if frontend is handling auth token expiration');
  console.log('- Check if new users have valid tokens in localStorage');
};

// Run the test
testNewUserAddresses().catch(console.error);