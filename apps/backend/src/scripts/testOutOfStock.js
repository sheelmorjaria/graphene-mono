import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

dotenv.config();

async function testOutOfStockDisplay() {
  try {
    console.log('🔍 Testing out-of-stock product display...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find a USB drive product to temporarily set out of stock
    const usbProduct = await Product.findOne({}).populate('category', 'name slug');
    
    if (!usbProduct) {
      console.log('❌ No products found');
      return;
    }
    
    console.log(`📦 Found product: ${usbProduct.name}`);
    console.log(`📊 Current stock status: ${usbProduct.isInStock() ? 'IN STOCK' : 'OUT OF STOCK'}`);
    console.log(`📋 Variations: ${usbProduct.variations.length}`);
    
    // Backup original stock statuses
    const originalStatuses = usbProduct.variations.map(v => v.stockStatus);
    console.log(`💾 Original stock statuses: ${originalStatuses.join(', ')}`);
    
    // Set all variations to out_of_stock temporarily
    usbProduct.variations.forEach(variation => {
      variation.stockStatus = 'out_of_stock';
    });
    
    await usbProduct.save();
    console.log('⏸️  Temporarily set product to OUT OF STOCK for testing');
    console.log(`📊 Updated stock status: ${usbProduct.isInStock() ? 'IN STOCK' : 'OUT OF STOCK'}`);
    
    // Wait 5 seconds for manual testing
    console.log('⏰ Waiting 10 seconds for you to test the frontend...');
    console.log('🌐 Visit: http://localhost:3001/products?category=usb-drives');
    console.log('👀 Check if the first product shows:');
    console.log('   - Out-of-stock placeholder image');
    console.log('   - "3-5 days" lead time');
    console.log('   - "Out of Stock" status');
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Restore original stock statuses
    usbProduct.variations.forEach((variation, index) => {
      variation.stockStatus = originalStatuses[index];
    });
    
    await usbProduct.save();
    console.log('✅ Restored original stock statuses');
    console.log(`📊 Final stock status: ${usbProduct.isInStock() ? 'IN STOCK' : 'OUT OF STOCK'}`);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testOutOfStockDisplay();