import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

dotenv.config();

async function checkCategories() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\\n');

    // Check existing categories
    const categories = await Category.find({}).sort({ name: 1 });
    console.log('📂 Existing Categories:');
    if (categories.length === 0) {
      console.log('   No categories found in database');
    } else {
      categories.forEach((cat, i) => {
        console.log(`   ${i + 1}. ${cat.name} (slug: ${cat.slug})`);
      });
    }

    // Check what category field values exist in products
    console.log('\\n📱 Product Category Analysis:');
    const products = await Product.find({}).populate('category', 'name slug');
    
    const categoryCounts = {};
    const uncategorizedProducts = [];
    
    products.forEach(product => {
      if (product.category) {
        const categoryName = product.category.name || 'Unknown';
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
      } else {
        uncategorizedProducts.push(product.name);
      }
    });

    console.log('\\n📊 Products by Category:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} products`);
    });
    
    if (uncategorizedProducts.length > 0) {
      console.log(`\\n❌ Uncategorized Products (${uncategorizedProducts.length}):`);
      uncategorizedProducts.forEach(name => console.log(`   - ${name}`));
    }

    // Check for the specific categories we need
    console.log('\\n🔍 Checking for Navigation Categories:');
    const smartphonesCategory = await Category.findOne({ slug: 'smartphones' });
    const usbDrivesCategory = await Category.findOne({ slug: 'usb-drives' });
    
    console.log(`   smartphones: ${smartphonesCategory ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   usb-drives: ${usbDrivesCategory ? '✅ EXISTS' : '❌ MISSING'}`);

    if (!smartphonesCategory || !usbDrivesCategory) {
      console.log('\\n💡 Recommendations:');
      if (!smartphonesCategory) {
        console.log('   - Create "smartphones" category or update ProductsDropdown to use existing category slug');
      }
      if (!usbDrivesCategory) {
        console.log('   - Create "usb-drives" category or update ProductsDropdown to use existing category slug');
      }
    }

    await mongoose.disconnect();
    console.log('\\n✓ Disconnected from MongoDB');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCategories();