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

// Cleanup categories and ensure all products use Smartphones category
const cleanupCategories = async () => {
  console.log('🧹 Starting category cleanup...\n');

  try {
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Import models
    const { default: Category } = await import('../models/Category.js');
    const { default: Product } = await import('../models/Product.js');

    // Find or create Smartphones category
    let smartphonesCategory = await Category.findOne({ slug: 'smartphones' });
    
    if (!smartphonesCategory) {
      smartphonesCategory = new Category({
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'Privacy-focused smartphones with GrapheneOS'
      });
      await smartphonesCategory.save();
      console.log('✅ Created Smartphones category');
    } else {
      console.log('✅ Found existing Smartphones category');
    }

    // Find categories to remove
    const categoriesToRemove = await Category.find({
      slug: { $in: ['accessories', 'cases'] }
    });

    console.log(`\n📋 Found ${categoriesToRemove.length} categories to remove:`);
    categoriesToRemove.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug})`);
    });

    // Update any products that have these categories to use Smartphones category
    if (categoriesToRemove.length > 0) {
      const categoryIds = categoriesToRemove.map(cat => cat._id);
      
      const updateResult = await Product.updateMany(
        { category: { $in: categoryIds } },
        { category: smartphonesCategory._id }
      );

      console.log(`\n✅ Updated ${updateResult.modifiedCount || 0} products from removed categories to Smartphones`);

      // Remove the categories
      const deleteResult = await Category.deleteMany({
        slug: { $in: ['accessories', 'cases'] }
      });

      console.log(`✅ Removed ${deleteResult.deletedCount || 0} categories`);
    }

    // Update all products without a category to use Smartphones
    console.log('\n📱 Ensuring all products have Smartphones category...');
    const noCategory = await Product.updateMany(
      { $or: [
        { category: null },
        { category: { $exists: false } }
      ]},
      { category: smartphonesCategory._id }
    );

    console.log(`✅ Updated ${noCategory.modifiedCount || 0} products without category`);

    // Verify final state
    console.log('\n📊 Final verification:');
    
    const allCategories = await Category.find({});
    console.log(`\nCategories in database (${allCategories.length}):`);
    allCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug})`);
    });

    const totalProducts = await Product.countDocuments({});
    const productsWithSmartphones = await Product.countDocuments({ 
      category: smartphonesCategory._id 
    });
    const productsWithoutCategory = await Product.countDocuments({ 
      $or: [
        { category: null },
        { category: { $exists: false } }
      ]
    });

    console.log(`\nProduct statistics:
  - Total products: ${totalProducts}
  - Products with Smartphones category: ${productsWithSmartphones}
  - Products without category: ${productsWithoutCategory}`);

    return {
      removedCategories: categoriesToRemove.length,
      totalProducts,
      productsWithCategory: productsWithSmartphones,
      productsWithoutCategory
    };

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📴 Database connection closed');
    }
  }
};

// Run the script
cleanupCategories()
  .then((result) => {
    console.log('\n✅ Category cleanup completed successfully');
    if (result.productsWithoutCategory > 0) {
      console.log('⚠️  Warning: Some products still don\'t have a category!');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Category cleanup failed:', error.message);
    process.exit(1);
  });