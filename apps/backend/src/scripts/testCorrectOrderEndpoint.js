import fetch from 'node-fetch';

const testCorrectOrderEndpoint = async () => {
  console.log('🔍 Testing Correct Order Endpoints\n');

  const orderId = '68842e60db0d322fa8adb77c';
  
  // Test different endpoints
  const endpoints = [
    {
      name: 'User Order Endpoint',
      url: `https://graphene-backend.onrender.com/api/user/orders/${orderId}`,
      description: 'Should work for authenticated users'
    },
    {
      name: 'Admin Order Endpoint', 
      url: `https://graphene-backend.onrender.com/api/admin/orders/${orderId}`,
      description: 'Should work for admin users'
    }
  ];

  for (const endpoint of endpoints) {
    console.log(`📡 Testing ${endpoint.name}...`);
    console.log(`   URL: ${endpoint.url}`);
    console.log(`   ${endpoint.description}`);

    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Origin': 'https://graphene-frontend.onrender.com',
          'User-Agent': 'Frontend/1.0'
        }
      });

      console.log(`   📊 Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Order accessible!');
        
        if (data.order) {
          console.log(`   📋 Order Status: ${data.order.status}`);
          console.log(`   📋 Payment Status: ${data.order.paymentStatus}`);
        } else if (data.status) {
          console.log(`   📋 Order Status: ${data.status}`);
          console.log(`   📋 Payment Status: ${data.paymentStatus}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText}`);
        
        if (response.status === 401) {
          console.log('   🔐 Authentication required - this is expected');
        } else if (response.status === 404) {
          console.log('   ❌ Not found - endpoint may not exist');
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
    
    console.log('');
  }
};

const explainSolution = () => {
  console.log('💡 Solution Explanation:\n');
  
  console.log('The "order could not be found" error occurs because:');
  console.log('1. Frontend is trying to access `/api/orders/${orderId}` (which doesn\'t exist)');
  console.log('2. The correct endpoints are:');
  console.log('   - `/api/user/orders/${orderId}` (requires user authentication)');
  console.log('   - `/api/admin/orders/${orderId}` (requires admin authentication)');
  console.log('');
  
  console.log('🔧 Fix needed:');
  console.log('Update the frontend to use the correct API endpoint:');
  console.log('- Change from: `/api/orders/${orderId}`');
  console.log('- Change to: `/api/user/orders/${orderId}`');
  console.log('- Ensure JWT token is included in Authorization header');
  console.log('');
  
  console.log('🎯 Result:');
  console.log('After Bitcoin payment confirmation, the frontend should:');
  console.log('1. ✅ Show "Payment confirmed!" (already working)');
  console.log('2. ✅ Redirect to order confirmation page with correct endpoint');
  console.log('3. ✅ Display order details successfully');
};

const main = async () => {
  console.log('🚀 Order Endpoint Investigation');
  console.log('===============================\n');
  
  await testCorrectOrderEndpoint();
  explainSolution();
};

main().catch(console.error);