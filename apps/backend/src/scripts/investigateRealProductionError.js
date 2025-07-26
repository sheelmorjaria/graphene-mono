import fetch from 'node-fetch';

const PRODUCTION_API = 'https://graphene-backend.onrender.com';

const investigateProductionError = async () => {
  console.log('🔍 Investigating Real Production 500 Error');
  console.log('==========================================\n');

  // Since ObjectId validation is working, the issue must be elsewhere
  console.log('✅ ObjectId validation is working in production');
  console.log('🎯 The 500 error must be occurring with a REAL order ID\n');

  console.log('🔍 Possible causes of 500 error in Bitcoin initialization:\n');

  // 1. CoinGecko API issues
  console.log('1️⃣ Testing CoinGecko API (Bitcoin exchange rates)...');
  try {
    const coinGeckoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=gbp', {
      headers: {
        'User-Agent': 'GrapheneOS-Store/1.0'
      }
    });
    
    if (coinGeckoResponse.ok) {
      const data = await coinGeckoResponse.json();
      console.log(`   ✅ CoinGecko API working - BTC rate: £${data.bitcoin.gbp}`);
    } else {
      console.log(`   ❌ CoinGecko API failed: ${coinGeckoResponse.status}`);
      console.log('   🎯 This could cause 500 errors in Bitcoin service');
    }
  } catch (error) {
    console.log(`   ❌ CoinGecko API error: ${error.message}`);
    console.log('   🎯 This could cause 500 errors in Bitcoin service');
  }

  // 2. Database issues
  console.log('\n2️⃣ Testing database connectivity in production...');
  try {
    const healthResponse = await fetch(`${PRODUCTION_API}/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.database.connected) {
      console.log('   ✅ Database connected');
    } else {
      console.log('   ❌ Database disconnected');
      console.log('   🎯 This could cause 500 errors when updating orders');
    }
  } catch (error) {
    console.log(`   ❌ Health check failed: ${error.message}`);
  }

  // 3. Check if there's a specific issue with order state
  console.log('\n3️⃣ Testing order state validation...');
  console.log('   💡 The user might have an order that exists but is in wrong state');
  console.log('   💡 E.g., order already processed, payment already initialized, etc.');

  // 4. Environment variables
  console.log('\n4️⃣ Checking environment variable dependencies...');
  console.log('   Required for Bitcoin service:');
  console.log('   - JWT_SECRET (for authentication)');
  console.log('   - MONGODB_URI (for database)');
  console.log('   - BLOCKONOMICS_API_KEY (optional - should fallback to mock)');
  console.log('   - CoinGecko access (no API key needed for basic tier)');

  // 5. Memory/resource issues
  console.log('\n5️⃣ Checking for Render.com resource constraints...');
  console.log('   💡 Render free tier has limitations:');
  console.log('   - 512MB RAM limit');
  console.log('   - CPU throttling');
  console.log('   - Request timeout limits');
  console.log('   - Cold starts can cause timeouts');

  // 6. Try to reproduce with realistic data
  console.log('\n6️⃣ Testing with realistic production scenarios...');
  
  // Test what happens if we simulate the exact user request
  const userRequestHeaders = {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Origin': 'https://graphene-frontend.onrender.com',
    'Referer': 'https://graphene-frontend.onrender.com/',
    'Cookie': 'cartSessionId=guest-7ea2c86c-a9bb-49af-b550-f31edde11c5a',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0'
  };

  // Try with a freshly generated ObjectId (simulating a real order)
  const testOrderId = '64abc123def456789012345a'; // Valid ObjectId format
  
  console.log('   🧪 Simulating user request with realistic order ID...');
  try {
    const response = await fetch(`${PRODUCTION_API}/api/payment/bitcoin/initialize`, {
      method: 'POST',
      headers: userRequestHeaders,
      body: JSON.stringify({ orderId: testOrderId })
    });

    console.log(`   📡 Status: ${response.status}`);
    const responseText = await response.text();
    console.log(`   📄 Response: ${responseText}`);

    if (response.status === 500) {
      console.log('   🎯 500 error reproduced! Issue confirmed.');
    } else if (response.status === 404) {
      console.log('   ✅ Expected 404 - order not found (normal behavior)');
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }

  // 7. Check for timing/race conditions
  console.log('\n7️⃣ Testing for timing/race condition issues...');
  console.log('   💡 Rapid successive requests might cause issues');
  
  // Make multiple requests quickly to test
  const promises = [];
  for (let i = 0; i < 3; i++) {
    promises.push(
      fetch(`${PRODUCTION_API}/api/payment/bitcoin/initialize`, {
        method: 'POST',
        headers: userRequestHeaders,
        body: JSON.stringify({ orderId: `64abc123def45678901234${i}${i}` })
      })
    );
  }

  try {
    const responses = await Promise.all(promises);
    console.log('   📊 Concurrent request results:');
    
    for (let i = 0; i < responses.length; i++) {
      console.log(`      Request ${i + 1}: ${responses[i].status}`);
      if (responses[i].status === 500) {
        console.log('      🎯 500 error found in concurrent requests!');
      }
    }
  } catch (error) {
    console.log(`   ❌ Concurrent requests failed: ${error.message}`);
  }
};

const provideDiagnostics = () => {
  console.log('\n📋 DIAGNOSTIC RECOMMENDATIONS');
  console.log('==============================\n');
  
  console.log('🔍 To find the exact cause of the 500 error:');
  console.log('   1. Check Render.com logs for stack traces');
  console.log('   2. Look for specific error messages in logs');
  console.log('   3. Check memory/CPU usage during error');
  console.log('   4. Verify all environment variables are set');
  console.log('   5. Test with the exact order ID that\'s failing\n');
  
  console.log('🛠️  Most likely causes (in order of probability):');
  console.log('   1. Order exists but is in wrong payment state');
  console.log('   2. CoinGecko API rate limiting or blocking');
  console.log('   3. Memory exhaustion on Render free tier');
  console.log('   4. Database connection timeout during order update');
  console.log('   5. Missing environment variables in production');
  console.log('   6. Cold start timeout issues\n');
  
  console.log('⚡ Immediate actions to try:');
  console.log('   1. Restart the Render service (to clear memory issues)');
  console.log('   2. Check if the order is already in "awaiting_confirmation" state');
  console.log('   3. Add more detailed error logging to catch specific errors');
  console.log('   4. Consider upgrading Render plan if memory is the issue');
};

const main = async () => {
  await investigateProductionError();
  provideDiagnostics();
};

main().catch(console.error);