import fetch from 'node-fetch';

const testOrderConfirmationAPI = async () => {
  console.log('🔍 Testing Order Confirmation API Access\n');

  const orderId = '68842e60db0d322fa8adb77c'; // Your completed order
  const baseUrl = 'https://graphene-backend.onrender.com';

  console.log(`Testing order access for ID: ${orderId}\n`);

  // Test 1: Without authentication (should fail with 401)
  console.log('1️⃣ Testing without authentication...');
  try {
    const response = await fetch(`${baseUrl}/api/user/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://graphene-frontend.onrender.com'
      }
    });

    console.log(`   Status: ${response.status}`);
    const data = await response.text();
    console.log(`   Response: ${data}`);
    
    if (response.status === 401) {
      console.log('   ✅ Expected: Authentication required\n');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 2: Check if order exists in database at all
  console.log('2️⃣ Testing order existence in admin endpoint...');
  try {
    const response = await fetch(`${baseUrl}/api/admin/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://graphene-frontend.onrender.com'
      }
    });

    console.log(`   Status: ${response.status}`);
    const data = await response.text();
    
    if (response.status === 401) {
      console.log('   ✅ Order endpoint exists (requires admin auth)');
    } else if (response.status === 404) {
      console.log('   ❌ Order may not exist or endpoint missing');
    }
    console.log(`   Response: ${data}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}\n`);
  }

  // Test 3: Check what authentication looks like
  console.log('3️⃣ Frontend authentication requirements:');
  console.log('   - JWT token must be stored in localStorage as "authToken"');
  console.log('   - Token must be sent as Authorization: Bearer <token>');
  console.log('   - User must be authenticated and own the order');
  console.log('');

  console.log('4️⃣ Possible causes of "Order Not Found":');
  console.log('   a) User not logged in (no authToken in localStorage)');
  console.log('   b) Expired or invalid JWT token');
  console.log('   c) User trying to access someone else\'s order');
  console.log('   d) Order ID incorrect or malformed');
  console.log('   e) Database/server error');
  console.log('');

  console.log('5️⃣ Debug steps:');
  console.log('   1. Check browser localStorage for "authToken"');
  console.log('   2. Check browser Network tab for the API request');
  console.log('   3. Look for 401 vs 404 vs 500 error responses');
  console.log('   4. Verify the order ID in the URL is correct');
  console.log('   5. Try logging in again to refresh token');
};

const main = async () => {
  console.log('🚀 Order Confirmation API Debug');
  console.log('===============================\n');
  
  await testOrderConfirmationAPI();
  
  console.log('\n💡 Quick Fix to Test:');
  console.log('If user is not logged in, the order confirmation page should:');
  console.log('1. Redirect to login page, OR');
  console.log('2. Show a different error message about authentication');
  console.log('');
  console.log('The "Order Not Found" message is generic and might be hiding auth errors.');
};

main().catch(console.error);