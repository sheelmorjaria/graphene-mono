import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';

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
  console.log('🔍 Checking Order Status After BTC Confirmation\n');

  const orderId = '68842e60db0d322fa8adb77c';
  const bitcoinAddress = 'bc1qytdnr3p7pqvks7gtaaut74tz8wrzgmmyalynvk';

  try {
    // 1. Check if order still exists
    console.log('1️⃣ Checking if order exists in database...');
    const order = await Order.findById(orderId);
    
    if (!order) {
      console.log('❌ ORDER NOT FOUND IN DATABASE!');
      console.log('   This explains the "order could not be found" error');
      
      // Check if order was moved or deleted
      console.log('\n   🔍 Searching for any trace of this order...');
      
      // Search by Bitcoin address
      const orderByAddress = await Order.findOne({
        'paymentDetails.bitcoinAddress': bitcoinAddress
      });
      
      if (orderByAddress) {
        console.log('   ✅ Found order by Bitcoin address:', orderByAddress._id);
        console.log('   ⚠️  Order ID mismatch! Frontend looking for wrong ID');
      } else {
        console.log('   ❌ No order found by Bitcoin address either');
      }
      
      return;
    }

    console.log('✅ Order exists in database');
    console.log(`   Order ID: ${order._id}`);
    console.log(`   Payment Status: ${order.paymentStatus}`);
    console.log(`   Order Status: ${order.status}`);
    console.log(`   Bitcoin Address: ${order.paymentDetails?.bitcoinAddress}`);
    console.log(`   Confirmations: ${order.paymentDetails?.bitcoinConfirmations}`);
    console.log(`   Last Updated: ${order.updatedAt}`);

    // 2. Check if Payment record was created
    console.log('\n2️⃣ Checking Payment records...');
    const payments = await Payment.find({ order: orderId });
    
    if (payments.length === 0) {
      console.log('   ⚠️  No Payment record found');
      console.log('   This suggests confirmation webhook didn\'t complete properly');
    } else {
      console.log(`   ✅ Found ${payments.length} Payment record(s)`);
      payments.forEach((payment, i) => {
        console.log(`   Payment ${i + 1}:`);
        console.log(`      ID: ${payment._id}`);
        console.log(`      Status: ${payment.status}`);
        console.log(`      Amount: £${payment.amount}`);
        console.log(`      Transaction: ${payment.transactionId}`);
      });
    }

    // 3. Check the current order status logic
    console.log('\n3️⃣ Analyzing order status...');
    
    if (order.paymentStatus === 'completed' && order.status === 'processing') {
      console.log('   ✅ Order properly confirmed and processing');
    } else if (order.paymentStatus === 'completed' && order.status !== 'processing') {
      console.log('   ⚠️  Payment completed but order status not updated');
    } else {
      console.log('   ❌ Payment not properly confirmed');
      console.log(`      Payment Status: ${order.paymentStatus}`);
      console.log(`      Order Status: ${order.status}`);
    }

    // 4. Check what frontend endpoints might be failing
    console.log('\n4️⃣ Frontend access scenarios...');
    console.log('   Frontend might be trying to access:');
    console.log(`   - Bitcoin payment page: /payment/bitcoin/${orderId}`);
    console.log(`   - Order confirmation: /order-confirmation/${orderId}`);
    console.log(`   - Order status API: /api/payment/bitcoin/status/${orderId}`);

  } catch (error) {
    console.error('❌ Error checking order:', error.message);
  }
};

const checkCommonIssues = async () => {
  console.log('\n5️⃣ Common Issues After BTC Confirmation:');
  
  console.log('\n   A. Order ID Mismatch:');
  console.log('      - Frontend using old/cached order ID');
  console.log('      - Order ID changed during processing');
  console.log('      - Browser cached old order data');
  
  console.log('\n   B. Order State Changes:');
  console.log('      - Order moved to different collection');
  console.log('      - Order archived after completion');
  console.log('      - Order deleted by cleanup process');
  
  console.log('\n   C. Frontend Routing Issues:');
  console.log('      - Redirect logic broken after payment confirmation');
  console.log('      - Wrong order ID in URL parameters');
  console.log('      - Authentication issues accessing order');
  
  console.log('\n   D. API Access Issues:');
  console.log('      - CORS blocking order status requests');
  console.log('      - Order API returning wrong error');
  console.log('      - Order not accessible due to user mismatch');
};

const suggestSolutions = () => {
  console.log('\n6️⃣ Recommended Solutions:');
  
  console.log('\n   1. Check Browser Console:');
  console.log('      - Look for specific API error messages');
  console.log('      - Check Network tab for failed requests');
  console.log('      - Verify order ID in URL');
  
  console.log('\n   2. Clear Browser Cache:');
  console.log('      - Hard refresh (Ctrl+F5)');
  console.log('      - Clear browser storage');
  console.log('      - Try incognito mode');
  
  console.log('\n   3. Test Order Access:');
  console.log('      - Try order confirmation URL directly');
  console.log('      - Test order status API endpoint');
  console.log('      - Check if order exists in admin panel');
  
  console.log('\n   4. Check Webhook Processing:');
  console.log('      - Verify webhook completed successfully');
  console.log('      - Check if order was properly updated');
  console.log('      - Ensure Payment record was created');
};

const main = async () => {
  await connectDB();
  await checkOrderStatus();
  await checkCommonIssues();
  suggestSolutions();
  await mongoose.connection.close();
  console.log('\n🔌 Database connection closed');
};

main().catch(console.error);