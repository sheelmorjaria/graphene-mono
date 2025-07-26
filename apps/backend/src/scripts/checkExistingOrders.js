import dotenv from 'dotenv';
import mongoose from 'mongoose';
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

const checkOrders = async () => {
  try {
    const orders = await Order.find({}).limit(10).sort({ createdAt: -1 });
    
    console.log(`📊 Found ${orders.length} recent orders:`);
    
    if (orders.length === 0) {
      console.log('   No orders found in database');
      return;
    }
    
    orders.forEach((order, index) => {
      console.log(`\n${index + 1}. Order ID: ${order._id}`);
      console.log(`   Email: ${order.customerEmail}`);
      console.log(`   Total: £${order.totalAmount}`);
      console.log(`   Payment Method: ${order.paymentMethod?.type || 'None'}`);
      console.log(`   Payment Status: ${order.paymentStatus}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Created: ${order.createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking orders:', error);
  }
};

const main = async () => {
  try {
    await connectDB();
    await checkOrders();
  } catch (error) {
    console.error('💥 Script failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

main().catch(console.error);