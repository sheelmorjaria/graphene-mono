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

const testAdminProductsPagination = async () => {
  try {
    console.log('🧪 Testing admin products pagination...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Import the controller after DB connection
    const { getProducts } = await import('./src/controllers/adminController.js');

    // Test 1: Default pagination (should show 10 products)
    console.log('🔍 Test 1: Default pagination (limit=10)');
    const req1 = createMockReq({});
    const res1 = createMockRes();
    await getProducts(req1, res1);

    // Test 2: Request all products (limit=50)
    console.log('🔍 Test 2: Request all products (limit=50)');
    const req2 = createMockReq({ limit: 50 });
    const res2 = createMockRes();
    await getProducts(req2, res2);

    // Test 3: Check what default limit is set to
    console.log('🔍 Test 3: Check default limit behavior');
    const req3 = createMockReq({ page: 1 });
    const res3 = createMockRes();
    await getProducts(req3, res3);

    // Test 4: Request specific page 2
    console.log('🔍 Test 4: Request page 2');
    const req4 = createMockReq({ page: 2, limit: 10 });
    const res4 = createMockRes();
    await getProducts(req4, res4);

  } catch (error) {
    console.error('❌ Error testing admin products pagination:', error.message);
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
testAdminProductsPagination()
  .then(() => {
    console.log('\n✅ Admin products pagination test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });