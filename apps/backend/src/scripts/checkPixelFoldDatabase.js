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

// Check Pixel Fold in database
const checkPixelFoldDatabase = async () => {
  console.log('🔍 Checking Pixel Fold products in database...\n');

  try {
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Import Product model
    const { default: Product } = await import('../models/Product.js');

    // Check for Pixel Fold products with different search patterns
    console.log('📱 Searching for Pixel Fold products...\n');

    const searches = [
      { name: 'Exact "Pixel Fold"', pattern: { name: { $regex: /Pixel\s+Fold/i } } },
      { name: 'Contains "Fold"', pattern: { name: { $regex: /Fold/i } } },
      { name: 'Contains "9 Pro Fold"', pattern: { name: { $regex: /9\s+Pro\s+Fold/i } } },
      { name: 'All Pixel 9 products', pattern: { name: { $regex: /Pixel\s+9/i } } },
      { name: 'Recent products (last hour)', pattern: { createdAt: { $gte: new Date(Date.now() - 60*60*1000) } } }
    ];

    for (const search of searches) {
      console.log(`🔍 ${search.name}:`);
      const products = await Product.find(search.pattern)
        .select('name price condition createdAt isActive status')
        .sort({ createdAt: -1 });

      if (products.length > 0) {
        products.forEach(product => {
          console.log(`   ✅ ${product.name}`);
          console.log(`      Price: £${product.price} | Condition: ${product.condition}`);
          console.log(`      Active: ${product.isActive} | Status: ${product.status}`);
          console.log(`      Created: ${product.createdAt.toLocaleString()}`);
          console.log(`      ID: ${product._id}`);
          console.log();
        });
      } else {
        console.log('   ❌ No products found');
      }
      console.log();
    }

    // Check total product count
    const totalProducts = await Product.countDocuments();
    console.log(`📊 Total products in database: ${totalProducts}`);

    // Check most recent products
    console.log('\n📅 Most recent 10 products:');
    const recentProducts = await Product.find()
      .select('name price createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    recentProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - £${product.price}`);
      console.log(`      Created: ${product.createdAt.toLocaleString()}`);
    });

    return {
      totalProducts,
      recentProducts
    };

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📴 Database connection closed');
    }
  }
};

// Run the check
checkPixelFoldDatabase()
  .then((result) => {
    console.log('\n✅ Database check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Database check failed:', error.message);
    process.exit(1);
  });