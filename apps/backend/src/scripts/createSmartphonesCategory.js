import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
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

// Create Smartphones category and assign products
const createSmartphonesCategory = async () => {
  try {
    console.log('\n📱 Creating Smartphones category...\n');
    
    // Check if category already exists
    let smartphonesCategory = await Category.findOne({ slug: 'smartphones' });
    
    if (smartphonesCategory) {
      console.log('📂 Smartphones category already exists:', smartphonesCategory.name);
    } else {
      // Create the category
      smartphonesCategory = new Category({
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'GrapheneOS-compatible smartphones for privacy and security',
        isActive: true,
        sortOrder: 1,
        seoTitle: 'Privacy Smartphones with GrapheneOS - Secure Mobile Devices',
        seoDescription: 'Shop GrapheneOS-compatible smartphones for ultimate privacy and security. Pre-installed with privacy-focused Android OS.',
        seoKeywords: ['smartphones', 'grapheneos', 'privacy phones', 'secure phones', 'android privacy']
      });
      
      await smartphonesCategory.save();
      console.log('✅ Created Smartphones category:', smartphonesCategory.name);
    }
    
    // Find all existing products
    const products = await Product.find({});
    console.log(`\n📦 Found ${products.length} products in database:`);
    
    let assignedCount = 0;
    
    for (const product of products) {
      console.log(`   - ${product.name} (${product.slug})`);
      
      // Check if product already has a category
      if (!product.category || product.category.toString() !== smartphonesCategory._id.toString()) {
        // Assign to Smartphones category
        product.category = smartphonesCategory._id;
        await product.save();
        assignedCount++;
        console.log(`     ✓ Assigned to Smartphones category`);
      } else {
        console.log(`     → Already in correct category`);
      }
    }
    
    console.log(`\n✅ Successfully assigned ${assignedCount} products to Smartphones category`);
    
    // Verify the assignments
    const productsInCategory = await Product.countDocuments({ category: smartphonesCategory._id });
    console.log(`📊 Total products in Smartphones category: ${productsInCategory}`);
    
    // Display category info
    console.log(`\n📂 Category Details:`);
    console.log(`   ID: ${smartphonesCategory._id}`);
    console.log(`   Name: ${smartphonesCategory.name}`);
    console.log(`   Slug: ${smartphonesCategory.slug}`);
    console.log(`   Products: ${productsInCategory}`);
    
  } catch (error) {
    console.error('\n❌ Error creating category and assigning products:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    console.log('🏷️  Create Smartphones Category Script');
    console.log('━'.repeat(50));
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Database: ${process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'local'}`);
    console.log('━'.repeat(50));
    
    await connectDB();
    await createSmartphonesCategory();
    
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
};

// Run the script
main();