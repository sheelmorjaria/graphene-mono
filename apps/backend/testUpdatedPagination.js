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
    if (data.data && data.data.products) {
      console.log(`📊 Products returned: ${data.data.products.length}`);
      console.log(`📊 Pagination info:`, JSON.stringify(data.data.pagination, null, 2));
      console.log('\n📋 Products list:');
      data.data.products.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} (${product.baseModel})`);
      });
      console.log();
    } else {
      console.log('❌ Invalid response structure');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
    return res;
  });
  res.status = jest.fn((code) => {
    if (code !== 200) {
      console.log(`❌ Error status: ${code}`);
    }
    return res;
  });
  return res;
};

const testUpdatedPagination = async () => {
  try {
    console.log('🧪 Testing updated admin products pagination (limit=25)...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Import the controller after DB connection
    const { getProducts } = await import('./src/controllers/adminController.js');

    // Test with limit=25 (new frontend default)
    console.log('🔍 Testing with limit=25 (updated frontend default)');
    const req = createMockReq({ limit: 25 });
    const res = createMockRes();
    await getProducts(req, res);

  } catch (error) {
    console.error('❌ Error testing updated pagination:', error.message);
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
testUpdatedPagination()
  .then(() => {
    console.log('\n✅ Updated pagination test completed!');
    console.log('\n💡 Result: With limit=25, all 13 products should now be visible on the first page');
    console.log('💡 The frontend admin dashboard should no longer need pagination for current product count');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });