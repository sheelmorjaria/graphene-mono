import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

// Load environment variables
dotenv.config();

const checkDatabaseStatus = async () => {
  try {
    console.log('🔍 Checking database status...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/graphene-store';
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');

    // Check categories
    const categories = await Category.find();
    console.log(`\n📂 Categories in database: ${categories.length}`);
    if (categories.length > 0) {
      categories.forEach(cat => {
        console.log(`   - ${cat.name} (slug: ${cat.slug})`);
      });
    }

    // Check products
    const products = await Product.find().populate('category');
    console.log(`\n📱 Products in database: ${products.length}`);
    
    if (products.length > 0) {
      // Group products by category
      const productsByCategory = {};
      products.forEach(product => {
        const categoryName = product.category?.name || 'Uncategorized';
        if (!productsByCategory[categoryName]) {
          productsByCategory[categoryName] = [];
        }
        productsByCategory[categoryName].push(product);
      });

      // Display products by category
      Object.entries(productsByCategory).forEach(([categoryName, categoryProducts]) => {
        console.log(`\n📋 ${categoryName} (${categoryProducts.length} products):`);
        categoryProducts.forEach(product => {
          console.log(`   - ${product.name} (£${product.price})`);
        });
      });
    } else {
      console.log('   Database is empty - no products found');
    }

    console.log('\n✅ Database check completed');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the script if executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  checkDatabaseStatus()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export default checkDatabaseStatus;