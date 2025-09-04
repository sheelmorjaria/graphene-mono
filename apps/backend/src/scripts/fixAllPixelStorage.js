import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

async function fixAllPixelStorage() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find all Pixel products
    const pixelProducts = await Product.find({ 
      baseModel: { $regex: /Pixel/i } 
    });
    
    console.log(`📱 Found ${pixelProducts.length} Pixel products\n`);

    for (const product of pixelProducts) {
      console.log(`\nProcessing: ${product.name} (${product.slug})`);
      console.log(`  Variations: ${product.variations.length}`);
      
      let updatedCount = 0;
      
      product.variations.forEach((variation, index) => {
        const sku = variation.sku;
        const oldStorage = variation.storage;
        
        // Determine storage based on SKU pattern or existing data
        let newStorage = null;
        
        if (sku.includes('-512-')) {
          newStorage = '512GB';
        } else if (sku.includes('-256-')) {
          newStorage = '256GB';
        } else if (sku.includes('-128-')) {
          newStorage = '128GB';
        } else if (!variation.storage) {
          // Default to 128GB if no storage is set and SKU doesn't indicate
          newStorage = '128GB';
        }
        
        if (newStorage && newStorage !== oldStorage) {
          variation.storage = newStorage;
          console.log(`    Variation ${index + 1}: ${oldStorage || 'Not set'} → ${newStorage}`);
          updatedCount++;
        }
      });
      
      if (updatedCount > 0) {
        await product.save();
        console.log(`  ✅ Updated ${updatedCount} variations`);
        
        // Show available storage after update
        const storageOptions = product.getAvailableStorage();
        console.log(`  📊 Available storage: ${storageOptions.join(', ')}`);
      } else {
        console.log('  ✓ All variations already have storage set');
      }
    }

    console.log('\n✅ All Pixel products have been checked and updated');

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAllPixelStorage();