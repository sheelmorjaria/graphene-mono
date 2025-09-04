import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

const clearProducts = async () => {
  try {
    console.log('🟡 Connecting to database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/graphene-store');
    console.log('✅ Connected to database');

    // Get counts before deletion
    const productCount = await Product.countDocuments();
    const cartCount = await Cart.countDocuments();
    
    console.log('📊 Current database state:');
    console.log(`   - Products: ${productCount}`);
    console.log(`   - Carts with items: ${cartCount}`);

    if (productCount === 0) {
      console.log('ℹ️  No products found in database. Nothing to clear.');
      process.exit(0);
    }

    console.log('\n🔄 Starting cleanup process...');

    // Step 1: Clear all cart items (since they reference products)
    console.log('1️⃣ Clearing cart items...');
    const cartUpdateResult = await Cart.updateMany(
      {},
      { 
        $set: { 
          items: [],
          totalItems: 0,
          totalAmount: 0,
          lastModified: new Date()
        }
      }
    );
    console.log(`   ✅ Updated ${cartUpdateResult.modifiedCount} carts`);

    // Step 2: Delete all products
    console.log('2️⃣ Deleting all products...');
    const productDeleteResult = await Product.deleteMany({});
    console.log(`   ✅ Deleted ${productDeleteResult.deletedCount} products`);

    // Step 3: Verify cleanup
    const remainingProducts = await Product.countDocuments();
    const remainingCartItems = await Cart.countDocuments({ 'items.0': { $exists: true } });

    console.log('\n📊 Cleanup complete! Final state:');
    console.log(`   - Products remaining: ${remainingProducts}`);
    console.log(`   - Carts with items: ${remainingCartItems}`);

    if (remainingProducts === 0) {
      console.log('🎉 All products successfully cleared from database!');
    } else {
      console.log('⚠️  Some products may still remain. Please check manually.');
    }

  } catch (error) {
    console.error('❌ Error clearing products:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
    process.exit(0);
  }
};

// Add confirmation prompt
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  WARNING: This will permanently delete ALL products from the database!');
console.log('⚠️  This action cannot be undone!');
console.log('⚠️  All cart items will also be cleared.');

rl.question('\nAre you sure you want to continue? Type "yes" to confirm: ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    console.log('\n🚀 Starting product cleanup...\n');
    rl.close();
    clearProducts();
  } else {
    console.log('❌ Operation cancelled.');
    rl.close();
    process.exit(0);
  }
});