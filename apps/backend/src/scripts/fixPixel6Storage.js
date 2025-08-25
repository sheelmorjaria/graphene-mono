import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

async function fixPixel6Storage() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find Pixel 6 product
    const pixel6 = await Product.findOne({ slug: 'pixel-6' });
    
    if (!pixel6) {
      console.log('❌ Pixel 6 product not found');
      return;
    }

    console.log('📱 Found Pixel 6 product');
    console.log('  Current variations:', pixel6.variations.length);

    // Update storage field based on SKU patterns
    let updatedCount = 0;
    
    pixel6.variations.forEach((variation, index) => {
      const sku = variation.sku;
      console.log(`\nChecking variation ${index + 1}:`);
      console.log(`  SKU: ${sku}`);
      console.log(`  Current storage: ${variation.storage || 'Not set'}`);
      
      // Determine storage based on SKU pattern
      if (sku.includes('-256-')) {
        variation.storage = '256GB';
        console.log(`  ✅ Setting storage to 256GB`);
        updatedCount++;
      } else if (sku.includes('-128-')) {
        variation.storage = '128GB';
        console.log(`  ✅ Setting storage to 128GB`);
        updatedCount++;
      } else {
        // Default to 128GB for older variations without clear storage in SKU
        variation.storage = '128GB';
        console.log(`  ✅ Setting storage to 128GB (default)`);
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      // Save the updated product
      await pixel6.save();
      console.log(`\n✅ Updated ${updatedCount} variations`);
      
      // Verify the update
      const updatedPixel6 = await Product.findOne({ slug: 'pixel-6' });
      const storageOptions = updatedPixel6.getAvailableStorage();
      console.log('\n📊 Available storage options after update:', storageOptions);
      
      // Show updated variations
      console.log('\n📦 Updated Variations:');
      updatedPixel6.variations.forEach((v, i) => {
        console.log(`  ${i + 1}. Storage: ${v.storage}, Color: ${v.color}, Price: £${v.price}, Stock: ${v.stockStatus}`);
      });
    } else {
      console.log('\n✅ All variations already have storage set correctly');
    }

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPixel6Storage();