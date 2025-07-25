import fetch from 'node-fetch';

// Test PayPal configuration on production
const testPayPalConfig = async () => {
  console.log('🔍 Testing PayPal configuration on PRODUCTION...');
  console.log('📍 API URL: https://graphene-backend.onrender.com/api/payment/methods');

  try {
    const response = await fetch('https://graphene-backend.onrender.com/api/payment/methods');
    const data = await response.json();
    
    console.log('\n📊 Raw Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.data.paymentMethods) {
      const paypalMethod = data.data.paymentMethods.find(method => method.type === 'paypal');
      
      if (paypalMethod) {
        console.log('\n💳 PayPal Method Found:');
        console.log(`✅ Enabled: ${paypalMethod.enabled}`);
        console.log(`🔑 Client ID: ${paypalMethod.clientId || 'NOT PRESENT'}`);
        
        if (!paypalMethod.clientId) {
          console.log('\n❌ Issue: PayPal client ID is missing from the response');
          console.log('🔧 This means either:');
          console.log('   1. PAYPAL_CLIENT_ID environment variable is not set');
          console.log('   2. Backend code hasn\'t been deployed with clientId field');
          console.log('   3. PayPal client initialization failed');
        } else {
          console.log('\n✅ PayPal configuration looks good!');
        }
      } else {
        console.log('\n❌ PayPal payment method not found in response');
      }
    } else {
      console.log('\n❌ Invalid response structure');
    }

  } catch (error) {
    console.log(`\n❌ Error testing PayPal config: ${error.message}`);
  }

  console.log('\n🏁 PayPal configuration test completed!');
};

// Run the test
testPayPalConfig().catch(console.error);