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
    console.log('📤 Response:', JSON.stringify(data, null, 2));
    return res;
  });
  res.status = jest.fn((code) => {
    console.log(`📤 Status: ${code}`);
    return res;
  });
  return res;
};

const testAdminController = async () => {
  try {
    console.log('🧪 Testing admin controller getProducts function...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Import the controller after DB connection
    const { getProducts } = await import('./src/controllers/adminController.js');

    // Test with default parameters
    console.log('🔍 Testing with default parameters...');
    const req1 = createMockReq({ limit: 50 });
    const res1 = createMockRes();
    
    await getProducts(req1, res1);
    
    // Test with search for Fold
    console.log('\n🔍 Testing with Fold search...');
    const req2 = createMockReq({ limit: 50, searchQuery: 'Fold' });
    const res2 = createMockRes();
    
    await getProducts(req2, res2);

  } catch (error) {
    console.error('❌ Error testing admin controller:', error.message);
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
testAdminController()
  .then(() => {
    console.log('\n✅ Admin controller test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });