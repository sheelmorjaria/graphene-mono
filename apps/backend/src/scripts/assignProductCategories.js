import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

dotenv.config();

async function assignProductCategories() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\\n');

    // Get the smartphones category
    const smartphonesCategory = await Category.findOne({ slug: 'smartphones' });
    if (!smartphonesCategory) {
      console.log('❌ Smartphones category not found');
      return;
    }

    console.log(`📱 Found smartphones category: ${smartphonesCategory.name} (${smartphonesCategory._id})`);

    // Find all uncategorized products (assuming all current products are smartphones)
    const uncategorizedProducts = await Product.find({ category: { $exists: false } });
    
    console.log(`\\n📦 Found ${uncategorizedProducts.length} uncategorized products:`);
    uncategorizedProducts.forEach((product, i) => {
      console.log(`   ${i + 1}. ${product.name}`);
    });

    if (uncategorizedProducts.length === 0) {
      console.log('✅ No uncategorized products found');
      return;
    }

    // Update all uncategorized products to be smartphones
    console.log('\\n🔄 Assigning all products to smartphones category...');
    const updateResult = await Product.updateMany(
      { category: { $exists: false } },
      { $set: { category: smartphonesCategory._id } }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} products`);

    // Verify the update
    console.log('\\n🔍 Verification:');
    const smartphoneProducts = await Product.find({ category: smartphonesCategory._id });
    console.log(`   Products in smartphones category: ${smartphoneProducts.length}`);
    
    const remainingUncategorized = await Product.find({ category: { $exists: false } });
    console.log(`   Remaining uncategorized products: ${remainingUncategorized.length}`);

    await mongoose.disconnect();
    console.log('\\n✓ Disconnected from MongoDB');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

assignProductCategories();