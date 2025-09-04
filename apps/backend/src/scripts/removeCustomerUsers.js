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

// Remove all customer users
const removeCustomerUsers = async () => {
  try {
    console.log('\n🔍 Analyzing users in database...\n');
    
    // Count total users
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users in database: ${totalUsers}`);
    
    // Count customer users
    const customerUsers = await User.countDocuments({ role: 'customer' });
    console.log(`👥 Customer users to remove: ${customerUsers}`);
    
    // Count admin users
    const adminUsers = await User.countDocuments({ role: 'admin' });
    console.log(`🔐 Admin users (will be kept): ${adminUsers}`);
    
    if (customerUsers === 0) {
      console.log('\n✨ No customer users to remove.');
      return;
    }
    
    // Show sample of customer users that will be removed
    const sampleCustomers = await User.find({ role: 'customer' })
      .select('email firstName lastName createdAt')
      .limit(5);
    
    console.log('\n📋 Sample of customer users to be removed:');
    sampleCustomers.forEach(user => {
      console.log(`   - ${user.email} (${user.firstName} ${user.lastName})`);
    });
    
    if (customerUsers > 5) {
      console.log(`   ... and ${customerUsers - 5} more`);
    }
    
    // Check for orders associated with customer users
    const customerUserIds = await User.find({ role: 'customer' }).select('_id');
    const customerIds = customerUserIds.map(u => u._id);
    const relatedOrders = await Order.countDocuments({ userId: { $in: customerIds } });
    
    if (relatedOrders > 0) {
      console.log(`\n⚠️  Warning: Found ${relatedOrders} orders associated with customer users.`);
      console.log('   These orders will become orphaned after user removal.');
    }
    
    // Prompt for confirmation
    console.log('\n⚠️  This action will permanently delete all customer users.');
    console.log('   Admin users will NOT be affected.');
    console.log('\n   Press Ctrl+C to cancel, or wait 5 seconds to proceed...');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Perform the deletion
    console.log('\n🗑️  Removing customer users...');
    const result = await User.deleteMany({ role: 'customer' });
    
    console.log(`\n✅ Successfully removed ${result.deletedCount} customer users.`);
    
    // Verify final state
    const remainingUsers = await User.countDocuments();
    const remainingAdmins = await User.countDocuments({ role: 'admin' });
    console.log('\n📊 Final database state:');
    console.log(`   - Total users remaining: ${remainingUsers}`);
    console.log(`   - Admin users: ${remainingAdmins}`);
    
    // Optional: Clean up orphaned data
    if (relatedOrders > 0) {
      console.log('\n🧹 Cleaning up orphaned orders...');
      const orphanResult = await Order.deleteMany({ userId: { $in: customerIds } });
      console.log(`   Removed ${orphanResult.deletedCount} orphaned orders.`);
    }
    
  } catch (error) {
    console.error('\n❌ Error removing customer users:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    console.log('🚀 Starting customer user removal script...');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Database: ${process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'local'}`);
    
    await connectDB();
    await removeCustomerUsers();
    
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
};

// Run the script
main();