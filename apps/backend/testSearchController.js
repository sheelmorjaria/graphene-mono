import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Mock request and response objects
const createMockReq = (query = {}) => ({
  query: query
});

const createMockRes = () => {
  const res = {};
  res.json = jest.fn((data) => {
    console.log('📤 Search Response:');
    if (data.data && data.data.products) {
      console.log(`   Found ${data.data.products.length} products`);
      data.data.products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name}`);
        console.log(`      Price: £${product.price}${product.priceRange ? ` (Range: £${product.priceRange.min}-£${product.priceRange.max})` : ''}`);
        console.log(`      Stock: ${product.stockQuantity} (${product.stockStatus})`);
        console.log(`      Condition: ${product.condition}`);
        console.log(`      Variations: ${product.variationCount}`);
        console.log(`      Base Model: ${product.baseModel}`);
        console.log();
      });
    } else {
      console.log('   No products found or invalid response structure');
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
    return res;
  });
  res.status = jest.fn((code) => {
    console.log(`📤 Status: ${code}`);
    return res;
  });
  return res;
};

const testSearchController = async () => {
  try {
    console.log('🧪 Testing search controller with variations structure...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Import the controller after DB connection
    const { searchProducts } = await import('./src/controllers/searchController.js');

    // Test 1: Search for all products
    console.log('🔍 Test 1: Search for "pixel"...');
    const req1 = createMockReq({ q: 'pixel', limit: 50 });
    const res1 = createMockRes();
    await searchProducts(req1, res1);
    
    // Test 2: Search specifically for Fold
    console.log('\n🔍 Test 2: Search for "fold"...');
    const req2 = createMockReq({ q: 'fold', limit: 50 });
    const res2 = createMockRes();
    await searchProducts(req2, res2);

    // Test 3: Search for "Pixel 9 Pro Fold"
    console.log('\n🔍 Test 3: Search for "Pixel 9 Pro Fold"...');
    const req3 = createMockReq({ q: 'Pixel 9 Pro Fold', limit: 50 });
    const res3 = createMockRes();
    await searchProducts(req3, res3);

    // Test 4: Price range search
    console.log('\n🔍 Test 4: Search with price range £500-£1000...');
    const req4 = createMockReq({ q: 'pixel', minPrice: '500', maxPrice: '1000', limit: 50 });
    const res4 = createMockRes();
    await searchProducts(req4, res4);

  } catch (error) {
    console.error('❌ Error testing search controller:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n📴 Database connection closed');
  }
};

// Mock jest functions
global.jest = {
  fn: (implementation) => {
    const mockFn = (...args) => {
      if (implementation) {
        return implementation(...args);
      }
    };
    mockFn.mockClear = () => {};
    return mockFn;
  }
};

// Run the test
testSearchController()
  .then(() => {
    console.log('\n✅ Search controller test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });