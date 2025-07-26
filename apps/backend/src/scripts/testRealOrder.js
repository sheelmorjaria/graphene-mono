import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fetch from 'node-fetch';
import Order from '../models/Order.js';

// Load environment variables
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

const testWithRealOrder = async () => {
  try {
    // Get the most recent order
    const order = await Order.findOne({}).sort({ createdAt: -1 });
    
    if (!order) {
      console.log('❌ No orders found in database');
      return;
    }
    
    console.log(`📦 Testing with real order: ${order._id}`);
    console.log(`   Email: ${order.customerEmail}`);
    console.log(`   Total: £${order.totalAmount}`);
    console.log(`   Payment Status: ${order.paymentStatus}`);
    
    // Test the Bitcoin initialization API
    console.log('\n🧪 Testing Bitcoin initialization API...');
    
    const response = await fetch('http://localhost:5000/api/payment/bitcoin/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId: order._id.toString() })
    });

    const data = await response.json();
    
    console.log(`📡 Response status: ${response.status}`);
    console.log('📦 Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error(`❌ API call failed: ${data.error || 'Unknown error'}`);
      return false;
    }

    console.log('✅ Bitcoin payment initialization successful with real order!');
    
    // Check the updated order
    const updatedOrder = await Order.findById(order._id);
    console.log('\n📊 Updated order payment details:');
    console.log(`   Payment Status: ${updatedOrder.paymentStatus}`);
    console.log(`   Bitcoin Address: ${updatedOrder.paymentDetails.bitcoinAddress}`);
    console.log(`   Bitcoin Amount: ${updatedOrder.paymentDetails.bitcoinAmount} BTC`);
    
    return true;

  } catch (error) {
    console.error('❌ Error testing with real order:', error.message);
    return false;
  }
};

const main = async () => {
  try {
    await connectDB();
    await testWithRealOrder();
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

main().catch(console.error);