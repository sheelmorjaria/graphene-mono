import fetch from 'node-fetch';

const testConfirmedWebhook = async () => {
  console.log('🧪 Testing Confirmed Bitcoin Webhook Fix\n');

  const baseUrl = 'https://graphene-backend.onrender.com/api/payment/bitcoin/webhook';
  const bitcoinAddress = 'bc1qytdnr3p7pqvks7gtaaut74tz8wrzgmmyalynvk';
  const txId = 'WarningThisIsAGeneratedTestPaymentAndNotARealBitcoinTransaction';
  const value = '363525';

  // Test different status values
  const testCases = [
    { status: '0', description: 'Unconfirmed (0 confirmations)' },
    { status: '1', description: 'Partially Confirmed (1 confirmation)' },
    { status: '2', description: 'Confirmed (2+ confirmations) - Should complete payment' }
  ];

  for (const testCase of testCases) {
    console.log(`🔍 Testing ${testCase.description}`);
    
    const webhookUrl = `${baseUrl}?addr=${bitcoinAddress}&status=${testCase.status}&crypto=BTC&txid=${txId}&value=${value}`;
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log(`   📡 Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   📄 Response:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText}`);
      }
      
      // Wait a moment between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
    
    console.log('');
  }

  // Test the payment status after the confirmed webhook
  console.log('🔍 Checking payment status after confirmed webhook...');
  const orderId = '68842e60db0d322fa8adb77c';
  const statusUrl = `https://graphene-backend.onrender.com/api/payment/bitcoin/status/${orderId}`;
  
  try {
    const response = await fetch(statusUrl, {
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://graphene-frontend.onrender.com'
      }
    });

    console.log(`   📡 Status API: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   📊 Payment Status:', data.data.paymentStatus);
      console.log('   🔢 Confirmations:', data.data.bitcoinConfirmations);
      console.log('   ✅ Is Confirmed:', data.data.isConfirmed);
      
      if (data.data.paymentStatus === 'completed') {
        console.log('   🎉 SUCCESS: Payment marked as completed!');
      } else {
        console.log('   ⚠️  Payment not completed yet. Status:', data.data.paymentStatus);
      }
    }
  } catch (error) {
    console.log(`   ❌ Status check failed: ${error.message}`);
  }
};

const main = async () => {
  console.log('🚀 Bitcoin Webhook Confirmation Test');
  console.log('====================================\n');
  
  await testConfirmedWebhook();
  
  console.log('\n📋 Expected Results:');
  console.log('✅ status=0 → awaiting_confirmation (0 confirmations)');
  console.log('✅ status=1 → awaiting_confirmation (1 confirmation)');
  console.log('✅ status=2 → completed (2+ confirmations)');
  console.log('\n🎯 If status=2 marks payment as completed, the fix is working!');
};

main().catch(console.error);