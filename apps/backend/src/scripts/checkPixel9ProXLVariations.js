import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

async function checkPixel9ProXLVariations() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find Pixel 9 Pro XL
    const pixel9ProXL = await Product.findOne({ slug: 'grapheneos-pixel-9-pro-xl' });
    
    if (!pixel9ProXL) {
      console.log('❌ Pixel 9 Pro XL product not found');
      return;
    }

    console.log('📱 Found Pixel 9 Pro XL product');
    console.log('📦 Current Variations:');
    pixel9ProXL.variations.forEach((variation, index) => {
      console.log(`${index + 1}. ${variation.condition} - ${variation.color} - ${variation.storage} - £${variation.price} - Stock: ${variation.stock}`);
    });
    
    console.log('\n📋 Available Colors:', pixel9ProXL.getAvailableColors());
    console.log('💾 Available Storage:', pixel9ProXL.getAvailableStorage());
    
    // Check for problematic variations
    const obsidianVariations = pixel9ProXL.variations.filter(v => 
      v.color.toLowerCase().includes('obsidian')
    );
    
    console.log('\n🔍 Obsidian Variations Analysis:');
    obsidianVariations.forEach((variation, index) => {
      console.log(`${index + 1}. ${variation.condition} - "${variation.color}" - ${variation.storage} - £${variation.price}`);
    });

    // Check for 1TB storage variations
    const oneTBVariations = pixel9ProXL.variations.filter(v => 
      v.storage === '1TB'
    );
    
    console.log('\n💾 1TB Storage Variations:');
    if (oneTBVariations.length === 0) {
      console.log('   No 1TB variations found');
    } else {
      oneTBVariations.forEach((variation, index) => {
        console.log(`${index + 1}. ${variation.condition} - ${variation.color} - ${variation.storage} - £${variation.price}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPixel9ProXLVariations();