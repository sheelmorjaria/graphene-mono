import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

async function fixPixel7ProStorageRAMIssue() {
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
    console.log('📦 Current Variations:');
    pixel7Pro.variations.forEach((variation, index) => {
      console.log(`${index + 1}. ${variation.condition} - ${variation.color} - Storage: "${variation.storage}" - £${variation.price}`);
    });

    console.log('\n🔧 Fixing storage/RAM confusion...');

    // Fix: Convert variations with "12GB" storage to "256GB" storage
    // The logic: 12GB is actually RAM, and these should be 256GB storage variations
    let fixedCount = 0;
    pixel7Pro.variations.forEach((variation, index) => {
      if (variation.storage === '12GB') {
        console.log(`✅ Fixing variation ${index + 1}: ${variation.condition} ${variation.color} - "12GB" → "256GB" storage`);
        variation.storage = '256GB';
        fixedCount++;
      }
    });

    // Fix attributes: Ensure 12GB is properly noted as RAM, not storage
    console.log('\n🧠 Updating RAM specification in attributes...');
    
    // Add or update RAM attribute
    const ramAttributeIndex = pixel7Pro.attributes.findIndex(attr => 
      attr.name.toLowerCase().includes('ram') || 
      attr.name.toLowerCase().includes('memory') ||
      attr.value === '12GB'
    );

    if (ramAttributeIndex >= 0) {
      // Update existing RAM attribute
      pixel7Pro.attributes[ramAttributeIndex].name = 'RAM';
      pixel7Pro.attributes[ramAttributeIndex].value = '12GB';
      console.log('✅ Updated existing RAM attribute: RAM = 12GB');
    } else {
      // Add new RAM attribute
      pixel7Pro.attributes.push({
        name: 'RAM',
        value: '12GB'
      });
      console.log('✅ Added new RAM attribute: RAM = 12GB');
    }

    // Update "Available Storage" attribute to reflect both options
    const storageAttributeIndex = pixel7Pro.attributes.findIndex(attr => 
      attr.name === 'Available Storage'
    );

    if (storageAttributeIndex >= 0) {
      pixel7Pro.attributes[storageAttributeIndex].value = '128GB, 256GB';
      console.log('✅ Updated Available Storage attribute: 128GB, 256GB');
    }

    if (fixedCount > 0) {
      // Save the updated product
      await pixel7Pro.save();
      console.log(`\n💾 Fixed ${fixedCount} variations and updated attributes`);
      
      // Verify the update
      const updatedPixel7Pro = await Product.findOne({ slug: 'grapheneos-pixel-7-pro' });
      console.log('\n📊 After fix:');
      console.log('💾 Available Storage:', updatedPixel7Pro.getAvailableStorage());
      
      // Show updated variations
      console.log('\n📦 Updated Variations:');
      updatedPixel7Pro.variations.forEach((v, i) => {
        console.log(`${i + 1}. ${v.condition} - ${v.color} - ${v.storage} - £${v.price}`);
      });

      // Show updated attributes
      console.log('\n📋 Updated Attributes:');
      updatedPixel7Pro.attributes.forEach((attr, i) => {
        console.log(`${i + 1}. ${attr.name}: "${attr.value}"`);
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

fixPixel7ProStorageRAMIssue();