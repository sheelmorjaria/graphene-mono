import fetch from 'node-fetch';

const PRODUCTION_API = 'https://graphene-backend.onrender.com';

const testProductionAPI = async () => {
  console.log('🧪 Testing Production API Endpoints...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing production health endpoint...');
    const healthResponse = await fetch(`${PRODUCTION_API}/health`);
    console.log(`   📡 Status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`   ✅ Server Status: ${healthData.status}`);
      console.log(`   🗄️  Database: ${healthData.database.connected ? 'Connected' : 'Disconnected'}`);
      console.log(`   ⏱️  Uptime: ${Math.round(healthData.uptime)}s`);
    } else {
      console.log('   ❌ Health check failed');
    }

    // Test 2: Payment Methods (Public endpoint)
    console.log('\n2️⃣ Testing payment methods endpoint...');
    const methodsResponse = await fetch(`${PRODUCTION_API}/api/payment/methods`);
    console.log(`   📡 Status: ${methodsResponse.status}`);
    
    if (methodsResponse.ok) {
      const methodsData = await methodsResponse.json();
      console.log(`   ✅ Found ${methodsData.data.paymentMethods.length} payment methods`);
      
      const bitcoinMethod = methodsData.data.paymentMethods.find(m => m.type === 'bitcoin');
      console.log(`   ₿ Bitcoin enabled: ${bitcoinMethod?.enabled ? 'Yes' : 'No'}`);
    } else {
      const errorText = await methodsResponse.text();
      console.log(`   ❌ Payment methods failed: ${errorText}`);
    }

    // Test 3: Bitcoin Initialization (This is where the error occurs)
    console.log('\n3️⃣ Testing Bitcoin initialization with dummy order...');
    
    // First, let's see what happens with a test order ID
    const testOrderId = '507f1f77bcf86cd799439011'; // Valid MongoDB ObjectId format
    
    const bitcoinResponse = await fetch(`${PRODUCTION_API}/api/payment/bitcoin/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'cartSessionId=test-session-id'
      },
      body: JSON.stringify({ orderId: testOrderId })
    });

    console.log(`   📡 Status: ${bitcoinResponse.status}`);
    console.log('   📋 Response Headers:');
    
    // Log relevant headers
    const headers = bitcoinResponse.headers;
    console.log(`      Content-Type: ${headers.get('content-type')}`);
    console.log(`      Content-Length: ${headers.get('content-length')}`);
    
    const responseText = await bitcoinResponse.text();
    console.log(`   📄 Response Body: ${responseText}`);

    if (!bitcoinResponse.ok) {
      console.log('\n   🔍 Analyzing the error...');
      
      try {
        const errorData = JSON.parse(responseText);
        console.log(`   📝 Error Message: ${errorData.error || errorData.message || 'Unknown error'}`);
        
        if (errorData.stack) {
          console.log(`   📚 Stack Trace: ${errorData.stack}`);
        }
      } catch (parseError) {
        console.log('   ⚠️  Could not parse error response as JSON');
        console.log(`   📄 Raw response: ${responseText}`);
      }
    }

    // Test 4: Check server logs/monitoring
    console.log('\n4️⃣ Production environment analysis...');
    console.log('   🌍 Environment: Production (Render.com)');
    console.log('   🔧 Expected issues in production:');
    console.log('      - Missing environment variables');
    console.log('      - Database connection issues');
    console.log('      - External API failures (Blockonomics, CoinGecko)');
    console.log('      - Memory/resource constraints');
    console.log('      - Dependency issues');

  } catch (error) {
    console.error('\n💥 Test failed with network error:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('   🌐 DNS resolution failed - server might be down');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   🔌 Connection refused - server not responding');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   ⏱️  Request timed out - server overloaded or slow');
    }
  }
};

const main = async () => {
  console.log('🚀 Production API Diagnostic Tool');
  console.log('==================================\n');
  
  await testProductionAPI();
  
  console.log('\n📋 Recommendations:');
  console.log('1. Check Render.com deployment logs');
  console.log('2. Verify environment variables are set in production');
  console.log('3. Ensure external APIs (CoinGecko) are accessible');
  console.log('4. Check database connection and permissions');
  console.log('5. Monitor memory/CPU usage on Render');
  
  console.log('\n🔗 Useful Render.com commands:');
  console.log('   View logs: Check Render dashboard logs');
  console.log('   Environment: Verify all required env vars are set');
  console.log('   Health: Monitor service health metrics');
};

main().catch(console.error);