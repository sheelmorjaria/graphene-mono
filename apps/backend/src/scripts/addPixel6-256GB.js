import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

async function addPixel6_256GB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find the current Pixel 6 product
    const pixel6 = await Product.findOne({ slug: 'grapheneos-pixel-6' });
    
    if (!pixel6) {
      console.log('❌ Pixel 6 product not found');
      return;
    }

    console.log('📱 Found Pixel 6 product');
    console.log('  Current variations:', pixel6.variations.length);
    
    // Check if 256GB already exists
    const has256GB = pixel6.variations.some(v => v.storage === '256GB');
    if (has256GB) {
      console.log('✅ 256GB variation already exists');
      return;
    }

    // Add 256GB variations
    const new256GBVariations = [
      {
        condition: 'good',
        color: 'Stormy Black',
        storage: '256GB',
        price: 340,
        stockQuantity: 15,
        stockStatus: 'in_stock',
        sku: 'PIXEL-6-GOOD-BLACK-256',
        images: []
      },
      {
        condition: 'good',
        color: 'Kinda Coral',
        storage: '256GB',
        price: 345,
        stockQuantity: 8,
        stockStatus: 'in_stock',
        sku: 'PIXEL-6-GOOD-CORAL-256',
        images: []
      }
    ];

    // Add the new variations
    pixel6.variations.push(...new256GBVariations);
    
    // Save the updated product
    await pixel6.save();
    
    console.log(`\n✅ Added ${new256GBVariations.length} new 256GB variations`);
    
    // Verify the update
    const updatedPixel6 = await Product.findOne({ slug: 'grapheneos-pixel-6' });
    const storageOptions = updatedPixel6.getAvailableStorage();
    console.log('\n📊 Available storage options after update:', storageOptions);
    
    // Show all variations
    console.log('\n📦 All Variations:');
    updatedPixel6.variations.forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.condition} - ${v.color} - ${v.storage} - £${v.price} (${v.stockStatus})`);
    });

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addPixel6_256GB();