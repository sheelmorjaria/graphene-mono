import fetch from 'node-fetch';

const testFrontendPaymentStatus = async () => {
  console.log('🔍 Testing Frontend Payment Status Access\n');

  const orderId = '68842e60db0d322fa8adb77c';
  const statusUrl = `https://graphene-backend.onrender.com/api/payment/bitcoin/status/${orderId}`;
  
  console.log('📡 Testing payment status API that frontend uses...');
  console.log(`URL: ${statusUrl}`);

  try {
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://graphene-frontend.onrender.com',
        'User-Agent': 'Frontend/1.0'
      }
    });

    console.log(`\n📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', JSON.stringify(data, null, 2));
      
      const paymentData = data.data;
      
      console.log('\n📋 Payment Status Summary:');
      console.log(`   Order ID: ${paymentData.orderId}`);
      console.log(`   Order Number: ${paymentData.orderNumber}`);
      console.log(`   Payment Status: ${paymentData.paymentStatus}`);
      console.log(`   Bitcoin Confirmations: ${paymentData.bitcoinConfirmations}`);
      console.log(`   Is Confirmed: ${paymentData.isConfirmed}`);
      console.log(`   Is Expired: ${paymentData.isExpired}`);
      
      // Test what the frontend should show
      console.log('\n🎯 Frontend Display Logic:');
      
      if (paymentData.isExpired) {
        console.log('   ❌ Should show: "Payment expired"');
      } else if (paymentData.isConfirmed) {
        console.log('   ✅ Should show: "Payment confirmed!" (SUCCESS)');
        console.log('   🎉 Should redirect to order confirmation or success page');
      } else if (paymentData.bitcoinConfirmations >= 1) {
        console.log('   ⏳ Should show: "Payment received, waiting for confirmations..."');
      } else {
        console.log('   ⏳ Should show: "Waiting for payment..."');
      }
      
    } else {
      const errorText = await response.text();
      console.log(`❌ Error Response: ${errorText}`);
    }

  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
};

const testOrderConfirmationAccess = async () => {
  console.log('\n🔍 Testing Order Confirmation Access\n');

  const orderId = '68842e60db0d322fa8adb77c';
  const orderUrl = `https://graphene-backend.onrender.com/api/orders/${orderId}`;
  
  console.log('📡 Testing order access for confirmation page...');
  console.log(`URL: ${orderUrl}`);

  try {
    const response = await fetch(orderUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://graphene-frontend.onrender.com',
        'User-Agent': 'Frontend/1.0'
      }
    });

    console.log(`📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Order accessible for confirmation page');
      console.log(`   Order Status: ${data.order?.status || data.status}`);
      console.log(`   Payment Status: ${data.order?.paymentStatus || data.paymentStatus}`);
    } else {
      const errorText = await response.text();
      console.log(`❌ Order not accessible: ${errorText}`);
      
      if (response.status === 404) {
        console.log('   🔍 This explains the "order could not be found" error');
      }
    }

  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
};

const main = async () => {
  console.log('🚀 Frontend Payment Status Test');
  console.log('================================\n');
  
  await testFrontendPaymentStatus();
  await testOrderConfirmationAccess();
  
  console.log('\n📝 Summary:');
  console.log('If payment status shows isConfirmed: true, the fix is working!');
  console.log('If order is accessible, the "order not found" error should be resolved.');
};

main().catch(console.error);