import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js'; // Import Product model
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Connect to MongoDB
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

// Test categories query
const testCategoriesQuery = async () => {
  try {
    console.log('\n🔍 Testing categories query...\n');
    
    // Test basic find
    const allCategories = await Category.find();
    console.log(`📊 Total categories found: ${allCategories.length}`);
    
    if (allCategories.length > 0) {
      console.log('\n📂 Categories in database:');
      allCategories.forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.name} (${category.slug})`);
        console.log(`      ID: ${category._id}`);
        console.log(`      Active: ${category.isActive}`);
        console.log(`      Created: ${category.createdAt}`);
        console.log('');
      });
    }
    
    // Test the exact same query as admin controller
    console.log('🔍 Testing admin controller query...\n');
    
    const categoriesWithPopulate = await Category.find()
      .populate('parentId', 'name slug')
      .sort({ name: 1 })
      .lean();
    
    console.log(`📊 Admin query found: ${categoriesWithPopulate.length} categories`);
    
    if (categoriesWithPopulate.length > 0) {
      console.log('\n📂 Admin query results:');
      categoriesWithPopulate.forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.name} (${category.slug})`);
        console.log(`      ID: ${category._id}`);
        console.log(`      Parent: ${category.parentId || 'None'}`);
      });
    }
    
    // Test product count for each category
    console.log('\n📦 Testing product counts...\n');
    
    for (const category of categoriesWithPopulate) {
      try {
        const productCount = await Category.getProductCount(category._id);
        console.log(`   ${category.name}: ${productCount} products`);
      } catch (error) {
        console.error(`   ${category.name}: Error getting product count - ${error.message}`);
      }
    }
    
    // Test collection statistics
    console.log('\n📈 Collection Statistics:');
    const stats = await mongoose.connection.db.collection('categories').stats();
    console.log(`   Documents: ${stats.count}`);
    console.log(`   Size: ${stats.size} bytes`);
    console.log(`   Storage Size: ${stats.storageSize} bytes`);
    
  } catch (error) {
    console.error('\n❌ Error testing categories query:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    console.log('🔬 Categories Query Test');
    console.log('━'.repeat(50));
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Database: ${process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'local'}`);
    console.log('━'.repeat(50));
    
    await connectDB();
    await testCategoriesQuery();
    
    console.log('\n✨ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
};

// Run the test
main();