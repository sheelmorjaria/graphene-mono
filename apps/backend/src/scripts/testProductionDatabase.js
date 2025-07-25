import fetch from 'node-fetch';

// Test production database connection
const testProductionDatabase = async () => {
  console.log('🔍 Testing Production Database Connection...\n');

  const baseUrl = 'https://graphene-backend.onrender.com';

  try {
    // Test health endpoint first
    console.log('🏥 Testing health endpoint...');
    try {
      const healthResponse = await fetch(`${baseUrl}/api/health`);
      console.log(`Health check: ${healthResponse.status} - ${healthResponse.statusText}`);
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('Health data:', healthData);
      }
    } catch (healthError) {
      console.log(`Health endpoint not available: ${healthError.message}`);
    }

    // Test a different endpoint to see if the API is working
    console.log('\n🔧 Testing other endpoints...');
    
    // Try payment methods endpoint
    try {
      const paymentResponse = await fetch(`${baseUrl}/api/payment/methods`);
      console.log(`Payment methods: ${paymentResponse.status} - ${paymentResponse.statusText}`);
      
      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        console.log('Payment methods working:', Object.keys(paymentData));
      }
    } catch (paymentError) {
      console.log(`Payment methods error: ${paymentError.message}`);
    }

    // Test products endpoint with more detailed debugging
    console.log('\n📱 Testing products endpoint with detailed debugging...');
    const response = await fetch(`${baseUrl}/api/products`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log(`Products API Status: ${response.status}`);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log(`Response Length: ${responseText.length} characters`);
    console.log(`Response Preview: ${responseText.substring(0, 500)}...`);

    // Try to parse as JSON
    try {
      const data = JSON.parse(responseText);
      console.log('\n✅ Successfully parsed JSON');
      console.log('Response Structure:', Object.keys(data));
      
      if (data.data) {
        console.log('Data Structure:', Object.keys(data.data));
        console.log('Products Array Length:', data.data.length || 'Not an array');
        
        if (Array.isArray(data.data)) {
          console.log(`Products found: ${data.data.length}`);
        }
      }
      
      if (data.pagination) {
        console.log('Pagination:', data.pagination);
      }
    } catch (parseError) {
      console.log(`❌ Failed to parse JSON: ${parseError.message}`);
      console.log('Raw response:', responseText);
    }

  } catch (error) {
    console.error('❌ Error testing production:', error.message);
  }

  console.log('\n🏁 Production test completed!');
};

// Run the test
testProductionDatabase().catch(console.error);