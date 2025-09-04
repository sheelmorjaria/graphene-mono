import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/graphene-store';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
};

const testGroupedProducts = async () => {
  console.log('🧪 Testing grouped product creation...\n');

  try {
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Import the createOrUpdateProductFromCLI function
    const { createOrUpdateProductFromCLI } = await import('../syncFromCLI.js');

    // Test data - multiple variations of the same base model
    const testVariations = [
      {
        name: 'Google Pixel 8 Pro 128GB Obsidian',
        price: 650,
        condition: 'A',
        url: 'https://example.com'
      },
      {
        name: 'Google Pixel 8 Pro 256GB Hazel', 
        price: 720,
        condition: 'B',
        url: 'https://example.com'
      },
      {
        name: 'Google Pixel 8 Pro 128GB Snow',
        price: 630,
        condition: 'B', 
        url: 'https://example.com'
      },
      {
        name: 'Google Pixel 8 256GB Obsidian',
        price: 550,
        condition: 'A',
        url: 'https://example.com'
      },
      {
        name: 'Google Pixel 8 128GB Rose',
        price: 520,
        condition: 'C',
        url: 'https://example.com'
      }
    ];

    console.log('🔄 Creating/updating products with variations...\n');

    for (const variation of testVariations) {
      try {
        console.log(`Processing: ${variation.name} (${variation.condition}) - £${variation.price}`);
        const result = await createOrUpdateProductFromCLI(variation);
        console.log(`Result: ${result ? 'Success' : 'Failed'}\n`);
      } catch (error) {
        console.error(`❌ Error processing ${variation.name}:`, error.message);
      }
    }

    // Verify the results
    console.log('\n📊 Verification - Checking grouped products:\n');
    
    const { default: Product } = await import('../src/models/Product.js');
    
    const products = await Product.find({ baseModel: { $in: ['8 Pro', '8'] } })
      .select('name baseModel price variations')
      .lean();

    console.log(`Found ${products.length} unique products:\n`);

    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Base Model: ${product.baseModel}`);
      console.log(`   Base Price: £${product.price}`);
      console.log(`   Variations: ${product.variations.length}`);
      
      product.variations.forEach((variation, vIndex) => {
        console.log(`     ${vIndex + 1}. ${variation.storage} ${variation.color} (${variation.condition}) - £${variation.price} - Stock: ${variation.stockQuantity}`);
      });
      console.log();
    });

    // Expected results:
    console.log('📋 Expected Results:');
    console.log('   - Should have 2 unique products (Pixel 8 Pro, Pixel 8)');
    console.log('   - Pixel 8 Pro should have 3 variations');
    console.log('   - Pixel 8 should have 2 variations');
    console.log('   - Each variation should have correct storage, color, condition');

    return {
      totalProducts: products.length,
      products: products.map(p => ({
        name: p.name,
        baseModel: p.baseModel,
        variationCount: p.variations.length
      }))
    };

  } catch (error) {
    console.error('❌ Error testing grouped products:', error.message);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📴 Database connection closed');
    }
  }
};

// Run the test
testGroupedProducts()
  .then((result) => {
    console.log('\n✅ Grouped product test completed');
    console.log(`📊 Results: ${result.totalProducts} unique products created`);
    result.products.forEach(p => {
      console.log(`   - ${p.name}: ${p.variationCount} variations`);
    });
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });