import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/graphene-store', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Complete database cleanup
const cleanupDatabase = async () => {
  try {
    console.log('\n🔍 Analyzing database contents...\n');
    
    // Count current data
    const totalUsers = await User.countDocuments();
    const customerUsers = await User.countDocuments({ role: 'customer' });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const totalOrders = await Order.countDocuments();
    
    console.log('📊 Current Database Statistics:');
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   - Customer users: ${customerUsers}`);
    console.log(`   - Admin users: ${adminUsers}`);
    console.log(`   Total orders: ${totalOrders}`);
    
    // Calculate total revenue from orders
    const orders = await Order.find({});
    const totalRevenue = orders.reduce((sum, order) => sum + (order.orderTotal || 0), 0);
    console.log(`   Total revenue: £${totalRevenue.toFixed(2)}`);
    
    if (customerUsers === 0 && totalOrders === 0) {
      console.log('\n✨ Database is already clean. No customer data to remove.');
      return;
    }
    
    // Show sample of data to be removed
    if (customerUsers > 0) {
      const sampleCustomers = await User.find({ role: 'customer' })
        .select('email firstName lastName createdAt')
        .limit(3);
      
      console.log('\n👥 Sample customer users to be removed:');
      sampleCustomers.forEach(user => {
        console.log(`   - ${user.email} (${user.firstName} ${user.lastName})`);
      });
      if (customerUsers > 3) {
        console.log(`   ... and ${customerUsers - 3} more`);
      }
    }
    
    if (totalOrders > 0) {
      const sampleOrders = await Order.find({})
        .select('orderNumber customerEmail orderTotal orderStatus createdAt')
        .limit(3);
      
      console.log('\n📦 Sample orders to be removed:');
      sampleOrders.forEach(order => {
        console.log(`   - ${order.orderNumber} | ${order.customerEmail} | £${order.orderTotal} | ${order.orderStatus}`);
      });
      if (totalOrders > 3) {
        console.log(`   ... and ${totalOrders - 3} more`);
      }
    }
    
    // Warning message
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  WARNING: This action will PERMANENTLY delete:');
    console.log(`   - ${customerUsers} customer users`);
    console.log(`   - ${totalOrders} orders`);
    console.log(`   - £${totalRevenue.toFixed(2)} in revenue data`);
    console.log(`   - All associated customer data`);
    console.log('\n   Admin users will be PRESERVED');
    console.log('='.repeat(60));
    console.log('\n   Press Ctrl+C to cancel, or wait 10 seconds to proceed...');
    
    // Wait for confirmation
    for (let i = 10; i > 0; i--) {
      process.stdout.write(`\r   Starting in ${i} seconds... `);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('\n');
    
    // Perform the cleanup
    console.log('🗑️  Starting cleanup process...\n');
    
    // Step 1: Remove all orders
    if (totalOrders > 0) {
      console.log('   📦 Removing orders...');
      const orderResult = await Order.deleteMany({});
      console.log(`      ✓ Removed ${orderResult.deletedCount} orders`);
      console.log(`      ✓ Cleared £${totalRevenue.toFixed(2)} in revenue`);
    }
    
    // Step 2: Remove customer users (preserve admins)
    if (customerUsers > 0) {
      console.log('   👥 Removing customer users...');
      const userResult = await User.deleteMany({ role: 'customer' });
      console.log(`      ✓ Removed ${userResult.deletedCount} customer users`);
    }
    
    // Step 3: Clean up any other collections that might reference users/orders
    // Add other collection cleanups here if needed (e.g., Carts, Reviews, etc.)
    
    // Verify final state
    console.log('\n📊 Final Database State:');
    const finalUsers = await User.countDocuments();
    const finalAdmins = await User.countDocuments({ role: 'admin' });
    const finalOrders = await Order.countDocuments();
    
    console.log(`   Total users remaining: ${finalUsers}`);
    console.log(`   - Admin users preserved: ${finalAdmins}`);
    console.log(`   Total orders remaining: ${finalOrders}`);
    
    console.log('\n✅ Database cleanup completed successfully!');
    console.log('   All customer data and revenue records have been removed.');
    console.log('   Admin accounts have been preserved.');
    
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    console.log('🚀 Database Cleanup Script');
    console.log('━'.repeat(60));
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Database: ${process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'local'}`);
    console.log('━'.repeat(60));
    
    await connectDB();
    await cleanupDatabase();
    
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
};

// Run the script
main();