import mongoose from 'mongoose';
import Product from './src/models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

const testAdminProducts = async () => {
  try {
    console.log('🧪 Testing admin products query...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Simulate the admin products query
    const query = {
      status: { $ne: 'archived' }
    };

    console.log('🔍 Query:', JSON.stringify(query, null, 2));

    const products = await Product.find(query)
      .select('name sku baseModel status category images variations createdAt updatedAt')
      .lean();

    console.log(`📊 Found ${products.length} products total\n`);

    // Look specifically for Fold products
    const foldProducts = products.filter(p => p.name.toLowerCase().includes('fold'));
    console.log(`🔍 Fold products found: ${foldProducts.length}\n`);

    if (foldProducts.length > 0) {
      console.log('✅ Fold products in database:');
      foldProducts.forEach((product, index) => {
        const totalStock = product.variations?.reduce((total, variation) => total + (variation.stockQuantity || 0), 0) || 0;
        const prices = product.variations?.map(v => v.salePrice || v.price).filter(p => p) || [];
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
        const priceDisplay = minPrice === maxPrice ? `£${minPrice}` : `£${minPrice} - £${maxPrice}`;
        
        console.log(`   ${index + 1}. ${product.name}`);
        console.log(`      SKU: ${product.sku}`);
        console.log(`      Base Model: ${product.baseModel}`);
        console.log(`      Status: ${product.status}`);
        console.log(`      Variations: ${product.variations?.length || 0}`);
        console.log(`      Total Stock: ${totalStock}`);
        console.log(`      Price Range: ${priceDisplay}`);
        console.log();
        
        // Show variation details
        if (product.variations?.length > 0) {
          console.log('      Variation Details:');
          product.variations.forEach((variation, vIndex) => {
            console.log(`        ${vIndex + 1}. ${variation.storage} ${variation.color} (${variation.condition})`);
            console.log(`           Price: £${variation.price}, Stock: ${variation.stockQuantity}, Status: ${variation.stockStatus}`);
          });
          console.log();
        }
      });
    } else {
      console.log('❌ No Fold products found!');
      console.log('\n📋 All products in database:');
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (${product.baseModel})`);
      });
    }

    // Test different query patterns
    console.log('\n🧪 Testing different query patterns for Fold products...\n');

    const testQueries = [
      { name: 'By name regex (case insensitive)', query: { name: { $regex: /fold/i } } },
      { name: 'By baseModel regex', query: { baseModel: { $regex: /fold/i } } },
      { name: 'By baseModel exact match', query: { baseModel: '9 Pro Fold' } },
      { name: 'By baseModel exact match (Fold)', query: { baseModel: 'Fold' } }
    ];

    for (const test of testQueries) {
      const results = await Product.find(test.query).select('name baseModel').lean();
      console.log(`   ${test.name}: ${results.length} results`);
      if (results.length > 0) {
        results.forEach(r => console.log(`     - ${r.name} (${r.baseModel})`));
      }
      console.log();
    }

    return {
      totalProducts: products.length,
      foldProducts: foldProducts.length,
      foldProductDetails: foldProducts
    };

  } catch (error) {
    console.error('❌ Error testing admin products:', error.message);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('📴 Database connection closed');
  }
};

// Run the test
testAdminProducts()
  .then((result) => {
    console.log('\n📊 Test Summary:');
    console.log(`   Total products: ${result.totalProducts}`);
    console.log(`   Fold products: ${result.foldProducts}`);
    
    if (result.foldProducts > 0) {
      console.log('\n🎉 SUCCESS: Fold products are in the database and should be visible in admin!');
    } else {
      console.log('\n❌ PROBLEM: No Fold products found in database');
    }
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });