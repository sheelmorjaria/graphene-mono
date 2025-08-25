import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

async function removeDuplicateVariations() {
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
    console.log(`📦 Total variations: ${pixel9ProXL.variations.length}`);
    
    // Find duplicate problematic variations
    const problematicVariations = pixel9ProXL.variations.filter(v => v.color === '1TB Obsidian');
    console.log(`\n🔍 Found ${problematicVariations.length} problematic variations with "1TB Obsidian" color:`);
    problematicVariations.forEach((variation, index) => {
      console.log(`${index + 1}. ${variation.condition} - "${variation.color}" - ${variation.storage} - £${variation.price}`);
    });
    
    if (problematicVariations.length === 0) {
      console.log('✅ No problematic variations found');
      return;
    }

    // Remove variations with "1TB Obsidian" color (keep the corrected "Obsidian" + "1TB" ones)
    console.log('\n🗑️ Removing problematic variations:');
    const initialLength = pixel9ProXL.variations.length;
    
    pixel9ProXL.variations = pixel9ProXL.variations.filter((variation, index) => {
      if (variation.color === '1TB Obsidian') {
        console.log(`❌ Removing variation ${index + 1}: ${variation.condition} - "${variation.color}" - ${variation.storage} - £${variation.price}`);
        return false; // Remove this variation
      }
      return true; // Keep this variation
    });
    
    const finalLength = pixel9ProXL.variations.length;
    const removedCount = initialLength - finalLength;

    // Save the updated product
    await pixel9ProXL.save();
    console.log(`\n💾 Removed ${removedCount} duplicate variations`);
    console.log(`📦 Variations count: ${initialLength} → ${finalLength}`);
    
    // Verify the update
    const updatedPixel9ProXL = await Product.findOne({ slug: 'grapheneos-pixel-9-pro-xl' });
    console.log('\n📊 After cleanup:');
    console.log('📋 Available Colors:', updatedPixel9ProXL.getAvailableColors());
    console.log('💾 Available Storage:', updatedPixel9ProXL.getAvailableStorage());
    
    // Show 1TB variations (should only show the correct ones)
    const oneTBVariations = updatedPixel9ProXL.variations.filter(v => v.storage === '1TB');
    console.log(`\n💾 1TB Storage Variations (${oneTBVariations.length}):`);
    oneTBVariations.forEach((variation, index) => {
      console.log(`${index + 1}. ${variation.condition} - ${variation.color} - ${variation.storage} - £${variation.price}`);
    });

    // Verify no more "1TB Obsidian" colors exist
    const remainingProblematic = updatedPixel9ProXL.variations.filter(v => v.color.includes('1TB'));
    if (remainingProblematic.length === 0) {
      console.log('\n✅ SUCCESS: No more colors containing "1TB"');
      console.log('✅ Duplicates removed, only correct variations remain');
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

removeDuplicateVariations();