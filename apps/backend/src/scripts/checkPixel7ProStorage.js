import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

async function checkPixel7ProStorage() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find Pixel 7 Pro
    const pixel7Pro = await Product.findOne({ slug: 'grapheneos-pixel-7-pro' });
    
    if (!pixel7Pro) {
      console.log('❌ Pixel 7 Pro product not found');
      return;
    }

    console.log('📱 Found Pixel 7 Pro product');
    console.log('  Name:', pixel7Pro.name);
    console.log('  Total variations:', pixel7Pro.variations.length);
    console.log('  Available Storage (from method):', pixel7Pro.getAvailableStorage());
    
    console.log('\n📦 Current Storage Values in Variations:');
    pixel7Pro.variations.forEach((v, i) => {
      console.log(`${i+1}. ${v.condition} - ${v.color} - Storage: "${v.storage}" - £${v.price}`);
      console.log(`   SKU: ${v.sku}`);
    });
    
    // Check if any have the wrong "12GB" value
    const wrongStorage = pixel7Pro.variations.filter(v => v.storage === '12GB');
    const correctStorage = pixel7Pro.variations.filter(v => v.storage === '128GB');
    const noStorage = pixel7Pro.variations.filter(v => !v.storage);
    
    console.log('\n🔍 Analysis:');
    console.log(`  Variations with "12GB": ${wrongStorage.length}`);
    console.log(`  Variations with "128GB": ${correctStorage.length}`);
    console.log(`  Variations with no storage set: ${noStorage.length}`);
    
    if (wrongStorage.length > 0) {
      console.log('\n🔧 Need to fix: Change "12GB" to "128GB"');
      console.log('  This appears to be RAM (12GB) incorrectly stored as storage');
    }

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPixel7ProStorage();