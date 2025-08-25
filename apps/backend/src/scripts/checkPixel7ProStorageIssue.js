import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

async function checkPixel7ProStorageIssue() {
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
    console.log('📄 Product Name:', pixel7Pro.name);
    console.log('📄 Product Description:');
    console.log(pixel7Pro.description);
    
    console.log('\n📦 Current Variations:');
    pixel7Pro.variations.forEach((variation, index) => {
      console.log(`${index + 1}. ${variation.condition} - ${variation.color} - Storage: "${variation.storage}" - £${variation.price}`);
    });
    
    console.log('\n📋 Available Storage Options:', pixel7Pro.getAvailableStorage());
    
    // Check attributes/specifications
    console.log('\n📋 Product Attributes/Specifications:');
    if (pixel7Pro.attributes && pixel7Pro.attributes.length > 0) {
      pixel7Pro.attributes.forEach((attr, index) => {
        console.log(`${index + 1}. ${attr.name}: "${attr.value}"`);
      });
    } else {
      console.log('No attributes found');
    }

    // Look for any mention of 12GB (RAM)
    const has12GBStorage = pixel7Pro.variations.some(v => v.storage === '12GB');
    const has128GBStorage = pixel7Pro.variations.some(v => v.storage === '128GB');
    const has256GBStorage = pixel7Pro.variations.some(v => v.storage === '256GB');

    console.log('\n🔍 Storage Analysis:');
    console.log(`Has 12GB storage variations: ${has12GBStorage ? 'YES ❌' : 'NO ✅'}`);
    console.log(`Has 128GB storage variations: ${has128GBStorage ? 'YES ✅' : 'NO ❌'}`);
    console.log(`Has 256GB storage variations: ${has256GBStorage ? 'YES ✅' : 'NO ❌'}`);

    // Check if 12GB appears in attributes (should be RAM, not storage)
    const ramAttribute = pixel7Pro.attributes?.find(attr => 
      attr.name.toLowerCase().includes('ram') || 
      attr.value === '12GB' ||
      attr.name.toLowerCase().includes('memory')
    );
    
    if (ramAttribute) {
      console.log(`\n🧠 RAM Attribute Found: ${ramAttribute.name} = "${ramAttribute.value}"`);
    }

    // Expected: 128GB and 256GB storage, 12GB RAM
    console.log('\n✅ Expected Setup:');
    console.log('- RAM (Memory): 12GB (should be in attributes, not storage)');
    console.log('- Storage Options: 128GB, 256GB (should be in variations.storage)');
    console.log('- Frontend should show: "128GB, 256GB" as storage options');

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPixel7ProStorageIssue();