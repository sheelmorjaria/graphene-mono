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

// Test search function with various queries
const testSearchQueries = async () => {
  console.log('🔍 Testing search functionality for Pixel 9 Pro Fold products...\n');

  try {
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Import search controller function
    const { searchProducts } = await import('../controllers/searchController.js');

    const testQueries = [
      'Pixel 9 Pro Fold',
      'pixel 9 pro fold',
      'Pixel9ProFold',
      'Pro Fold',
      'fold pixel',
      'pixel fold',
      'foldable',
      'fold',
      '9 pro fold',
      'pixel 9',
      'graphene fold'
    ];

    console.log('🧪 Testing different search queries:\n');

    for (const query of testQueries) {
      console.log(`🔍 Testing query: "${query}"`);
      
      // Simulate a request object
      const mockReq = {
        query: {
          q: query,
          page: 1,
          limit: 10
        }
      };

      // Mock response object
      let responseData = null;
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            responseData = { status: code, data };
            return mockRes;
          }
        })
      };

      try {
        await searchProducts(mockReq, mockRes);
        
        if (responseData) {
          if (responseData.status === 200) {
            const products = responseData.data.data.products;
            console.log(`   ✅ Found ${products.length} product(s):`);
            
            products.forEach(product => {
              console.log(`      - ${product.name} (£${product.price})`);
            });
            
            if (products.length === 0) {
              console.log('      ⚠️  No products found');
            }
          } else {
            console.log(`   ❌ Error: ${responseData.data.error || 'Unknown error'}`);
          }
        }
      } catch (searchError) {
        console.log(`   ❌ Search error: ${searchError.message}`);
      }
      
      console.log('');
    }

    // Also test direct database queries
    console.log('\n📊 Direct database query results:\n');
    
    const { default: Product } = await import('../models/Product.js');

    const directQueries = [
      { name: 'All Pixel 9 products', filter: { name: { $regex: /pixel.*9/i } } },
      { name: 'All Fold products', filter: { name: { $regex: /fold/i } } },
      { name: 'Pixel 9 Pro Fold products', filter: { name: { $regex: /pixel.*9.*pro.*fold/i } } },
      { name: 'Active products', filter: { isActive: true } }
    ];

    for (const dbQuery of directQueries) {
      console.log(`🔍 ${dbQuery.name}:`);
      const products = await Product.find(dbQuery.filter)
        .select('name price isActive')
        .limit(10);
      
      console.log(`   Found ${products.length} product(s):`);
      products.forEach(product => {
        console.log(`      - ${product.name} (£${product.price}) - Active: ${product.isActive}`);
      });
      console.log('');
    }

    return true;

  } catch (error) {
    console.error('❌ Error testing search:', error.message);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('📴 Database connection closed');
    }
  }
};

// Run the test
testSearchQueries()
  .then(() => {
    console.log('\n✅ Search tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Search tests failed:', error.message);
    process.exit(1);
  });