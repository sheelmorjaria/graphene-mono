import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import bitcoinService from '../services/bitcoinService.js';

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

const debugWebhook = async () => {
  console.log('🔍 Debugging Blockonomics Webhook Issue\n');

  // Webhook data from the URL
  const webhookData = {
    addr: 'bc1qytdnr3p7pqvks7gtaaut74tz8wrzgmmyalynvk',
    status: '1',
    crypto: 'BTC',
    txid: 'WarningThisIsAGeneratedTestPaymentAndNotARealBitcoinTransaction',
    value: '363525'
  };

  console.log('📋 Webhook Data:');
  console.log(`   Address: ${webhookData.addr}`);
  console.log(`   Status: ${webhookData.status} (1 = Partially Confirmed)`);
  console.log(`   Value: ${webhookData.value} satoshis`);
  console.log(`   BTC Amount: ${webhookData.value / 100000000} BTC`);
  console.log(`   TxID: ${webhookData.txid}`);

  // Step 1: Check if order exists for this Bitcoin address
  console.log('\n1️⃣ Searching for order with this Bitcoin address...');
  
  try {
    const order = await Order.findOne({
      'paymentDetails.bitcoinAddress': webhookData.addr,
      'paymentMethod.type': 'bitcoin'
    });

    if (!order) {
      console.log('   ❌ No order found for Bitcoin address:', webhookData.addr);
      console.log('   💡 This explains why payment shows as "waiting"');
      
      // Let's check what Bitcoin addresses exist in the database
      console.log('\n   📊 Checking existing Bitcoin orders...');
      const bitcoinOrders = await Order.find({
        'paymentMethod.type': 'bitcoin',
        'paymentDetails.bitcoinAddress': { $exists: true }
      }).limit(5).select('_id paymentDetails.bitcoinAddress paymentStatus totalAmount');

      if (bitcoinOrders.length === 0) {
        console.log('   ⚠️  No Bitcoin orders with addresses found in database');
      } else {
        console.log('   Found Bitcoin orders:');
        bitcoinOrders.forEach((o, i) => {
          console.log(`   ${i + 1}. Order ${o._id}`);
          console.log(`      Address: ${o.paymentDetails.bitcoinAddress}`);
          console.log(`      Status: ${o.paymentStatus}`);
          console.log(`      Amount: £${o.totalAmount}`);
        });
      }
      
      return;
    }

    console.log('   ✅ Order found!');
    console.log(`   Order ID: ${order._id}`);
    console.log(`   Current Payment Status: ${order.paymentStatus}`);
    console.log(`   Expected BTC Amount: ${order.paymentDetails.bitcoinAmount} BTC`);
    console.log(`   Order Total: £${order.totalAmount}`);

    // Step 2: Simulate webhook processing
    console.log('\n2️⃣ Simulating webhook processing...');
    
    const amountReceived = bitcoinService.satoshisToBtc(parseInt(webhookData.value));
    const expectedAmount = order.paymentDetails.bitcoinAmount;
    const confirmations = parseInt(webhookData.status);

    console.log(`   Amount Received: ${amountReceived} BTC`);
    console.log(`   Expected Amount: ${expectedAmount} BTC`);
    console.log(`   Confirmations: ${confirmations}`);

    // Check payment validation
    const isExpired = bitcoinService.isPaymentExpired(order.paymentDetails.bitcoinPaymentExpiry);
    const isSufficient = bitcoinService.isPaymentSufficient(amountReceived, expectedAmount);
    const isConfirmed = bitcoinService.isPaymentConfirmed(confirmations);

    console.log('\n3️⃣ Payment Validation:');
    console.log(`   ⏰ Expired: ${isExpired}`);
    console.log(`   💰 Sufficient Amount: ${isSufficient}`);
    console.log(`   ✅ Confirmed (2+ confirmations): ${isConfirmed}`);

    // Determine what status the order would get
    let newStatus;
    if (isExpired) {
      newStatus = 'expired';
    } else if (!isSufficient) {
      newStatus = 'underpaid';
    } else if (isConfirmed) {
      newStatus = 'completed';
    } else {
      newStatus = 'awaiting_confirmation';
    }

    console.log(`\n   🎯 Order would be updated to: ${newStatus}`);
    
    if (newStatus === 'awaiting_confirmation') {
      console.log('   💡 This is why it shows "waiting for payment"');
      console.log('   📋 Need 2 confirmations, currently have:', confirmations);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

const checkProductionIssues = () => {
  console.log('\n4️⃣ Common Production Issues:');
  console.log('   1. Order was created with a different Bitcoin address');
  console.log('   2. Order doesn\'t exist yet (webhook received before order creation)');
  console.log('   3. Bitcoin address in database doesn\'t match webhook address');
  console.log('   4. Payment amount doesn\'t match expected amount');
  console.log('   5. Order is in wrong state (not pending payment)');
  
  console.log('\n5️⃣ Recommendations:');
  console.log('   1. Create a new test order and note the Bitcoin address');
  console.log('   2. Use that exact address in Blockonomics test');
  console.log('   3. Ensure order is in "pending" payment status');
  console.log('   4. Check production logs for exact error messages');
};

const main = async () => {
  await connectDB();
  await debugWebhook();
  checkProductionIssues();
  await mongoose.connection.close();
  console.log('\n🔌 Database connection closed');
};

main().catch(console.error);