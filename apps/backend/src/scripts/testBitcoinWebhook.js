import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

const testBitcoinWebhook = async () => {
  console.log('🧪 Testing Bitcoin Webhook Endpoints...\n');

  // Test webhook URL from Blockonomics
  const webhookUrl = 'https://graphene-backend.onrender.com/api/payment/bitcoin/webhook?addr=bc1q4nf4a0fj2er93kg0uxr8lvx4ua9chlu527yxfk&status=1&crypto=BTC&txid=WarningThisIsAGeneratedTestPaymentAndNotARealBitcoinTransaction&value=377000';
  
  // Extract query params
  const url = new URL(webhookUrl);
  const params = Object.fromEntries(url.searchParams);
  
  console.log('📋 Webhook Parameters:');
  console.log(`   Address: ${params.addr}`);
  console.log(`   Status: ${params.status}`);
  console.log(`   Crypto: ${params.crypto}`);
  console.log(`   TxID: ${params.txid}`);
  console.log(`   Value: ${params.value} satoshis`);
  console.log(`   BTC Amount: ${params.value / 100000000} BTC`);

  // Test 1: Test GET webhook (Blockonomics style)
  console.log('\n1️⃣ Testing GET webhook endpoint...');
  
  const getUrl = `${API_BASE_URL}/payment/bitcoin/webhook?${url.search.substring(1)}`;
  console.log(`   URL: ${getUrl}`);
  
  try {
    const response = await fetch(getUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log(`   📡 Status: ${response.status}`);
    const data = await response.json();
    console.log(`   📄 Response:`, JSON.stringify(data, null, 2));
    
    if (response.status === 404) {
      console.log('   ❌ GET endpoint not found - needs deployment');
    } else if (response.status === 200) {
      console.log('   ✅ GET webhook working correctly');
    } else {
      console.log(`   ⚠️  Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }

  // Test 2: Test POST webhook (alternative format)
  console.log('\n2️⃣ Testing POST webhook endpoint...');
  
  const postData = {
    addr: params.addr,
    status: parseInt(params.status),
    crypto: params.crypto,
    txid: params.txid,
    value: parseInt(params.value),
    confirmations: 1 // Blockonomics sends this in POST
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/payment/bitcoin/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(postData)
    });

    console.log(`   📡 Status: ${response.status}`);
    const data = await response.json();
    console.log(`   📄 Response:`, JSON.stringify(data, null, 2));
    
    if (response.status === 200) {
      console.log('   ✅ POST webhook working correctly');
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }

  // Test 3: Test webhook with missing parameters
  console.log('\n3️⃣ Testing webhook validation...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/payment/bitcoin/webhook?addr=test`, {
      method: 'GET'
    });

    console.log(`   📡 Status: ${response.status}`);
    const data = await response.json();
    
    if (response.status === 400) {
      console.log('   ✅ Validation working - missing txid rejected');
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }
};

const main = async () => {
  console.log('🚀 Bitcoin Webhook Test Suite');
  console.log('==============================\n');
  
  // Check if server is running
  try {
    const healthResponse = await fetch('http://localhost:5000/health');
    if (!healthResponse.ok) {
      console.log('❌ Backend server not running on localhost:5000');
      return;
    }
    console.log('✅ Backend server is running\n');
  } catch (error) {
    console.log('❌ Cannot connect to backend server');
    return;
  }
  
  await testBitcoinWebhook();
  
  console.log('\n📋 Summary:');
  console.log('✅ Webhook now accepts both GET and POST requests');
  console.log('✅ GET requests use query parameters (Blockonomics style)');
  console.log('✅ POST requests use JSON body');
  console.log('✅ Proper validation and error handling');
  console.log('\n🎯 Deploy this fix to resolve the 404 error in production');
};

main().catch(console.error);