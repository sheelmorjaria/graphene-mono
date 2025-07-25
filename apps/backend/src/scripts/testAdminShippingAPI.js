import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const testAdminShippingAPI = async () => {
  console.log('🔍 Testing Admin Shipping API');
  console.log('==============================');

  const baseUrl = 'https://graphene-backend.onrender.com';
  
  // Create a test admin token (this is just for testing - normally you'd get this from login)
  const adminPayload = {
    userId: 'test-admin-id',
    email: 'admin@test.com',
    role: 'admin',
    isAdmin: true
  };
  
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
  const adminToken = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '1h' });
  
  console.log('🔑 Generated test admin token');
  console.log('   Token preview:', adminToken.substring(0, 30) + '...');

  try {
    console.log('\n📊 Testing GET /api/admin/settings/shipping');
    
    const response = await fetch(`${baseUrl}/api/admin/settings/shipping`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   Status:', response.status, response.statusText);
    console.log('   Content-Type:', response.headers.get('content-type'));
    console.log('   URL:', response.url);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Success:', data.success);
      console.log('   📦 Shipping methods found:', data.data?.shippingMethods?.length || 0);
      
      if (data.data?.shippingMethods) {
        data.data.shippingMethods.forEach((method, index) => {
          console.log(`      ${index + 1}. ${method.name} (${method.code}) - £${method.baseCost} - ${method.isActive ? 'Active' : 'Inactive'}`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log('   ❌ Error response:', errorText);
      
      if (errorText.trim().startsWith('<')) {
        console.log('   🚨 Server returned HTML instead of JSON!');
      }
    }
    
  } catch (error) {
    console.error('   ❌ Request failed:', error.message);
  }
  
  console.log('\n💡 Summary:');
  console.log('============');
  console.log('- Admin shipping API endpoint: /api/admin/settings/shipping');
  console.log('- Requires valid admin JWT token in Authorization header');
  console.log('- Should return JSON with success and data.shippingMethods array');
  console.log('- If you see HTML response, check routing configuration');
};

testAdminShippingAPI().catch(console.error);