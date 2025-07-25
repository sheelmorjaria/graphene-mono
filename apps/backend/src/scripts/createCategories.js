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

// Create basic categories
const createCategories = async () => {
  console.log('🏗️  Creating basic categories...\n');

  try {
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Import models
    const { default: Category } = await import('../models/Category.js');
    const { default: Product } = await import('../models/Product.js');

    // Check if categories already exist
    const existingCategories = await Category.find({});
    console.log(`Found ${existingCategories.length} existing categories`);

    if (existingCategories.length > 0) {
      console.log('Existing categories:');
      existingCategories.forEach(cat => {
        console.log(`  - ${cat.name} (${cat.slug})`);
      });
    }

    // Create smartphones category if it doesn't exist
    let smartphonesCategory = await Category.findOne({ slug: 'smartphones' });
    
    if (!smartphonesCategory) {
      smartphonesCategory = new Category({
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'Privacy-focused smartphones with GrapheneOS',
        isActive: true
      });
      await smartphonesCategory.save();
      console.log('✅ Created Smartphones category');
    } else {
      console.log('⏭️  Smartphones category already exists');
    }

    // Update all products to use the smartphones category
    console.log('\n📱 Updating all products to use Smartphones category...');
    const updateResult = await Product.updateMany(
      { category: { $in: [null, undefined] } },
      { category: smartphonesCategory._id }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount || updateResult.nModified || 0} products with category`);

    // Verify the update
    const productsWithCategory = await Product.countDocuments({ category: smartphonesCategory._id });
    console.log(`📊 Total products with Smartphones category: ${productsWithCategory}`);

    return {
      category: smartphonesCategory,
      updatedProducts: updateResult.modifiedCount || updateResult.nModified || 0
    };

  } catch (error) {
    console.error('❌ Error creating categories:', error.message);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n📴 Database connection closed');
    }
  }
};

// Run the script
createCategories()
  .then((result) => {
    console.log('\n✅ Categories creation completed');
    console.log(`Category: ${result.category.name}`);
    console.log(`Updated products: ${result.updatedProducts}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Categories creation failed:', error.message);
    process.exit(1);
  });