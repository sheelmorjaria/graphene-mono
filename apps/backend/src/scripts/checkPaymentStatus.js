import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import fetch from 'node-fetch';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/graphene-store');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkOrderStatus = async () => {
  console.log('🔍 Checking Payment Status After Confirmed Webhook\n');

  const orderId = '68842e60db0d322fa8adb77c';
  const bitcoinAddress = 'bc1qytdnr3p7pqvks7gtaaut74tz8wrzgmmyalynvk';

  try {
    // Check order in database
    console.log('1️⃣ Checking order in database...');
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log('❌ Order not found!');
      return;
    }

    console.log(`✅ Order found:`);
    console.log(`   Order ID: ${order._id}`);
    console.log(`   Payment Status: ${order.paymentStatus}`);
    console.log(`   Order Status: ${order.status}`);
    console.log(`   Bitcoin Address: ${order.paymentDetails?.bitcoinAddress}`);
    console.log(`   Bitcoin Amount Expected: ${order.paymentDetails?.bitcoinAmount} BTC`);
    console.log(`   Bitcoin Amount Received: ${order.paymentDetails?.bitcoinAmountReceived} BTC`);
    console.log(`   Confirmations: ${order.paymentDetails?.bitcoinConfirmations}`);
    console.log(`   Transaction Hash: ${order.paymentDetails?.bitcoinTransactionHash}`);
    console.log(`   Last Updated: ${order.updatedAt}`);

    // Check if payment details were updated
    if (order.paymentDetails?.bitcoinConfirmations >= 2) {
      console.log('\n✅ Payment has 2+ confirmations');
      
      if (order.paymentStatus !== 'completed') {
        console.log('⚠️  BUT payment status is not "completed"!');
        console.log('   This suggests the webhook didn\'t update the order properly');
      }
      
      if (order.status !== 'processing') {
        console.log('⚠️  AND order status is not "processing"!');
      }
    }

    // Test the payment status API endpoint
    console.log('\n2️⃣ Testing payment status API endpoint...');
    const statusUrl = `https://graphene-backend.onrender.com/api/payment/bitcoin/status/${orderId}`;
    
    try {
      const response = await fetch(statusUrl, {
        headers: {
          'Accept': 'application/json',
          'Origin': 'https://graphene-frontend.onrender.com'
        }
      });

      console.log(`   API Response Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   API Response:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('   API Error:', errorText);
      }
    } catch (error) {
      console.log(`   ❌ API call failed: ${error.message}`);
    }

    // Simulate what should happen with confirmed webhook
    console.log('\n3️⃣ What should happen with status=2 webhook:');
    console.log('   - bitcoinConfirmations should be >= 2');
    console.log('   - paymentStatus should be "completed"');
    console.log('   - order status should be "processing"');
    console.log('   - Payment record should be created');

    // Check for any webhook processing issues
    console.log('\n4️⃣ Possible issues:');
    if (order.paymentStatus === 'awaiting_confirmation' && order.paymentDetails?.bitcoinConfirmations < 2) {
      console.log('   ❌ Webhook with status=2 was not processed');
      console.log('   - Check if webhook URL was called');
      console.log('   - Check Render logs for webhook processing');
      console.log('   - Verify webhook returned 200 OK');
    }

    if (!order.paymentDetails?.bitcoinTransactionHash) {
      console.log('   ⚠️  Transaction hash not set - webhook may not have been received');
    }

  } catch (error) {
    console.error('❌ Error checking order:', error.message);
  }
};

const simulateConfirmedWebhook = () => {
  console.log('\n5️⃣ To manually trigger confirmed payment:');
  console.log('Send this webhook with status=2:');
  console.log(`
curl -X GET "https://graphene-backend.onrender.com/api/payment/bitcoin/webhook?addr=bc1qytdnr3p7pqvks7gtaaut74tz8wrzgmmyalynvk&status=2&crypto=BTC&txid=WarningThisIsAGeneratedTestPaymentAndNotARealBitcoinTransaction&value=363525&confirmations=2"
`);
  
  console.log('\nOr use Blockonomics test tool with:');
  console.log('- Status: 2 (Confirmed)');
  console.log('- Address: bc1qytdnr3p7pqvks7gtaaut74tz8wrzgmmyalynvk');
  console.log('- Amount: 363525 satoshis');
};

const main = async () => {
  await connectDB();
  await checkOrderStatus();
  simulateConfirmedWebhook();
  await mongoose.connection.close();
  console.log('\n🔌 Database connection closed');
};

main().catch(console.error);