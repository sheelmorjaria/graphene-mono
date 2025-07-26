import fetch from 'node-fetch';

const PRODUCTION_API = 'https://graphene-backend.onrender.com';

const testBitcoinService = async () => {
  console.log('🔍 Debugging Production 500 Error...\n');

  // The user's request had these headers - let's replicate them
  const headers = {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'Origin': 'https://graphene-frontend.onrender.com',
    'Referer': 'https://graphene-frontend.onrender.com/',
    'Cookie': 'cartSessionId=guest-7ea2c86c-a9bb-49af-b550-f31edde11c5a',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0'
  };

  try {
    // Test 1: Check what services are working in production
    console.log('1️⃣ Testing Bitcoin service dependencies...');
    
    // Test CoinGecko API (for exchange rates)
    console.log('   🪙 Testing CoinGecko API...');
    try {
      const coinGeckoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=gbp');
      if (coinGeckoResponse.ok) {
        const data = await coinGeckoResponse.json();
        console.log(`   ✅ CoinGecko API working - BTC rate: £${data.bitcoin.gbp}`);
      } else {
        console.log(`   ❌ CoinGecko API failed: ${coinGeckoResponse.status}`);
      }
    } catch (error) {
      console.log(`   ❌ CoinGecko API error: ${error.message}`);
    }

    // Test 2: Try to trigger the specific error scenario
    console.log('\n2️⃣ Testing Bitcoin initialization patterns...');
    
    // Test with different order ID formats to see what triggers the 500
    const testCases = [
      { name: 'Valid MongoDB ObjectId', orderId: '507f1f77bcf86cd799439011' },
      { name: 'Invalid ObjectId format', orderId: 'invalid-order-id' },
      { name: 'Empty string', orderId: '' },
      { name: 'Null value', orderId: null }
    ];

    for (const testCase of testCases) {
      console.log(`\n   🧪 Testing: ${testCase.name}`);
      
      try {
        const response = await fetch(`${PRODUCTION_API}/api/payment/bitcoin/initialize`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ orderId: testCase.orderId })
        });

        console.log(`      📡 Status: ${response.status}`);
        
        if (response.status === 500) {
          console.log('      🎯 Found 500 error! This might be the trigger.');
        }

        const responseText = await response.text();
        console.log(`      📄 Response: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);

      } catch (error) {
        console.log(`      ❌ Request failed: ${error.message}`);
      }
    }

    // Test 3: Check production environment variables
    console.log('\n3️⃣ Checking for common production issues...');
    console.log('   🔧 Likely causes of 500 error in Bitcoin initialization:');
    console.log('      1. Missing BLOCKONOMICS_API_KEY (should fallback to mock)');
    console.log('      2. CoinGecko API rate limiting/blocking');
    console.log('      3. Database connection issues during order update');
    console.log('      4. Memory/timeout issues on Render');
    console.log('      5. Missing JWT_SECRET or other env vars');
    console.log('      6. Order exists but has invalid data structure');

    // Test 4: Try to get more info from production
    console.log('\n4️⃣ Additional diagnostic info...');
    
    // Test if the error is consistent
    console.log('   🔄 Testing consistency (multiple requests)...');
    for (let i = 1; i <= 3; i++) {
      try {
        const response = await fetch(`${PRODUCTION_API}/api/payment/bitcoin/initialize`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ orderId: '507f1f77bcf86cd799439011' })
        });
        console.log(`      Request ${i}: ${response.status}`);
        
        if (response.status === 500) {
          const errorText = await response.text();
          console.log(`      Error details: ${errorText}`);
          break;
        }
      } catch (error) {
        console.log(`      Request ${i} failed: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('💥 Diagnostic failed:', error.message);
  }
};

const main = async () => {
  await testBitcoinService();
  
  console.log('\n📋 Next Steps for Production Debugging:');
  console.log('1. Check Render.com logs for the exact error stack trace');
  console.log('2. Verify these environment variables are set:');
  console.log('   - JWT_SECRET');
  console.log('   - MONGODB_URI');
  console.log('   - BLOCKONOMICS_API_KEY (optional, should fallback)');
  console.log('3. Check if the order exists and has valid data structure');
  console.log('4. Test CoinGecko API access from production server');
  console.log('5. Monitor memory usage during Bitcoin service calls');
};

main().catch(console.error);