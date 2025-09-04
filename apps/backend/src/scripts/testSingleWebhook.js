import fetch from 'node-fetch';

const testSingleWebhook = async () => {
  console.log('🧪 Testing Single Webhook with status=2\n');

  const baseUrl = 'https://graphene-backend.onrender.com/api/payment/bitcoin/webhook';
  const bitcoinAddress = 'bc1qytdnr3p7pqvks7gtaaut74tz8wrzgmmyalynvk';
  const txId = 'WarningThisIsAGeneratedTestPaymentAndNotARealBitcoinTransaction';
  const value = '363525';
  const status = '2'; // Should trigger confirmation

  const webhookUrl = `${baseUrl}?addr=${bitcoinAddress}&status=${status}&crypto=BTC&txid=${txId}&value=${value}`;
  
  console.log('📡 Sending webhook request...');
  console.log(`URL: ${webhookUrl}`);

  try {
    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Blockonomics/1.0'
      }
    });

    console.log(`\n📊 Response Status: ${response.status}`);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('📄 Response Body:', JSON.stringify(data, null, 2));
      console.log('\n✅ Webhook processed successfully!');
    } else {
      const errorText = await response.text();
      console.log(`❌ Error Response: ${errorText}`);
      
      // Try to parse as JSON if possible
      try {
        const errorJson = JSON.parse(errorText);
        console.log('📄 Error Details:', JSON.stringify(errorJson, null, 2));
      } catch (parseError) {
        console.log('📄 Raw Error Text:', errorText);
      }
    }

  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    console.log('Stack trace:', error.stack);
  }
};

const main = async () => {
  console.log('🔍 Bitcoin Webhook Debug Test');
  console.log('=============================\n');
  
  await testSingleWebhook();
  
  console.log('\n🎯 Expected: status=2 should mark payment as completed');
  console.log('📋 Next: Check database to see if order was updated');
};

main().catch(console.error);