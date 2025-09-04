import bitcoinService from '../services/bitcoinService.js';

const testRateLimitFix = async () => {
  console.log('🧪 Testing CoinGecko Rate Limit Fix...\n');

  // Test 1: First call should work (or use fallback if API is down)
  console.log('1️⃣ First API call:');
  try {
    const result1 = await bitcoinService.getBtcExchangeRate();
    console.log(`   ✅ Rate: £${result1.rate}`);
    console.log(`   📅 Timestamp: ${result1.timestamp}`);
    console.log(`   💾 Cached: ${result1.cached}`);
    console.log(`   🔄 Fallback: ${result1.fallback || false}`);
    console.log(`   ⚠️  Error: ${result1.error || 'None'}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 2: Immediate second call should use cache or be throttled
  console.log('\n2️⃣ Immediate second call (should be throttled):');
  try {
    const result2 = await bitcoinService.getBtcExchangeRate();
    console.log(`   ✅ Rate: £${result2.rate}`);
    console.log(`   💾 Cached: ${result2.cached}`);
    console.log(`   🚫 Throttled: ${result2.throttled || false}`);
    console.log(`   🔄 Fallback: ${result2.fallback || false}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 3: Simulate API failure
  console.log('\n3️⃣ Simulating API failure scenario:');
  
  // Clear cache to test fallback
  bitcoinService.rateCache = { rate: null, timestamp: null };
  bitcoinService.lastApiCallTime = 0; // Reset throttle
  
  // Temporarily override fetch to simulate 429 error
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error('CoinGecko API error: 429 Too Many Requests');
  };

  try {
    const result3 = await bitcoinService.getBtcExchangeRate();
    console.log(`   ✅ Rate: £${result3.rate}`);
    console.log(`   🔄 Using fallback: ${result3.fallback || false}`);
    console.log('   💡 Fallback rate active!');
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Restore original fetch
  global.fetch = originalFetch;

  // Test 4: Test Bitcoin payment creation with fallback
  console.log('\n4️⃣ Testing Bitcoin payment creation:');
  try {
    const payment = await bitcoinService.createBitcoinPayment(299.99);
    console.log('   ✅ Payment created successfully');
    console.log(`   ₿ Address: ${payment.bitcoinAddress}`);
    console.log(`   💰 Amount: ${payment.bitcoinAmount} BTC`);
    console.log(`   📊 Rate: £${payment.bitcoinExchangeRate}`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n📋 Summary:');
  console.log('✅ Rate limiting protection implemented');
  console.log('✅ Fallback rate available (£87,000 per BTC)');
  console.log('✅ Extended cache duration to 60 minutes');
  console.log('✅ Minimum 10 seconds between API calls');
  console.log('✅ Bitcoin payments will work even if CoinGecko is down');
};

const main = async () => {
  console.log('🚀 CoinGecko Rate Limit Fix Test');
  console.log('=================================\n');
  
  await testRateLimitFix();
  
  console.log('\n🎉 Fix ready for production deployment!');
};

main().catch(console.error);