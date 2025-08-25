import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

async function setPixel6Storage128GB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find Pixel 6 product
    const pixel6 = await Product.findOne({ slug: 'grapheneos-pixel-6' });
    
    if (!pixel6) {
      console.log('❌ Pixel 6 product not found');
      return;
    }

    console.log('📱 Found Pixel 6 product');
    console.log('  Current variations:', pixel6.variations.length);
    
    // Set storage to 128GB for all variations (based on SKU analysis)
    let updatedCount = 0;
    pixel6.variations.forEach((variation, index) => {
      if (!variation.storage) {
        variation.storage = '128GB';
        console.log(`  ✅ Set variation ${index + 1} (${variation.condition} ${variation.color}) storage to 128GB`);
        updatedCount++;
      }
    });
    
    if (updatedCount > 0) {
      // Save the updated product
      await pixel6.save();
      console.log(`\n💾 Updated ${updatedCount} variations`);
      
      // Verify the update
      const updatedPixel6 = await Product.findOne({ slug: 'grapheneos-pixel-6' });
      const storageOptions = updatedPixel6.getAvailableStorage();
      console.log('\n📊 Available storage options after update:', storageOptions);
      
      // Show all variations
      console.log('\n📦 Updated Variations:');
      updatedPixel6.variations.forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.condition} - ${v.color} - ${v.storage} - £${v.price} (Stock: ${v.stockQuantity})`);
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

setPixel6Storage128GB();