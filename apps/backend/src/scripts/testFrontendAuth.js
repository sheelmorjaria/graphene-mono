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

const testFrontendConfig = async () => {
  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server connectivity...');
    const healthResponse = await fetch('http://localhost:5000/health');
    console.log(`   📡 Health check status: ${healthResponse.status}`);
    
    if (!healthResponse.ok) {
      throw new Error('Server not responding');
    }
    
    const healthData = await healthResponse.json();
    console.log(`   ✅ Server is running (${healthData.status})`);

    // Test 2: Test payment methods endpoint (public)
    console.log('\n2️⃣ Testing payment methods endpoint...');
    const methodsResponse = await fetch('http://localhost:5000/api/payment/methods');
    console.log(`   📡 Payment methods status: ${methodsResponse.status}`);
    
    if (methodsResponse.ok) {
      const methodsData = await methodsResponse.json();
      console.log(`   ✅ Found ${methodsData.data.paymentMethods.length} payment methods`);
      
      const bitcoinEnabled = methodsData.data.paymentMethods.find(m => m.type === 'bitcoin');
      console.log(`   ₿ Bitcoin enabled: ${bitcoinEnabled ? 'Yes' : 'No'}`);
    }

    // Test 3: Get a real order from database
    console.log('\n3️⃣ Testing with real order...');
    const order = await Order.findOne({ 
      'paymentMethod.type': 'bitcoin',
      'paymentStatus': 'pending'
    }).sort({ createdAt: -1 });
    
    if (!order) {
      console.log('   ⚠️  No Bitcoin orders found in database');
      return;
    }
    
    console.log(`   📦 Found order: ${order._id}`);
    console.log(`   💷 Total: £${order.totalAmount}`);
    console.log(`   📧 Email: ${order.customerEmail}`);

    // Test 4: Test Bitcoin initialization (without auth - should work with optionalAuth)
    console.log('\n4️⃣ Testing Bitcoin initialization without auth...');
    const initResponse = await fetch('http://localhost:5000/api/payment/bitcoin/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId: order._id.toString() })
    });

    console.log(`   📡 Bitcoin init status: ${initResponse.status}`);
    const initData = await initResponse.json();
    
    if (initResponse.ok) {
      console.log('   ✅ Bitcoin initialization successful!');
      console.log(`   ₿ Address: ${initData.data.bitcoinAddress}`);
      console.log(`   💰 Amount: ${initData.data.bitcoinAmount} BTC`);
    } else {
      console.log('   ❌ Bitcoin initialization failed:');
      console.log(`   📝 Error: ${initData.error || 'Unknown error'}`);
    }

    console.log('\n🎉 Frontend configuration test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

const main = async () => {
  try {
    await connectDB();
    await testFrontendConfig();
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

main().catch(console.error);