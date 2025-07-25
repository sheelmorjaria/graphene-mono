import dotenv from 'dotenv';
import PayPalService from '../services/paypalService.js';

dotenv.config();

const testPayPalSandbox = async () => {
  console.log('🧪 Testing PayPal Sandbox Configuration');
  console.log('=====================================');
  
  // Check environment variables
  console.log('📋 Environment Configuration:');
  console.log(`   PAYPAL_ENVIRONMENT: ${process.env.PAYPAL_ENVIRONMENT || 'NOT SET'}`);
  console.log(`   PAYPAL_CLIENT_ID: ${process.env.PAYPAL_CLIENT_ID ? 'SET (' + process.env.PAYPAL_CLIENT_ID.substring(0, 10) + '...)' : 'NOT SET'}`);
  console.log(`   PAYPAL_CLIENT_SECRET: ${process.env.PAYPAL_CLIENT_SECRET ? 'SET (*****)' : 'NOT SET'}`);
  console.log(`   ENABLE_PAYPAL_PAYMENTS: ${process.env.ENABLE_PAYPAL_PAYMENTS || 'NOT SET'}`);
  
  // Check if using sandbox
  const isSandbox = process.env.PAYPAL_ENVIRONMENT !== 'live';
  console.log(`\n🌐 PayPal Environment: ${isSandbox ? 'SANDBOX ✅' : 'LIVE ⚠️'}`);
  console.log(`   Base URL: ${isSandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'}`);
  
  if (!isSandbox) {
    console.log('⚠️  WARNING: You are using LIVE PayPal environment!');
    console.log('   To switch to sandbox, set PAYPAL_ENVIRONMENT=sandbox');
    return;
  }
  
  // Test authentication
  console.log('\n🔐 Testing PayPal Authentication:');
  try {
    const accessToken = await PayPalService.getAccessToken();
    console.log('   ✅ Successfully authenticated with PayPal');
    console.log(`   🎫 Access token obtained: ${accessToken.substring(0, 20)}...`);
  } catch (error) {
    console.log('   ❌ Failed to authenticate with PayPal');
    console.log(`   Error: ${error.message}`);
    console.log('\n💡 Common issues:');
    console.log('   1. Invalid Client ID or Client Secret');
    console.log('   2. Credentials are for wrong environment (sandbox vs live)');
    console.log('   3. Network connectivity issues');
    return;
  }
  
  // Test creating a test order
  console.log('\n💳 Testing PayPal Order Creation:');
  try {
    const testOrder = await PayPalService.createOrder(10.99, 'GBP', 'test-order-123');
    console.log('   ✅ Successfully created test order');
    console.log(`   📦 Order ID: ${testOrder.id}`);
    console.log(`   💰 Amount: £${testOrder.purchase_units[0].amount.value}`);
    console.log(`   🔗 Approval URL: ${testOrder.links.find(link => link.rel === 'approve')?.href || 'Not found'}`);
    
    // Test getting order details
    console.log('\n📋 Testing Order Details Retrieval:');
    const orderDetails = await PayPalService.getOrderDetails(testOrder.id);
    console.log('   ✅ Successfully retrieved order details');
    console.log(`   📊 Status: ${orderDetails.status}`);
    console.log(`   🎯 Intent: ${orderDetails.intent}`);
    
  } catch (error) {
    console.log('   ❌ Failed to create test order');
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('\n📝 Sandbox Testing Instructions:');
  console.log('===============================');
  console.log('1. Your PayPal is configured for SANDBOX mode ✅');
  console.log('2. You can use PayPal\'s test accounts for payments:');
  console.log('   • Personal (Buyer): sb-buyer@personal.example.com');
  console.log('   • Password: password123');
  console.log('3. Or create test accounts at: https://developer.paypal.com/developer/accounts');
  console.log('4. Payments made in sandbox are NOT real transactions');
  console.log('5. Test the full checkout flow with sandbox accounts');
  
  console.log('\n🔄 To switch back to LIVE mode later:');
  console.log('   Set PAYPAL_ENVIRONMENT=live in your .env file');
  console.log('   ⚠️  Make sure to use LIVE credentials when switching!');
};

testPayPalSandbox().catch(console.error);