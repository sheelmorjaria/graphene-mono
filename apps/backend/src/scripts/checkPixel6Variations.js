import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';

dotenv.config();

async function checkPixel6Variations() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find Pixel 6 product by slug
    const pixel6 = await Product.findOne({ slug: 'pixel-6' });
    
    if (!pixel6) {
      console.log('❌ Pixel 6 product not found');
      return;
    }

    console.log('📱 Product Found:');
    console.log('  Name:', pixel6.name);
    console.log('  Slug:', pixel6.slug);
    console.log('  SKU:', pixel6.sku);
    console.log('  Status:', pixel6.status);
    console.log('  Is Active:', pixel6.isActive);
    console.log('  Total Variations:', pixel6.variations?.length || 0);
    
    console.log('\n📦 Variations:');
    console.log('='.repeat(80));
    
    if (pixel6.variations && pixel6.variations.length > 0) {
      pixel6.variations.forEach((variation, index) => {
        console.log(`\nVariation ${index + 1}:`);
        console.log('  Storage:', variation.storage || 'N/A');
        console.log('  Color:', variation.color || 'N/A');
        console.log('  Condition:', variation.condition || 'N/A');
        console.log('  Price: £', variation.price);
        console.log('  Sale Price: £', variation.salePrice || 'N/A');
        console.log('  Stock Quantity:', variation.stockQuantity);
        console.log('  Stock Status:', variation.stockStatus);
        console.log('  SKU:', variation.sku);
        console.log('  Images:', variation.images?.length || 0, 'images');
      });
    }

    // Check for 256GB specifically
    console.log('\n🔍 Checking for 256GB variation:');
    const has256GB = pixel6.variations?.some(v => v.storage === '256GB');
    console.log(has256GB ? '✅ 256GB variation exists in database' : '❌ 256GB variation NOT found');

    // Check available storage options
    const storageOptions = pixel6.getAvailableStorage();
    console.log('\n📊 Available Storage Options (from method):', storageOptions);

    // Check all storage values in variations
    const allStorageValues = pixel6.variations?.map(v => v.storage).filter(Boolean);
    console.log('📊 All Storage Values in DB:', allStorageValues);

    // Check in-stock storage options
    const inStockStorage = pixel6.variations
      ?.filter(v => v.stockStatus !== 'out_of_stock' && v.storage)
      .map(v => v.storage);
    console.log('📊 In-Stock Storage Options:', inStockStorage);

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPixel6Variations();