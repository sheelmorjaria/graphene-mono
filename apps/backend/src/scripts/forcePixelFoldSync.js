import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable not set');
    }

    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    });
    
    console.log('✅ Connected to database');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Force Pixel Fold sync
const forcePixelFoldSync = async () => {
  console.log('🔄 Force syncing Pixel Fold products...\n');

  try {
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Import Product model
    const { default: Product } = await import('../models/Product.js');

    // Step 1: Check for any existing Pixel Fold products
    console.log('🔍 Checking for existing Pixel Fold products...');
    const existingFolds = await Product.find({
      name: { $regex: /Pixel\s+Fold/i }
    }).select('name price _id');

    if (existingFolds.length > 0) {
      console.log(`📱 Found ${existingFolds.length} existing Pixel Fold products:`);
      existingFolds.forEach(product => {
        console.log(`   - ${product.name} (£${product.price}) - ID: ${product._id}`);
      });

      // Ask if we should remove them first
      console.log('\n🗑️  Removing existing Pixel Fold products to allow fresh sync...');
      const deleteResult = await Product.deleteMany({
        name: { $regex: /Pixel\s+Fold/i }
      });
      console.log(`✅ Removed ${deleteResult.deletedCount} existing Pixel Fold products`);
    } else {
      console.log('📱 No existing Pixel Fold products found');
    }

    // Step 2: Import and run the sync function
    console.log('\n🔄 Running fresh sync to import Pixel Fold products...');
    const { syncAndroidPhones } = await import('../../syncFromCLI.js');
    
    const syncResult = await syncAndroidPhones();
    
    console.log('\n📊 Sync Results:');
    console.log(`✅ Created: ${syncResult.syncedCount} products`);
    console.log(`⏭️  Skipped: ${syncResult.skippedCount} products`);
    console.log(`🗑️  Removed old: ${syncResult.removedCount} products`);

    // Step 3: Verify Pixel Fold products were added
    console.log('\n🔍 Verifying Pixel Fold products after sync...');
    const newFolds = await Product.find({
      name: { $regex: /Pixel\s+Fold/i }
    }).select('name price condition createdAt');

    if (newFolds.length > 0) {
      console.log(`\n🎉 Success! Found ${newFolds.length} Pixel Fold products:`);
      newFolds.forEach(product => {
        console.log(`   ✅ ${product.name}`);
        console.log(`      Price: £${product.price} | Condition: ${product.condition}`);
        console.log(`      Added: ${product.createdAt.toLocaleString()}`);
        console.log();
      });
    } else {
      console.log('\n⚠️  No Pixel Fold products found after sync');
      console.log('This could mean:');
      console.log('1. No Pixel Fold products available in CEX data');
      console.log('2. CLI tool is not finding Pixel Fold products');
      console.log('3. Products are being filtered out elsewhere');
    }

    return {
      removedCount: existingFolds.length,
      syncResult,
      newFoldCount: newFolds.length,
      newFolds
    };

  } catch (error) {
    console.error('❌ Error in force sync:', error.message);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📴 Database connection closed');
    }
  }
};

// Test the new filtering logic first
const testPixelFoldFiltering = () => {
  console.log('🧪 Testing new Pixel Fold filtering logic...\n');

  const isOldPixelVariant = (productName) => {
    if (!productName) return false;
    
    const oldPixelPatterns = [
      /\bPixel\s+1\b/i,
      /\bPixel\s+2(\s+XL)?\b/i,
      /\bPixel\s+3(a)?(\s+XL)?\b/i,
      /\bPixel\s+4(a)?(\s+(XL|5G))?\b/i,
      /\bPixel\s+5(a)?(\s+XL)?\b/i
    ];
    
    return oldPixelPatterns.some(pattern => pattern.test(productName));
  };

  const testProducts = [
    'Google Pixel Fold 256GB Obsidian',
    'Google Pixel Fold 512GB Porcelain',
    'Google Pixel 8 Pro 256GB Bay',
    'Google Pixel 5 128GB Green' // Should be excluded
  ];

  testProducts.forEach(product => {
    const isOld = isOldPixelVariant(product);
    const status = isOld ? '❌ EXCLUDE' : '✅ INCLUDE';
    console.log(`${status} ${product}`);
  });
  
  console.log('\n✅ Filtering logic test completed\n');
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  if (command === 'test') {
    testPixelFoldFiltering();
  } else {
    testPixelFoldFiltering();
    
    forcePixelFoldSync()
      .then((result) => {
        console.log('\n🎯 Force Sync Summary:');
        console.log(`Removed existing: ${result.removedCount} Pixel Fold products`);
        console.log(`Sync results: ${result.syncResult.syncedCount} created, ${result.syncResult.skippedCount} skipped`);
        console.log(`New Pixel Fold products: ${result.newFoldCount}`);
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n💥 Force sync failed:', error.message);
        process.exit(1);
      });
  }
}

export { forcePixelFoldSync };