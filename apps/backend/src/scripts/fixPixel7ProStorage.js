import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

async function fixPixel7ProStorage() {
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
    console.log('  Before fix - Available Storage:', pixel7Pro.getAvailableStorage());
    
    // Fix all variations: change "12GB" to "128GB"
    let fixedCount = 0;
    pixel7Pro.variations.forEach((variation, index) => {
      if (variation.storage === '12GB') {
        console.log(`  ✅ Fixing variation ${index + 1}: ${variation.condition} ${variation.color} - 12GB → 128GB`);
        variation.storage = '128GB';
        fixedCount++;
      }
    });
    
    if (fixedCount > 0) {
      // Save the updated product
      await pixel7Pro.save();
      console.log(`\n💾 Fixed ${fixedCount} variations`);
      
      // Verify the update
      const updatedPixel7Pro = await Product.findOne({ slug: 'grapheneos-pixel-7-pro' });
      const storageOptions = updatedPixel7Pro.getAvailableStorage();
      console.log('\n📊 After fix - Available Storage:', storageOptions);
      
      // Show updated variations
      console.log('\n📦 Updated Variations:');
      updatedPixel7Pro.variations.forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.condition} - ${v.color} - ${v.storage} - £${v.price}`);
      });
    } else {
      console.log('\n✅ No variations needed fixing');
    }

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPixel7ProStorage();