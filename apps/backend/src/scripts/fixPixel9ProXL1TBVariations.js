import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

async function fixPixel9ProXL1TBVariations() {
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
    
    // Find variations with "1TB Obsidian" color (the problematic ones)
    const problematicVariations = pixel9ProXL.variations.filter(v => v.color === '1TB Obsidian');
    console.log(`\n🔍 Found ${problematicVariations.length} problematic variations with "1TB Obsidian" color:`);
    problematicVariations.forEach((variation, index) => {
      console.log(`${index + 1}. ${variation.condition} - "${variation.color}" - ${variation.storage} - £${variation.price}`);
    });
    
    if (problematicVariations.length === 0) {
      console.log('✅ No problematic variations found');
      return;
    }

    // Fix variations: change color from "1TB Obsidian" to "Obsidian" and storage from "128GB" to "1TB"
    let fixedCount = 0;
    console.log('\n🔧 Fixing variations:');
    
    pixel9ProXL.variations.forEach((variation, index) => {
      if (variation.color === '1TB Obsidian') {
        console.log(`✅ Fixing variation ${index + 1}: ${variation.condition} - "${variation.color}" - ${variation.storage} → ${variation.condition} - "Obsidian" - "1TB"`);
        variation.color = 'Obsidian';
        variation.storage = '1TB';
        fixedCount++;
      }
    });

    // Save the updated product
    await pixel9ProXL.save();
    console.log(`\n💾 Fixed ${fixedCount} variations`);
    
    // Verify the update
    const updatedPixel9ProXL = await Product.findOne({ slug: 'grapheneos-pixel-9-pro-xl' });
    console.log('\n📊 After fix:');
    console.log('📋 Available Colors:', updatedPixel9ProXL.getAvailableColors());
    console.log('💾 Available Storage:', updatedPixel9ProXL.getAvailableStorage());
    
    // Show all Obsidian variations
    const obsidianVariations = updatedPixel9ProXL.variations.filter(v => v.color === 'Obsidian');
    console.log(`\n📦 All Obsidian Variations (${obsidianVariations.length}):`);
    obsidianVariations.forEach((variation, index) => {
      console.log(`${index + 1}. ${variation.condition} - ${variation.color} - ${variation.storage} - £${variation.price}`);
    });

    // Show 1TB variations
    const oneTBVariations = updatedPixel9ProXL.variations.filter(v => v.storage === '1TB');
    console.log(`\n💾 All 1TB Storage Variations (${oneTBVariations.length}):`);
    oneTBVariations.forEach((variation, index) => {
      console.log(`${index + 1}. ${variation.condition} - ${variation.color} - ${variation.storage} - £${variation.price}`);
    });

    // Verify no more "1TB Obsidian" colors exist
    const remainingProblematic = updatedPixel9ProXL.variations.filter(v => v.color.includes('1TB'));
    if (remainingProblematic.length === 0) {
      console.log('\n✅ SUCCESS: No more colors containing "1TB"');
    } else {
      console.log(`\n❌ WARNING: Still ${remainingProblematic.length} variations with "1TB" in color`);
    }

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPixel9ProXL1TBVariations();