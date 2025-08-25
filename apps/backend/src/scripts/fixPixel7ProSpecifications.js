import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

async function fixPixel7ProSpecifications() {
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
    console.log('\n📋 Current Attributes (Specifications):');
    pixel7Pro.attributes.forEach((attr, i) => {
      console.log(`${i+1}. ${attr.name}: "${attr.value}"`);
    });
    
    // Find and fix the "Available Storage" attribute
    let fixedCount = 0;
    pixel7Pro.attributes.forEach((attr, index) => {
      if (attr.name === 'Available Storage' && attr.value === '12GB') {
        console.log(`\n✅ Fixing attribute ${index + 1}: Available Storage "12GB" → "128GB"`);
        attr.value = '128GB';
        fixedCount++;
      }
    });
    
    if (fixedCount > 0) {
      // Save the updated product
      await pixel7Pro.save();
      console.log(`\n💾 Fixed ${fixedCount} specification attribute(s)`);
      
      // Verify the update
      const updatedPixel7Pro = await Product.findOne({ slug: 'grapheneos-pixel-7-pro' });
      console.log('\n📋 Updated Attributes (Specifications):');
      updatedPixel7Pro.attributes.forEach((attr, i) => {
        console.log(`${i+1}. ${attr.name}: "${attr.value}"`);
      });
    } else {
      console.log('\n✅ No specification attributes needed fixing');
    }

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPixel7ProSpecifications();