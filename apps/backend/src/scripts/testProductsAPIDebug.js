import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
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

// Debug products API
const debugProductsAPI = async () => {
  console.log('🔍 Debugging Products API...\n');

  try {
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Import models
    const { default: Product } = await import('../models/Product.js');
    const { default: Category } = await import('../models/Category.js');

    console.log('📊 Step 1: Check basic product query');
    
    // Test the exact same query as the API
    const filter = { isActive: true };
    
    const products = await Product.find(filter).limit(5);
    console.log(`✅ Basic query found ${products.length} products`);
    
    // Test with populate
    console.log('\n📊 Step 2: Test with category populate');
    const productsWithPopulate = await Product
      .find(filter)
      .populate('category', 'name slug')
      .limit(5);
    
    console.log(`✅ Query with populate found ${productsWithPopulate.length} products`);
    
    if (productsWithPopulate.length > 0) {
      console.log('\nFirst product details:');
      const first = productsWithPopulate[0];
      console.log(`Name: ${first.name}`);
      console.log(`Category: ${first.category}`);
      console.log(`isActive: ${first.isActive}`);
      console.log(`status: ${first.status}`);
    }
    
    // Check categories
    console.log('\n📊 Step 3: Check categories');
    const categories = await Category.find({});
    console.log(`✅ Found ${categories.length} categories in database`);
    
    if (categories.length > 0) {
      console.log('Categories:');
      categories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug})`);
      });
    } else {
      console.log('❌ No categories found - this might be the issue!');
    }
    
    // Test the full API query simulation
    console.log('\n📊 Step 4: Simulate full API query');
    
    const fullQuery = await Product
      .find({ isActive: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(12)
      .exec();
    
    console.log(`✅ Full API simulation found ${fullQuery.length} products`);
    
    // Test Pixel Fold specifically
    console.log('\n📊 Step 5: Test Pixel Fold specifically');
    const foldProduct = await Product
      .findOne({ name: /Fold/i, isActive: true })
      .populate('category', 'name slug');
    
    if (foldProduct) {
      console.log('✅ Pixel Fold found in active products:');
      console.log(`   Name: ${foldProduct.name}`);
      console.log(`   Price: £${foldProduct.price}`);
      console.log(`   Category: ${foldProduct.category}`);
      console.log(`   isActive: ${foldProduct.isActive}`);
      console.log(`   status: ${foldProduct.status}`);
    } else {
      console.log('❌ Pixel Fold not found in active products');
    }

    return {
      basicQuery: products.length,
      withPopulate: productsWithPopulate.length,
      categories: categories.length,
      fullQuery: fullQuery.length
    };

  } catch (error) {
    console.error('❌ Error debugging API:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📴 Database connection closed');
    }
  }
};

// Run the debug
debugProductsAPI()
  .then((result) => {
    console.log('\n🎯 Debug Summary:');
    console.log(`Basic query: ${result.basicQuery} products`);
    console.log(`With populate: ${result.withPopulate} products`);
    console.log(`Categories: ${result.categories} found`);
    console.log(`Full API query: ${result.fullQuery} products`);
    console.log('\n✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Debug failed:', error.message);
    process.exit(1);
  });