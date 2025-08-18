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

const testRefactoredSeed = async () => {
  console.log('🧪 Testing refactored seed database script...\n');

  try {
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Import models
    const { default: Product } = await import('../models/Product.js');
    const { default: Category } = await import('../models/Category.js');

    console.log('📊 BEFORE seeding:');
    const beforeCategories = await Category.find().select('name slug');
    const beforeProducts = await Product.find().populate('category', 'name slug').select('name category');
    
    console.log(`   Categories: ${beforeCategories.length}`);
    beforeCategories.forEach(cat => console.log(`     - ${cat.name} (${cat.slug})`));
    
    console.log(`   Products: ${beforeProducts.length}`);
    beforeProducts.forEach(prod => console.log(`     - ${prod.name} (${prod.category?.name || 'No category'})`));

    console.log('\n🌱 Running refactored seed script...\n');
    
    // Import and run the refactored seed script
    const { default: seedDatabase } = await import('./seedDatabase.js');
    const result = await seedDatabase();

    console.log('\n📊 AFTER seeding:');
    const afterCategories = await Category.find().select('name slug');
    const afterProducts = await Product.find().populate('category', 'name slug').select('name category');
    
    console.log(`   Categories: ${afterCategories.length}`);
    afterCategories.forEach(cat => console.log(`     - ${cat.name} (${cat.slug})`));
    
    console.log(`   Products: ${afterProducts.length}`);
    
    // Group products by category
    const smartphoneProducts = afterProducts.filter(p => p.category?.slug === 'smartphones');
    const otherProducts = afterProducts.filter(p => p.category?.slug !== 'smartphones');
    
    console.log(`   📱 Smartphones: ${smartphoneProducts.length}`);
    smartphoneProducts.forEach(prod => console.log(`     - ${prod.name}`));
    
    if (otherProducts.length > 0) {
      console.log(`   ⚠️  Other products: ${otherProducts.length}`);
      otherProducts.forEach(prod => console.log(`     - ${prod.name} (${prod.category?.name || 'No category'})`));
    }

    console.log('\n✅ Test Results:');
    console.log(`   ✅ Only smartphones category exists: ${afterCategories.length === 1 && afterCategories[0].slug === 'smartphones'}`);
    console.log(`   ✅ No non-smartphone products: ${otherProducts.length === 0}`);
    console.log(`   ✅ Seed script returned results: ${result ? 'Yes' : 'No'}`);
    console.log(`   📊 Added: ${result?.addedCount || 0}, Updated: ${result?.updatedCount || 0}, Total: ${result?.totalSmartphones || 0}`);

    return {
      success: true,
      beforeCount: beforeProducts.length,
      afterCount: afterProducts.length,
      smartphoneCount: smartphoneProducts.length,
      result
    };

  } catch (error) {
    console.error('❌ Error testing seed:', error.message);
    return { success: false, error: error.message };
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📴 Database connection closed');
    }
  }
};

// Run the test
testRefactoredSeed()
  .then((result) => {
    if (result.success) {
      console.log('\n✅ Refactored seed test completed successfully');
    } else {
      console.log(`\n❌ Refactored seed test failed: ${result.error}`);
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });