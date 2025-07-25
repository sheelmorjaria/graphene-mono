// Test script to verify addressService behavior
import { getUserAddresses } from '../services/addressService.js';

const testAddressService = async () => {
  console.log('🔍 Testing Address Service...');
  console.log('=============================');
  
  // Check environment variables
  console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('Current origin:', window.location.origin);
  
  // Test with no auth token (should fail gracefully)
  try {
    console.log('\n📊 Test 1: Call getUserAddresses() with no token');
    const response = await getUserAddresses();
    console.log('✅ Unexpected success:', response);
  } catch (error) {
    console.log('❌ Expected error:', error.message);
  }
  
  // Check what URL would be constructed
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const constructedURL = `${API_BASE_URL}/user/addresses`;
  console.log('\n🔗 Constructed URL:', constructedURL);
  
  // Test basic fetch to the URL to see what happens
  try {
    console.log('\n📊 Test 2: Direct fetch to addresses endpoint');
    const response = await fetch(constructedURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response URL:', response.url);
    console.log('Response Status:', response.status);
    console.log('Response Content-Type:', response.headers.get('content-type'));
    
    const responseText = await response.text();
    console.log('Response body preview:', responseText.substring(0, 200));
    
    if (responseText.trim().startsWith('<')) {
      console.log('⚠️  Response is HTML (likely frontend app)');
    } else {
      console.log('✅ Response is not HTML');
    }
    
  } catch (error) {
    console.log('❌ Direct fetch error:', error.message);
  }
  
  console.log('\n✅ Address service test completed');
};

// Run the test
testAddressService().catch(console.error);