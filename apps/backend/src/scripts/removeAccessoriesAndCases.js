import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

// Load environment variables
dotenv.config();

const removeAccessoriesAndCases = async () => {
  try {
    console.log('🧹 Starting removal of accessories and cases...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/graphene-store';
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');

    // Find category IDs for accessories and cases
    const categoriesToRemove = await Category.find({
      slug: { $in: ['accessories', 'cases'] }
    });
    
    if (categoriesToRemove.length === 0) {
      console.log('⚠️  No accessories or cases categories found in database');
      return;
    }

    const categoryIds = categoriesToRemove.map(cat => cat._id);
    console.log(`📂 Found ${categoriesToRemove.length} categories to remove:`, 
      categoriesToRemove.map(cat => cat.name).join(', '));

    // Count products before deletion
    const productCountBefore = await Product.countDocuments({
      category: { $in: categoryIds }
    });
    console.log(`📱 Found ${productCountBefore} products in these categories`);

    // List products that will be deleted (for confirmation)
    const productsToDelete = await Product.find({
      category: { $in: categoryIds }
    }).select('name price category');
    
    console.log('\n🗑️  Products to be deleted:');
    productsToDelete.forEach(product => {
      console.log(`   - ${product.name} (£${product.price})`);
    });

    // Confirm deletion
    console.log('\n⚠️  WARNING: This will permanently delete all accessories and cases!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    
    // Wait 5 seconds for user to cancel if needed
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete products
    const deleteResult = await Product.deleteMany({
      category: { $in: categoryIds }
    });
    console.log(`\n✅ Deleted ${deleteResult.deletedCount} products`);

    // Delete the categories themselves
    const categoryDeleteResult = await Category.deleteMany({
      slug: { $in: ['accessories', 'cases'] }
    });
    console.log(`✅ Deleted ${categoryDeleteResult.deletedCount} categories`);

    // Show remaining products
    const remainingProducts = await Product.countDocuments();
    const remainingCategories = await Category.find();
    
    console.log('\n📊 Database status after deletion:');
    console.log(`   Total products remaining: ${remainingProducts}`);
    console.log(`   Categories remaining: ${remainingCategories.map(cat => cat.name).join(', ')}`);

    // List remaining products
    const remainingProductsList = await Product.find()
      .populate('category')
      .select('name price category');
    
    console.log('\n📱 Remaining products (smartphones only):');
    remainingProductsList.forEach(product => {
      console.log(`   - ${product.name} (£${product.price})`);
    });

    console.log('\n✅ Removal completed successfully!');
    
  } catch (error) {
    console.error('❌ Error removing accessories and cases:', error);
    throw error;
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the script if executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  removeAccessoriesAndCases()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export default removeAccessoriesAndCases;