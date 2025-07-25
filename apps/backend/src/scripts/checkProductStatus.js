import mongoose from 'mongoose';
import dotenv from 'dotenv';

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

// Check product status fields
const checkProductStatus = async () => {
  console.log('🔍 Checking product status fields...\n');

  try {
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Import Product model
    const { default: Product } = await import('../models/Product.js');

    // Check all products' status fields
    console.log('📊 Analyzing product status fields...\n');

    const allProducts = await Product.find({})
      .select('name isActive status category price')
      .limit(10);

    console.log(`Found ${allProducts.length} products (showing first 10):\n`);

    allProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   isActive: ${product.isActive}`);
      console.log(`   status: ${product.status}`);
      console.log(`   category: ${product.category}`);
      console.log(`   price: £${product.price}`);
      console.log();
    });

    // Check specifically for Pixel Fold
    console.log('🔍 Checking Pixel Fold status...\n');
    const foldProduct = await Product.findOne({ name: /Pixel.*Fold/i })
      .select('name isActive status category price');

    if (foldProduct) {
      console.log('📱 Pixel Fold found:');
      console.log(`   Name: ${foldProduct.name}`);
      console.log(`   isActive: ${foldProduct.isActive}`);
      console.log(`   status: ${foldProduct.status}`);
      console.log(`   category: ${foldProduct.category}`);
      console.log(`   price: £${foldProduct.price}`);
    } else {
      console.log('❌ No Pixel Fold found');
    }

    // Check counts by status
    console.log('\n📊 Product counts by status:');
    const statusCounts = await Product.aggregate([
      {
        $group: {
          _id: { isActive: '$isActive', status: '$status' },
          count: { $sum: 1 }
        }
      }
    ]);

    statusCounts.forEach(item => {
      console.log(`   isActive: ${item._id.isActive}, status: ${item._id.status} - Count: ${item.count}`);
    });

    // Test the API filter
    console.log('\n🔍 Testing API filter (isActive: true):');
    const activeProducts = await Product.find({ isActive: true }).select('name');
    console.log(`   Active products: ${activeProducts.length}`);
    
    if (activeProducts.length > 0) {
      console.log('   Sample active products:');
      activeProducts.slice(0, 5).forEach(product => {
        console.log(`     - ${product.name}`);
      });
    }

    return {
      totalProducts: allProducts.length,
      activeProducts: activeProducts.length
    };

  } catch (error) {
    console.error('❌ Error checking product status:', error.message);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📴 Database connection closed');
    }
  }
};

// Run the check
checkProductStatus()
  .then((result) => {
    console.log('\n✅ Product status check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Product status check failed:', error.message);
    process.exit(1);
  });