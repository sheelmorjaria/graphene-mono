import fetch from 'node-fetch';

const PRODUCTION_API = 'https://graphene-backend.onrender.com';

const checkProductionDeployment = async () => {
  console.log('🚀 Production Deployment Status Check');
  console.log('=====================================\n');

  try {
    // Test 1: Check if our ObjectId validation fix is deployed
    console.log('1️⃣ Testing if ObjectId validation fix is deployed...');
    
    const invalidObjectIdTest = await fetch(`${PRODUCTION_API}/api/payment/bitcoin/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://graphene-frontend.onrender.com'
      },
      body: JSON.stringify({ orderId: 'invalid-object-id-format' })
    });

    console.log(`   📡 Status: ${invalidObjectIdTest.status}`);
    
    const responseText = await invalidObjectIdTest.text();
    console.log(`   📄 Response: ${responseText}`);

    if (invalidObjectIdTest.status === 400) {
      try {
        const data = JSON.parse(responseText);
        if (data.error === 'Invalid Order ID format') {
          console.log('   ✅ ObjectId validation fix IS deployed in production!');
          console.log('   ⚠️  The 500 error must be from a different cause');
        } else {
          console.log('   ❌ Different 400 error - fix may be partially deployed');
        }
      } catch (e) {
        console.log('   ❌ Could not parse response');
      }
    } else if (invalidObjectIdTest.status === 500) {
      console.log('   ❌ ObjectId validation fix NOT deployed - still getting 500 errors');
      console.log('   📋 Action needed: Deploy the updated code to production');
    } else {
      console.log(`   ⚠️  Unexpected status code: ${invalidObjectIdTest.status}`);
    }

    // Test 2: Check health and basic functionality
    console.log('\n2️⃣ Checking production server health...');
    
    const healthResponse = await fetch(`${PRODUCTION_API}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`   ✅ Server healthy - uptime: ${Math.round(healthData.uptime)}s`);
      console.log(`   🗄️  Database: ${healthData.database.connected ? 'Connected' : 'Disconnected'}`);
    } else {
      console.log('   ❌ Server health check failed');
    }

    // Test 3: Check current deployment info
    console.log('\n3️⃣ Analyzing deployment status...');
    console.log('   📅 Current timestamp:', new Date().toISOString());
    console.log('   🌍 Production URL:', PRODUCTION_API);
    console.log('   📋 Expected behavior after fix:');
    console.log('      - Invalid ObjectId → 400 "Invalid Order ID format"');
    console.log('      - Valid ObjectId (not found) → 404 "Order not found"');
    console.log('      - Real issue → Different error message');

    // Test 4: Try to understand the actual issue
    console.log('\n4️⃣ Investigating the actual production issue...');
    
    // Since we can't see the request body, let's test different scenarios
    const testScenarios = [
      { name: 'Empty request body', body: {} },
      { name: 'Null orderId', body: { orderId: null } },
      { name: 'Undefined orderId', body: { orderId: undefined } },
      { name: 'Valid ObjectId format', body: { orderId: '507f1f77bcf86cd799439011' } }
    ];

    for (const scenario of testScenarios) {
      console.log(`\n   🧪 Testing: ${scenario.name}`);
      
      try {
        const response = await fetch(`${PRODUCTION_API}/api/payment/bitcoin/initialize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://graphene-frontend.onrender.com',
            'Cookie': 'cartSessionId=test-session'
          },
          body: JSON.stringify(scenario.body)
        });

        const data = await response.json();
        console.log(`      Status: ${response.status} - ${data.error || data.message || 'Success'}`);
        
        if (response.status === 500) {
          console.log('      🎯 This scenario triggers the 500 error!');
        }
      } catch (error) {
        console.log(`      ❌ Request failed: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('💥 Production check failed:', error.message);
  }
};

const provideSolution = () => {
  console.log('\n📋 DEPLOYMENT SOLUTION GUIDE');
  console.log('============================\n');
  
  console.log('🔧 If ObjectId validation fix is NOT deployed:');
  console.log('   1. Ensure your changes are committed to git');
  console.log('   2. Push to your main/master branch');
  console.log('   3. Check Render.com dashboard for auto-deployment');
  console.log('   4. If auto-deploy is disabled, manually trigger deployment');
  console.log('   5. Monitor deployment logs for any build failures\n');
  
  console.log('🔍 If ObjectId validation fix IS deployed but still getting 500:');
  console.log('   1. The issue might be with a valid ObjectId that exists in production');
  console.log('   2. Check production database for the specific order');
  console.log('   3. Look for other errors in the Bitcoin service (CoinGecko API, etc.)');
  console.log('   4. Check Render.com logs for the exact error stack trace');
  console.log('   5. Verify all required environment variables are set\n');
  
  console.log('⚡ Quick Render.com Deployment Steps:');
  console.log('   1. Go to https://dashboard.render.com');
  console.log('   2. Find your backend service');
  console.log('   3. Click "Manual Deploy" → "Deploy latest commit"');
  console.log('   4. Wait for deployment to complete');
  console.log('   5. Test the API again');
  
  console.log('\n🔗 Useful Commands:');
  console.log('   git add -A');
  console.log('   git commit -m "Fix: Add ObjectId validation to prevent 500 errors"');
  console.log('   git push origin main');
};

const main = async () => {
  await checkProductionDeployment();
  provideSolution();
};

main().catch(console.error);