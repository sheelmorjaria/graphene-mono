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

const createTestOrder = async () => {
  try {
    const testOrder = new Order({
      userId: new mongoose.Types.ObjectId(),
      customerEmail: 'test@example.com',
      items: [{
        productId: new mongoose.Types.ObjectId(),
        productName: 'Test Product',
        productSlug: 'test-product',
        quantity: 1,
        unitPrice: 299.99,
        totalPrice: 299.99
      }],
      subtotal: 299.99,
      shipping: 9.99,
      totalAmount: 309.98,
      shippingAddress: {
        fullName: 'Test User',
        addressLine1: '123 Test St',
        city: 'London',
        stateProvince: 'England',
        postalCode: 'SW1A 1AA',
        country: 'United Kingdom'
      },
      billingAddress: {
        fullName: 'Test User',
        addressLine1: '123 Test St',
        city: 'London',
        stateProvince: 'England',
        postalCode: 'SW1A 1AA',
        country: 'United Kingdom'
      },
      shippingMethod: {
        id: new mongoose.Types.ObjectId(),
        name: 'Standard Shipping',
        cost: 9.99
      },
      paymentMethod: {
        type: 'bitcoin',
        name: 'Bitcoin'
      },
      paymentDetails: {},
      paymentStatus: 'pending',
      status: 'pending'
    });

    await testOrder.save();
    console.log(`✅ Test order created: ${testOrder._id}`);
    return testOrder._id;

  } catch (error) {
    console.error('❌ Error creating test order:', error);
    throw error;
  }
};

const testBitcoinInitAPI = async (orderId) => {
  try {
    console.log('\n🧪 Testing Bitcoin initialization API endpoint...');
    
    const response = await fetch('http://localhost:5000/api/payment/bitcoin/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId: orderId.toString() })
    });

    const data = await response.json();
    
    console.log(`📡 Response status: ${response.status}`);
    console.log('📦 Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error(`❌ API call failed: ${data.error || 'Unknown error'}`);
      return false;
    }

    console.log('✅ Bitcoin payment initialization successful!');
    return true;

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    return false;
  }
};

const cleanupTestOrder = async (orderId) => {
  try {
    await Order.findByIdAndDelete(orderId);
    console.log('🧹 Test order cleaned up');
  } catch (error) {
    console.error('⚠️  Error cleaning up test order:', error);
  }
};

const main = async () => {
  let orderId = null;
  
  try {
    await connectDB();
    
    // Create test order
    orderId = await createTestOrder();
    
    // Wait a moment for server to be ready
    console.log('⏳ Waiting for server to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test the API
    const success = await testBitcoinInitAPI(orderId);
    
    if (success) {
      console.log('\n🎉 Bitcoin API test passed!');
    } else {
      console.log('\n❌ Bitcoin API test failed!');
    }
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
  } finally {
    if (orderId) {
      await cleanupTestOrder(orderId);
    }
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Check if server is running first
const checkServer = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/payment/methods');
    if (response.ok) {
      console.log('✅ Server is running');
      return true;
    }
  } catch (error) {
    console.log('❌ Server is not running. Please start it first with: npm start');
    return false;
  }
};

// Run the test
const runTest = async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await main();
  } else {
    process.exit(1);
  }
};

runTest().catch(console.error);